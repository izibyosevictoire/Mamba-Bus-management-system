import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import busLogo from '../assets/bus_logo.png';

export default function Login() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = React.useState('');

    const getRole = (u) => String(u?.userType || u?.role || '').trim().toLowerCase();

    const onSubmit = async (data) => {
        try {
            await login(data.email, data.password);
            toast.success('Welcome back!');
            // Redirect to where they came from, or their role-based home
        } catch (err) {
            toast.error('Invalid email or password');
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
                        {/* If busLogo is available, use it, else fallback to icon */}
                        <img src={busLogo} alt="Bus Management" className="object-contain w-14 h-14 brightness-0 invert opacity-90" />
                    </div>
                    <span className="block mb-4 text-sm font-bold tracking-widest uppercase text-nexus-400">Mamba Bus System</span>
                    <h1 className="mb-6 text-5xl font-medium tracking-tight text-white font-display">Mamba Bus Management System</h1>
                    <p className="max-w-sm text-lg leading-relaxed text-slate-400">
                        Transform the way you travel with Mamba Bus Management System. Built for a faster, smarter, and more reliable transit experience.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="relative z-10 flex flex-col justify-center flex-1 px-4 bg-transparent sm:px-12 lg:px-24 xl:px-32">
                {/* Mobile Logo for small screens */}
                <div className="mb-8 text-center lg:hidden animate-fade-in">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border shadow-xl bg-slate-900 rounded-2xl border-slate-800">
                        <img src={busLogo} alt="Bus Management" className="object-contain w-10 h-10 brightness-0 invert" />
                    </div>
                    <h2 className="text-2xl font-semibold font-display text-slate-900">Mamba Bus Management System</h2>
                </div>

                <div className="w-full max-w-md p-8 mx-auto glass-panel sm:p-12 rounded-3xl animate-slide-in-right">
                    <h2 className="mb-8 text-3xl font-medium font-display text-slate-900">Sign in</h2>

                    {error && (
                        <div className="flex items-center p-4 mb-6 text-sm text-red-600 border border-red-100 bg-red-50 rounded-xl">
                            <div className="w-2 h-2 mr-3 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="relative group">
                            <label className="block mb-2 text-sm font-medium transition-colors text-slate-700">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    {...register('email', { required: 'Email is required' })}
                                    type="email"
                                    className="w-full py-3.5 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-nexus-500 focus:ring-4 focus:ring-nexus-500/10 transition-all outline-none text-slate-900"
                                    placeholder="name@example.com"
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
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password', { required: 'Password is required' })}
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

                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center justify-center w-5 h-5 mr-3 transition-colors border rounded border-slate-300 bg-slate-50 group-hover:border-nexus-500">
                                    <input type="checkbox" className="absolute inset-0 opacity-0 cursor-pointer peer" />
                                    <Check size={14} className="transition-opacity opacity-0 text-nexus-600 peer-checked:opacity-100" />
                                </div>
                                <span className="text-sm transition-colors text-slate-600 group-hover:text-slate-900">Remember me</span>
                            </label>
                            <a href="#" className="text-sm font-medium transition-colors text-nexus-600 hover:text-nexus-700">Forgot Password?</a>
                        </div>

                        <div className="flex flex-col gap-4 pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-slate-900 text-white py-3.5 rounded-xl hover:bg-slate-800 transition-all font-medium flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                            </button>

                            <Link
                                to="/register"
                                className="w-full bg-white text-slate-600 border border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all text-center font-medium"
                            >
                                Create an account
                            </Link>
                        </div>
                    </form>

                    <div className="hidden mt-8 text-center lg:block">
                        <p className="text-xs text-slate-400">
                            Secure login powered by Bus Management Enterprise
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
