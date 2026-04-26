import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, Map, Ticket, Shield, ArrowRight, Clock, Star } from 'lucide-react';
import busImage from '../assets/hero-bus.png';

export default function Landing() {
    return (
        <div className="min-h-screen overflow-hidden font-sans bg-slate-50 text-slate-900 selection:bg-nexus-500 selection:text-white">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 border-b lg:px-12 backdrop-blur-sm bg-white/30 border-white/20">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 shadow-lg bg-gradient-to-br from-nexus-500 to-nexus-600 rounded-xl shadow-nexus-500/20">
                        <Bus size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight font-display">Mamba Bus Management System</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-semibold transition-colors text-slate-600 hover:text-nexus-600">Sign In</Link>
                    <Link to="/register" className="text-sm font-semibold text-white bg-slate-900 px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5">Register</Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 overflow-hidden flex flex-col justify-center min-h-[90vh]">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-nexus-500/10 mix-blend-multiply rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-500/10 mix-blend-multiply rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-between gap-12 mx-auto max-w-7xl lg:flex-row xl:gap-20">
                    {/* Text Side */}
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-xs font-semibold tracking-wider uppercase border rounded-full shadow-sm bg-nexus-50 border-nexus-100 text-nexus-700">
                            <Star size={14} className="text-nexus-500" /> Defining the future of transit
                        </div>
                        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight text-slate-900 mb-8 leading-[1.05]">
                            Transform how you travel <br className="hidden lg:block" /> with <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexus-500 to-brand-500 drop-shadow-sm">Mamba Bus System</span>.
                        </h1>
                        <p className="max-w-2xl mx-auto mb-12 text-xl font-medium leading-relaxed text-slate-500 lg:mx-0">
                            Enjoy effortless ticketing, accurate schedules, and real-time bus updates—built to deliver a faster, smarter, and more reliable transit experience.
                        </p>
                        
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                            <Link to="/login" className="flex items-center justify-center w-full gap-2 px-8 py-4 text-lg font-semibold text-white transition-all rounded-full shadow-xl sm:w-auto bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 hover:-translate-y-1 group">
                                Start Journey <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link to="/register" className="flex items-center justify-center w-full px-8 py-4 text-lg font-semibold transition-all bg-white border rounded-full shadow-sm sm:w-auto text-slate-700 border-slate-200 hover:border-nexus-300 hover:text-nexus-600">
                                Create Account
                            </Link>
                        </div>
                    </div>

                    {/* Image Side */}
                    <div className="relative flex-1 w-full max-w-2xl mt-12 lg:max-w-none lg:mt-0 perspective-1000">
                        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/50 backdrop-blur-sm transform transition-transform hover:-translate-y-2 duration-500 bg-white/50">
                            <img src={busImage} alt="Modern City Bus" className="object-cover w-full h-auto scale-105" />
                            
                            {/* Glass Overlay on Image */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-transparent mix-blend-overlay"></div>
                            
                            <div className="absolute hidden p-6 text-white border shadow-xl bottom-6 left-6 right-6 rounded-2xl bg-white/20 backdrop-blur-md border-white/30 sm:block">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full shadow-lg bg-brand-500">
                                        <Shield size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold leading-tight font-display">Secure Network</h4>
                                        <p className="text-white/90 text-sm mt-0.5">Track your scheduled fleets globally.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Decorative glow behind image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] bg-nexus-500/20 mix-blend-screen rounded-full blur-[100px] -z-10"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 px-6 py-24 bg-white lg:px-12">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold lg:text-4xl font-display text-slate-900">Enterprise Grade Capabilities</h2>
                        <p className="max-w-2xl mx-auto text-slate-500">Everything you need to manage your fleet, schedules, and tickets in a single intuitive platform.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {/* Box 1 */}
                        <div className="p-8 transition-all duration-300 border rounded-3xl bg-slate-50 border-slate-100 hover:border-nexus-200 hover:shadow-xl hover:-translate-y-1 group">
                            <div className="flex items-center justify-center mb-6 transition-transform w-14 h-14 bg-nexus-100 rounded-2xl group-hover:scale-110">
                                <Ticket size={28} className="text-nexus-600" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold font-display text-slate-900">Smart Ticketing</h3>
                            <p className="leading-relaxed text-slate-600">Book trips seamlessly with real-time seat availability. Download PDF receipts directly to your device.</p>
                        </div>
                        {/* Box 2 */}
                        <div className="p-8 transition-all duration-300 border rounded-3xl bg-slate-50 border-slate-100 hover:border-brand-200 hover:shadow-xl hover:-translate-y-1 group">
                            <div className="flex items-center justify-center mb-6 transition-transform w-14 h-14 bg-brand-100 rounded-2xl group-hover:scale-110">
                                <Map size={28} className="text-brand-600" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold font-display text-slate-900">Dynamic Routing</h3>
                            <p className="leading-relaxed text-slate-600">Manage complex transit networks across multiple corridors. Full administrative dashboard for route tracking.</p>
                        </div>
                        {/* Box 3 */}
                        <div className="p-8 transition-all duration-300 border rounded-3xl bg-slate-50 border-slate-100 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 group">
                            <div className="flex items-center justify-center mb-6 transition-transform bg-purple-100 w-14 h-14 rounded-2xl group-hover:scale-110">
                                <Shield size={28} className="text-purple-600" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold font-display text-slate-900">Role-Based Access</h3>
                            <p className="leading-relaxed text-slate-600">Secure environment with Admin, Driver, and Passenger tailored views. Your data is protected.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-12 text-center bg-slate-950 lg:px-12 text-slate-400">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800">
                        <Bus size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white font-display">Mamba Bus Management System</span>
                </div>
                <p className="text-sm">© {new Date().getFullYear()} Mamba Bus Management System. All rights reserved.</p>
            </footer>
        </div>
    );
}
