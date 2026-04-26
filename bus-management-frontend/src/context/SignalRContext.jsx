import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { notificationService } from '../api/notificationService';
import toast from 'react-hot-toast';

const SignalRContext = createContext();

export const useSignalR = () => useContext(SignalRContext);

export const SignalRProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [connection, setConnection] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initial fetch of DB notifications
    useEffect(() => {
        if (user) {
            notificationService.getMyNotifications().then((res) => {
                const fetched = res.data.data;
                setNotifications(fetched);
                setUnreadCount(fetched.filter(n => !n.isRead).length);
            }).catch(console.error);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user]);

    useEffect(() => {
        if (user && token) {
            const newConnection = new signalR.HubConnectionBuilder()
                .withUrl('/hubs/notifications', {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect()
                .build();

            setConnection(newConnection);
        } else if (connection) {
            connection.stop();
            setConnection(null);
        }
        
        // eslint-disable-next-line
    }, [user, token]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to SignalR Notification Hub');

                    connection.on('ReceiveNotification', (notification) => {
                        // Show styled toast based on notification type
                        if (notification.type === 'Alert') {
                            toast.error(`🚨 ${notification.title}: ${notification.message}`, { duration: 8000 });
                        } else if (notification.type === 'TripUpdate') {
                            toast(
                                (t) => (
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-slate-900 text-sm">🚌 {notification.title}</span>
                                        <span className="text-slate-600 text-sm">{notification.message}</span>
                                    </div>
                                ),
                                {
                                    duration: 10000,
                                    style: {
                                        background: '#f0fdf4',
                                        border: '1px solid #86efac',
                                        padding: '12px 16px',
                                        maxWidth: '400px',
                                    },
                                    icon: '🚌',
                                }
                            );
                        } else {
                            toast(`🔔 ${notification.title}: ${notification.message}`, { duration: 5000 });
                        }

                        setNotifications(prev => [notification, ...prev].slice(0, 50));
                        setUnreadCount(prev => prev + 1);
                    });
                })
                .catch(e => console.log('Connection failed: ', e));

            return () => {
                connection.off('ReceiveNotification');
                connection.stop();
            };
        }
    }, [connection]);

    const markAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    return (
        <SignalRContext.Provider value={{
            connection,
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            setNotifications,
            setUnreadCount
        }}>
            {children}
        </SignalRContext.Provider>
    );
};
