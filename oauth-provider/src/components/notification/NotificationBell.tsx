'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Bell, CheckCircle2, Info, AlertTriangle, XCircle, Clock, Check } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import Link from 'next/link';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'donation': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'urgent': return <AlertTriangle size={16} className="text-amber-500" />;
            case 'system': return <Info size={16} className="text-blue-500" />;
            default: return <Bell size={16} className="text-gray-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon & Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full transition-all"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-3 duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-[10px] font-bold text-red-600 uppercase tracking-wider hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={32} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-sm text-gray-500">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div 
                                        key={notification.id}
                                        className={cn(
                                            "p-4 transition-colors relative group",
                                            !notification.isRead ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-gray-50"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {getTypeIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-xs leading-5", !notification.isRead ? "font-bold text-gray-900" : "text-gray-600")}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Clock size={10} className="text-gray-400" />
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(notification.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Mark as read button */}
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-green-600 transition-all shadow-sm"
                                                    title="Mark as read"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                        {notification.link && (
                                            <Link 
                                                href={notification.link}
                                                onClick={() => setIsOpen(false)}
                                                className="absolute inset-0 z-0"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
                        <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                            View All Activity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
