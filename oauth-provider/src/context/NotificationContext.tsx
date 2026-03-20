'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { pusherClient } from '@/lib/pusher-client';
import { useSession } from 'next-auth/react';

interface UserNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link?: string;
    created_at: string;
}

interface NotificationContextType {
    notifications: UserNotification[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
                setUnreadCount(data.data.filter((n: UserNotification) => !n.isRead).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchNotifications();

            const channel = pusherClient.subscribe(`user-${session.user.id}`);
            
            channel.bind('notification', (data: any) => {
                const toastType = data.type === 'donation' ? 'success' : 
                                  data.type === 'urgent' ? 'warning' : 'info';
                
                toast(
                    <div className="flex flex-col gap-1">
                        <p className="font-bold text-sm">{data.title}</p>
                        <p className="text-xs text-gray-600">{data.message}</p>
                    </div>,
                    { 
                        type: toastType,
                        position: "top-right",
                        autoClose: 5000,
                    }
                );

                fetchNotifications();
            });

            return () => {
                pusherClient.unsubscribe(`user-${session.user.id}`);
            };
        }
    }, [session?.user?.id, fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true })
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
