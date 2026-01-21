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
    const [stockItems, setStockItems] = useState([]);
    const [fetching, setFetching] = useState(true);

    // Fetch stock for metrics
    // Fetch stock for metrics
    useEffect(() => {
        const fetchData = () => {
            if (user?.id) {
                setFetching(true);
                api.get(`/stock/${user.id}`)
                    .then(res => {
                        setStockItems(res.data);
                        setFetching(false);
                    })
                    .catch(err => {
                        console.error(err);
                        setFetching(false);
                    });
            }
        };

        fetchData();

        const onFocus = () => fetchData();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user?.id, stockRefreshTrigger]);

    // 1. Capacity: Simple count metric (Target: 20 items = 100%)
    const efficiency = Math.min(Math.round((stockItems.length / 20) * 100), 100);

    // 2. Freshness: % of items NOT expiring in the next 3 days
    const freshness = stockItems.length > 0 ? Math.round((stockItems.filter(item => {
        if (!item.expiry_date) return true;
        const daysUntilExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry > 3;
    }).length / stockItems.length) * 100) : 100;

    // 3. Variety: How many unique categories exist out of 5 core ones
    const uniqueCategories = new Set(stockItems.map(i => i.category)).size;
    const varietyScore = Math.min(Math.round((uniqueCategories / 5) * 100), 100);

    return (
        <div className="animate-fade-in space-y-12">
            {/* Hero Section */}
            {/* Hero Section */}
            <section className="card-hero text-white group relative overflow-hidden">
                {/* Ambient Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-[10s]"></div>

                <div className="relative z-20 container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 py-8 md:py-12 px-2 md:px-0">
                    <div className="max-w-2xl text-left">
                        <div className="inline-flex items-center bg-orange-500/10 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-orange-500/20 text-accent text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6">
                            <span className="relative flex h-2 w-2 mr-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            AI Chef v2.0
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black mb-4 md:mb-6 leading-tight tracking-tight">
                            Elevate Your <br /><span className="text-accent">Culinary Art.</span>
                        </h1>

                        <p className="text-base md:text-xl text-stone-300 mb-8 font-medium leading-relaxed max-w-lg opacity-90 hidden md:block">
                            AI-powered inventory tracking and chef-grade recipe generation at your fingertips.
                        </p>

                        <div>
                            <Link to="/chat" className="btn-glass inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 text-base md:text-lg w-full md:w-auto justify-center">
                                <Sparkles size={20} className="text-accent" />
                                Ask Chef AI
                            </Link>
                        </div>
                    </div>

                    {/* Hero Graphic */}
                    <div className="hidden md:block max-w-[400px] lg:max-w-[500px] w-full animate-fade-in-up delay-200">
                        <img
                            src={HeroGraphic}
                            alt="AI Chef Workflow"
                            className="w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </div>
            </section>



            {/* Interaction Grid (Inputs & Shopping) */}
            <section className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                {/* 1. Visual Scan */}
                <Link to="/scan" className="glass-panel p-4 md:p-8 flex flex-col items-center md:items-start justify-center hover:border-accent/50 transition-all group relative overflow-hidden text-center md:text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-accent/10"></div>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-accent group-hover:text-white transition-all text-accent">
                        <Camera size={20} className="md:w-6 md:h-6" />
                    </div>
                    <h3 className="text-base md:text-xl font-bold mb-1">Visual Scan</h3>
                    <p className="text-stone-500 text-xs md:text-sm hidden md:block">Capture bills, items, or meals</p>
                </Link>

                {/* 2. Manual Entry */}
                <Link to="/add" className="glass-panel p-4 md:p-8 flex flex-col items-center md:items-start justify-center hover:border-accent/50 transition-all group text-center md:text-left">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-accent group-hover:text-white transition-all text-accent">
                        <PlusCircle size={20} className="md:w-6 md:h-6" />
                    </div>
                    <h3 className="text-base md:text-xl font-bold mb-1">Manual Entry</h3>
                    <p className="text-stone-500 text-xs md:text-sm hidden md:block">Log items or meals</p>
                </Link>

                {/* 3. Shopping List */}
                <div className="col-span-2 md:col-span-1 glass-panel p-4 md:p-8 flex flex-row md:flex-col items-center md:items-start justify-center md:justify-center gap-4 md:gap-0 hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 flex items-center justify-center md:mb-4 group-hover:bg-accent group-hover:text-white transition-all text-stone-400">
                        <ShoppingBag size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div className="text-left md:text-left flex-1 md:flex-none">
                        <h3 className="text-base md:text-xl font-bold mb-0.5 md:mb-1 text-white">Shopping List</h3>
                        <p className="text-stone-500 text-xs md:text-sm">Automated by AI</p>
                    </div>
                </div>
            </section>

            {/* Status & Nutrition Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kitchen Capacity Widget */}
                {/* Kitchen Capacity & Metrics Widget */}
                <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-[60px] -mr-16 -mt-16 transition-all group-hover:bg-accent/10"></div>

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-stone-400 text-sm font-bold uppercase tracking-widest">Pantry Status</h3>
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                            <Activity size={16} className="text-stone-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* 1. Capacity */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-white">Capacity</span>
                                <span className="text-accent font-black">{efficiency}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${efficiency}%` }}></div>
                            </div>
                        </div>

                        {/* 2. Freshness */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-white">Freshness</span>
                                <span className="text-green-500 font-black">{freshness}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${freshness}%` }}></div>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">Items safe from expiry</p>
                        </div>

                        {/* 3. Variety */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-white">Variety</span>
                                <span className="text-blue-500 font-black">{varietyScore}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${varietyScore}%` }}></div>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">Diversity of ingredients</p>
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
                    <StockList limit={5} />
                </div>

                {/* Right: History & Chat Teaser */}
                <div className="space-y-8">
                    <MealHistory limit={5} />
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
                        <Route path="/inventory" element={<div className="animate-fade-in"><StockList /></div>} />
                        <Route path="/meals" element={<div className="animate-fade-in"><MealHistory /></div>} />
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
