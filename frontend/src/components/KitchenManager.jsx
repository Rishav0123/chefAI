
import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { X, Users, Home, ArrowRight, ClipboardCopy } from 'lucide-react';
import api from '../api';

const KitchenManager = ({ isOpen, onClose }) => {
    const { user, refreshKitchens } = useContext(UserContext);
    const [view, setView] = useState('menu'); // menu, create, join
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/kitchens/', {
                name: formData.name,
                owner_id: user.id
            });
            await refreshKitchens();
            onClose();
            setView('menu');
            setFormData({ name: '', code: '' });
        } catch (err) {
            console.error(err);
            setError("Failed to create group. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/kitchens/join', {
                user_id: user.id,
                invite_code: formData.code
            });
            await refreshKitchens();
            onClose();
            setView('menu');
            setFormData({ name: '', code: '' });
        } catch (err) {
            console.error(err);
            setError("Invalid invite code or already a member.");
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (view === 'create') {
            return (
                <form onSubmit={handleCreate} className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Create New Group</h3>
                    <div>
                        <label className="block text-stone-400 text-sm mb-2">Group Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Flat 302, Office Pantry"
                            className="input-field w-full"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setView('menu')} className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold">Back</button>
                        <button type="submit" disabled={loading} className="flex-1 btn-primary py-3 rounded-xl font-bold flex justify-center items-center">
                            {loading ? <div className="animate-spin border-2 border-white rounded-full h-4 w-4 border-t-transparent"></div> : "Create"}
                        </button>
                    </div>
                </form>
            );
        }

        if (view === 'join') {
            return (
                <form onSubmit={handleJoin} className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Join Existing Group</h3>
                    <div>
                        <label className="block text-stone-400 text-sm mb-2">Enter Invite Code</label>
                        <input
                            type="text"
                            placeholder="e.g. 6-digit code"
                            className="input-field w-full uppercase tracking-widest text-center"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            maxLength={6}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setView('menu')} className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold">Back</button>
                        <button type="submit" disabled={loading} className="flex-1 btn-primary py-3 rounded-xl font-bold flex justify-center items-center">
                            {loading ? <div className="animate-spin border-2 border-white rounded-full h-4 w-4 border-t-transparent"></div> : "Join"}
                        </button>
                    </div>
                </form>
            );
        }

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">Add Workspace</h3>
                <p className="text-stone-400 text-sm mb-6">Create a shared pantry for your family or join an existing one.</p>

                <button
                    onClick={() => setView('create')}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-white p-4 rounded-xl flex items-center justify-between group transition-all border border-white/5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center">
                            <Home size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold">Create New</div>
                            <div className="text-xs text-stone-500">Start a new shared pantry</div>
                        </div>
                    </div>
                    <ArrowRight size={16} className="text-stone-500 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    onClick={() => setView('join')}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-white p-4 rounded-xl flex items-center justify-between group transition-all border border-white/5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold">Join Group</div>
                            <div className="text-xs text-stone-500">Use an invite code</div>
                        </div>
                    </div>
                    <ArrowRight size={16} className="text-stone-500 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-stone-900 border border-white/10 w-full max-w-md rounded-2xl p-6 relative shadow-2xl animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {renderContent()}
            </div>
        </div>
    );
};

export default KitchenManager;
