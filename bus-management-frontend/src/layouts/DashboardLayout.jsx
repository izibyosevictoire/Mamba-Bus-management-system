import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

// Importing icons from lucide-react for UI
import {
    Bus, Map, Calendar, Users, Ticket, LogOut, Menu, X,
    LayoutDashboard, UserCircle, Bell, Building, ScanLine
} from 'lucide-react';

// Utility function for conditional class names
import { cn } from '../lib/utils';

// Custom authentication context (handles user + logout)
import { useAuth } from '../context/AuthContext';

// SignalR context for real-time notifications
import { useSignalR } from '../context/SignalRContext';

// Date formatting utilities
import { formatDistanceToNow, format } from 'date-fns';

/**
 * SidebarItem Component
 * Reusable navigation item for sidebar links
 */
const SidebarItem = ({ icon: Icon, label, to, active }) => (
    <Link
        to={to}
        className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
            active
                ? "bg-gradient-to-r from-nexus-500 to-nexus-600 text-white shadow-lg shadow-nexus-500/25 font-semibold"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white font-medium"
        )}
    >
        {/* Icon with animation */}
        <Icon size={20} className={cn("transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")} />
        <span>{label}</span>
    </Link>
);

/**
 * Main Dashboard Layout Component
 * Contains sidebar, header, notifications, and main content area
 */
export default function DashboardLayout() {
    // Sidebar toggle (for mobile)
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Notification dropdown toggle
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // Get current route location
    const location = useLocation();

    // Get user and logout function from auth context
    const { logout, user } = useAuth();

    // Notification data and handlers from SignalR
    const { unreadCount, notifications, markAsRead, markAllAsRead } = useSignalR();

    /**
     * Navigation items configuration
     * Each item includes allowed user roles
     */
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard',     to: '/app',          allowedTypes: ['Admin'] },
        { icon: Bus,             label: 'Buses',          to: '/app/buses',    allowedTypes: ['Admin'] },
        { icon: Map,             label: 'Routes',         to: '/app/routes',   allowedTypes: ['Admin', 'Driver'] },
        { icon: Calendar,        label: 'Schedules',      to: '/app/schedules',allowedTypes: ['Admin'] },
        { icon: Users,           label: 'Drivers',        to: '/app/drivers',  allowedTypes: ['Admin'] },
        { icon: Ticket,          label: 'My Tickets',     to: '/app/tickets',  allowedTypes: ['Passenger', 'Client'] },
        { icon: ScanLine,        label: 'Ticket Checker', to: '/app/checker',  allowedTypes: ['Admin', 'Checker', 'TicketChecker'] },
        { icon: UserCircle,      label: 'Users',          to: '/app/users',    allowedTypes: ['Admin'] },
        { icon: Building,        label: 'Agencies',       to: '/app/agencies', allowedTypes: ['Admin'] },
    ];

    // Normalize user role (handles different formats)
    const userRole = user ? String(user.userType || user.role || 'Passenger').trim().toLowerCase() : '';

    /**
     * Filter navigation items based on user role
     */
    const filteredNavItems = navItems.filter(item =>
        user && item.allowedTypes.some(type =>
            String(type).trim().toLowerCase() === userRole ||
            (Array.isArray(user.role) && user.role.some(r => String(r).trim().toLowerCase() === String(type).trim().toLowerCase()))
        )
    );

    return (
        <div className="flex min-h-screen bg-slate-50">

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-40 w-[280px] bg-slate-950 border-r border-slate-900 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col font-sans text-slate-300",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>

                {/* Logo / Header */}
                <div className="relative flex items-center justify-between p-6 overflow-hidden border-b border-slate-800/80 lg:justify-center bg-slate-950">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none bg-nexus-600/10 blur-3xl" />
                    
                    <div className="relative z-10 flex items-center w-full gap-3 text-white lg:justify-center">
                        <div className="flex items-center justify-center w-10 h-10 shadow-lg bg-nexus-500 rounded-xl shadow-nexus-500/20">
                            <Bus size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white font-display">Mamba Bus System</span>
                    </div>

                    {/* Close button (mobile only) */}
                    <button onClick={() => setSidebarOpen(false)} className="relative z-10 p-2 lg:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-8 px-4 space-y-1.5 custom-scrollbar">
                    {filteredNavItems.map(item => (
                        <SidebarItem key={item.to} {...item} active={location.pathname === item.to} />
                    ))}
                </nav>

                {/* Logout button */}
                <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
                    <button
                        onClick={logout}
                        className="flex items-center w-full gap-3 px-4 py-3 font-medium transition-all duration-300 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl group"
                    >
                        <LogOut size={20} className="transition-transform duration-300 group-hover:scale-110" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <main className="relative flex flex-col flex-1 h-screen overflow-hidden">

                {/* Top Header */}
                <header className="sticky top-0 z-20 flex items-center justify-between h-20 px-6 border-b shadow-sm bg-white/70 backdrop-blur-xl border-white/50 lg:px-10">

                    {/* Mobile menu button */}
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 lg:hidden text-slate-500 hover:text-slate-700">
                        <Menu size={24} />
                    </button>

                    {/* Right side actions */}
                    <div className="relative flex items-center gap-5 ml-auto">

                        {/* Notification button */}
                        <button
                            className="relative p-2.5 text-slate-500 hover:text-nexus-600 hover:bg-nexus-50 transition-all rounded-full group"
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                        >
                            <Bell size={22} className="group-hover:animate-pulse" />

                            {/* Unread count badge */}
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-rose-500/20">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications dropdown */}
                        {notificationsOpen && (
                            <div className="absolute top-[3.5rem] right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 z-50 overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up origin-top-right">

                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 backdrop-blur-md">
                                    <h3 className="font-semibold font-display text-slate-900">Notifications</h3>

                                    {/* Mark all as read */}
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className="px-2 py-1 text-xs font-semibold transition-colors rounded-md text-nexus-600 hover:text-nexus-700 hover:bg-nexus-50">
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                {/* Notification list */}
                                <div className="flex-1 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500">
                                            <Bell className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                            <p className="text-sm">No new notifications</p>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-slate-100">
                                            {[...notifications]
                                             .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                              .map(n => (
                                                <li
                                                    key={n.notificationId}
                                                    className={cn("p-4 cursor-pointer transition-colors hover:bg-slate-50", !n.isRead ? (n.type === 'TripUpdate' ? "bg-green-50/60" : "bg-indigo-50/50") : "")}
                                                    onClick={() => !n.isRead && markAsRead(n.notificationId)}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="flex-shrink-0 mt-0.5 text-lg">
                                                            {n.type === 'TripUpdate' ? '🚌' : n.type === 'Alert' ? '🚨' : '🔔'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold truncate text-slate-900">{n.title}</p>
                                                                {!n.isRead && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-nexus-500" />}
                                                            </div>
                                                            <p className="mt-0.5 text-sm leading-relaxed text-slate-600 line-clamp-2">{n.message}</p>
                                                            <p className="text-[11px] text-slate-400 mt-1.5 font-medium flex items-center gap-1.5">
                                                                <span className="font-semibold text-slate-600">{format(new Date(n.createdAt), 'h:mm a')}</span>
                                                                <span>&bull;</span>
                                                                <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* User info */}
                        <div className="hidden w-px h-8 mx-1 bg-slate-200 sm:block" />

                        <div className="hidden pl-2 text-right sm:block">
                            <div className="text-sm font-semibold leading-tight font-display text-slate-900">
                                {user?.name || 'Guest User'}
                            </div>
                            <div className="text-xs font-medium text-slate-500 mt-0.5">
                                {user?.userType || user?.role || 'Passenger'}
                            </div>
                        </div>

                        {/* Avatar */}
                        <div className="flex items-center justify-center text-lg font-bold text-white uppercase transition-transform transform shadow-lg cursor-pointer h-11 w-11 bg-gradient-to-br from-nexus-500 to-nexus-700 rounded-xl font-display hover:scale-105">
                            {user?.name?.[0] || 'U'}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="flex-1 p-6 overflow-auto lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}