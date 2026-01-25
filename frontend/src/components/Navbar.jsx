import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Home, Users, ChevronDown, PlusCircle, User as UserIcon } from 'lucide-react';
import { UserContext } from '../context/UserContext';
import ProfileModal from './ProfileModal';
import KitchenManager from './KitchenManager';

import logo from '../assets/logo.png';

const Navbar = () => {
    const { user, logout, kitchens, activeKitchen, switchKitchen, loading } = useContext(UserContext);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isKitchenMenuOpen, setIsKitchenMenuOpen] = useState(false);
    const [isKitchenManagerOpen, setIsKitchenManagerOpen] = useState(false);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
                <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 md:w-14 md:h-14 group-hover:scale-110 transition-transform rounded-full overflow-hidden border border-white/5">
                            <img src={logo} alt="Chef AI" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-white">AI<span className="text-accent">Chef</span></span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* Kitchen Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setIsKitchenMenuOpen(!isKitchenMenuOpen)}
                                className="flex items-center gap-2 bg-stone-800 border border-white/10 px-4 py-2 rounded-xl text-stone-300 hover:text-white hover:border-accent/50 transition-all text-sm font-medium"
                            >
                                {activeKitchen ? (
                                    <>
                                        {activeKitchen.role === 'admin' && activeKitchen.name.includes("Personal") ? <Home size={16} /> : <Users size={16} />}
                                        <span className="truncate max-w-[120px]">{activeKitchen.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Home size={16} />
                                        <span className="truncate max-w-[120px]">{loading ? "Loading..." : "Personal Pantry"}</span>
                                    </>
                                )}
                                <ChevronDown size={14} className="text-stone-500" />
                            </button>

                            {/* Dropdown Menu */}
                            {isKitchenMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-stone-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <h4 className="px-3 py-2 text-xs font-bold text-stone-500 uppercase tracking-widest">Switch Workspace</h4>
                                    <div className="space-y-1 mb-2">
                                        {kitchens.map(k => (
                                            <button
                                                key={k.id}
                                                onClick={() => {
                                                    switchKitchen(k.id);
                                                    setIsKitchenMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors ${activeKitchen?.id === k.id ? 'bg-accent/10 text-accent' : 'text-stone-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {k.name.includes("Personal") ? <Home size={14} className="shrink-0" /> : <Users size={14} className="shrink-0" />}
                                                    <div className="flex flex-col items-start overflow-hidden">
                                                        <span className="truncate w-full font-medium">{k.name}</span>
                                                        {!k.name.includes("Personal") && k.invite_code && (
                                                            <span className="text-[10px] text-stone-500 font-mono tracking-wider">CODE: {k.invite_code}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {activeKitchen?.id === k.id && <div className="w-2 h-2 rounded-full bg-accent"></div>}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="pt-2 border-t border-white/5">
                                        <button
                                            onClick={() => {
                                                setIsKitchenMenuOpen(false);
                                                setIsKitchenManagerOpen(true);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                                        >
                                            <PlusCircle size={14} />
                                            Create or Join Group
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile Hook */}
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="w-10 h-10 rounded-full bg-stone-800 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white hover:border-accent hover:bg-stone-700 transition-all cursor-pointer shadow-lg z-50 relative"
                        >
                            <UserIcon size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            <KitchenManager isOpen={isKitchenManagerOpen} onClose={() => setIsKitchenManagerOpen(false)} />

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
                logout={logout}
            />
        </>
    );
};

export default Navbar;
