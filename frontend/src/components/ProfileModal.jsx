import React, { useState, useEffect, useContext } from 'react';
import { X, User, LogOut, Save, ChevronRight, Scale, Activity, Utensils, AlertCircle } from 'lucide-react';
import { UserContext } from '../context/UserContext';
import api from '../api';

const ProfileModal = ({ isOpen, onClose }) => {
    const { user, logout, triggerStockRefresh } = useContext(UserContext);
    const [loading, setLoading] = useState(false);

    // Collapsible state: keys are section IDs, values are boolean
    const [expandedSections, setExpandedSections] = useState({
        personal: true,
        body: false,
        diet: false,
        goals: true
    });

    const [formData, setFormData] = useState({
        name: '',
        dietary_preferences: 'Standard',
        allergies: '',
        height: '',
        weight: '',
        age: '',
        activity_level: 'Moderate',
        // Goals
        daily_calories: '',
        daily_protein: '',
        daily_carbs: '',
        daily_fat: ''
    });

    useEffect(() => {
        if (isOpen && user) {
            fetchProfile();
        }
    }, [isOpen, user]);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users/${user.id}`);
            // Merge defaults with fetched data
            setFormData({
                name: res.data.name || '',
                dietary_preferences: res.data.dietary_preferences || 'Standard',
                allergies: res.data.allergies || '',
                height: res.data.height || '',
                weight: res.data.weight || '',
                age: res.data.age || '',
                activity_level: res.data.activity_level || 'Moderate',
                // Goals
                daily_calories: res.data.daily_calories || '',
                daily_protein: res.data.daily_protein || '',
                daily_carbs: res.data.daily_carbs || '',
                daily_fat: res.data.daily_fat || ''
            });
        } catch (err) {
            console.error("Error fetching profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put(`/users/${user.id}`, {
                ...formData,
                height: formData.height ? parseInt(formData.height) : null,
                weight: formData.weight ? parseInt(formData.weight) : null,
                age: formData.age ? parseInt(formData.age) : null,
                daily_calories: formData.daily_calories ? parseInt(formData.daily_calories) : null,
                daily_protein: formData.daily_protein ? parseInt(formData.daily_protein) : null,
                daily_carbs: formData.daily_carbs ? parseInt(formData.daily_carbs) : null,
                daily_fat: formData.daily_fat ? parseInt(formData.daily_fat) : null
            });
            triggerStockRefresh(); // Force dashboard update
            onClose();
        } catch (err) {
            console.error("Error updating profile", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>

            {/* Slide-over Panel */}
            <div className="relative w-full max-w-md bg-[#1c1917] h-full shadow-2xl flex flex-col border-l border-white/10 animate-slide-in">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-stone-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <User size={24} />
                        </div>
                        <div>
                            {user.email && (
                                <h2 className="font-bold text-white text-lg">{formData.name || 'Chef'}</h2>
                            )}
                            <p className="text-sm text-stone-400">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">

                    {/* Section: Personal Info */}
                    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                        <button
                            onClick={() => toggleSection('personal')}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-stone-400">
                                <User size={16} /> Personal Details
                            </div>
                            <ChevronRight size={16} className={`text-stone-500 transition-transform duration-300 ${expandedSections.personal ? 'rotate-90' : ''}`} />
                        </button>

                        {expandedSections.personal && (
                            <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2 pt-4">
                                <div>
                                    <label className="text-sm text-stone-400 mb-1 block">Display Name</label>
                                    <input name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Enter your name" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-stone-400 mb-1 block">Age</label>
                                        <input name="age" type="number" value={formData.age} onChange={handleChange} className="input-field" placeholder="25" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-stone-400 mb-1 block">Activity Level</label>
                                        <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="input-field">
                                            <option value="Sedentary">Sedentary</option>
                                            <option value="Light">Light</option>
                                            <option value="Moderate">Moderate</option>
                                            <option value="Active">Active</option>
                                            <option value="Very Active">Very Active</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Body Stats */}
                    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                        <button
                            onClick={() => toggleSection('body')}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-stone-400">
                                <Scale size={16} /> Body Stats
                            </div>
                            <ChevronRight size={16} className={`text-stone-500 transition-transform duration-300 ${expandedSections.body ? 'rotate-90' : ''}`} />
                        </button>

                        {expandedSections.body && (
                            <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-stone-400 mb-1 block">Height (cm)</label>
                                        <input name="height" type="number" value={formData.height} onChange={handleChange} className="input-field" placeholder="175" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-stone-400 mb-1 block">Weight (kg)</label>
                                        <input name="weight" type="number" value={formData.weight} onChange={handleChange} className="input-field" placeholder="70" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Food Preferences */}
                    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                        <button
                            onClick={() => toggleSection('diet')}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-stone-400">
                                <Utensils size={16} /> Food Preferences
                            </div>
                            <ChevronRight size={16} className={`text-stone-500 transition-transform duration-300 ${expandedSections.diet ? 'rotate-90' : ''}`} />
                        </button>

                        {expandedSections.diet && (
                            <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2 pt-4">
                                <div>
                                    <label className="text-sm text-stone-400 mb-1 block">Dietary Type</label>
                                    <select name="dietary_preferences" value={formData.dietary_preferences} onChange={handleChange} className="input-field">
                                        <option value="Standard">Standard</option>
                                        <option value="Vegetarian">Vegetarian</option>
                                        <option value="Vegan">Vegan</option>
                                        <option value="Keto">Keto</option>
                                        <option value="Paleo">Paleo</option>
                                        <option value="Gluten-Free">Gluten-Free</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-stone-400 mb-1 block">Allergies (comma separated)</label>
                                    <input name="allergies" value={formData.allergies} onChange={handleChange} className="input-field" placeholder="Peanuts, Shellfish..." />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Nutritional Goals */}
                    <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                        <button
                            onClick={() => toggleSection('goals')}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-stone-400">
                                <Activity size={16} /> Nutritional Goals
                            </div>
                            <ChevronRight size={16} className={`text-stone-500 transition-transform duration-300 ${expandedSections.goals ? 'rotate-90' : ''}`} />
                        </button>

                        {expandedSections.goals && (
                            <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2 pt-4">
                                <div>
                                    <label className="text-sm text-stone-400 mb-1 block">Daily Calories (kcal)</label>
                                    <input name="daily_calories" type="number" value={formData.daily_calories} onChange={handleChange} className="input-field" placeholder="2000" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-sm text-stone-400 mb-1 block">Protein (g)</label>
                                        <input name="daily_protein" type="number" value={formData.daily_protein} onChange={handleChange} className="input-field" placeholder="150" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-stone-400 mb-1 block">Carbs (g)</label>
                                        <input name="daily_carbs" type="number" value={formData.daily_carbs} onChange={handleChange} className="input-field" placeholder="250" />
                                    </div>
                                    <div>
                                        <label className="text-sm text-stone-400 mb-1 block">Fat (g)</label>
                                        <input name="daily_fat" type="number" value={formData.daily_fat} onChange={handleChange} className="input-field" placeholder="70" />
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-stone-500 bg-stone-900/50 p-3 rounded-lg">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <p>These goals will be used to track your daily nutrition progress in the dashboard.</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-white/5 bg-stone-900/50 backdrop-blur-md space-y-3">
                    <button onClick={handleSave} disabled={loading} className="btn-primary w-full justify-center">
                        <Save size={20} />
                        Save Changes
                    </button>
                    <button onClick={logout} className="w-full py-3 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-semibold flex items-center justify-center gap-2">
                        <LogOut size={20} />
                        Log Out
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ProfileModal;
