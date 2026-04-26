import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { busService, routeService, scheduleService, userService, assignmentService } from '../api/services';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { Bus, Map, Calendar, Users, TrendingUp, AlertCircle, Clock, MapPin, Check, X, Send, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { notificationService } from '../api/notificationService';

// --- Admin Dashboard Component ---
const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        buses: [],
        routes: [],
        schedules: [],
        users: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [busRes, routeRes, schedRes, userRes] = await Promise.all([
                    busService.getAll(),
                    routeService.getAll(),
                    scheduleService.getAll(),
                    userService.getAll()
                ]);

                setStats({
                    buses: busRes.data.data || [],
                    routes: routeRes.data.data || [],
                    schedules: schedRes.data.data || [],
                    users: userRes.data.data || []
                });
            } catch (error) {
                console.error("Dashboard data fetch failed", error);
                toast.error("Failed to load dashboard analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center py-12 text-indigo-600">Loading Analytics...</div>;

    const exportReports = () => {
        const busData = stats.buses.map(b => ({
            BusNumber: b.busNumber,
            Model: b.model,
            Status: b.status || 'Active'
        }));
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Bus Number,Model,Status\n"
            + busData.map(e => `${e.BusNumber},${e.Model},${e.Status}`).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fleet_report_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Report downloaded safely!");
    };

    // Charts Data
    const busStatusData = [
        { name: 'Active', value: stats.buses.filter(b => b.status === 'Active' || !b.status).length },
        { name: 'Maintenance', value: stats.buses.filter(b => b.status === 'Maintenance').length },
        { name: 'Inactive', value: stats.buses.filter(b => b.status === 'Inactive').length }
    ].filter(d => d.value > 0);
    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    const routeScheduleCounts = stats.routes.map(r => ({
        name: r.origin.substring(0, 3) + '-' + r.destination.substring(0, 3),
        fullRoute: `${r.origin} → ${r.destination}`,
        count: stats.schedules.filter(s => s.routeId === r.routeId).length
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    const routeEconomics = stats.routes.map(r => ({
        name: r.destination,
        price: r.price,
        distance: r.distance
    })).sort((a, b) => a.distance - b.distance);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight">Admin Overview</h1>
                    <p className="text-slate-500 mt-1">Real-time transit analytics for the Mamba Bus Management System.</p>
                </div>
                <button
                    onClick={exportReports}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5 font-medium"
                >
                    <Download size={20} />
                    <span className="hidden md:inline">Export Report</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric Card 1 */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-nexus-500/10 rounded-full blur-xl group-hover:bg-nexus-500/20 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-gradient-to-br from-nexus-100 to-nexus-200 text-nexus-600 rounded-xl shadow-inner"><Bus size={28} className="stroke-[1.5]" /></div>
                        <div><div className="text-sm font-medium text-slate-500">Total Fleet</div><div className="text-3xl font-display font-semibold text-slate-900">{stats.buses.length}</div></div>
                    </div>
                </div>
                {/* Metric Card 2 */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-xl group-hover:bg-brand-500/20 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-gradient-to-br from-brand-100 to-brand-200 text-brand-600 rounded-xl shadow-inner"><Map size={28} className="stroke-[1.5]" /></div>
                        <div><div className="text-sm font-medium text-slate-500">Active Routes</div><div className="text-3xl font-display font-semibold text-slate-900">{stats.routes.length}</div></div>
                    </div>
                </div>
                {/* Metric Card 3 */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 rounded-xl shadow-inner"><Calendar size={28} className="stroke-[1.5]" /></div>
                        <div><div className="text-sm font-medium text-slate-500">Scheduled Trips</div><div className="text-3xl font-display font-semibold text-slate-900">{stats.schedules.length}</div></div>
                    </div>
                </div>
                {/* Metric Card 4 */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600 rounded-xl shadow-inner"><Users size={28} className="stroke-[1.5]" /></div>
                        <div><div className="text-sm font-medium text-slate-500">Total Users</div><div className="text-3xl font-display font-semibold text-slate-900">{stats.users.length}</div></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-8 rounded-2xl min-h-[350px]">
                    <h3 className="text-lg font-display font-medium text-slate-900 mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-nexus-500 rounded-full"></div>Fleet Status</h3>
                    <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={busStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">{busStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /><Legend iconType="circle" /></PieChart></ResponsiveContainer></div>
                </div>
                <div className="glass-card p-8 rounded-2xl min-h-[350px]">
                    <h3 className="text-lg font-display font-medium text-slate-900 mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-brand-500 rounded-full"></div>Route Frequency</h3>
                    <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={routeScheduleCounts} layout="vertical" margin={{ left: -15 }}><CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#e2e8f0" /><XAxis type="number" axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /><Bar dataKey="count" fill="#4f46e5" radius={[0, 6, 6, 0]} name="Trips" /></BarChart></ResponsiveContainer></div>
                </div>
                <div className="glass-card p-8 rounded-2xl min-h-[350px] lg:col-span-2">
                    <h3 className="text-lg font-display font-medium text-slate-900 mb-6 flex items-center gap-2"><div className="w-2 h-6 bg-purple-500 rounded-full"></div>Route Economics</h3>
                    <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={routeEconomics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}><defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="distance" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} /><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} /><Area type="monotone" dataKey="price" stroke="#4f46e5" strokeWidth={3} fill="url(#colorPrice)" /></AreaChart></ResponsiveContainer></div>
                </div>
            </div>
        </div>
    );
};

// --- Driver Dashboard Component ---
const DriverDashboard = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [myAssignments, setMyAssignments] = useState([]);
    const [mySchedules, setMySchedules] = useState([]);
    const [myBuses, setMyBuses] = useState([]);

    useEffect(() => {
        const fetchDriverData = async () => {
            try {
                let myAssign = null;
                try {
                    const assignRes = await assignmentService.getMyAssignment();
                    myAssign = assignRes.data.data;
                } catch (e) {
                    if (e.response && e.response.status === 404) {
                        // No active assignment
                    } else {
                        throw e;
                    }
                }

                const [schedRes, routeRes] = await Promise.all([
                    scheduleService.getAll(),
                    routeService.getAll()
                ]);

                const allSchedules = schedRes.data.data || [];
                const allRoutes = routeRes.data.data || [];

                setMyAssignments(myAssign ? [myAssign] : []);

                // Check pending logic early so UI can focus on it
                if (myAssign && myAssign.status === 'Pending') {
                    setMyBuses([{
                        busId: myAssign.busId,
                        busNumber: myAssign.busNumber,
                        model: 'Pending Assignment',
                        capacity: 'N/A',
                        status: 'Pending'
                    }]);
                    setMySchedules([]); // hide schedules until accepted
                    setLoading(false);
                    return;
                }

                // Mock bus features for the UI display, as drivers lack permissions to fetch full bus catalogues
                const busses = myAssign ? [{
                    busId: myAssign.busId,
                    busNumber: myAssign.busNumber,
                    model: 'Standard Bus',
                    capacity: 'N/A',
                    status: myAssign.status
                }] : [];
                setMyBuses(busses);

                const myBusIds = myAssign ? [myAssign.busId] : [];
                const schedules = allSchedules.filter(s => myBusIds.includes(s.busId));

                // Enhance Schedules with Route Info
                const enhancedSchedules = schedules.map(s => {
                    const r = allRoutes.find(route => route.routeId === s.routeId);
                    return { ...s, route: r };
                });

                setMySchedules(enhancedSchedules);

            } catch (error) {
                console.error("Driver data fetch failed", error);
                toast.error("Failed to load your dashboard");
            } finally {
                setLoading(false);
            }
        };
        fetchDriverData();
    }, [user]);

    if (loading) return <div className="text-center py-12 text-indigo-600">Loading Your Dashboard...</div>;

    const pendingAssignment = myAssignments.find(a => a.status === 'Pending');

    const handleAssignmentResponse = async (id, status) => {
        try {
            await notificationService.respondToAssignment(id, status);
            toast.success(`Assignment ${status.toLowerCase()}!`);
            window.location.reload(); // Quick refresh to load active state
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${status.toLowerCase()} assignment`);
        }
    };

    const handleSendUpdate = async (e) => {
        e.preventDefault();
        const msg = e.target.elements.updateMsg.value;
        if (!msg) return;
        try {
            await notificationService.sendTripUpdate({ message: msg });
            toast.success("Trip update broadcasted to passengers and dispatch!");
            e.target.reset();
        } catch (err) {
            toast.error("Failed to send trip update");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="mb-6">
                <h1 className="text-3xl font-display font-medium text-slate-900">Welcome back, {user.name}</h1>
                <p className="text-slate-500 mt-1">Here is your daily route overview and active assignments.</p>
            </div>

            {/* Buses Section */}
            {pendingAssignment ? (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-8 shadow-sm mb-8 animate-pulse relative overflow-hidden">
                    {/* Decorative Warning Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                        <div className="p-4 bg-white/60 text-amber-600 rounded-2xl shadow-sm border border-amber-100 flex-shrink-0">
                            <AlertCircle size={36} className="stroke-[1.5]" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-display font-semibold text-slate-900 mb-1">New Assignment Pending!</h2>
                            <p className="text-slate-600 mb-5 leading-relaxed">
                                You have been assigned to drive <strong className="text-slate-900">Bus {pendingAssignment.busNumber}</strong>. 
                                Please confirm if you are available for this shift.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button 
                                    onClick={() => handleAssignmentResponse(pendingAssignment.assignmentId, 'Accepted')}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all font-medium shadow-md shadow-slate-900/10 hover:-translate-y-0.5"
                                >
                                    <Check size={18} /> Accept Assignment
                                </button>
                                <button 
                                    onClick={() => handleAssignmentResponse(pendingAssignment.assignmentId, 'Rejected')}
                                    className="flex items-center gap-2 bg-white text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all font-medium border border-slate-200"
                                >
                                    <X size={18} /> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {myBuses.length === 0 ? (
                        <div className="col-span-full glass-card p-8 rounded-2xl flex flex-col items-center justify-center gap-4 text-center min-h-[250px]">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                <Bus size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">No Active Assignment</h3>
                                <p className="text-slate-500 mt-1 max-w-sm">You are not currently assigned to any buses. Relax and wait for dispatch instructions.</p>
                            </div>
                        </div>
                    ) : (
                        myBuses.map(bus => (
                            <div key={bus.busId} className="glass-card p-6 rounded-2xl border-l-[6px] border-l-nexus-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <span className="text-[10px] font-bold text-nexus-600 uppercase tracking-widest bg-nexus-50 px-2 py-1 rounded-md">Assigned Bus</span>
                                    <Bus size={22} className="text-slate-300" />
                                </div>
                                <div className="text-4xl font-display font-medium text-slate-900 relative z-10">{bus.busNumber}</div>
                                <div className="text-sm font-medium text-slate-500 mt-2 relative z-10">{bus.model} • {bus.capacity}</div>
                                <div className="mt-6 pt-4 border-t border-slate-100/60 flex items-center gap-3 relative z-10 text-sm">
                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide
                                        ${bus.status === 'Active' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${bus.status === 'Active' ? 'bg-brand-500' : 'bg-amber-500'}`}></div>
                                        {bus.status || 'Active'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {!pendingAssignment && myBuses.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
                    <div className="lg:col-span-2 glass-card rounded-2xl p-0 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100/60 bg-white/40">
                            <h2 className="text-lg font-display font-medium text-slate-900 flex items-center gap-2">
                                <Calendar size={20} className="text-nexus-500" />
                                Upcoming Trips
                            </h2>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            {mySchedules.length === 0 ? (
                                <div className="py-16 flex flex-col items-center justify-center text-slate-500">
                                    <Clock className="w-12 h-12 text-slate-200 mb-3" />
                                    <p>No upcoming schedules found.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Route</th>
                                            <th className="px-6 py-4">Departure Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/60 transition-colors">
                                        {mySchedules.map(schedule => (
                                            <tr key={schedule.scheduleId} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900 flex items-center gap-2">
                                                        <MapPin size={16} className="text-slate-400" />
                                                        {schedule.route ? `${schedule.route.origin} → ${schedule.route.destination}` : 'Unknown'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium">
                                                        {format(new Date(schedule.departureTime), 'PP p')}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl flex flex-col items-stretch overflow-hidden">
                         <div className="p-6 border-b border-slate-100/60 bg-white/40">
                            <h2 className="text-lg font-display font-medium text-slate-900 flex items-center gap-2">
                                <Send size={20} className="text-nexus-500" />
                                Dispatch Comms
                            </h2>
                        </div>
                        <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-transparent to-slate-50/30">
                            <p className="text-sm text-slate-500 mb-4 font-medium">Broadcast a real-time status update to dispatch and waiting passengers.</p>
                            <form onSubmit={handleSendUpdate} className="flex flex-col flex-1 gap-4">
                                <div className="flex flex-wrap gap-2 mb-1">
                                    <button type="button" onClick={() => document.querySelector('[name="updateMsg"]').value = 'Approaching destination, please get ready.'} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full transition-colors font-medium border border-indigo-200">Approaching Stop</button>
                                    <button type="button" onClick={() => document.querySelector('[name="updateMsg"]').value = 'Encountered a problem/delay. Will keep you updated.'} className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full transition-colors font-medium border border-rose-200">Report Problem</button>
                                </div>
                                <textarea
                                    name="updateMsg"
                                    required
                                    placeholder="E.g., Departing station now, Stuck in traffic on route A..."
                                    className="flex-1 w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none resize-none shadow-sm"
                                ></textarea>
                                <button 
                                    type="submit" 
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/15 hover:-translate-y-0.5"
                                >
                                    <Send size={18} /> Broadcast Update
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Container ---
export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const checkRole = (roleType) => {
             if (Array.isArray(user.role)) return user.role.some(r => String(r).trim().toLowerCase() === roleType.trim().toLowerCase());
             return String(user.userType || user.role || 'Passenger').trim().toLowerCase() === roleType.trim().toLowerCase();
        };
        
        // Redirect only non-admin and non-driver
        if (!checkRole('admin') && !checkRole('driver')) {
            navigate('/app/tickets');
        }
    }, [user, navigate]);

    if (!user) return null;

    const isDriver = Array.isArray(user.role) 
        ? user.role.some(r => String(r).trim().toLowerCase() === 'driver') 
        : String(user.userType || user.role || '').trim().toLowerCase() === 'driver';

    const isAdmin = Array.isArray(user.role) 
        ? user.role.some(r => String(r).trim().toLowerCase() === 'admin') 
        : String(user.userType || user.role || '').trim().toLowerCase() === 'admin';

    if (isDriver) {
        return <DriverDashboard user={user} />;
    }

    if (isAdmin) {
        return <AdminDashboard />;
    }

    return null;
}
