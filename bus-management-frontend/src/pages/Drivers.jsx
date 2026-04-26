import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Users, Bus as BusIcon, BellRing, Send, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import { busService, userService, assignmentService } from '../api/services';
import { notificationService } from '../api/notificationService';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Drivers() {
    const [assignments, setAssignments] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

    // Unassign confirm
    const [unassignTarget, setUnassignTarget] = useState(null);
    const [unassigning, setUnassigning] = useState(false);

    // Form for registration
    const {
        register: registerDriver,
        handleSubmit: handleSubmitDriver,
        reset: resetDriver,
        formState: { errors: driverErrors }
    } = useForm();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [assignRes, busRes, userRes] = await Promise.all([
                assignmentService.getAll(),
                busService.getAll(),
                userService.getAll()
            ]);
            setAssignments(assignRes.data.data);
            setBuses(busRes.data.data);
            // Filter only users with userType 'Driver'
            const allUsers = userRes.data.data || [];
            const driverUsers = allUsers.filter(u => u.userType === 'Driver');
            setDrivers(driverUsers);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            const busIdInt = parseInt(data.busId);
            const driverIdInt = parseInt(data.driverId);

            if (isNaN(busIdInt) || isNaN(driverIdInt)) {
                toast.error("Invalid Bus or Driver selection");
                return;
            }

            const payload = {
                busId: busIdInt,
                driverId: driverIdInt
            };

            await assignmentService.create(payload);
            toast.success("Driver assigned successfully");
            fetchData();
            closeModal();
        } catch (error) {
            console.error('Failed to assign driver', error);
            // Handle expected 400 Bad Request with custom message
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to assign driver. Check if driver/bus is already assigned.');
            }
        }
    };

    const openAddModal = () => {
        reset({ busId: '', driverId: '' });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleDelete = async (id) => {
        // no-op — use unassignTarget modal instead
    };

    const confirmUnassign = async () => {
        if (!unassignTarget) return;
        setUnassigning(true);
        try {
            const id = unassignTarget.assignmentId || unassignTarget.AssignmentId || unassignTarget.id;
            await assignmentService.delete(id);
            toast.success(`${getDriverName(unassignTarget.driverId)} unassigned from ${getBusNumber(unassignTarget.busId)}`);
            setUnassignTarget(null);
            fetchData();
        } catch (e) {
            console.error('[Unassign]', e.response?.status, e.response?.data);
            toast.error(e.response?.data?.message || e.response?.data?.Message || 'Failed to unassign driver');
        } finally {
            setUnassigning(false);
        }
    };

    const getDriverName = (id) => drivers.find(d => (d.id || d.userId) === id)?.name || `Driver #${id}`;
    const getBusNumber = (id) => buses.find(b => b.busId === id)?.busNumber || `Bus #${id}`;

    const onRegisterDriver = async (data) => {
        try {
            const payload = { ...data, userType: 'Driver' };
            await api.post('/Auth/register', payload);
            toast.success("Driver created successfully!");
            setIsRegisterModalOpen(false);
            resetDriver();
            fetchData(); // Refresh lists
        } catch (error) {
            console.error("Failed to register driver", error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to register driver. Email might be taken.");
            }
        }
    };

    const handleSendAlert = async (e) => {
        e.preventDefault();
        const msg = e.target.elements.alertMessage.value;
        if (!msg) return;
        try {
            await notificationService.sendEmergencyAlert({ message: msg });
            toast.success("Alert sent to all drivers!");
            setIsAlertModalOpen(false);
        } catch (error) {
            toast.error("Failed to send alert");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight">Driver Assignments</h1>
                    <p className="text-slate-500 mt-1">Manage transport personnel and their designated vehicles.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setIsAlertModalOpen(true)}
                        className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-200/60 px-5 py-2.5 rounded-xl hover:bg-rose-100 transition-all shadow-sm font-medium"
                    >
                        <BellRing size={20} />
                        <span>Send Alert</span>
                    </button>
                    <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-nexus-600 border border-nexus-200 px-5 py-2.5 rounded-xl hover:bg-nexus-50 transition-all shadow-sm font-medium"
                    >
                        <Plus size={20} />
                        <span>New Driver</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5 font-medium"
                    >
                        <Plus size={20} />
                        <span>Assign Bus</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-600"></div>
                        <p>Loading assignments...</p>
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-500 glass-card rounded-2xl flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-slate-300" />
                        <p className="text-lg">No active assignments found.</p>
                    </div>
                ) : (
                    assignments.map((assignment) => (
                        <div key={assignment.assignmentId || assignment.id} className="glass-card rounded-2xl p-6 flex flex-col gap-5 border-t-[4px] border-t-nexus-500 group drop-shadow-sm hover:drop-shadow-md transition-all relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-nexus-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-nexus-500/10 transition-colors"></div>
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-nexus-100 to-nexus-50 flex items-center justify-center text-nexus-600 shadow-sm border border-nexus-200/50">
                                        <Users size={24} className="stroke-[1.5]" />
                                    </div>
                                    <div>
                                        <div className="font-display font-medium text-slate-900 text-lg">{assignment.driverName || getDriverName(assignment.driverId)}</div>
                                        <div className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Assigned Operator</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUnassignTarget(assignment)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Unassign driver from bus"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-1 relative z-10">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100/60 rounded-xl text-slate-700 flex-1">
                                    <BusIcon size={22} className="text-nexus-500 stroke-[1.5]" />
                                    <div className="flex flex-col">
                                        <span className="font-display font-medium">{assignment.busNumber || getBusNumber(assignment.busId)}</span>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                                            {buses.find(b => b.busId === assignment.busId)?.agencyName || 'No Agency'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-2 flex items-center relative z-10">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase ${
                                    assignment.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 
                                    assignment.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-700'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        assignment.status === 'Pending' ? 'bg-amber-500' : 
                                        assignment.status === 'Rejected' ? 'bg-rose-500' : 'bg-brand-500'
                                    }`}></div>
                                    {assignment.status || 'Active'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Assign Driver to Bus">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Driver</label>
                        <select
                            {...register('driverId', { required: 'Driver is required' })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900 appearance-none"
                        >
                            <option value="">Select a driver...</option>
                            {drivers.map(d => (
                                <option key={d.id || d.userId} value={d.id || d.userId}>{d.name} ({d.email})</option>
                            ))}
                        </select>
                        {errors.driverId && <p className="text-sm text-red-500 mt-2">{errors.driverId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Bus</label>
                        <select
                            {...register('busId', { required: 'Bus is required' })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900 appearance-none"
                        >
                            <option value="">Select a bus...</option>
                            {buses.map(b => (
                                <option key={b.busId} value={b.busId}>{b.busNumber}</option>
                            ))}
                        </select>
                        {errors.busId && <p className="text-sm text-red-500 mt-2">{errors.busId.message}</p>}
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md font-medium"
                        >
                            Confirm Assignment
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Register New Driver">
                <form onSubmit={handleSubmitDriver(onRegisterDriver)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                        <input {...registerDriver('name', { required: 'Name is required' })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900" placeholder="John Doe" />
                        {driverErrors.name && <p className="text-sm text-red-500 mt-1">{driverErrors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                        <input {...registerDriver('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900" placeholder="driver@example.com" />
                        {driverErrors.email && <p className="text-sm text-red-500 mt-1">{driverErrors.email.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                        <input {...registerDriver('phone', { required: 'Phone is required' })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900" placeholder="+1234567890" />
                        {driverErrors.phone && <p className="text-sm text-red-500 mt-1">{driverErrors.phone.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Licence Number</label>
                        <input {...registerDriver('licenceNumber', { required: 'Licence is required' })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900" placeholder="LIC-123456" />
                        {driverErrors.licenceNumber && <p className="text-sm text-red-500 mt-1">{driverErrors.licenceNumber.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Initial Password</label>
                        <input type="password" {...registerDriver('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900" />
                        {driverErrors.password && <p className="text-sm text-red-500 mt-1">{driverErrors.password.message}</p>}
                    </div>
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md font-medium">Create Driver</button>
                    </div>
                </form>
            </Modal>

            {/* Unassign Confirm Modal */}
            <Modal isOpen={!!unassignTarget} onClose={() => setUnassignTarget(null)} title="Unassign Driver">
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                        <AlertTriangle size={26} className="text-rose-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 text-lg">Unassign this driver?</p>
                        {unassignTarget && (
                            <p className="text-slate-500 text-sm mt-1">
                                <span className="font-bold text-slate-800">{getDriverName(unassignTarget.driverId)}</span>
                                {' '}will be removed from{' '}
                                <span className="font-bold text-slate-800">{getBusNumber(unassignTarget.busId)}</span>.
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button
                        onClick={() => setUnassignTarget(null)}
                        className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmUnassign}
                        disabled={unassigning}
                        className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-medium shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                        {unassigning && <Loader2 size={15} className="animate-spin" />}
                        Yes, Unassign
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isAlertModalOpen} onClose={() => setIsAlertModalOpen(false)} title="Send Emergency Alert">
                <form onSubmit={handleSendAlert} className="space-y-5">
                    <div className="bg-rose-50 border border-rose-200/50 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-rose-800 leading-relaxed font-medium">This will immediately broadcast a critical alert to all active drivers in the transit network.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                        <textarea name="alertMessage" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900 resize-none min-h-[120px]" placeholder="E.g. Severe weather warning on route 4..." />
                    </div>
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsAlertModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-rose-600 flex items-center gap-2 text-white rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 font-medium">
                            <Send size={18} /> Broadcast Alert
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
