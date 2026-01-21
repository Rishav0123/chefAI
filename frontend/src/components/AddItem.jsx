import React, { useState, useContext, useEffect } from 'react';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Utensils, Box, Flame, Activity, Wheat, Droplet, X, Sparkles } from 'lucide-react';
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
                meal_source: (draft.deduct_stock || (draft.ingredients && draft.ingredients.length > 0)) ? 'home' : 'outside',
                calories: draft.nutrition?.calories || '',
                protein_g: draft.nutrition?.protein || '',
                carbs_g: draft.nutrition?.carbs || '',
                fat_g: draft.nutrition?.fat || '',
                ingredients_used: draft.ingredients || []
            });

            // If we have ingredients but meal_source is 'out' (maybe explicitly set or defaulted),
            // we should probably ensure they are visible or at least default to 'home' if ambiguous?
            // But let's stick to the draft's explicit intent. 
            // However, Chatbot often infers 'deduct_stock' poorly.
            // Let's force 'home' if ingredients are provided to ensure they are seen?
            // "deduct_stock" property from Chatbot is robust usually.
            // Let's check if the issue is actually property name mismatch in Chatbot output?
            // Chatbot tool definition: "ingredients": [{"item": "...", "qty": "..."}]
            // AddItem expects: ingredients_used: [{item: "...", qty: "..."}]
            // Matches.

            // Maybe the issue is simple: draft.ingredients is undefined?
            // If I look at the previous `UploadBill.jsx` redirection for meal:
            // ingredients: data.ingredients || []
            // That works.

            setActiveTab('meal');
        } else if (location.state?.stockDrafts) {
            const drafts = location.state.stockDrafts;
            console.log("Stock Drafts loaded:", drafts);

            const mapDraft = (d) => {
                let qStr = (d.quantity || "").toString().toLowerCase();
                let num = parseFloat(qStr) || '';
                let unit = 'pcs';

                if (qStr.includes('kg')) { num = (parseFloat(qStr) || 0) * 1000; unit = 'g'; }
                else if (qStr.includes('mg')) { num = (parseFloat(qStr) || 0) / 1000; unit = 'g'; }
                else if (qStr.includes('ml')) { unit = 'ml'; }
                else if (qStr.includes('l') && !qStr.includes('ml')) { num = (parseFloat(qStr) || 0) * 1000; unit = 'ml'; }
                else if (qStr.includes('g')) { unit = 'g'; }

                return {
                    item_name: d.item_name || '',
                    quantity_num: num,
                    unit: ['g', 'ml', 'pcs'].includes(unit) ? unit : 'pcs',
                    category: d.category || '',
                    expiry_date: ''
                };
            };

            // Queue all except last
            if (drafts.length > 1) {
                setStockQueue(drafts.slice(0, -1).map(mapDraft));
            }

            // Set active form to last draft
            if (drafts.length > 0) {
                setStockFormData(mapDraft(drafts[drafts.length - 1]));
            }
            setActiveTab('stock');
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

    // --- Ingredient Sub-form Handlers ---
    const [ingredientInput, setIngredientInput] = useState({ item: '', qty: '' });

    const handleAddIngredient = () => {
        if (!ingredientInput.item || !ingredientInput.qty) return;
        setMealFormData(prev => ({
            ...prev,
            ingredients_used: [...prev.ingredients_used, { item: ingredientInput.item, qty: ingredientInput.qty }]
        }));
        setIngredientInput({ item: '', qty: '' });
    };

    const handleRemoveIngredient = (index) => {
        setMealFormData(prev => ({
            ...prev,
            ingredients_used: prev.ingredients_used.filter((_, i) => i !== index)
        }));
    };

    const handleEstimate = async (target) => {
        if (!mealFormData.name) {
            alert("Please enter a Meal Name first!");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/meals/estimate', { meal_name: mealFormData.name });
            const data = res.data;

            setMealFormData(prev => {
                const updates = { ...prev };

                if (target === 'ingredients' || target === 'all') {
                    // Append estimated ingredients
                    if (data.ingredients && data.ingredients.length > 0) {
                        updates.ingredients_used = [...prev.ingredients_used, ...data.ingredients];
                    }
                }

                if (target === 'nutrition' || target === 'all') {
                    if (data.nutrition) {
                        updates.calories = data.nutrition.calories;
                        updates.protein_g = data.nutrition.protein;
                        updates.carbs_g = data.nutrition.carbs;
                        updates.fat_g = data.nutrition.fat;
                    }
                }

                return updates;
            });

        } catch (error) {
            console.error("Estimation failed:", error);
            alert("Could not estimate data. Please try again.");
        } finally {
            setLoading(false);
        }
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

                        {/* Ingredients Section (Only for Home Cooked) */}
                        {mealFormData.meal_source === 'home' && (
                            <div className="bg-stone-800/30 p-4 rounded-xl space-y-3 border border-white/5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
                                        <Box size={16} /> Ingredients Used (Optional)
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => handleEstimate('ingredients')}
                                        className="text-xs flex items-center gap-1 text-accent hover:text-orange-400 bg-stone-900 px-2 py-1 rounded-lg border border-orange-500/20 transition-all"
                                    >
                                        <Sparkles size={12} /> Auto-Calculate
                                    </button>
                                </div>

                                {/* List of Added Ingredients */}
                                {mealFormData.ingredients_used.length > 0 && (
                                    <ul className="mb-3 space-y-2">
                                        {mealFormData.ingredients_used.map((ing, idx) => (
                                            <li key={idx} className="flex justify-between items-center bg-stone-900 px-3 py-2 rounded-lg text-sm">
                                                <span className="text-stone-300">{ing.item} <span className="text-stone-500">({ing.qty})</span></span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveIngredient(idx)}
                                                    className="text-stone-500 hover:text-red-400"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Add Ingredient Inputs */}
                                <div className="flex gap-2">
                                    <input
                                        placeholder="Item (e.g. Rice)"
                                        className="input-field flex-[2] min-w-0"
                                        list="stock-options-meal"
                                        value={ingredientInput.item}
                                        onChange={e => setIngredientInput({ ...ingredientInput, item: e.target.value })}
                                    />
                                    <datalist id="stock-options-meal">
                                        {existingStockNames.map((name, i) => <option key={i} value={name} />)}
                                    </datalist>

                                    <input
                                        placeholder="Qty"
                                        className="input-field flex-1 min-w-0"
                                        value={ingredientInput.qty}
                                        onChange={e => setIngredientInput({ ...ingredientInput, qty: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddIngredient}
                                        className="bg-stone-700 hover:bg-stone-600 text-white p-3 rounded-xl transition-all"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white/5 p-4 rounded-xl space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
                                    <Activity size={16} /> Nutrition (Optional)
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => handleEstimate('nutrition')}
                                    className="text-xs flex items-center gap-1 text-accent hover:text-orange-400 bg-stone-900 px-2 py-1 rounded-lg border border-orange-500/20 transition-all"
                                >
                                    <Sparkles size={12} /> Auto-Calculate
                                </button>
                            </div>
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

                        {/* Queue Display: Render as Cards */}
                        <div className="space-y-4 mb-6">
                            {mealQueue.map((m, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-stone-800 border border-orange-500/30 shadow-lg relative animate-fade-in group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-white font-bold text-lg">{m.name}</h4>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 bg-stone-900 px-2 py-1 rounded-md">{m.meal_type}</span>
                                                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 bg-stone-900 px-2 py-1 rounded-md">{m.meal_source}</span>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm">
                                            {i + 1}
                                        </div>
                                    </div>

                                    {/* Macros Mini-Summary */}
                                    {(m.calories || m.protein_g) && (
                                        <div className="flex gap-4 text-xs text-stone-400 mt-3 pt-3 border-t border-white/5">
                                            {m.calories && <span className="flex items-center gap-1"><Flame size={10} /> {m.calories} kcal</span>}
                                            {m.protein_g && <span className="flex items-center gap-1"><Utensils size={10} /> {m.protein_g}g pro</span>}
                                            {m.carbs_g && <span className="flex items-center gap-1"><Wheat size={10} /> {m.carbs_g}g carb</span>}
                                            {m.fat_g && <span className="flex items-center gap-1"><Droplet size={10} /> {m.fat_g}g fat</span>}
                                        </div>
                                    )}

                                    {/* Ingredients Mini-List */}
                                    {m.ingredients_used && m.ingredients_used.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-2">Ingredients</p>
                                            <div className="flex flex-wrap gap-2">
                                                {m.ingredients_used.map((ing, idx) => (
                                                    <span key={idx} className="text-xs bg-stone-900 text-stone-300 px-2 py-1 rounded border border-white/5">
                                                        {ing.item} <span className="text-stone-500">({ing.qty})</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete Button (Visual Only for now, logic needed) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newQueue = [...mealQueue];
                                            newQueue.splice(i, 1);
                                            setMealQueue(newQueue);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

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
