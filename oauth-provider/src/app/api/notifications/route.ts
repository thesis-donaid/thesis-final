import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.userNotification.findMany({
            where: { userId: session.user.id },
            orderBy: { created_at: 'desc' },
            take: 50,
        });

        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationId, markAll } = await request.json();

        if (markAll) {
            await prisma.userNotification.updateMany({
                where: { userId: session.user.id, isRead: false },
                data: { isRead: true },
            });
        } else if (notificationId) {
            await prisma.userNotification.update({
                where: { id: notificationId, userId: session.user.id },
                data: { isRead: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
