import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Ticket, Calendar, Map, CheckCircle, Download, Building,
    Plus, Trash2, User, Phone, ChevronRight, ChevronLeft,
    CreditCard, Banknote, QrCode, Loader2, AlertCircle, X, ScanLine,
    Smartphone
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/client';
import { scheduleService, routeService, ticketService } from '../api/services';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { generateTicketPDF } from '../lib/ticketPDF';
import { parseLocalDate } from '../lib/utils';

// ─── Seat Map Component ───────────────────────────────────────────────────────
const SeatMap = ({ totalSeats = 40, bookedSeats = [], selectedSeats = [], onToggle }) => {
    const rows = Math.ceil(totalSeats / 4);
    return (
        <div className="space-y-3">
            {/* Driver row */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                    <span className="w-7 h-7 bg-slate-200 rounded flex items-center justify-center text-slate-600">🚌</span>
                    <span>Driver</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300 inline-block"></span> Available</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-rose-100 border border-rose-300 inline-block"></span> Booked</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-nexus-500 inline-block"></span> Selected</span>
                </div>
            </div>
            <div className="grid gap-2">
                {Array.from({ length: rows }).map((_, rowIdx) => (
                    <div key={rowIdx} className="flex gap-2 justify-center">
                        {[0, 1].map(col => {
                            const seatNum = rowIdx * 4 + col + 1;
                            if (seatNum > totalSeats) return <div key={col} className="w-10 h-10" />;
                            const isBooked = bookedSeats.includes(seatNum);
                            const isSelected = selectedSeats.includes(seatNum);
                            return (
                                <button
                                    key={col}
                                    disabled={isBooked}
                                    onClick={() => onToggle(seatNum)}
                                    className={`w-10 h-10 rounded-lg text-xs font-bold border-2 transition-all
                                        ${isBooked ? 'bg-rose-100 border-rose-300 text-rose-400 cursor-not-allowed' :
                                          isSelected ? 'bg-nexus-500 border-nexus-600 text-white shadow-md shadow-nexus-500/30 scale-105' :
                                          'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400'}`}
                                >
                                    {seatNum}
                                </button>
                            );
                        })}
                        <div className="w-6" />
                        {[2, 3].map(col => {
                            const seatNum = rowIdx * 4 + col + 1;
                            if (seatNum > totalSeats) return <div key={col} className="w-10 h-10" />;
                            const isBooked = bookedSeats.includes(seatNum);
                            const isSelected = selectedSeats.includes(seatNum);
                            return (
                                <button
                                    key={col}
                                    disabled={isBooked}
                                    onClick={() => onToggle(seatNum)}
                                    className={`w-10 h-10 rounded-lg text-xs font-bold border-2 transition-all
                                        ${isBooked ? 'bg-rose-100 border-rose-300 text-rose-400 cursor-not-allowed' :
                                          isSelected ? 'bg-nexus-500 border-nexus-600 text-white shadow-md shadow-nexus-500/30 scale-105' :
                                          'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400'}`}
                                >
                                    {seatNum}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Ticket Card Component ────────────────────────────────────────────────────
const TicketCard = ({ ticket, onDownload }) => (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-5 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all border-t-[4px] border-t-nexus-500">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Ticket size={120} className="text-nexus-700" />
        </div>
        <div className="flex justify-between items-start z-10">
            <div>
                <div className="text-[10px] font-bold text-nexus-600 tracking-widest uppercase mb-2 bg-nexus-50 inline-block px-2 py-1 rounded">
                    #{ticket.ticketNumber || ticket.ticketId}
                </div>
                <div className="flex items-center gap-3 text-slate-900 font-display font-medium text-xl">
                    <span>{ticket.origin}</span>
                    <span className="text-slate-300">→</span>
                    <span>{ticket.destination}</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 tracking-wide mt-1.5 uppercase">
                    Bus: {ticket.busNumber} {ticket.seatNumber ? `· Seat ${ticket.seatNumber}` : ''}
                </div>
            </div>
            <div className="text-right">
                <div className="text-xl font-display font-bold text-nexus-600 bg-nexus-50 px-3 py-1 rounded-lg">
                    RWF {Number(ticket.pricePaid || 0).toFixed(2)}
                </div>
                <div className={`text-xs font-bold tracking-wide uppercase mt-2 pr-1 px-2 py-0.5 rounded-full inline-block
                    ${ticket.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                      ticket.paymentStatus === 'Pending' ? 'bg-amber-50 text-amber-600' :
                      'bg-slate-100 text-slate-500'}`}>
                    {ticket.paymentStatus || ticket.status}
                </div>
            </div>
        </div>

        <div className="space-y-3 border-t border-slate-100/60 pt-4 z-10">
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <Calendar size={18} className="text-nexus-500 flex-shrink-0" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Departure</span>
                    <span className="text-sm font-semibold text-slate-700">
                        {ticket.departureTime ? format(new Date(ticket.departureTime), 'PPP · p') : 'N/A'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <User size={18} className="text-nexus-500 flex-shrink-0" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Passenger</span>
                    <span className="text-sm font-semibold text-slate-700">{ticket.passengerName || ticket.clientName}</span>
                </div>
            </div>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-full">
                <CheckCircle size={14} />
                <span>Issued {ticket.dateIssued ? format(new Date(ticket.dateIssued), 'P') : 'Today'}</span>
            </div>
            <button
                onClick={() => onDownload(ticket)}
                className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 hover:text-nexus-600 hover:border-nexus-200 hover:bg-nexus-50 px-3 py-1.5 rounded-lg transition-all text-sm font-semibold shadow-sm"
            >
                <Download size={14} />
                <span>Save Pass</span>
            </button>
        </div>
    </div>
);

// ─── Main Tickets Page ────────────────────────────────────────────────────────
export default function Tickets() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Booking wizard state
    const [step, setStep] = useState(1); // 1=schedule, 2=passengers, 3=seats, 4=payment, 5=confirm
    const [schedules, setSchedules] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [selectedAgencyId, setSelectedAgencyId] = useState('all');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [loadingSeats, setLoadingSeats] = useState(false);

    // Passengers
    const [passengers, setPassengers] = useState([{ name: '', gender: '', phone: '', seatNumber: null }]);
    const [passengerErrors, setPassengerErrors] = useState([]);

    // Payment
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'momo'
    const [momoPhone, setMomoPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // MoMo polling
    const [momoStatus, setMomoStatus] = useState(null); // null | 'pending' | 'paid' | 'failed'
    const [momoPolling, setMomoPolling] = useState(false);
    const [momoCountdown, setMomoCountdown] = useState(0);
    const pollRef = useRef(null);
    const countdownRef = useRef(null);

    // Confirmed tickets (for QR display)
    const [confirmedTickets, setConfirmedTickets] = useState([]);

    useEffect(() => { fetchMyTickets(); }, []);

    // Cleanup polling on unmount
    useEffect(() => () => {
        clearInterval(pollRef.current);
        clearInterval(countdownRef.current);
    }, []);

    const startMomoPolling = (ticketIds) => {
        setMomoStatus('pending');
        setMomoPolling(true);
        setMomoCountdown(120); // 2 min timeout

        countdownRef.current = setInterval(() => {
            setMomoCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownRef.current);
                    clearInterval(pollRef.current);
                    setMomoPolling(false);
                    setMomoStatus('failed');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        pollRef.current = setInterval(async () => {
            try {
                // Poll the first ticket's payment status
                const res = await ticketService.getById(ticketIds[0]);
                const t = res.data.data || res.data;
                if (t.paymentStatus === 'Paid' || t.status === 'Paid') {
                    clearInterval(pollRef.current);
                    clearInterval(countdownRef.current);
                    setMomoPolling(false);
                    setMomoStatus('paid');
                    setStep(5);
                    toast.success('Payment confirmed! Tickets generated.');
                    fetchMyTickets();
                }
            } catch { /* keep polling */ }
        }, 5000);
    };

    const fetchMyTickets = async () => {
        setLoading(true);
        try {
            const res = await ticketService.getMyTickets();
            setTickets(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = async () => {
        setStep(1);
        setSelectedSchedule(null);
        setPassengers([{ name: '', gender: '', phone: '', seatNumber: null }]);
        setPassengerErrors([]);
        setPaymentMethod('cash');
        setMomoPhone('');
        setConfirmedTickets([]);
        setIsModalOpen(true);
        try {
            const [schedRes, routeRes, agencyRes] = await Promise.all([
                scheduleService.getAll(),
                routeService.getAll(),
                api.get('/Agencies'),
            ]);
            const all = schedRes.data.data || [];
            setSchedules(all.filter(s => new Date(s.departureTime) > new Date()));
            setRoutes(routeRes.data.data || []);
            setAgencies(agencyRes.data.data || []);
        } catch (e) {
            toast.error('Failed to load schedules');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        if (confirmedTickets.length > 0) fetchMyTickets();
    };

    // Step 1 → 2: schedule selected
    const handleScheduleNext = async () => {
        if (!selectedSchedule) return toast.error('Please select a schedule');
        setLoadingSeats(true);
        try {
            const res = await ticketService.getSeats(selectedSchedule.scheduleId);
            setBookedSeats(res.data.data || []);
        } catch {
            setBookedSeats([]);
        } finally {
            setLoadingSeats(false);
        }
        setStep(2);
    };

    // Passenger helpers
    const updatePassenger = (idx, field, value) => {
        setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    };

    const addPassenger = () => {
        setPassengers(prev => [...prev, { name: '', gender: '', phone: '', seatNumber: null }]);
    };

    const removePassenger = (idx) => {
        setPassengers(prev => prev.filter((_, i) => i !== idx));
    };

    // Step 2 → 3: validate passenger names
    const handlePassengersNext = async () => {
        const errors = passengers.map(p => p.name.trim() === '' ? 'Name is required' : '');
        if (errors.some(e => e)) { setPassengerErrors(errors); return; }

        // Check for duplicate names within the group
        const names = passengers.map(p => p.name.trim().toLowerCase());
        const hasDupes = names.some((n, i) => names.indexOf(n) !== i);
        if (hasDupes) {
            toast.error('Each passenger must have a unique name');
            return;
        }

        // Check against existing bookings on this trip
        try {
            const checks = await Promise.all(
                passengers.map(p =>
                    ticketService.checkDuplicate(selectedSchedule.scheduleId, p.name.trim())
                        .then(r => ({ name: p.name, exists: r.data.data?.exists || false }))
                        .catch(() => ({ name: p.name, exists: false }))
                )
            );
            const dup = checks.find(c => c.exists);
            if (dup) {
                toast.error(`A ticket under "${dup.name}" already exists for this trip. Please use a different name.`);
                return;
            }
        } catch { /* allow if endpoint not available */ }

        setPassengerErrors([]);
        setStep(3);
    };

    // Step 3: seat toggle — each passenger gets one seat
    const toggleSeat = (seatNum) => {
        // Find which passenger needs a seat (first without one)
        const assignedSeats = passengers.map(p => p.seatNumber).filter(Boolean);
        const passengerIdx = passengers.findIndex(p => p.seatNumber === seatNum);

        if (passengerIdx !== -1) {
            // Deselect
            updatePassenger(passengerIdx, 'seatNumber', null);
            return;
        }
        // Find next unassigned passenger
        const nextIdx = passengers.findIndex(p => !p.seatNumber);
        if (nextIdx === -1) {
            toast.error('All passengers already have seats. Deselect one first.');
            return;
        }
        updatePassenger(nextIdx, 'seatNumber', seatNum);
    };

    const allSeatsAssigned = passengers.every(p => p.seatNumber !== null);

    // Step 4 → 5: submit booking
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                scheduleId: selectedSchedule.scheduleId,
                paymentMethod,
                passengers: passengers.map(p => ({
                    passengerName: p.name.trim(),
                    gender: p.gender || null,
                    phone: p.phone || null,
                    seatNumber: p.seatNumber,
                })),
            };

            let results = [];

            try {
                const res = await ticketService.purchaseMulti(payload);
                results = res.data.data || [];
            } catch (multiErr) {
                const status = multiErr.response?.status;
                if (status === 404 || status === 405 || status === 500) {
                    for (const p of passengers) {
                        const res = await ticketService.purchase({
                            scheduleId: selectedSchedule.scheduleId,
                            passengerName: p.name.trim(),
                            seatNumber: p.seatNumber,
                        });
                        results.push(res.data.data || res.data);
                    }
                } else {
                    throw multiErr;
                }
            }

            if (results.length === 0) throw new Error('No tickets were created.');

            const patchedResults = results.map((r, i) => ({
                ...r,
                seatNumber: r.seatNumber ?? r.SeatNumber ?? passengers[i]?.seatNumber ?? null,
                passengerName: r.passengerName ?? r.PassengerName ?? r.clientName ?? passengers[i]?.name ?? '',
            }));

            setConfirmedTickets(patchedResults);
            setStep(5);

            if (paymentMethod === 'momo') {
                toast.success(`${patchedResults.length} ticket(s) booked! Your ticket is pending payment via Mobile Money.`);
            } else {
                toast.success(`${patchedResults.length} ticket(s) booked! Pay at the office to confirm.`);
            }
        } catch (e) {
            console.error('[Booking] error:', e.response?.status, e.response?.data);
            const msg =
                e.response?.data?.message ||
                e.response?.data?.Message ||
                e.response?.data?.title ||
                e.message ||
                'Booking failed. Please try again.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const downloadTicket = (ticket) => generateTicketPDF(ticket);

    const route = routes.find(r => r.routeId === selectedSchedule?.routeId);
    const selectedSeats = passengers.map(p => p.seatNumber).filter(Boolean);
    const stepTitles = ['Select Schedule', 'Add Passengers', 'Choose Seats', 'Payment', 'Confirmation'];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight">My Tickets</h1>
                    <p className="text-slate-500 mt-1">View your bookings and purchase new transit passes.</p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5 font-medium"
                >
                    <Ticket size={20} />
                    <span>Book Tickets</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin h-8 w-8 text-nexus-600" />
                        <p>Loading your tickets...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-500 glass-card rounded-2xl flex flex-col items-center gap-4">
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Ticket size={32} />
                        </div>
                        <p className="text-lg">You haven't purchased any tickets yet.</p>
                        <button onClick={openModal} className="text-nexus-600 hover:text-nexus-700 font-medium hover:underline">
                            Browse Schedules
                        </button>
                    </div>
                ) : (
                    tickets.map(ticket => <TicketCard key={ticket.ticketId} ticket={ticket} onDownload={downloadTicket} />)
                )}
            </div>

            {/* Booking Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={stepTitles[step - 1]}>
                <div className="mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                        {stepTitles.map((title, i) => (
                            <div key={i} className={`flex items-center ${i < stepTitles.length - 1 ? 'flex-1' : ''}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all
                                    ${step > i + 1 ? 'bg-emerald-500 text-white' :
                                      step === i + 1 ? 'bg-nexus-600 text-white ring-4 ring-nexus-500/20' :
                                      'bg-slate-200 text-slate-400'}`}>
                                    {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                                </div>
                                {i < stepTitles.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${step > i + 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Select Schedule */}
                {step === 1 && (
                    <>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Filter by Agency</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedAgencyId('all')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedAgencyId === 'all' ? 'bg-nexus-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    All
                                </button>
                                {agencies.map(a => (
                                    <button
                                        key={a.agencyId}
                                        onClick={() => setSelectedAgencyId(a.agencyId)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedAgencyId === a.agencyId ? 'bg-nexus-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {a.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            {schedules.filter(s => selectedAgencyId === 'all' || s.agencyId === selectedAgencyId).length === 0 ? (
                                <p className="text-center py-8 text-slate-500">No schedules available</p>
                            ) : (
                                schedules.filter(s => selectedAgencyId === 'all' || s.agencyId === selectedAgencyId).map(sch => {
                                    const r = routes.find(x => x.routeId === sch.routeId);
                                    if (!r) return null;
                                    const sel = selectedSchedule?.scheduleId === sch.scheduleId;
                                    return (
                                        <div
                                            key={sch.scheduleId}
                                            onClick={() => setSelectedSchedule(sch)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${sel ? 'border-nexus-500 bg-nexus-50 ring-2 ring-nexus-500/20' : 'border-slate-200 hover:border-nexus-300 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-display font-medium text-slate-900 text-lg">{r.origin} → {r.destination}</span>
                                                <span className="font-bold text-nexus-600 bg-white px-2 py-1 rounded border text-sm">RWF {r.price}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Calendar size={14} />
                                                <span>{format(new Date(sch.departureTime), 'PPP p')}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button onClick={closeModal} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium">Cancel</button>
                            <button onClick={handleScheduleNext} disabled={!selectedSchedule || loadingSeats} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2">
                                {loadingSeats ? <Loader2 size={16} className="animate-spin" /> : null}
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}

                {/* Step 2: Passengers */}
                {step === 2 && (
                    <>
                        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                            {passengers.map((p, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-700">Passenger {idx + 1}</span>
                                        {passengers.length > 1 && (
                                            <button onClick={() => removePassenger(idx)} className="text-rose-400 hover:text-rose-600 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Full Name *"
                                            value={p.name}
                                            onChange={e => updatePassenger(idx, 'name', e.target.value)}
                                            className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30 transition-all ${passengerErrors[idx] ? 'border-rose-400' : 'border-slate-200'}`}
                                        />
                                        {passengerErrors[idx] && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{passengerErrors[idx]}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            value={p.gender}
                                            onChange={e => updatePassenger(idx, 'gender', e.target.value)}
                                            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                                        >
                                            <option value="">Gender (optional)</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Phone / ID (optional)"
                                            value={p.phone}
                                            onChange={e => updatePassenger(idx, 'phone', e.target.value)}
                                            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addPassenger}
                                className="w-full py-3 border-2 border-dashed border-nexus-300 text-nexus-600 rounded-xl hover:bg-nexus-50 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Add Another Passenger
                            </button>
                        </div>
                        <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
                            <button onClick={() => setStep(1)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                            <button onClick={handlePassengersNext} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium shadow-md flex items-center gap-2">
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}

                {/* Step 3: Seat Selection */}
                {step === 3 && (
                    <>
                        <div className="mb-4 p-3 bg-nexus-50 rounded-xl border border-nexus-100 text-sm text-nexus-700 font-medium">
                            Select {passengers.length} seat{passengers.length > 1 ? 's' : ''} — one per passenger.
                            {passengers.map((p, i) => (
                                <span key={i} className="ml-2 inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-nexus-200 text-xs">
                                    <User size={10} /> {p.name.split(' ')[0]}: {p.seatNumber ? `Seat ${p.seatNumber}` : <span className="text-slate-400">unassigned</span>}
                                </span>
                            ))}
                        </div>
                        <div className="overflow-y-auto max-h-[50vh] pr-2">
                            <SeatMap
                                totalSeats={selectedSchedule?.totalSeats || 40}
                                bookedSeats={bookedSeats}
                                selectedSeats={selectedSeats}
                                onToggle={toggleSeat}
                            />
                        </div>
                        <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
                            <button onClick={() => setStep(2)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={!allSeatsAssigned}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}

                {/* Step 4: Payment */}
                {step === 4 && (
                    <>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-1">
                                <p className="font-bold text-slate-700">{route?.origin} → {route?.destination}</p>
                                <p className="text-slate-500">{selectedSchedule && format(new Date(selectedSchedule.departureTime), 'PPP p')}</p>
                                <p className="text-slate-500">{passengers.length} passenger(s) · Seats: {passengers.map(p => p.seatNumber).join(', ')}</p>
                                <p className="font-bold text-nexus-600 text-base mt-2">Total: RWF {((route?.price || 0) * passengers.length).toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Payment Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-nexus-500 bg-nexus-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <Banknote size={28} className={paymentMethod === 'cash' ? 'text-nexus-600' : 'text-slate-400'} />
                                        <span className="font-semibold text-sm text-slate-700">Cash</span>
                                        <span className="text-xs text-slate-400">Pay at office/agent</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('momo')}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'momo' ? 'border-nexus-500 bg-nexus-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <Smartphone size={28} className={paymentMethod === 'momo' ? 'text-nexus-600' : 'text-slate-400'} />
                                        <span className="font-semibold text-sm text-slate-700">Mobile Money</span>
                                        <span className="text-xs text-slate-400">MTN / Airtel</span>
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'cash' && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>Ticket will be marked <strong>Pending Payment</strong>. Visit the office or agent to pay and activate it.</span>
                                </div>
                            )}

                            {paymentMethod === 'momo' && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-start gap-2">
                                    <Smartphone size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>Ticket will be booked and marked <strong>Pending Payment</strong>. Pay via Mobile Money at the office or agent to activate.</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
                            <button onClick={() => setStep(3)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium flex items-center gap-2">
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-5 py-2.5 bg-nexus-600 text-white rounded-xl hover:bg-nexus-700 transition-all font-medium shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                                {submitting ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </>
                )}

                {/* Step 5: Confirmation with QR */}
                {step === 5 && (
                    <>
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle size={32} className="text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-slate-900">Booking Confirmed!</h3>
                            <p className="text-slate-500">Your ticket{confirmedTickets.length > 1 ? 's have' : ' has'} been generated.</p>
                        </div>

                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 mt-6">
                            {confirmedTickets.map((t, i) => (
                                <div key={i} className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-nexus-600 uppercase tracking-widest">Ticket #{t.ticketNumber || t.ticketId}</p>
                                            <p className="font-semibold text-slate-900 mt-1">{t.passengerName}</p>
                                            <p className="text-sm text-slate-500">Seat {t.seatNumber}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                                            <QRCodeSVG value={JSON.stringify({ ticketId: t.ticketId, ticketNumber: t.ticketNumber })} size={80} />
                                        </div>
                                    </div>
                                    <div className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full inline-block ${t.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {t.paymentStatus || 'Pending Payment'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button onClick={closeModal} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium shadow-md">
                                Done
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
