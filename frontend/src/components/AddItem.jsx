import React, { useState, useContext, useEffect } from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Utensils, Box, Flame, Activity, Wheat, Droplet } from 'lucide-react';
import { UserContext } from '../context/UserContext';
import LoadingOverlay from './LoadingOverlay';

const AddItem = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(UserContext);

    // Initialize tab based on URL param ?mode=meal or default to 'stock'
    const initialTab = new URLSearchParams(location.search).get('mode') || 'stock';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);

    // --- Stock Form State ---
    const [stockFormData, setStockFormData] = useState({
        item_name: '',
        quantity_num: '',
        unit: 'g',
        category: '',
        expiry_date: '',
    });
    const [existingStockNames, setExistingStockNames] = useState([]);

    // --- Meal Form State ---
    const [mealFormData, setMealFormData] = useState({
        name: '',
        meal_type: 'other',
        meal_source: 'home',
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: ''
    });

    // Fetch existing stock for autocomplete
    useEffect(() => {
        if (user && activeTab === 'stock') {
            api.get(`/stock/${user.id}`)
                .then(res => {
                    const names = [...new Set(res.data.map(item => item.item_name))];
                    setExistingStockNames(names);
                })
                .catch(err => console.error("Failed to fetch stock for autocomplete", err));
        }
    }, [user, activeTab]);

    // --- Stock Handlers ---
    const handleStockChange = (e) => {
        setStockFormData({ ...stockFormData, [e.target.name]: e.target.value });
    };

    const handleStockSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const quantity = `${stockFormData.quantity_num} ${stockFormData.unit}`;
            const payload = {
                user_id: user.id,
                item_name: stockFormData.item_name,
                quantity: quantity,
                category: stockFormData.category,
                expiry_date: stockFormData.expiry_date || undefined
            };

            await api.post('/stock/', payload);
            navigate('/');
        } catch (error) {
            console.error("Error adding item:", error);
            const msg = error.response?.data?.detail || error.message || "Unknown Error";
            alert(`Failed: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Meal Handlers ---
    const handleMealChange = (e) => {
        setMealFormData({ ...mealFormData, [e.target.name]: e.target.value });
    };

    const handleMealSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                user_id: user.id,
                name: mealFormData.name,
                meal_type: mealFormData.meal_type,
                meal_source: mealFormData.meal_source,
                ingredients_used: [], // Manual entry assumes no specific ingredient deduction for now unless complex logic added
                confidence: 100,
                calories: parseInt(mealFormData.calories) || 0,
                protein_g: parseInt(mealFormData.protein_g) || 0,
                carbs_g: parseInt(mealFormData.carbs_g) || 0,
                fat_g: parseInt(mealFormData.fat_g) || 0
            };

            await api.post('/meals/', payload);
            navigate('/');
        } catch (error) {
            console.error("Error adding meal:", error);
            alert("Failed to add meal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
            {loading && <LoadingOverlay message="Saving..." />}

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'stock' ? 'bg-accent text-white shadow-lg shadow-orange-500/20' : 'bg-stone-900/50 text-stone-400 hover:bg-stone-800'}`}
                >
                    <Box size={20} />
                    <span className="font-bold">Add Ingredient</span>
                </button>
                <button
                    onClick={() => setActiveTab('meal')}
                    className={`flex-1 p-4 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'meal' ? 'bg-accent text-white shadow-lg shadow-orange-500/20' : 'bg-stone-900/50 text-stone-400 hover:bg-stone-800'}`}
                >
                    <Utensils size={20} />
                    <span className="font-bold">Log Meal</span>
                </button>
            </div>

            <div className="glass-panel p-8">
                {activeTab === 'stock' ? (
                    <form onSubmit={handleStockSubmit} className="space-y-6">
                        <div>
                            <label className="block text-stone-400 text-sm mb-2">Item Name</label>
                            <input
                                name="item_name"
                                className="input-field"
                                placeholder="e.g. Tomatoes"
                                value={stockFormData.item_name}
                                onChange={handleStockChange}
                                list="stock-options"
                                required
                            />
                            <datalist id="stock-options">
                                {existingStockNames.map((name, i) => (
                                    <option key={i} value={name} />
                                ))}
                            </datalist>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-stone-400 text-sm mb-2">Quantity</label>
                                <input
                                    name="quantity_num"
                                    type="number"
                                    className="input-field"
                                    placeholder="e.g. 500"
                                    value={stockFormData.quantity_num}
                                    onChange={handleStockChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-stone-400 text-sm mb-2">Unit</label>
                                <select
                                    name="unit"
                                    className="input-field"
                                    value={stockFormData.unit}
                                    onChange={handleStockChange}
                                >
                                    <option value="g">grams (g)</option>
                                    <option value="ml">milliliters (ml)</option>
                                    <option value="pcs">pieces (pcs)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-stone-400 text-sm mb-2">Category</label>
                            <select
                                name="category"
                                className="input-field"
                                value={stockFormData.category}
                                onChange={handleStockChange}
                            >
                                <option value="">Select Category</option>
                                <option value="vegetable">Vegetable</option>
                                <option value="fruit">Fruit</option>
                                <option value="dairy">Dairy</option>
                                <option value="spice">Spice</option>
                                <option value="grain">Grain</option>
                                <option value="meat">Meat</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
                            <Save size={18} /> Save to Stock
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleMealSubmit} className="space-y-6">
                        <div>
                            <label className="block text-stone-400 text-sm mb-2">Meal Name</label>
                            <input
                                name="name"
                                className="input-field"
                                placeholder="e.g. Chicken Curry"
                                value={mealFormData.name}
                                onChange={handleMealChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-stone-400 text-sm mb-2">Type</label>
                                <select
                                    name="meal_type"
                                    className="input-field"
                                    value={mealFormData.meal_type}
                                    onChange={handleMealChange}
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snack">Snack</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-stone-400 text-sm mb-2">Source</label>
                                <select
                                    name="meal_source"
                                    className="input-field"
                                    value={mealFormData.meal_source}
                                    onChange={handleMealChange}
                                >
                                    <option value="home">Home Cooked</option>
                                    <option value="outside">Ordered / Outside</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
                                <Activity size={16} /> Nutrition (Optional)
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Flame size={12} /> Calories</label>
                                    <input type="number" name="calories" className="input-field" value={mealFormData.calories} onChange={handleMealChange} />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Utensils size={12} /> Protein (g)</label>
                                    <input type="number" name="protein_g" className="input-field" value={mealFormData.protein_g} onChange={handleMealChange} />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Wheat size={12} /> Carbs (g)</label>
                                    <input type="number" name="carbs_g" className="input-field" value={mealFormData.carbs_g} onChange={handleMealChange} />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Droplet size={12} /> Fat (g)</label>
                                    <input type="number" name="fat_g" className="input-field" value={mealFormData.fat_g} onChange={handleMealChange} />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
                            <Save size={18} /> Log Meal
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddItem;
