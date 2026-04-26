import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Phone, Loader2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import busLogo from '../assets/bus_logo.png';

export default function Register() {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = React.useState('');
    const [selectedTab, setSelectedTab] = React.useState('Passenger');

    const switchTab = (tab) => {
        setSelectedTab(tab);
        reset();
    };

    const onSubmit = async (data) => {
        try {
            await registerUser({ ...data, userType: selectedTab });
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Registration failed. Email might be taken.');
        }
    };

    return (
        <div className="flex w-full min-h-screen overflow-hidden font-sans bg-slate-50">
            {/* Left Panel - Brand */}
            <div className="relative flex-col items-center justify-center hidden p-12 overflow-hidden text-white lg:flex lg:w-1/2 bg-slate-950">
                {/* Decorative Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-nexus-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-soft"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-brand-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-soft" style={{ animationDelay: '1.5s' }}></div>
                
                {/* Clean Geometric Divider */}
                <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                <div className="relative z-20 flex flex-col items-center text-center animate-fade-in-up">
                    <div className="flex items-center justify-center w-24 h-24 mb-8 transition-all duration-500 transform border shadow-2xl bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl hover:scale-105 hover:bg-white/20">
                        <img src={busLogo} alt="Bus Management" className="object-contain w-14 h-14 brightness-0 invert opacity-90" />
                    </div>
                    <span className="block mb-4 text-sm font-bold tracking-widest uppercase text-nexus-400">Mamba Bus System</span>
                    <h1 className="mb-6 text-5xl font-medium tracking-tight text-white font-display">Mamba Bus Management System</h1>
                    <p className="max-w-sm text-lg leading-relaxed text-slate-400">
                        Transform the way you travel with Mamba Bus Management System. Join a faster, smarter, and more reliable transit network.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="relative z-10 flex flex-col justify-center flex-1 px-4 py-12 bg-transparent sm:px-12 lg:px-24 xl:px-32">
                {/* Mobile Logo */}
                <div className="mb-8 text-center lg:hidden animate-fade-in">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border shadow-xl bg-slate-900 rounded-2xl border-slate-800">
                        <img src={busLogo} alt="Bus Management" className="object-contain w-10 h-10 brightness-0 invert" />
                    </div>
                    <h2 className="text-2xl font-semibold font-display text-slate-900">Mamba Bus Management System</h2>
                </div>

                <div className="w-full max-w-md p-8 mx-auto glass-panel sm:p-12 rounded-3xl animate-slide-in-right">
                    <h2 className="mb-4 text-3xl font-medium font-display text-slate-900">Create Account</h2>

                    {/* Role tabs */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 relative border border-slate-200/60 shadow-inner">
                        {['Passenger', 'Driver'].map(tab => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => switchTab(tab)}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all relative z-10 ${selectedTab === tab ? 'text-nexus-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab === 'Passenger' ? '🧍 Passenger' : '🚌 Driver'}
                            </button>
                        ))}
                        <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${selectedTab === 'Passenger' ? 'left-1.5' : 'left-[calc(50%+1.5px)]'}`} />
                    </div>

                    {error && (
                        <div className="flex items-center p-4 mb-6 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">
                            <div className="w-2 h-2 mr-3 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-5">
                            <div className="relative group">
                                <label className="block mb-2 text-sm font-medium transition-colors text-slate-700">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('name', { required: 'Name is required' })}
                                        type="text"
                                        className="w-full py-3.5 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-nexus-500 focus:ring-4 focus:ring-nexus-500/10 transition-all outline-none text-slate-900"
                                        placeholder="John Doe"
                                        id="name"
                                    />
                                    <span className="absolute transition-colors -translate-y-1/2 pointer-events-none right-4 top-1/2 text-slate-400 group-focus-within:text-nexus-500">
                                        <User size={20} className="stroke-[1.5]" />
                                    </span>
                                </div>
                                {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="relative group">
                                <label className="block mb-2 text-sm font-medium transition-colors text-slate-700">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('email', { required: 'Email is required' })}
                                        type="email"
                                        className="w-full py-3.5 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-nexus-500 focus:ring-4 focus:ring-nexus-500/10 transition-all outline-none text-slate-900"
                                        placeholder="you@example.com"
                                        id="email"
                                    />
                                    <span className="absolute transition-colors -translate-y-1/2 pointer-events-none right-4 top-1/2 text-slate-400 group-focus-within:text-nexus-500">
                                        <Mail size={20} className="stroke-[1.5]" />
                                    </span>
                                </div>
                                {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="relative group">
                                <label className="block mb-2 text-sm font-medium transition-colors text-slate-700">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('phone', { required: 'Phone is required' })}
                                        type="tel"
                                        className="w-full py-3.5 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-nexus-500 focus:ring-4 focus:ring-nexus-500/10 transition-all outline-none text-slate-900"
                                        placeholder="+1 234 567 890"
                                        id="phone"
                                    />
                                    <span className="absolute transition-colors -translate-y-1/2 pointer-events-none right-4 top-1/2 text-slate-400 group-focus-within:text-nexus-500">
                                        <Phone size={20} className="stroke-[1.5]" />
                                    </span>
                                </div>
                                {errors.phone && <p className="mt-2 text-sm text-red-500">{errors.phone.message}</p>}
                            </div>

                            {/* Licence field — Driver only */}
                            {selectedTab === 'Driver' && (
                                <div className="relative group animate-fade-in-up">
                                    <label className="block mb-2 text-sm font-medium transition-colors text-slate-700">
                                        Licence Number
                                    </label>
                                    <div className="relative">
                                        <input
                                            {...register('licenceNumber', { required: selectedTab === 'Driver' ? 'Licence number is required' : false })}
                                            type="text"
                                            className="w-full py-3.5 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-nexus-500 focus:ring-4 focus:ring-nexus-500/10 transition-all outline-none text-slate-900"
                                            placeholder="e.g. LIC-123456"
                                        />
                                        <span className="absolute transition-colors -translate-y-1/2 pointer-events-none right-4 top-1/2 text-slate-400 group-focus-within:text-nexus-500">
                                            <CreditCard size={20} className="stroke-[1.5]" />
                                        </span>
                                    </div>
                                    {errors.licenceNumber && <p className="mt-2 text-sm text-red-500">{errors.licenceNumber.message}</p>}
                                </div>
                            )}

                            <div className="relative group">
                                <label className="block mb-2 text-sm font-medium transition-colors text-slate-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                                        type="password"
                                        className="w-full py-3.5 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-nexus-500 focus:ring-4 focus:ring-nexus-500/10 transition-all outline-none text-slate-900"
                                        placeholder="••••••••"
                                        id="password"
                                    />
                                    <span className="absolute transition-colors -translate-y-1/2 pointer-events-none right-4 top-1/2 text-slate-400 group-focus-within:text-nexus-500">
                                        <Lock size={20} className="stroke-[1.5]" />
                                    </span>
                                </div>
                                {errors.password && <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-slate-900 text-white py-3.5 rounded-xl hover:bg-slate-800 transition-all font-medium flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (selectedTab === 'Driver' ? 'Register as Driver' : 'Create Account')}
                            </button>

                            <Link
                                to="/login"
                                className="w-full bg-white text-slate-600 border border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all text-center font-medium"
                            >
                                Sign In
                            </Link>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400">
                            By registering, you agree to our <a href="#" className="transition-colors text-nexus-600 hover:text-nexus-800">Terms of Service</a> and <a href="#" className="transition-colors text-nexus-600 hover:text-nexus-800">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
