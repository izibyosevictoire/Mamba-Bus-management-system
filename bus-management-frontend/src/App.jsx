import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SignalRProvider } from './context/SignalRContext';
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
import { Bus, Loader2 } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="relative">
          <div className="w-20 h-20 border-4 rounded-full border-nexus-100 border-t-nexus-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Bus size={32} className="text-nexus-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-6 font-medium tracking-wide text-slate-500 font-display animate-pulse">Initializing Mamba Bus System...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Guest Route Wrapper (For Login/Register)
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-nexus-600 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" />;
  }

  return children;
};

import { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing'; // Added

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SignalRProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            } />
            <Route path="/register" element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            } />

            <Route path="/app" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />

              {/* Placeholders for future routes */}
              <Route path="buses" element={<Buses />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="agencies" element={<Agencies />} />
              <Route path="checker" element={<TicketChecker />} />
            </Route>
          </Routes>
        </SignalRProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
