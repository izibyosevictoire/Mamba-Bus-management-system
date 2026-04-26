import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Map, Search, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { routeService, assignmentService, scheduleService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Routes() {
    const { user } = useAuth();
    const isAdmin = () => String(user?.userType || user?.role || '').trim().toLowerCase() === 'admin';

    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    useEffect(() => { fetchRoutes(); }, []);

    const fetchRoutes = async () => {
        try {
            const res = await routeService.getAll();
            let all = res.data.data || res.data || [];

            if (!isAdmin()) {
                // Drivers see only routes assigned to their bus
                const [assignRes, schedRes] = await Promise.all([
                    assignmentService.getAll(),
                    scheduleService.getAll(),
                ]);
                const myBusIds = (assignRes.data.data || [])
                    .filter(a => a.driverId === (user?.userId || user?.id))
                    .map(a => a.busId);
                const myRouteIds = (schedRes.data.data || [])
                    .filter(s => myBusIds.includes(s.busId))
                    .map(s => s.routeId);
                all = all.filter(r => myRouteIds.includes(r.routeId));
            }
            setRoutes(all);
        } catch {
            toast.error('Failed to load routes');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            const payload = {
                origin: data.origin.trim(),
                destination: data.destination.trim(),
                distance: parseFloat(data.distance),
                price: parseFloat(data.price),
            };
            if (editingRoute) {
                await routeService.update(editingRoute.routeId, payload);
                toast.success('Route updated');
            } else {
                await routeService.create(payload);
                toast.success('Route created');
            }
            fetchRoutes();
            closeModal();
        } catch (e) {
            toast.error(e.response?.data?.message || e.response?.data?.Message || 'Failed to save route');
        } finally {
            setSaving(false);
        }
    };

    const openAddModal = () => {
        setEditingRoute(null);
        reset({ origin: '', destination: '', distance: '', price: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (route) => {
        setEditingRoute(route);
        setValue('origin', route.origin);
        setValue('destination', route.destination);
        setValue('distance', route.distance);
        setValue('price', route.price);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRoute(null);
        reset();
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await routeService.delete(deleteTarget.routeId);
            toast.success('Route deleted');
            setDeleteTarget(null);
            fetchRoutes();
        } catch (e) {
            toast.error(e.response?.data?.message || e.response?.data?.Message || 'Failed to delete route');
        } finally {
            setDeleting(false);
        }
    };

    const filtered = routes.filter(r =>
        r.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight">Route Management</h1>
                    <p className="text-slate-500 mt-1">Create and manage travel routes.</p>
                </div>
                {isAdmin() && (
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5 font-medium"
                    >
                        <Plus size={20} />
                        <span>Add Route</span>
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search origin or destination..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                />
            </div>

            {/* Route Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loading ? (
                    <div className="col-span-full py-16 text-center text-slate-400">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-nexus-500" />
                        Loading routes...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-400">
                        <Map className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                        No routes found.
                    </div>
                ) : filtered.map(route => (
                    <div key={route.routeId} className="glass-card rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group border-t-4 border-t-nexus-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-nexus-50 rounded-xl flex items-center justify-center text-nexus-600 border border-nexus-100">
                                <Map size={20} />
                            </div>
                            {isAdmin() && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEditModal(route)}
                                        className="p-2 text-slate-400 hover:text-nexus-600 hover:bg-nexus-50 rounded-xl transition-all"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(route)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-slate-900 font-display font-semibold text-lg mb-3">
                            <span>{route.origin}</span>
                            <ArrowRight size={18} className="text-nexus-400 flex-shrink-0" />
                            <span>{route.destination}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                            <span className="text-slate-500">{route.distance} km</span>
                            <span className="font-bold text-nexus-600 bg-nexus-50 px-3 py-1 rounded-lg border border-nexus-100">
                                RWF {Number(route.price).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create / Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRoute ? 'Edit Route' : 'Add Route'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Origin</label>
                            <input
                                {...register('origin', { required: 'Origin is required' })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                                placeholder="e.g. Kigali"
                            />
                            {errors.origin && <p className="text-xs text-rose-500 mt-1">{errors.origin.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Destination</label>
                            <input
                                {...register('destination', { required: 'Destination is required' })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                                placeholder="e.g. Musanze"
                            />
                            {errors.destination && <p className="text-xs text-rose-500 mt-1">{errors.destination.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Distance (km)</label>
                            <input
                                type="number" step="0.1" min="0.1"
                                {...register('distance', { required: 'Distance is required', min: { value: 0.1, message: 'Must be > 0' } })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                                placeholder="0.0"
                            />
                            {errors.distance && <p className="text-xs text-rose-500 mt-1">{errors.distance.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Price (RWF)</label>
                            <input
                                type="number" step="1" min="1"
                                {...register('price', { required: 'Price is required', min: { value: 1, message: 'Must be > 0' } })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                                placeholder="0"
                            />
                            {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md font-medium disabled:opacity-50 flex items-center gap-2">
                            {saving && <Loader2 size={15} className="animate-spin" />}
                            {editingRoute ? 'Save Changes' : 'Create Route'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Route">
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                        <AlertTriangle size={26} className="text-rose-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 text-lg">Delete this route?</p>
                        {deleteTarget && (
                            <p className="text-slate-500 text-sm mt-1">
                                <span className="font-bold text-slate-800">{deleteTarget.origin} → {deleteTarget.destination}</span>
                            </p>
                        )}
                        <p className="text-xs text-rose-500 mt-2">All schedules and tickets on this route will also be deleted.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-all">
                        Cancel
                    </button>
                    <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-medium shadow-md disabled:opacity-50 flex items-center gap-2">
                        {deleting && <Loader2 size={15} className="animate-spin" />}
                        Delete Route
                    </button>
                </div>
            </Modal>
        </div>
    );
}
