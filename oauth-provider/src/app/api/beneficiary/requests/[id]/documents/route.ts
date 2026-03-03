import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob"
import { writeFile, mkdir } from "fs/promises";
import path from "path";


type RouteParams = { params: Promise<{ id: string }> };


export async function POST(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const session = await getSession(req);

        if(!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        if(session.user.role !== "beneficiary") {
            return NextResponse.json(
                { error: "Forbidden. Beneficiary access only" },
                { status: 403 }
            )
        }

        // Verify request exists and belong to user
        const request = await prisma.beneficiaryRequest.findUnique({
            where: { id: parseInt(id) },
            include: { beneficiary: true }
        })

        if (!request) {
            return NextResponse.json(
                { error: "Request not found" },
                { status: 404 } 
            );
        }

        if (request.beneficiary.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await req.formData();
        
        // Get ALL files from form data
        const files = formData.getAll("files") as File[];

        if(!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 })
        }

        const MAX_FILES = 10;
        if (files.length > MAX_FILES) {
            return NextResponse.json({ error: `Too many files. maximum ${MAX_FILES} files per upload` }, { status: 400 })
        }

        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "application/pdf",
        ];


        // Validate ALL files frist before uploading any
        for (const file of files) {
            if(!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: `Invalid file type: ${file.name}. Allowed: PNG, JPG, PDF` },
                    { status: 400 }
                )
            }

            if(file.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    { error: `File too large: ${file.name}. Max 10MB` },
                    { status: 400 }
                );
            }
        }


        // Upload all files and collect reulst
        const uploadedDocuments = [];

        for (const file of files) {
            let fileUrl: string;

            if (process.env.BLOB_READ_WRITE_TOKEN) {
                const blob = await put(`requests/${id}/${file.name}`, file, {
                    access: "public"
                });
                fileUrl = blob.url;
            } else {
                const uploadDir = path.join(process.cwd(), "public", "uploads", "requests", id);
                await mkdir(uploadDir, { recursive: true});

                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                const fileName = `${Date.now()}-${file.name}`;
                const filePath = path.join(uploadDir, fileName);
                await writeFile(filePath, buffer);

                fileUrl = `/uploads/requests/${id}/${fileName}`;
            }

            const document = await prisma.requestDocument.create({
                data: {
                    requestId: parseInt(id),
                    file_name: file.name,
                    file_url: fileUrl,
                    file_type: file.type,
                    file_size: file.size,
                },
            });

            uploadedDocuments.push(document);
        }

        return NextResponse.json({
            success: true,
            message: `${uploadedDocuments.length} file(s) uploaded successfully`,
            documents: uploadedDocuments
        }, { status: 201 });

    } catch(error) { 
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload documents" },
            { status: 500 }
        );
    }
}

export async function GET(
    req: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const session = await getSession(req);

        if(!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const documents = await prisma.requestDocument.findMany({
            where: { requestId: parseInt(id) },
            orderBy: { uploaded_at: "desc" },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Get documents error:", error);
        return NextResponse.json(
        { error: "Failed to get documents" },
        { status: 500 }
        );
    }
}