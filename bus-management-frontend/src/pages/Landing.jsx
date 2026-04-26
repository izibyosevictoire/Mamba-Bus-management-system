import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, Map, Ticket, Shield, ArrowRight, Clock, Star } from 'lucide-react';
import busImage from '../assets/hero-bus.png';

export default function Landing() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-nexus-500 selection:text-white">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-50 px-6 py-6 lg:px-12 flex justify-between items-center backdrop-blur-sm bg-white/30 border-b border-white/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-nexus-500 to-nexus-600 rounded-xl flex items-center justify-center shadow-lg shadow-nexus-500/20">
                        <Bus size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-display font-bold tracking-tight">Mamba Bus Management System</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-nexus-600 transition-colors">Sign In</Link>
                    <Link to="/register" className="text-sm font-semibold text-white bg-slate-900 px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5">Register</Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 overflow-hidden flex flex-col justify-center min-h-[90vh]">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-nexus-500/10 mix-blend-multiply rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-500/10 mix-blend-multiply rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 xl:gap-20">
                    {/* Text Side */}
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nexus-50 border border-nexus-100 text-nexus-700 font-semibold text-xs tracking-wider uppercase mb-8 shadow-sm">
                            <Star size={14} className="text-nexus-500" /> Defining the future of transit
                        </div>
                        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight text-slate-900 mb-8 leading-[1.05]">
                            Transform how you travel <br className="hidden lg:block" /> with <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexus-500 to-brand-500 drop-shadow-sm">Mamba Bus System</span>.
                        </h1>
                        <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                            Enjoy effortless ticketing, accurate schedules, and real-time bus updates—built to deliver a faster, smarter, and more reliable transit experience.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-semibold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 hover:-translate-y-1 flex items-center justify-center gap-2 group">
                                Start Journey <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold text-lg hover:border-nexus-300 hover:text-nexus-600 transition-all shadow-sm flex items-center justify-center">
                                Create Account
                            </Link>
                        </div>
                    </div>

                    {/* Image Side */}
                    <div className="flex-1 relative w-full max-w-2xl lg:max-w-none mt-12 lg:mt-0 perspective-1000">
                        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/50 backdrop-blur-sm transform transition-transform hover:-translate-y-2 duration-500 bg-white/50">
                            <img src={busImage} alt="Modern City Bus" className="w-full h-auto object-cover scale-105" />
                            
                            {/* Glass Overlay on Image */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-transparent mix-blend-overlay"></div>
                            
                            <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white hidden sm:block shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="bg-brand-500 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                        <Shield size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-display font-bold text-lg leading-tight">Secure Network</h4>
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
            <section className="py-24 px-6 lg:px-12 bg-white relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-4">Enterprise Grade Capabilities</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Everything you need to manage your fleet, schedules, and tickets in a single intuitive platform.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Box 1 */}
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-nexus-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-nexus-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Ticket size={28} className="text-nexus-600" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-slate-900 mb-3">Smart Ticketing</h3>
                            <p className="text-slate-600 leading-relaxed">Book trips seamlessly with real-time seat availability. Download PDF receipts directly to your device.</p>
                        </div>
                        {/* Box 2 */}
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Map size={28} className="text-brand-600" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-slate-900 mb-3">Dynamic Routing</h3>
                            <p className="text-slate-600 leading-relaxed">Manage complex transit networks across multiple corridors. Full administrative dashboard for route tracking.</p>
                        </div>
                        {/* Box 3 */}
                        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield size={28} className="text-purple-600" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-slate-900 mb-3">Role-Based Access</h3>
                            <p className="text-slate-600 leading-relaxed">Secure environment with Admin, Driver, and Passenger tailored views. Your data is protected.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 px-6 py-12 lg:px-12 text-center text-slate-400">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                        <Bus size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-display font-bold tracking-tight text-white">Mamba Bus Management System</span>
                </div>
                <p className="text-sm">© {new Date().getFullYear()} Mamba Bus Management System. All rights reserved.</p>
            </footer>
        </div>
    );
}
