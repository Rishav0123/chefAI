import React from 'react';
import { ChefHat, Camera, MessageSquare, Activity, ArrowRight, Sparkles } from 'lucide-react';
import HeroGraphic from '../assets/how_it_works_graphic.png';

const LandingPage = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen bg-stone-950 text-white overflow-hidden relative selection:bg-orange-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-50 container mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <ChefHat size={20} color="white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">AI<span className="text-orange-500">Chef</span></span>
                </div>
                <button
                    onClick={onGetStarted}
                    className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-medium backdrop-blur-sm"
                >
                    Sign In
                </button>
            </nav>

            {/* Hero Section */}
            <header className="relative z-10 container mx-auto px-6 pt-12 pb-20 md:pt-24 md:pb-32 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up">
                    <Sparkles size={14} className="text-orange-400" />
                    <span className="text-xs font-semibold text-stone-300 tracking-wide uppercase">The Future of Home Cooking</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight animate-fade-in-up delay-100">
                    Elevate Your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Culinary Art.</span>
                </h1>

                <p className="text-xl md:text-2xl text-stone-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                    Stop staring at your fridge. Start creating.
                    <span className="block mt-2 text-stone-500 text-lg">AI Chef transforms chaos into gourmet meals instantly.</span>
                </p>

                <div className="animate-fade-in-up delay-300">
                    <button
                        onClick={onGetStarted}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)] hover:shadow-[0_0_60px_-15px_rgba(234,88,12,0.6)] hover:-translate-y-1"
                    >
                        Get Started
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="mt-4 text-xs text-stone-600 font-medium">Free to try • No credit card required</p>
                </div>
            </header>

            {/* Features Section */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:border-orange-500/20">
                        <div className="w-14 h-14 rounded-2xl bg-stone-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                            <Camera size={28} className="text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Visual Inventory</h3>
                        <p className="text-stone-400 leading-relaxed">
                            Forget manual typing. Just snap a photo of your receipt or open fridge.
                            AI instantly identifies ingredients and updates your digital pantry.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:border-orange-500/20">
                        <div className="w-14 h-14 rounded-2xl bg-stone-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                            <MessageSquare size={28} className="text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Intelligent Chat</h3>
                        <p className="text-stone-400 leading-relaxed">
                            "I have chicken and rice. What can I make in 20 mins?"
                            The AI suggests recipes specifically based on what you actually have in stock.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="group p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:border-orange-500/20">
                        <div className="w-14 h-14 rounded-2xl bg-stone-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                            <Activity size={28} className="text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Smart Tracking</h3>
                        <p className="text-stone-400 leading-relaxed">
                            Cooking a recipe? One click deducts ingredients from your stock.
                            Track your "Kitchen Efficiency" and drastically reduce food waste.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-xl mt-20">
                <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <ChefHat size={16} />
                        <span className="font-bold text-sm">AI Chef</span>
                    </div>
                    <p className="text-stone-600 text-sm">© 2024 AI Chef. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
