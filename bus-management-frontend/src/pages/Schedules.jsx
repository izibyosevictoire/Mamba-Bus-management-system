import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Calendar, Bus as BusIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { scheduleService, busService, routeService } from '../api/services';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { parseLocalDate } from '../lib/utils';

// Returns the minimum datetime string for datetime-local input (now)
const nowLocal = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
};

export default function Schedules() {
    const [schedules, setSchedules] = useState([]);
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit/create modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);

    // Delete confirm modal
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
    const departureValue = watch('departureTime');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [schedRes, busRes, routeRes] = await Promise.all([
                scheduleService.getAll(),
                busService.getAll(),
                routeService.getAll(),
            ]);
            setSchedules(schedRes.data.data || []);
            setBuses(busRes.data.data || []);
            setRoutes(routeRes.data.data || []);
        } catch {
            toast.error('Failed to load schedule data');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        // Frontend date validation — must be in the future
        const departure = new Date(data.departureTime);
        const arrival = new Date(data.arrivalTime);
        const now = new Date();

        if (departure <= now) {
            toast.error('Departure time must be today or a future date and time.');
            return;
        }
        if (arrival <= departure) {
            toast.error('Arrival time must be after departure time.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                busId: parseInt(data.busId),
                routeId: parseInt(data.routeId),
                // Send as-is (no UTC conversion) so backend stores local time
                departureTime: data.departureTime,
                arrivalTime: data.arrivalTime,
            };
            if (editingSchedule) {
                await scheduleService.update(editingSchedule.scheduleId, payload);
                toast.success('Schedule updated');
            } else {
                await scheduleService.create(payload);
                toast.success('Schedule created');
            }
            fetchData();
            closeModal();
        } catch (e) {
            toast.error(e.response?.data?.message || e.response?.data?.Message || 'Failed to save schedule');
        } finally {
            setSaving(false);
        }
    };

    const openAddModal = () => {
        setEditingSchedule(null);
        reset({ busId: '', routeId: '', departureTime: '', arrivalTime: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (schedule) => {
        setEditingSchedule(schedule);
        setValue('busId', schedule.busId);
        setValue('routeId', schedule.routeId);
        setValue('departureTime', new Date(schedule.departureTime).toISOString().slice(0, 16));
        setValue('arrivalTime', new Date(schedule.arrivalTime).toISOString().slice(0, 16));
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSchedule(null);
        reset();
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await scheduleService.delete(deleteTarget.scheduleId);
            toast.success('Schedule deleted');
            setDeleteTarget(null);
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || e.response?.data?.Message || 'Failed to delete schedule');
        } finally {
            setDeleting(false);
        }
    };

    const getBusNumber = (id) => buses.find(b => b.busId === id)?.busNumber || `Bus #${id}`;
    const getRoute = (id) => routes.find(r => r.routeId === id);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight">Schedule Management</h1>
                    <p className="text-slate-500 mt-1">Plan and coordinate active transit routes and timings.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={20} />
                    <span>Create Schedule</span>
                </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Route</th>
                                <th className="px-6 py-4">Bus</th>
                                <th className="px-6 py-4">Departure</th>
                                <th className="px-6 py-4">Arrival</th>
                                <th className="px-6 py-4">Agency</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                            {loading ? (
                                <tr><td colSpan={6} className="py-16 text-center text-slate-400">
                                    <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-nexus-500" />
                                    Loading schedules...
                                </td></tr>
                            ) : schedules.length === 0 ? (
                                <tr><td colSpan={6} className="py-16 text-center text-slate-400">
                                    <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                                    No schedules found.
                                </td></tr>
                            ) : schedules.map(schedule => {
                                const route = getRoute(schedule.routeId);
                                const isPast = parseLocalDate(schedule.departureTime) < new Date();
                                return (
                                    <tr key={schedule.scheduleId} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">
                                                {route ? `${route.origin} → ${route.destination}` : `Route #${schedule.routeId}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-nexus-50 text-nexus-700 border border-nexus-100/50">
                                                <BusIcon size={14} />
                                                {getBusNumber(schedule.busId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`font-medium ${isPast ? 'text-slate-400' : 'text-slate-700'}`}>
                                                {format(parseLocalDate(schedule.departureTime), 'dd MMM yyyy')}
                                            </div>
                                            <div className="text-xs text-slate-400">{format(parseLocalDate(schedule.departureTime), 'p')}</div>
                                            {isPast && <span className="text-[10px] font-bold text-rose-400 uppercase">Past</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-700">{format(parseLocalDate(schedule.arrivalTime), 'dd MMM yyyy')}</div>
                                            <div className="text-xs text-slate-400">{format(parseLocalDate(schedule.arrivalTime), 'p')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold text-nexus-600 bg-nexus-50 px-2 py-1 rounded">
                                                {schedule.agencyName || 'Standard'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEditModal(schedule)}
                                                    className="p-2 text-slate-400 hover:text-nexus-600 hover:bg-nexus-50 rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={17} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(schedule)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSchedule ? 'Edit Schedule' : 'Create Schedule'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Route</label>
                        <select
                            {...register('routeId', { required: 'Route is required' })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-nexus-500/30 focus:border-nexus-500 outline-none text-slate-900"
                        >
                            <option value="">Select a route...</option>
                            {routes.map(r => (
                                <option key={r.routeId} value={r.routeId}>{r.origin} → {r.destination} (RWF {r.price})</option>
                            ))}
                        </select>
                        {errors.routeId && <p className="text-xs text-rose-500 mt-1">{errors.routeId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bus</label>
                        <select
                            {...register('busId', { required: 'Bus is required' })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-nexus-500/30 focus:border-nexus-500 outline-none text-slate-900"
                        >
                            <option value="">Select a bus...</option>
                            {buses.map(b => (
                                <option key={b.busId} value={b.busId}>{b.busNumber} — {b.model} ({b.capacity} seats)</option>
                            ))}
                        </select>
                        {errors.busId && <p className="text-xs text-rose-500 mt-1">{errors.busId.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Departure</label>
                            <input
                                type="datetime-local"
                                min={nowLocal()}
                                {...register('departureTime', {
                                    required: 'Departure time is required',
                                    validate: v => new Date(v) > new Date() || 'Must be a future date and time',
                                })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-nexus-500/30 focus:border-nexus-500 outline-none text-slate-900"
                            />
                            {errors.departureTime && <p className="text-xs text-rose-500 mt-1">{errors.departureTime.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Arrival</label>
                            <input
                                type="datetime-local"
                                min={departureValue || nowLocal()}
                                {...register('arrivalTime', {
                                    required: 'Arrival time is required',
                                    validate: v => !departureValue || new Date(v) > new Date(departureValue) || 'Must be after departure',
                                })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-nexus-500/30 focus:border-nexus-500 outline-none text-slate-900"
                            />
                            {errors.arrivalTime && <p className="text-xs text-rose-500 mt-1">{errors.arrivalTime.message}</p>}
                        </div>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>Only future dates and times are allowed. Past schedules cannot be created.</span>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md font-medium disabled:opacity-50 flex items-center gap-2">
                            {saving && <Loader2 size={15} className="animate-spin" />}
                            {editingSchedule ? 'Save Changes' : 'Create Schedule'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Schedule">
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                        <AlertTriangle size={26} className="text-rose-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 text-lg">Delete this schedule?</p>
                        {deleteTarget && (
                            <p className="text-slate-500 text-sm mt-1">
                                {getRoute(deleteTarget.routeId)
                                    ? `${getRoute(deleteTarget.routeId).origin} → ${getRoute(deleteTarget.routeId).destination}`
                                    : `Schedule #${deleteTarget.scheduleId}`}
                                {' · '}{format(parseLocalDate(deleteTarget.departureTime), 'dd MMM yyyy p')}
                            </p>
                        )}
                        <p className="text-xs text-rose-500 mt-2">This will also delete all tickets for this schedule.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-all">
                        Cancel
                    </button>
                    <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-medium shadow-md disabled:opacity-50 flex items-center gap-2">
                        {deleting && <Loader2 size={15} className="animate-spin" />}
                        Delete Schedule
                    </button>
                </div>
            </Modal>
        </div>
    );
}
