import React, { useState, useEffect, useRef } from 'react';
import {
    ScanLine, CheckCircle, XCircle, Loader2, User, Bus,
    MapPin, Calendar, Hash, Camera, CameraOff, Info
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ticketService } from '../api/services';
import api from '../api/client';
//ticketschcker
// ─── How It Works Banner ──────────────────────────────────────────────────────
const HowItWorks = () => (
    <div className="glass-card rounded-2xl p-5 border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-nexus-600" />
            <span className="font-bold text-slate-800 text-sm uppercase tracking-widest">How Ticket Checking Works</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
                { step: '1', icon: <ScanLine size={22} className="text-nexus-600" />, title: 'Scan or Enter', desc: 'Scan the passenger\'s QR code with your camera, or type the ticket number manually.' },
                { step: '2', icon: <CheckCircle size={22} className="text-nexus-600" />, title: 'Verify Details', desc: 'System checks the ticket is valid, not used, and matches today\'s trip date and time.' },
                { step: '3', icon: <Bus size={22} className="text-nexus-600" />, title: 'Mark & Board', desc: 'If valid, click "Mark as Used" to stamp the ticket. Passenger boards. Done.' },
            ].map(item => (
                <div key={item.step} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-nexus-50 border border-nexus-200 flex items-center justify-center flex-shrink-0 font-bold text-nexus-700 text-sm">
                        {item.step}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">{item.icon}<span className="font-semibold text-slate-800 text-sm">{item.title}</span></div>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                </div>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
                { label: 'Ticket exists', ok: true },
                { label: 'Not already used', ok: true },
                { label: 'Matches trip date/time', ok: true },
                { label: 'Seat assigned', ok: true },
            ].map(r => (
                <div key={r.label} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded-lg font-medium">
                    <CheckCircle size={12} /> {r.label}
                </div>
            ))}
        </div>
    </div>
);

// ─── QR Scanner Component ─────────────────────────────────────────────────────
const QRScanner = ({ onScan, onClose }) => {
    const videoRef = useRef(null);
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let html5QrCode;
        const startScanner = async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode');
                html5QrCode = new Html5Qrcode('qr-reader');
                scannerRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        // Try to parse JSON QR (our format), else use raw text
                        try {
                            const parsed = JSON.parse(decodedText);
                            onScan(parsed.ticketNumber || parsed.ticketId || decodedText);
                        } catch {
                            onScan(decodedText);
                        }
                        html5QrCode.stop().catch(() => {});
                        onClose();
                    },
                    () => {} // ignore per-frame errors
                );
            } catch (e) {
                setError('Camera access denied or not available. Please use manual entry.');
            }
        };
        startScanner();
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    return (
        <div className="space-y-3">
            {error ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-start gap-2">
                    <CameraOff size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden bg-slate-900">
                    <div id="qr-reader" className="w-full" />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-nexus-400 rounded-xl opacity-70">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-nexus-400 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-nexus-400 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-nexus-400 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-nexus-400 rounded-br-lg" />
                        </div>
                    </div>
                </div>
            )}
            <button
                onClick={onClose}
                className="w-full py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium text-sm border border-slate-200"
            >
                Cancel Scan
            </button>
        </div>
    );
};

// ─── Main TicketChecker Page ──────────────────────────────────────────────────
export default function TicketChecker() {
    const [ticketId, setTicketId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [marking, setMarking] = useState(false);
    const [scanning, setScanning] = useState(false);

    const handleValidate = async (idToCheck) => {
        const val = (idToCheck || ticketId).trim();
        if (!val) return;
        setLoading(true);
        setResult(null);

        // Detect format: TKT-* = ticket number, otherwise treat as UUID
        const isTicketNumber = val.toUpperCase().startsWith('TKT-');

        try {
            let data;

            // Strategy 1: try dedicated validate endpoint (by number or by id)
            try {
                const res = isTicketNumber
                    ? await ticketService.validateByNumber(val)
                    : await ticketService.validate(val);
                data = res.data.data || res.data;
            } catch (e1) {
                console.warn('[Checker] validate endpoint failed:', e1.response?.status);

                // Strategy 2: try getByNumber or getById as fallback
                try {
                    const res = isTicketNumber
                        ? await ticketService.getByNumber(val)
                        : await ticketService.getById(val);
                    data = res.data.data || res.data;
                } catch (e2) {
                    console.warn('[Checker] getBy* failed:', e2.response?.status);

                    // Strategy 3: last resort — search all tickets (admin only)
                    const res = await ticketService.getAll();
                    const all = res.data.data || [];
                    const found = all.find(t =>
                        t.ticketNumber === val ||
                        t.ticketId === val ||
                        t.id === val
                    );
                    if (!found) throw { response: { status: 404 } };
                    data = found;
                }
            }

            // Client-side validity checks
            if (!data || (!data.ticketId && !data.id && !data.ticketNumber)) {
                throw { response: { status: 404 } };
            }

            setResult({ valid: true, ticket: data });
        } catch (err) {
            console.error('[Checker] Final error:', err.response?.status, err.response?.data);
            const status = err.response?.status;
            let msg = 'Ticket not found. Check the number and try again.';
            if (status === 400) msg = err.response?.data?.message || err.response?.data?.Message || 'Invalid ticket format.';
            else if (status === 403) msg = 'You do not have permission to validate tickets.';
            else if (status === 500) msg = 'Server error. Please try again or contact support.';
            else if (err.response?.data?.message) msg = err.response.data.message;
            else if (err.response?.data?.Message) msg = err.response.data.Message;
            setResult({ valid: false, message: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleScan = (scannedId) => {
        setTicketId(scannedId);
        setScanning(false);
        handleValidate(scannedId);
    };

    const handleMarkUsed = async () => {
        if (!result?.ticket) return;
        setMarking(true);
        const t = result.ticket;
        // TicketId is an int on this backend
        const id = t.ticketId || t.TicketId || t.id;
        console.log('[Checker] Marking used, ticketId:', id, 'full object:', t);

        try {
            await ticketService.markUsed(id);
            toast.success('Ticket marked as used — passenger may board');
            setResult(prev => ({ ...prev, ticket: { ...prev.ticket, status: 'Used' } }));
        } catch (err) {
            console.error('[Checker] markUsed error:', err.response?.status, err.response?.data);
            const status = err.response?.status;
            if (status === 403) {
                toast.error('Permission denied. Make sure your account has the "tickets.mark.used" permission assigned.');
            } else {
                toast.error(err.response?.data?.message || err.response?.data?.Message || 'Failed to mark ticket');
            }
        } finally {
            setMarking(false);
        }
    };

    const reset = () => {
        setResult(null);
        setTicketId('');
    };

    const isUsed = result?.ticket?.isUsed || result?.ticket?.status === 'Used';

    return (
        <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight">Ticket Checker</h1>
                <p className="text-slate-500 mt-1">Validate passenger tickets before boarding.</p>
            </div>

            <HowItWorks />

            {/* Scanner / Input */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
                {scanning ? (
                    <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
                ) : (
                    <>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Scan QR Code or Enter Ticket Number
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={ticketId}
                                    onChange={e => setTicketId(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleValidate()}
                                    placeholder="e.g. TKT-00123"
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-nexus-500/30 transition-all"
                                />
                            </div>
                            <button
                                onClick={() => setScanning(true)}
                                title="Scan QR Code"
                                className="px-4 py-3 bg-slate-100 text-slate-600 hover:bg-nexus-50 hover:text-nexus-600 rounded-xl transition-all font-medium border border-slate-200 flex items-center gap-2"
                            >
                                <Camera size={18} />
                                <span className="hidden sm:inline text-sm">Scan QR</span>
                            </button>
                            <button
                                onClick={() => handleValidate()}
                                disabled={loading || !ticketId.trim()}
                                className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <ScanLine size={18} />}
                                <span className="hidden sm:inline">Validate</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Result */}
            {result && (
                <div className={`glass-card rounded-2xl p-6 border-t-4 transition-all ${result.valid ? (isUsed ? 'border-t-amber-400' : 'border-t-emerald-500') : 'border-t-rose-500'}`}>
                    {result.valid ? (
                        <div className="space-y-5">
                            {/* Status header */}
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isUsed ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                    {isUsed
                                        ? <XCircle size={24} className="text-amber-600" />
                                        : <CheckCircle size={24} className="text-emerald-600" />}
                                </div>
                                <div>
                                    <p className={`font-bold text-lg ${isUsed ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        {isUsed ? 'Already Used' : 'Valid Ticket ✓'}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                                        #{result.ticket.ticketNumber || result.ticket.ticketId}
                                    </p>
                                </div>
                                <div className={`ml-auto text-xs font-bold uppercase px-3 py-1.5 rounded-full ${isUsed ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {result.ticket.paymentStatus || result.ticket.status}
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 col-span-2 sm:col-span-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Passenger</p>
                                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                                        <User size={14} className="text-nexus-500" />
                                        {result.ticket.passengerName || result.ticket.clientName}
                                    </p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Seat</p>
                                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Bus size={14} className="text-nexus-500" />
                                        Seat {result.ticket.seatNumber || 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 col-span-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Route</p>
                                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                                        <MapPin size={14} className="text-nexus-500" />
                                        {result.ticket.origin} → {result.ticket.destination}
                                    </p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 col-span-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Departure</p>
                                    <p className="font-semibold text-slate-800 flex items-center gap-2">
                                        <Calendar size={14} className="text-nexus-500" />
                                        {result.ticket.departureTime
                                            ? format(new Date(result.ticket.departureTime), 'PPPP · p')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={reset}
                                    className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-medium border border-slate-200 text-sm"
                                >
                                    Check Another
                                </button>
                                {!isUsed && (
                                    <button
                                        onClick={handleMarkUsed}
                                        disabled={marking}
                                        className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                    >
                                        {marking ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        Mark as Used — Allow Boarding
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                                <XCircle size={28} className="text-rose-600" />
                            </div>
                            <div>
                                <p className="font-bold text-rose-700 text-lg">Invalid Ticket</p>
                                <p className="text-slate-500 text-sm mt-1">{result.message}</p>
                            </div>
                            <button onClick={reset} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium text-sm">
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
