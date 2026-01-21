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
            <nav className="relative z-50 container mx-auto px-4 py-4 md:px-6 md:py-6 flex justify-between items-center">
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
            {/* Hero Section */}
            <header className="relative z-10 container mx-auto px-6 pt-12 pb-20 md:pt-24 md:pb-32 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up self-center md:self-start">
                        <Sparkles size={14} className="text-orange-400" />
                        <span className="text-xs font-semibold text-stone-300 tracking-wide uppercase">The Future of Home Cooking</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-6 md:mb-8 leading-tight animate-fade-in-up delay-100">
                        Elevate Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Culinary Art.</span>
                    </h1>

                    <p className="text-lg md:text-2xl text-stone-400 mb-8 md:mb-12 leading-relaxed animate-fade-in-up delay-200">
                        Stop staring at your fridge. Start creating.
                        <span className="block mt-2 text-stone-500 text-base md:text-lg">AI Chef transforms chaos into gourmet meals instantly.</span>
                    </p>

                    <div className="animate-fade-in-up delay-300 flex flex-col md:flex-row items-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)] hover:shadow-[0_0_60px_-15px_rgba(234,88,12,0.6)] hover:-translate-y-1"
                        >
                            Get Started
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <p className="text-xs text-stone-600 font-medium md:ml-4">Free to try • No credit card required</p>
                    </div>
                </div>

                {/* Hero Image */}
                <div className="flex-1 relative animate-fade-in-up delay-200 w-full max-w-lg mx-auto">
                    {/* Blurred Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-blue-600/20 blur-3xl opacity-50 rounded-full scale-110"></div>

                    {/* Image Container with Glow and Glassmorphism */}
                    <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-orange-900/20 group">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none"></div>
                        <img
                            src={HeroGraphic}
                            alt="AI Chef Interface"
                            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                    </div>
                </div>
            </header>

            {/* How It Works - Onboarding Steps */}
            <section className="relative z-10 container mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-12 justify-center">
                    <div className="h-px bg-white/10 w-24"></div>
                    <span className="text-stone-500 font-bold uppercase tracking-widest text-xs">How It Works</span>
                    <div className="h-px bg-white/10 w-24"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Step 1 */}
                    <div className="glass-panel p-5 md:p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-orange-500 font-black text-xl border border-white/5 group-hover:scale-110 transition-transform shadow-lg">1</div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Scan & Add</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">
                                Upload a bill or photo of your kitchen. AI detects ingredients instantly.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="glass-panel p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-orange-500 font-black text-xl border border-white/5 group-hover:scale-110 transition-transform shadow-lg">2</div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Ask Chef AI</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">
                                "What can I cook?" The AI suggests personalized recipes based on your stock.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="glass-panel p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-orange-500 font-black text-xl border border-white/5 group-hover:scale-110 transition-transform shadow-lg">3</div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Cook & Track</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">
                                Follow real-time recipes and auto-deduct used ingredients from your pantry.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 container mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="group p-6 md:p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:border-orange-500/20">
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
