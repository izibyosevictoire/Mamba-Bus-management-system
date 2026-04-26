import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import busLogo from '../assets/bus_logo.png';

export default function Login() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = React.useState('');

    const onSubmit = async (data) => {
        try {
            await login(data.email, data.password);
            toast.success('Welcome back!');
            // Redirection is now handled automatically by GuestRoute in App.jsx
        } catch (err) {
            toast.error('Invalid email or password');
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-slate-50 overflow-hidden font-sans">
            {/* Left Panel - Brand */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-950 relative flex-col items-center justify-center text-white p-12 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-nexus-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-soft"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-brand-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse-soft" style={{ animationDelay: '1.5s' }}></div>
                
                {/* Clean Geometric Divider */}
                <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                <div className="relative z-20 flex flex-col items-center text-center animate-fade-in-up">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl mb-8 transform transition-all hover:scale-105 duration-500 hover:bg-white/20">
                        {/* If busLogo is available, use it, else fallback to icon */}
                        <img src={busLogo} alt="Bus Management" className="w-14 h-14 object-contain brightness-0 invert opacity-90" />
                    </div>
                    <span className="text-nexus-400 font-bold uppercase tracking-widest text-sm mb-4 block">Mamba Bus System</span>
                    <h1 className="text-5xl font-display font-medium tracking-tight mb-6">Mamba Bus Management System</h1>
                    <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
                        Transform the way you travel with Mamba Bus Management System. Built for a faster, smarter, and more reliable transit experience.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 relative bg-transparent z-10">
                {/* Mobile Logo for small screens */}
                <div className="lg:hidden mb-8 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-slate-800">
                        <img src={busLogo} alt="Bus Management" className="w-10 h-10 object-contain brightness-0 invert" />
                    </div>
                    <h2 className="text-2xl font-display font-semibold text-slate-900">Mamba Bus Management System</h2>
                </div>

                <div className="w-full max-w-md mx-auto glass-panel p-8 sm:p-12 rounded-3xl animate-slide-in-right">
                    <h2 className="text-3xl font-display font-medium text-slate-900 mb-8">Sign in</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="group relative">
                            <label className="block text-sm font-medium text-slate-700 mb-2 transition-colors">
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
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-nexus-500 transition-colors pointer-events-none">
                                    <Mail size={20} className="stroke-[1.5]" />
                                </span>
                            </div>
                            {errors.email && <p className="text-sm text-red-500 mt-2">{errors.email.message}</p>}
                        </div>

                        <div className="group relative">
                            <label className="block text-sm font-medium text-slate-700 mb-2 transition-colors">
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
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-nexus-500 transition-colors pointer-events-none">
                                    <Lock size={20} className="stroke-[1.5]" />
                                </span>
                            </div>
                            {errors.password && <p className="text-sm text-red-500 mt-2">{errors.password.message}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-slate-50 group-hover:border-nexus-500 transition-colors mr-3">
                                    <input type="checkbox" className="peer opacity-0 absolute inset-0 cursor-pointer" />
                                    <Check size={14} className="text-nexus-600 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
                            </label>
                            <a href="#" className="text-sm text-nexus-600 hover:text-nexus-700 font-medium transition-colors">Forgot Password?</a>
                        </div>

                        <div className="pt-6 flex flex-col gap-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-slate-900 text-white py-3.5 rounded-xl hover:bg-slate-800 transition-all font-medium flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
                            </button>

                            <Link
                                to="/register"
                                className="w-full bg-white text-slate-600 border border-slate-200 py-3.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all text-center font-medium"
                            >
                                Create an account
                            </Link>
                        </div>
                    </form>

                    <div className="mt-8 text-center hidden lg:block">
                        <p className="text-slate-400 text-xs">
                            Secure login powered by Bus Management Enterprise
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
