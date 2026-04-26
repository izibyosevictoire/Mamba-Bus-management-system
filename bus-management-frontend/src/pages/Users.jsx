import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Edit2, Shield, User, Trash2, Loader2, AlertTriangle, Search } from 'lucide-react';
import { userService } from '../api/services';
import Modal from '../components/Modal';
import api from '../api/client';
import toast from 'react-hot-toast';

const USER_TYPES = ['Admin', 'Passenger', 'Driver', 'Checker', 'Client'];

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Edit modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [saving, setSaving] = useState(false);
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    // Delete confirm modal
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Permissions modal
    const [permissions, setPermissions] = useState([]);
    const [isPermOpen, setIsPermOpen] = useState(false);
    const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);
    const [selectedPerms, setSelectedPerms] = useState([]);

    useEffect(() => { fetchUsers(); fetchPermissions(); }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(users.filter(u =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.userType?.toLowerCase().includes(q)
        ));
    }, [search, users]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userService.getAll();
            const data = res.data.data || [];
            if (data.length > 0) {
                console.log('[Users] Sample user object keys:', Object.keys(data[0]));
            }
            setUsers(data);
            setFiltered(data);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const res = await api.get('/Users/permissions/available');
            setPermissions(res.data.data || res.data || []);
        } catch { /* optional feature */ }
    };

    // ── Edit ──────────────────────────────────────────────────────────────────
    const openEdit = (user) => {
        setEditingUser(user);
        setValue('name', user.name || '');
        setValue('email', user.email || '');
        setValue('phone', user.phone || '');
        setValue('userType', user.userType || 'Passenger');
        setValue('isActive', user.isActive ?? true);
        setIsEditOpen(true);
    };

    const onUpdate = async (data) => {
        setSaving(true);
        try {
            const id = editingUser.userId || editingUser.id || editingUser.Id || editingUser.UserId;
            if (!id) throw new Error('Could not resolve user ID');
            await userService.update(id, {
                name: data.name,
                email: data.email,
                phone: data.phone,
                userType: data.userType,
                isActive: data.isActive,
            });
            toast.success('User updated successfully');
            setIsEditOpen(false);
            fetchUsers();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const openDelete = (user) => {
        setDeletingUser(user);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            const id = deletingUser.userId || deletingUser.id || deletingUser.Id || deletingUser.UserId;
            if (!id) throw new Error('Could not resolve user ID');
            await userService.delete(id);
            toast.success(`${deletingUser.name} has been deleted`);
            setIsDeleteOpen(false);
            fetchUsers();
        } catch (e) {
            console.error('[Delete User] Error:', e.response?.status, e.response?.data);
            const msg =
                e.response?.data?.message ||
                e.response?.data?.Message ||
                e.response?.data?.title ||
                e.message ||
                'Failed to delete user';
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    // ── Permissions ───────────────────────────────────────────────────────────
    const openPerms = (user) => {
        setSelectedUserForPerms(user);
        setSelectedPerms(user.permissions || []);
        setIsPermOpen(true);
    };

    const savePermissions = async () => {
        try {
            const id = selectedUserForPerms.userId || selectedUserForPerms.id || selectedUserForPerms.Id || selectedUserForPerms.UserId;
            await api.put(`/Users/${id}/permissions`, { permissions: selectedPerms });
            toast.success('Permissions updated');
            setIsPermOpen(false);
            fetchUsers();
        } catch {
            toast.error('Failed to save permissions');
        }
    };

    const togglePerm = (name) =>
        setSelectedPerms(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-500 mt-1">Manage accounts, roles, and permissions.</p>
                </div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30 w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="py-16 text-center text-slate-400">
                                <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-nexus-500" />
                                Loading users...
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={4} className="py-16 text-center text-slate-400">No users found.</td></tr>
                        ) : filtered.map(user => (
                            <tr key={user.id || user.userId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-nexus-500 to-nexus-700 flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm">
                                            {user.name?.[0] || <User size={16} />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">{user.name}</div>
                                            <div className="text-slate-400 text-xs">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-nexus-50 text-nexus-700 border border-nexus-100">
                                        {user.userType}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => openPerms(user)}
                                            title="Manage Permissions"
                                            className="p-2 rounded-lg text-slate-400 hover:text-nexus-600 hover:bg-nexus-50 transition-all"
                                        >
                                            <Shield size={17} />
                                        </button>
                                        <button
                                            onClick={() => openEdit(user)}
                                            title="Edit User"
                                            className="p-2 rounded-lg text-slate-400 hover:text-nexus-600 hover:bg-nexus-50 transition-all"
                                        >
                                            <Edit2 size={17} />
                                        </button>
                                        <button
                                            onClick={() => openDelete(user)}
                                            title="Delete User"
                                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Edit Modal ── */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User">
                <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                            <input
                                {...register('name', { required: 'Name is required' })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                                placeholder="Full name"
                            />
                            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                            <input
                                {...register('email', { required: 'Email is required' })}
                                type="email"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                                placeholder="email@example.com"
                            />
                            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone</label>
                            <input
                                {...register('phone')}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                                placeholder="Phone number"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Role</label>
                            <select
                                {...register('userType', { required: true })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                            >
                                {USER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <input
                                type="checkbox"
                                id="isActive"
                                {...register('isActive')}
                                className="w-4 h-4 rounded border-slate-300 text-nexus-600 focus:ring-nexus-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                                Account is Active
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsEditOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 bg-nexus-600 text-white rounded-xl hover:bg-nexus-700 transition-all font-medium shadow-md disabled:opacity-50 flex items-center gap-2">
                            {saving && <Loader2 size={15} className="animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Confirm Modal ── */}
            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete User">
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                        <AlertTriangle size={26} className="text-rose-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 text-lg">Are you sure?</p>
                        <p className="text-slate-500 text-sm mt-1">
                            You're about to delete <span className="font-bold text-slate-800">{deletingUser?.name}</span>. This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                    <button onClick={() => setIsDeleteOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium">
                        Cancel
                    </button>
                    <button onClick={confirmDelete} disabled={deleting} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all font-medium shadow-md disabled:opacity-50 flex items-center gap-2">
                        {deleting && <Loader2 size={15} className="animate-spin" />}
                        Delete User
                    </button>
                </div>
            </Modal>

            {/* ── Permissions Modal ── */}
            {isPermOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-display font-bold text-slate-900 mb-1">Manage Permissions</h3>
                        <p className="text-sm text-slate-500 mb-5">For <span className="font-semibold text-slate-700">{selectedUserForPerms?.name}</span></p>
                        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-1">
                            {permissions.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-4">No permissions available.</p>
                            ) : permissions.map(p => (
                                <label key={p.name} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={selectedPerms.includes(p.name)}
                                        onChange={() => togglePerm(p.name)}
                                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-nexus-600 focus:ring-nexus-500"
                                    />
                                    <div>
                                        <span className="font-semibold text-sm text-slate-900 block">{p.name}</span>
                                        <span className="text-xs text-slate-400">{p.description}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setIsPermOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium">Cancel</button>
                            <button onClick={savePermissions} className="px-5 py-2.5 bg-nexus-600 text-white rounded-xl hover:bg-nexus-700 transition-all font-medium shadow-md">Save Permissions</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
