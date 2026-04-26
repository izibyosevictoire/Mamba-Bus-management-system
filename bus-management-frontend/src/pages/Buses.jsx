import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Bus as BusIcon, Search, Upload } from 'lucide-react';
import { busService, agencyService } from '../api/services';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function Buses() {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBus, setEditingBus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [agencies, setAgencies] = useState([]);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        fetchBuses();
        fetchAgencies();
    }, []);

    const fetchAgencies = async () => {
        try {
            const res = await agencyService.getAll();
            setAgencies(res.data.data || res.data);
        } catch (e) {
            console.error("Failed to fetch agencies", e);
        }
    };

    const fetchBuses = async () => {
        try {
            const response = await busService.getAll();
            setBuses(response.data.data);
        } catch (error) {
            console.error('Failed to fetch buses', error);
            toast.error('Failed to load buses');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            // Ensure capacity is integer
            data.capacity = parseInt(data.capacity);

            if (editingBus) {
                await busService.update(editingBus.busId, { ...data, agencyId: data.agencyId ? parseInt(data.agencyId) : null });
            } else {
                await busService.create({ ...data, agencyId: data.agencyId ? parseInt(data.agencyId) : null });
            }
            fetchBuses();
            closeModal();
            toast.success(editingBus ? 'Bus updated successfully' : 'Bus created successfully');
        } catch (error) {
            console.error('Failed to save bus', error);
            toast.error('Failed to save bus');
        }
    };

    const openAddModal = () => {
        setEditingBus(null);
        reset({ busNumber: '', model: '', capacity: '', agencyId: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (bus) => {
        setEditingBus(bus);
        setValue('busNumber', bus.busNumber);
        setValue('model', bus.model);
        setValue('capacity', bus.capacity);
        setValue('status', bus.status);
        setValue('agencyId', bus.agencyId || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBus(null);
        reset();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this bus?')) {
            try {
                await busService.delete(id);
                toast.success('Bus deleted successfully');
                fetchBuses();
            } catch (error) {
                console.error('Failed to delete bus', error);
                toast.error('Failed to delete bus');
            }
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            const newBuses = [];
            
            // Assume format matches: BusNumber,Model,Capacity
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const parts = line.split(',');
                    if (parts.length >= 3) {
                        newBuses.push({ 
                            busNumber: parts[0].trim(), 
                            model: parts[1].trim(), 
                            capacity: parseInt(parts[2].trim()) 
                        });
                    }
                }
            }

            if (newBuses.length > 0) {
                toast.loading(`Importing ${newBuses.length} buses...`, { id: 'import-toast' });
                let successCount = 0;
                
                for (const bus of newBuses) {
                    try {
                        await busService.create(bus);
                        successCount++;
                    } catch (err) {
                        console.error('Failed to import bus', bus, err);
                    }
                }
                
                toast.success(`Import complete: ${successCount} added.`, { id: 'import-toast' });
                fetchBuses();
            } else {
                toast.error('No valid records found in CSV.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = null;
    };

    const filteredBuses = buses.filter(bus =>
        bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bus.agencyName && bus.agencyName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight">Bus Fleet</h1>
                    <p className="text-slate-500 mt-1">Manage your centralized bus directory and operational status.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input type="file" id="csv-upload" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    <button
                        onClick={() => document.getElementById('csv-upload').click()}
                        className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-medium"
                    >
                        <Upload size={20} />
                        <span className="hidden sm:inline">Import CSV</span>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5 font-medium"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">Add New Bus</span>
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="glass-card p-5 rounded-2xl">
                <div className="relative max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by bus number or model..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-nexus-500 focus:ring-4 focus:ring-nexus-500/10 transition-all outline-none text-slate-900 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Bus Details</th>
                                <th className="px-6 py-4">Capacity</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Agency</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-600"></div>
                                            <p>Loading fleet data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBuses.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <BusIcon className="w-12 h-12 text-slate-200" />
                                            <p className="text-lg">No buses found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBuses.map((bus) => (
                                    <tr key={bus.busId} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nexus-100 to-nexus-50 flex items-center justify-center text-nexus-600 shadow-sm border border-nexus-200/50 group-hover:scale-105 transition-transform">
                                                    <BusIcon size={22} className="stroke-[1.5]" />
                                                </div>
                                                <div>
                                                    <div className="font-display font-medium text-slate-900 text-base">{bus.busNumber}</div>
                                                    <div className="text-slate-500 text-xs mt-0.5">{bus.model} • <span className="text-nexus-600 font-medium">{bus.agencyName || 'No Agency'}</span></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium">
                                                {bus.capacity} <span className="text-slate-400 ml-1 font-normal">seats</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                                                bus.status?.toLowerCase() === 'active' 
                                                ? 'bg-brand-50 text-brand-700' 
                                                : 'bg-amber-50 text-amber-700'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${bus.status?.toLowerCase() === 'active' ? 'bg-brand-500' : 'bg-amber-500'}`}></div>
                                                {bus.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            {bus.agencyName || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(bus)}
                                                    className="p-2 text-slate-400 hover:text-nexus-600 hover:bg-nexus-50 rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bus.busId)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingBus ? 'Edit Fleet Vehicle' : 'Add New Vehicle'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Bus Identifier</label>
                        <input
                            {...register('busNumber', { required: 'Bus Number is required' })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900"
                            placeholder="e.g. BUS-001"
                        />
                        {errors.busNumber && <p className="text-sm text-red-500 mt-2">{errors.busNumber.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Model</label>
                        <input
                            {...register('model', { required: 'Model is required' })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900"
                            placeholder="e.g. Mercedes Benz O500"
                        />
                        {errors.model && <p className="text-sm text-red-500 mt-2">{errors.model.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Passenger Capacity</label>
                        <input
                            type="number"
                            {...register('capacity', { required: 'Capacity is required', min: 1, max: 100 })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900"
                            placeholder="50"
                        />
                        {errors.capacity && <p className="text-sm text-red-500 mt-2">{errors.capacity.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Transport Agency</label>
                        <select
                            {...register('agencyId')}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-nexus-500/10 focus:border-nexus-500 transition-all outline-none text-slate-900"
                        >
                            <option value="">Select an Agency (Optional)</option>
                            {agencies.map(a => (
                                <option key={a.agencyId} value={a.agencyId}>{a.name}</option>
                            ))}
                        </select>
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
                            {editingBus ? 'Save Changes' : 'Create Vehicle'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
