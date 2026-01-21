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
    const [stockQueue, setStockQueue] = useState([]);
    const [existingStockNames, setExistingStockNames] = useState([]);

    // --- Meal Form State ---
    const [mealFormData, setMealFormData] = useState({
        name: '',
        meal_type: 'other',
        meal_source: 'home',
        calories: '',
        protein_g: '',
        carbs_g: '',
        fat_g: '',
        ingredients_used: []
    });
    const [mealQueue, setMealQueue] = useState([]);

    // Check for Draft Data from Chatbot
    useEffect(() => {
        if (location.state?.drafts) {
            const drafts = location.state.drafts;
            console.log("Drafts loaded:", drafts);

            // Queue all except last
            if (drafts.length > 1) {
                const queueItems = drafts.slice(0, -1).map(d => ({
                    name: d.name || '',
                    meal_type: d.meal_type || 'other',
                    meal_source: d.deduct_stock ? 'home' : 'out',
                    calories: d.nutrition?.calories || '',
                    protein_g: d.nutrition?.protein || '',
                    carbs_g: d.nutrition?.carbs || '',
                    fat_g: d.nutrition?.fat || '',
                    ingredients_used: d.ingredients || []
                }));
                setMealQueue(queueItems);
            }

            // Set active form to last draft
            const lastDraft = drafts[drafts.length - 1];
            setMealFormData({
                name: lastDraft.name || '',
                meal_type: lastDraft.meal_type || 'other',
                meal_source: lastDraft.deduct_stock ? 'home' : 'out',
                calories: lastDraft.nutrition?.calories || '',
                protein_g: lastDraft.nutrition?.protein || '',
                carbs_g: lastDraft.nutrition?.carbs || '',
                fat_g: lastDraft.nutrition?.fat || '',
                ingredients_used: lastDraft.ingredients || []
            });
            setActiveTab('meal');
        } else if (location.state?.draft) {
            // Legacy fallback
            const draft = location.state.draft;
            setMealFormData({
                name: draft.name || '',
                meal_type: draft.meal_type || 'other',
                meal_source: draft.deduct_stock ? 'home' : 'out',
                calories: draft.nutrition?.calories || '',
                protein_g: draft.nutrition?.protein || '',
                carbs_g: draft.nutrition?.carbs || '',
                fat_g: draft.nutrition?.fat || '',
                ingredients_used: draft.ingredients || []
            });
            setActiveTab('meal');
        }
    }, [location.state]);

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

    const handleAddAnotherStock = (e) => {
        e.preventDefault();
        if (!stockFormData.item_name) return;
        setStockQueue([...stockQueue, stockFormData]);
        setStockFormData({ item_name: '', quantity_num: '', unit: 'g', category: '', expiry_date: '' });
    };

    const handleStockSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Combine queue + current (if filled)
            const itemsToSave = [...stockQueue];
            if (stockFormData.item_name) itemsToSave.push(stockFormData);

            if (itemsToSave.length === 0) return;

            // Save all in parallel
            await Promise.all(itemsToSave.map(item => {
                const quantity = `${item.quantity_num} ${item.unit}`;
                return api.post('/stock/', {
                    user_id: user.id,
                    item_name: item.item_name,
                    quantity: quantity,
                    category: item.category,
                    expiry_date: item.expiry_date || undefined
                });
            }));

            navigate('/');
        } catch (error) {
            console.error("Error adding items:", error);
            alert(`Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Meal Handlers ---
    const handleMealChange = (e) => {
        setMealFormData({ ...mealFormData, [e.target.name]: e.target.value });
    };

    const handleAddAnotherMeal = (e) => {
        e.preventDefault();
        if (!mealFormData.name) return;
        setMealQueue([...mealQueue, mealFormData]);
        setMealFormData({
            name: '', meal_type: 'other', meal_source: 'home',
            calories: '', protein_g: '', carbs_g: '', fat_g: '', ingredients_used: []
        });
    };

    const handleMealSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const mealsToSave = [...mealQueue];
            if (mealFormData.name) mealsToSave.push(mealFormData);

            if (mealsToSave.length === 0) return;

            await Promise.all(mealsToSave.map(meal => {
                return api.post('/meals/', {
                    user_id: user.id,
                    name: meal.name,
                    meal_type: meal.meal_type,
                    meal_source: meal.meal_source,
                    ingredients_used: meal.ingredients_used || [],
                    confidence: 100,
                    calories: parseInt(meal.calories) || 0,
                    protein_g: parseInt(meal.protein_g) || 0,
                    carbs_g: parseInt(meal.carbs_g) || 0,
                    fat_g: parseInt(meal.fat_g) || 0
                });
            }));

            navigate('/');
        } catch (error) {
            console.error("Error adding meals:", error);
            alert("Failed to add meals");
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

                        {/* Queue Summary */}
                        {stockQueue.length > 0 && (
                            <div className="bg-stone-800/50 p-4 rounded-xl border border-white/10 mb-4">
                                <h4 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Ready to Add ({stockQueue.length})</h4>
                                <ul className="space-y-1">
                                    {stockQueue.map((item, i) => (
                                        <li key={i} className="text-white text-sm flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                                            {item.item_name} <span className="text-stone-500">({item.quantity_num} {item.unit})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleAddAnotherStock}
                                type="button"
                                className="w-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 py-3 rounded-xl font-bold transition-all border border-white/10 uppercase tracking-wider text-sm"
                            >
                                + Add Another Item
                            </button>
                            <button type="submit" className="w-full btn-primary flex justify-center items-center gap-2 py-4">
                                <Save size={18} />
                                {stockQueue.length > 0
                                    ? `Save All (${stockQueue.length + (stockFormData.item_name ? 1 : 0)})`
                                    : "Save to Stock"
                                }
                            </button>
                        </div>
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

                        {/* Queue Summary */}
                        {mealQueue.length > 0 && (
                            <div className="bg-stone-800/50 p-4 rounded-xl border border-white/10 mb-4">
                                <h4 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Ready to Log ({mealQueue.length})</h4>
                                <ul className="space-y-1">
                                    {mealQueue.map((m, i) => (
                                        <li key={i} className="text-white text-sm flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                            {m.name} <span className="text-stone-500">({m.meal_type})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleAddAnotherMeal}
                                type="button"
                                className="w-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 py-3 rounded-xl font-bold transition-all border border-white/10 uppercase tracking-wider text-sm"
                            >
                                + Add Another Meal
                            </button>
                            <button type="submit" className="w-full btn-primary flex justify-center items-center gap-2 py-4">
                                <Utensils size={18} />
                                {mealQueue.length > 0
                                    ? `Log All (${mealQueue.length + (mealFormData.name ? 1 : 0)})`
                                    : "Log Meal"
                                }
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddItem;
