import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SignalRProvider } from './context/SignalRContext';
import { Toaster } from 'react-hot-toast';
import { Bus, Loader2, ShieldAlert } from 'lucide-react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Buses from './pages/Buses';
import RoutesPage from './pages/Routes';
import Schedules from './pages/Schedules';
import Tickets from './pages/Tickets';
import Drivers from './pages/Drivers';
import UsersPage from './pages/Users';
import Agencies from './pages/Agencies';
import TicketChecker from './pages/TicketChecker';
import Landing from './pages/Landing';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getRole = (user) =>
    String(user?.userType || user?.role || '').trim().toLowerCase();

const isRole = (user, ...roles) =>
    roles.some(r => r.toLowerCase() === getRole(user));

// Where to send a user after login based on their role
const homeFor = (user) => {
    const role = getRole(user);
    if (role === 'passenger' || role === 'client') return '/app/tickets';
    if (role === 'driver') return '/app';
    return '/app'; // admin, checker, etc.
};

// ── Loading spinner ───────────────────────────────────────────────────────────
const Spinner = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="relative">
            <div className="w-20 h-20 border-4 rounded-full border-nexus-100 border-t-nexus-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Bus size={32} className="text-nexus-600 animate-pulse" />
            </div>
        </div>
        <p className="mt-6 font-medium tracking-wide text-slate-500 animate-pulse">
            Initializing Mamba Bus System...
        </p>
    </div>
);

// ── 403 Forbidden page ────────────────────────────────────────────────────────
const Forbidden = () => {
    const { user } = useAuth();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4 text-center px-4">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center">
                <ShieldAlert size={36} className="text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
            <p className="text-slate-500 max-w-sm">
                You don't have permission to view this page.
            </p>
            <a
                href={homeFor(user)}
                className="mt-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium"
            >
                Go to my dashboard
            </a>
        </div>
    );
};

// ── Protected Route — must be logged in ──────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <Spinner />;

    // Not logged in → send to login, remember where they wanted to go
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role check — if allowedRoles specified, verify
    if (allowedRoles && !isRole(user, ...allowedRoles)) {
        return <Forbidden />;
    }

    return children;
};

// ── Guest Route — must NOT be logged in ──────────────────────────────────────
const GuestRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Loader2 className="w-10 h-10 text-nexus-600 animate-spin" />
        </div>
    );

    // Already logged in → send to their home page
    if (user) return <Navigate to={homeFor(user)} replace />;

    return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SignalRProvider>
                    <Toaster position="top-right" />
                    <Routes>
                        {/* Public */}
                        <Route path="/" element={<Landing />} />

                        <Route path="/login" element={
                            <GuestRoute><Login /></GuestRoute>
                        } />
                        <Route path="/register" element={
                            <GuestRoute><Register /></GuestRoute>
                        } />

                        {/* Protected — all /app/* require login */}
                        <Route path="/app" element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }>
                            {/* Admin + Driver — dashboard */}
                            <Route index element={
                                <ProtectedRoute allowedRoles={['admin', 'driver']}>
                                    <Dashboard />
                                </ProtectedRoute>
                            } />
                            <Route path="buses" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Buses />
                                </ProtectedRoute>
                            } />
                            <Route path="schedules" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Schedules />
                                </ProtectedRoute>
                            } />
                            <Route path="drivers" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Drivers />
                                </ProtectedRoute>
                            } />
                            <Route path="users" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <UsersPage />
                                </ProtectedRoute>
                            } />
                            <Route path="agencies" element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <Agencies />
                                </ProtectedRoute>
                            } />

                            {/* Admin + Driver */}
                            <Route path="routes" element={
                                <ProtectedRoute allowedRoles={['admin', 'driver']}>
                                    <RoutesPage />
                                </ProtectedRoute>
                            } />

                            {/* Passenger / Client only */}
                            <Route path="tickets" element={
                                <ProtectedRoute allowedRoles={['passenger', 'client']}>
                                    <Tickets />
                                </ProtectedRoute>
                            } />

                            {/* Admin + Checker */}
                            <Route path="checker" element={
                                <ProtectedRoute allowedRoles={['admin', 'checker', 'ticketchecker']}>
                                    <TicketChecker />
                                </ProtectedRoute>
                            } />
                        </Route>

                        {/* Catch-all — redirect unknown URLs to login */}
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </SignalRProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
