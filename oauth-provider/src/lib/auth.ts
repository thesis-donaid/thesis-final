// lib/auth.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { prisma } from "./prisma";
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider  from "next-auth/providers/credentials";
import { generateOtp, sendOtpEmail } from "./email";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { compareHash } from "./bcrypt";


export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            id: "otp-verify",
            name: "OTP Verification",
            credentials: {
                email: { label: "Email", type: "email" },
                code: { label: "Code", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.code) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user) return null;

                const otpRecord = await prisma.otpCode.findFirst({
                    where: {
                        userId: user.id,
                        code: credentials.code as string,
                        used: false,
                        expires: { gt: new Date() },
                    },
                });

                if (!otpRecord) return null;

                await prisma.otpCode.update({
                    where: { id: otpRecord.id },
                    data: { used: true },
                });

                const updatedUser = await prisma.user.update({
                    where: { id: user.id },
                    data: { emailVerified: new Date() }
                })

                return updatedUser;
            },
        }),
        CredentialsProvider({
            id: "beneficiary-credentials",
            name: "Beneficiary Login",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;

                // Find beneficiary by username
                const beneficiary = await prisma.beneficiary.findUnique({
                    where: { username: credentials.username },
                    include: { user: true },
                });

                if (!beneficiary) return null;

                // Check if account is active
                if (!beneficiary.isActive) return null;

                // Verify password
                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    beneficiary.password
                );

                if (!isValidPassword) return null;

                // Return the linked user for session creation
                return beneficiary.user;
            },
        }),
        CredentialsProvider({
            id: "donor-credentials",
            name: "Donor Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findFirst({
                    where: {
                        email: credentials.email,
                        role: "registered",
                    },
                });

                if(!user || !user.password) return null;

                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isValidPassword) return null;

                return user;
            }
        })
    ],
    session: {
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google" && user.email) {
                const code = generateOtp();
                const expires = new Date(Date.now() + 10 * 60 * 1000);

                let dbUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!dbUser) {
                    dbUser = await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            role: user.role = "registered"
                        },
                    });
                }

                // Also create/update Account for Google Link
                const exisitingAccount = await prisma.account.findUnique({
                    where: {
                        provider_providerAccountId: {
                            provider: account.provider,
                            providerAccountId: account.providerAccountId
                        },
                    },
                });

                if(!exisitingAccount) {
                    await prisma.account.create({
                        data: {
                            userId: dbUser.id,
                            type: account.type,
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                            access_token: account.access_token,
                            refresh_token: account.refresh_token,
                            expires_at: account.expires_at,
                            token_type: account.token_type,
                            scope: account.scope,
                            id_token: account.id_token,
                        },
                    });


                    await prisma.registeredDonor.create({
                        data: {
                            userId: dbUser.id,
                            name: dbUser.name,
                            created_at: dbUser.updated_at,
                            updated_at: new Date()
                        }
                    })
                }

           
                await prisma.otpCode.create({
                    data: {
                        code,
                        userId: dbUser.id,
                        expires,
                    },
                });

                await sendOtpEmail(user.email, code);

                return `/auth/verify?email=${encodeURIComponent(user.email)}`;
         
            }


            // For OTP Verification - create session manually
            if(account?.provider === "otp-verify" || account?.type === "credentials") {
                const sessionToken = randomUUID();
                const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

                await prisma.session.create({
                    data: {
                        sessionToken,
                        userId: user.id,
                        expires,
                    },
                });

                // Store token to ve set as cookie
                // (user as any).sessionToken = sessionToken;
            }
            return true;
        },
        // async redirect({ url, baseUrl }) {
        //     // After Google sign-in, redirect to verify page
        //     if(url.includes('/api/auth/callback/google')) {
        //         // Get email from somewhere - this is tricky
        //         return `${baseUrl}/auth/verify`
        //     }
        //     return url.startsWith(baseUrl) ? url : baseUrl;
        // },
        // async jwt({ token, user }) {
        //     if (user) {
        //         token.id = user.id;
        //         token.role = user.role;
        //     }
        //     return token;
        // },
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                session.user.role = user.role;


                if(user.role === "beneficiary") {
                    const beneficiary = await prisma.beneficiary.findUnique({
                        where: { userId: user.id },
                        select: {
                            id: true,
                            username: true,
                            type: true,
                            firstName: true,
                            lastName: true
                        }
                    })

                    session.user.beneficiary = beneficiary
                }
            }
            return session;
        },
        async jwt ({ token, user, trigger }) {
            // On initial sign in, fetch role from database
            if (user) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { id: true, role: true }
                });
                token.id = dbUser?.id || user.id;
                token.role = dbUser?.role || "registered";
            }
            
            // Fetch role if missing (for existing tokens before this change)
            if (!token.role && (token.id || token.sub)) {
                const userId = (token.id || token.sub) as string;
                const dbUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, role: true }
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                }
            }
            
            // Refresh role from database on session update
            if (trigger === "update" && token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { role: true }
                });
                if (dbUser) {
                    token.role = dbUser.role;
                }
            }
            
            return token;
        }
    },
    pages: {
        signIn: "/auth/signin",
    },
};