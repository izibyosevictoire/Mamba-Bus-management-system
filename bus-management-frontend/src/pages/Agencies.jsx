import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Building, Search, Mail, Phone } from 'lucide-react';
import { agencyService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Agencies() {
    const { user } = useAuth();
    const isRole = (roleType) => {
        if (!user) return false;
        if (Array.isArray(user.role)) return user.role.some(r => String(r).trim().toLowerCase() === roleType.trim().toLowerCase());
        return String(user.userType || user.role || '').trim().toLowerCase() === roleType.trim().toLowerCase();
    };
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgency, setEditingAgency] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        fetchAgencies();
    }, []);

    const fetchAgencies = async () => {
        try {
            const response = await agencyService.getAll();
            setAgencies(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch agencies', error);
            toast.error("Failed to load agencies");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            if (editingAgency) {
                await agencyService.update(editingAgency.agencyId, data);
            } else {
                await agencyService.create(data);
            }
            fetchAgencies();
            closeModal();
            toast.success(editingAgency ? 'Agency updated successfully' : 'Agency created successfully');
        } catch (error) {
            console.error('Failed to save agency', error);
            toast.error('Failed to save agency');
        }
    };

    const openAddModal = () => {
        setEditingAgency(null);
        reset({ name: '', contactEmail: '', contactPhone: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (agency) => {
        setEditingAgency(agency);
        setValue('name', agency.name);
        setValue('contactEmail', agency.contactEmail);
        setValue('contactPhone', agency.contactPhone);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAgency(null);
        reset();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this agency?')) {
            try {
                await agencyService.delete(id);
                toast.success('Agency deleted successfully');
                fetchAgencies();
            } catch (error) {
                console.error('Failed to delete agency', error);
                toast.error('Failed to delete agency');
            }
        }
    };

    const filteredAgencies = agencies.filter(agency =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Agency Management</h1>
                    <p className="text-slate-500">Manage bus operators and agencies.</p>
                </div>
                {isRole('admin') && (
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        <span>Add New Agency</span>
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by agency name..."
                        className="pl-10 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid of Agencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-500">Loading agencies...</div>
                ) : filteredAgencies.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500">No agencies found.</div>
                ) : (
                    filteredAgencies.map((agency) => (
                        <div key={agency.agencyId} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Building size={24} />
                                </div>
                                {isRole('admin') && (
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(agency)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(agency.agencyId)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="text-slate-900 font-semibold text-lg mb-4">
                                {agency.name}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Mail size={16} />
                                    <span>{agency.contactEmail || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Phone size={16} />
                                    <span>{agency.contactPhone || 'No phone'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAgency ? 'Edit Agency' : 'Create Agency'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Agency Name</label>
                        <input
                            {...register('name', { required: 'Agency name is required' })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Agency Name"
                        />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                        <input
                            type="email"
                            {...register('contactEmail')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="email@agency.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                        <input
                            {...register('contactPhone')}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="+250..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            {editingAgency ? 'Update Agency' : 'Create Agency'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
