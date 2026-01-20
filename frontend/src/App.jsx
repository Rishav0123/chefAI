import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './index.css';
import StockList from './components/StockList';
import AddItem from './components/AddItem';
import DailyNutrition from './components/DailyNutrition';
import UploadBill from './components/UploadBill';
import ChatAssistant from './components/ChatAssistant';
import Login from './components/Login';
import ChatWidgetButton from './components/ChatWidgetButton';
import { UserProvider, UserContext } from './context/UserContext';
import { ShoppingBag, PlusCircle, ScanLine, User as UserIcon, ChefHat, Sparkles, UploadCloud, Camera, Activity } from 'lucide-react';
import MealHistory from './components/MealHistory';
import ProfileModal from './components/ProfileModal';
import ScanMethod from './components/ScanMethod';
import api from './api';
import HeroGraphic from './assets/how_it_works_graphic.png';

const Dashboard = () => {
    const { user, stockRefreshTrigger } = React.useContext(UserContext);
    const [stockCount, setStockCount] = useState(0);
    const [fetching, setFetching] = useState(true);

    // Fetch stock count for "Kitchen Capacity" metric
    useEffect(() => {
        if (user?.id) {
            setFetching(true);
            api.get(`/stock/${user.id}`)
                .then(res => {
                    setStockCount(res.data.length);
                    setFetching(false);
                })
                .catch(err => {
                    console.error(err);
                    setFetching(false);
                });
        }
    }, [user?.id, stockRefreshTrigger]);

    // Calculate "Efficiency" (arbitrary metric based on stock count for UI flare)
    const efficiency = Math.min(Math.round((stockCount / 20) * 100), 100);

    return (
        <div className="animate-fade-in space-y-12">
            {/* Hero Section */}
            <section className="card-hero text-white group">
                {/* Ambient Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-[10s]"></div>

                <div className="relative z-20 container mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="max-w-2xl text-left">
                        <div className="inline-flex items-center bg-orange-500/10 backdrop-blur-md px-4 py-2 rounded-full border border-orange-500/20 text-accent text-xs font-bold uppercase tracking-widest mb-6">
                            <span className="relative flex h-2 w-2 mr-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            AI Chef v2.0
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
                            Elevate Your <br /><span className="text-accent">Culinary Art.</span>
                        </h1>

                        <p className="text-xl text-stone-300 mb-10 font-medium leading-relaxed max-w-lg opacity-90">
                            AI-powered inventory tracking and chef-grade recipe generation at your fingertips.
                        </p>

                        <div>
                            <Link to="/chat" className="btn-glass inline-flex items-center gap-3 px-8 py-4 text-lg">
                                <Sparkles size={24} className="text-accent" />
                                Ask Chef AI
                            </Link>
                        </div>
                    </div>

                    {/* Hero Graphic */}
                    <div className="hidden md:block max-w-[500px] w-full animate-fade-in-up delay-200">
                        <img
                            src={HeroGraphic}
                            alt="AI Chef Workflow"
                            className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </div>
            </section>

            {/* How It Works - Onboarding Guide */}
            <section className="animate-fade-in-up">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-stone-500 font-bold uppercase tracking-widest text-xs">How It Works</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Step 1 */}
                    <div className="glass-panel p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-accent font-black text-xl border border-white/5 group-hover:scale-110 transition-transform shadow-lg">1</div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Scan & Add</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">
                                Upload a bill or photo of your kitchen. AI detects ingredients instantly.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="glass-panel p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-accent font-black text-xl border border-white/5 group-hover:scale-110 transition-transform shadow-lg">2</div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Ask Chef AI</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">
                                "What can I cook?" The AI suggests personalized recipes based on your stock.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="glass-panel p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-accent font-black text-xl border border-white/5 group-hover:scale-110 transition-transform shadow-lg">3</div>
                        <div>
                            <h3 className="text-white font-bold text-lg mb-1">Cook & Track</h3>
                            <p className="text-stone-400 text-sm leading-relaxed">
                                Follow real-time recipes and auto-deduct used ingredients from your pantry.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interaction Grid (Inputs & Shopping) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Visual Scan */}
                <Link to="/scan" className="glass-panel p-8 flex flex-col items-start justify-center hover:border-accent/50 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-accent/10"></div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-all text-accent">
                        <Camera size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-1">Visual Scan</h3>
                    <p className="text-stone-500 text-sm">Capture bills or items</p>
                </Link>

                {/* 2. Manual Entry */}
                <Link to="/add" className="glass-panel p-8 flex flex-col items-start justify-center hover:border-accent/50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-all text-accent">
                        <PlusCircle size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-1">Manual Entry</h3>
                    <p className="text-stone-500 text-sm">Log items or meals</p>
                </Link>

                {/* 3. Shopping List */}
                <div className="glass-panel p-8 flex flex-col items-start justify-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-all text-stone-400">
                        <ShoppingBag size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-1 text-white">Shopping List</h3>
                    <p className="text-stone-500 text-sm">Automated by AI</p>
                </div>
            </section>

            {/* Status & Nutrition Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kitchen Capacity Widget */}
                <div className="glass-panel p-8 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-[60px] -mr-16 -mt-16 transition-all group-hover:bg-accent/10"></div>
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h3 className="text-stone-400 text-sm font-bold uppercase tracking-widest mb-2">Pantry Status</h3>
                            {fetching ? (
                                <div className="text-3xl font-bold text-stone-500 mb-1 animate-pulse">Syncing...</div>
                            ) : (
                                <div className="text-5xl font-black text-accent mb-1">{efficiency}<span className="text-2xl text-white ml-1">% Capacity</span></div>
                            )}
                            <p className="text-stone-500 text-sm font-medium">Auto-calculated based on {stockCount} items.</p>
                        </div>
                        <div className="hidden md:block">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                                <Activity size={20} className="text-stone-400" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all duration-1000 relative" style={{ width: `${efficiency}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Nutrition Tracker */}
                <DailyNutrition />
            </section>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Inventory */}
                <div className="lg:col-span-2 space-y-8">
                    <StockList />
                </div>

                {/* Right: History & Chat Teaser */}
                <div className="space-y-8">
                    <MealHistory />
                </div>
            </div>
        </div>
    );
};

import LandingPage from './components/LandingPage';


// Main App Structure with Auth Logic
const AppContent = () => {
    const { user, loading } = React.useContext(UserContext);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogin, setShowLogin] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4">
                <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-stone-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-accent">
                        <ChefHat size={32} />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2 animate-pulse">Waking up AI Chef...</h2>
                <p className="text-stone-500 text-sm max-w-xs text-center">
                    The server sleeps when idle to save energy. This might take up to 60 seconds.
                    <br /><span className="text-accent/80 text-xs mt-2 block">Thanks for your patience! 🥣</span>
                </p>
            </div>
        );
    }

    if (!user) {
        if (showLogin) {
            return <Login />;
        }
        return <LandingPage onGetStarted={() => setShowLogin(true)} />;
    }

    return (
        <Router>
            <div className="min-h-screen pb-20">
                {/* Top Navigation */}
                <nav className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                            <ChefHat size={20} color="white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">AI<span className="text-accent">Chef</span></span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* User Profile Hook */}
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="w-10 h-10 rounded-full bg-stone-800 border border-border-color flex items-center justify-center text-stone-400 hover:text-white hover:border-accent hover:bg-stone-700 transition-all cursor-pointer shadow-lg z-50 relative"
                        >
                            <UserIcon size={18} />
                        </button>
                    </div>
                </nav>

                <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/add" element={<AddItem />} />
                        <Route path="/scan" element={<ScanMethod />} />
                        <Route path="/scan/bill" element={<UploadBill mode="bill" />} />
                        <Route path="/scan/item" element={<UploadBill mode="single" />} />
                        <Route path="/scan/meal" element={<UploadBill mode="meal" />} />
                        <Route path="/chat" element={<ChatAssistant />} />
                    </Routes>
                </main>

                <ChatWidgetButton />

                <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            </div>
        </Router>
    );
};

const App = () => {
    return (
        <UserProvider>
            <AppContent />
        </UserProvider>
    );
};

export default App;
