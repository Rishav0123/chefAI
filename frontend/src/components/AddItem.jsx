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
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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

    // --- Edit Mode State ---
    const [editingMealId, setEditingMealId] = useState(null);
    const [editingStockId, setEditingStockId] = useState(null);
    const [pendingLeftovers, setPendingLeftovers] = useState(null);

    // Check for Draft Data or Edit Mode
    useEffect(() => {
        if (location.state?.editMeal) {
            const m = location.state.editMeal;
            setMealFormData({
                name: m.name,
                meal_type: m.meal_type || 'other',
                meal_source: m.source || 'home', // 'source' is the field name in DB/API
                calories: m.calories || '',
                protein_g: m.protein_g || '',
                carbs_g: m.carbs_g || '',
                fat_g: m.fat_g || '',
                ingredients_used: m.ingredients_used || []
            });
            setEditingMealId(m.id);
            setActiveTab('meal');
        } else if (location.state?.drafts) {
            // ... existing draft logic ...
            const drafts = location.state.drafts;
            console.log("Drafts loaded:", drafts);

            // Queue all except last
            if (drafts.length > 1) {
                const queueItems = drafts.slice(0, -1).map(d => ({
                    name: d.name || '',
                    meal_type: d.meal_type || 'other',
                    meal_source: (d.deduct_stock || (d.ingredients && d.ingredients.length > 0)) ? 'home' : 'outside',
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
                meal_source: (lastDraft.deduct_stock || (lastDraft.ingredients && lastDraft.ingredients.length > 0)) ? 'home' : 'outside',
                calories: lastDraft.nutrition?.calories || '',
                protein_g: lastDraft.nutrition?.protein || '',
                carbs_g: lastDraft.nutrition?.carbs || '',
                fat_g: lastDraft.nutrition?.fat || '',
                ingredients_used: lastDraft.ingredients || []
            });
            setActiveTab('meal');
        } else if (location.state?.draft) {
            // ... existing legacy draft logic ...
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
            setActiveTab('meal');
        } else if (location.state?.editStock) {
            const s = location.state.editStock;

            // Parse "500 g" or "500g"
            let num = '';
            let unit = 'pcs';
            if (s.quantity) {
                const match = s.quantity.match(/^([\d\.]+)\s*([a-zA-Z]*)$/);
                if (match) {
                    num = match[1];
                    unit = match[2].toLowerCase() || 'pcs';
                } else {
                    num = parseFloat(s.quantity) || ''; // Fallback
                }
            }

            // Normalize unit
            if (unit === 'kg') { num = (parseFloat(num) || 0) * 1000; unit = 'g'; }
            else if (unit === 'l') { num = (parseFloat(num) || 0) * 1000; unit = 'ml'; }

            setStockFormData({
                item_name: s.item_name,
                quantity_num: num,
                unit: ['g', 'ml', 'pcs'].includes(unit) ? unit : 'pcs', // Default to pcs if unknown
                category: s.category || '',
                expiry_date: s.expiry_date || ''
            });
            setEditingStockId(s.stock_id);
            setActiveTab('stock');
        } else if (location.state?.stockDrafts) {
            // ... existing stock draft logic ...
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

        // Manual Validation
        const hasCurrentItem = !!stockFormData.item_name;

        if (editingStockId) {
            if (!hasCurrentItem) {
                showToast("Item name is required", 'error');
                return;
            }
        } else {
            if (!hasCurrentItem && stockQueue.length === 0) {
                showToast("Please add an item or add to queue", 'error');
                return;
            }
            if (hasCurrentItem && !stockFormData.quantity_num) {
                showToast("Please enter a quantity", 'error');
                return;
            }
        }

        setLoading(true);
        try {
            if (editingStockId) {
                // UPDATE Existing Stock
                const quantity = `${stockFormData.quantity_num} ${stockFormData.unit}`;
                await api.put(`/stock/${editingStockId}`, {
                    user_id: user.id,
                    item_name: stockFormData.item_name,
                    quantity: quantity,
                    category: stockFormData.category,
                    expiry_date: stockFormData.expiry_date || undefined
                });
                showToast("Stock updated successfully!", 'success');
            } else {
                // CREATE New Stock
                const itemsToSave = [...stockQueue];
                if (hasCurrentItem) itemsToSave.push(stockFormData);

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
            }

            navigate('/');
        } catch (error) {
            console.error("Error adding/updating items:", error);
            showToast(`Failed: ${error.message}`, 'error');
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
            showToast("Please enter a Meal Name first!", 'error');
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
            showToast("Could not estimate data. Please try again.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMealSubmit = async (e) => {
        e.preventDefault();

        // Manual Validation
        const hasCurrentMeal = !!mealFormData.name;

        if (editingMealId) {
            if (!hasCurrentMeal) {
                showToast("Meal name is required", 'error');
                return;
            }
        } else {
            if (!hasCurrentMeal && mealQueue.length === 0) {
                showToast("Please enter a meal details or add to queue", 'error');
                return;
            }
        }

        setLoading(true);
        try {
            if (editingMealId) {
                // UPDATE Existing Meal
                await api.put(`/meals/${editingMealId}`, {
                    user_id: user.id,
                    name: mealFormData.name,
                    meal_type: mealFormData.meal_type,
                    meal_source: mealFormData.meal_source,
                    ingredients_used: mealFormData.ingredients_used || [],
                    confidence: 100,
                    calories: parseInt(mealFormData.calories) || 0,
                    protein_g: parseInt(mealFormData.protein_g) || 0,
                    carbs_g: parseInt(mealFormData.carbs_g) || 0,
                    fat_g: parseInt(mealFormData.fat_g) || 0
                });
                showToast("Meal updated successfully!", 'success');
            } else {
                // CREATE New Meal(s)
                const mealsToSave = [...mealQueue];
                if (hasCurrentMeal) mealsToSave.push(mealFormData);

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
            }

            // --- Check for Leftover Stock Logic ---
            // Only check if we are saving the current form meal specifically, or if queue has items?
            // The prompt logic handles "mealFormData" which is the *current* form. 
            // The logic implies we only check leftovers for the *current* meal being entered or perhaps the last one?
            // Existing logic checked `mealFormData`. If we skip submitting `mealFormData` because it's empty, we shouldn't check it.

            if (hasCurrentMeal && mealFormData.meal_source === 'home' && mealFormData.ingredients_used.length > 0) {
                const missingIngredients = mealFormData.ingredients_used.filter(ing => {
                    return !existingStockNames.some(stockName =>
                        stockName.toLowerCase().includes(ing.item.toLowerCase()) ||
                        ing.item.toLowerCase().includes(stockName.toLowerCase())
                    );
                });

                if (missingIngredients.length > 0) {
                    setPendingLeftovers(missingIngredients);
                    setLoading(false);
                    return; // Do NOT navigate yet
                }
            }
            // Note: If saving from queue only, we skip the leftover check for simplicity or we'd need to iterate all.
            // For now, retaining behavior for `mealFormData` only.

            navigate('/');
        } catch (error) {
            console.error("Error saving/updating meal:", error);
            showToast("Failed to save meal. Please try again.", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
            {loading && <LoadingOverlay message="Saving..." />}

            {/* Tabs */}
            <div className="flex gap-2 md:gap-4 mb-4 md:mb-6">
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`flex-1 p-3 md:p-4 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'stock' ? 'bg-accent text-white shadow-lg shadow-orange-500/20' : 'bg-stone-900/50 text-stone-400 hover:bg-stone-800'}`}
                >
                    <Box size={20} />
                    <span className="font-bold text-sm md:text-base">Add Ingredient</span>
                </button>
                <button
                    onClick={() => setActiveTab('meal')}
                    className={`flex-1 p-3 md:p-4 rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === 'meal' ? 'bg-accent text-white shadow-lg shadow-orange-500/20' : 'bg-stone-900/50 text-stone-400 hover:bg-stone-800'}`}
                >
                    <Utensils size={20} />
                    <span className="font-bold text-sm md:text-base">Log Meal</span>
                </button>
            </div>

            <div className="glass-panel p-4 md:p-8">
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
                                        <li
                                            key={i}
                                            className="text-white text-sm flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors group relative"
                                            onClick={() => {
                                                // Swap logic: if form has data, push valid form data to queue
                                                const newQueue = [...stockQueue];

                                                if (stockFormData.item_name) {
                                                    // Push current form to queue
                                                    newQueue.push(stockFormData);
                                                }

                                                // Load back into form
                                                setStockFormData({
                                                    item_name: item.item_name,
                                                    quantity_num: item.quantity_num,
                                                    unit: item.unit,
                                                    category: item.category,
                                                    expiry_date: item.expiry_date
                                                });

                                                // Remove clicked item from queue (it's now in form)
                                                // Note: We need to find the correct index if we pushed to queue above? 
                                                // No, 'i' is the index of 'item' in the *original* 'stockQueue' mapping.
                                                // Since we spread 'stockQueue' into 'newQueue', 'i' corresponds to the same item.
                                                newQueue.splice(i, 1);
                                                setStockQueue(newQueue);
                                            }}
                                            title="Click to edit"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent group-hover:scale-125 transition-transform"></div>
                                            <span className="flex-1">{item.item_name} <span className="text-stone-500">({item.quantity_num} {item.unit})</span></span>
                                            <span className="text-xs text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {!editingStockId && (
                                <button
                                    onClick={handleAddAnotherStock}
                                    type="button"
                                    className="w-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 py-3 rounded-xl font-bold transition-all border border-white/10 uppercase tracking-wider text-sm"
                                >
                                    + Add Another Item
                                </button>
                            )}
                            <button type="submit" className="w-full btn-primary flex justify-center items-center gap-2 py-4">
                                <Save size={18} />
                                {editingStockId ? "Update Stock" : (
                                    stockQueue.length > 0
                                        ? `Save All (${stockQueue.length + (stockFormData.item_name ? 1 : 0)})`
                                        : "Save to Stock"
                                )}
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
                                <div key={i}
                                    className="p-5 rounded-2xl bg-stone-800 border border-orange-500/30 shadow-lg relative animate-fade-in group cursor-pointer hover:bg-stone-700 transition-colors"
                                    onClick={() => {
                                        const newQueue = [...mealQueue];

                                        // 1. Swap Logic: If form has data, push it to queue first
                                        if (mealFormData.name) {
                                            newQueue.push(mealFormData);
                                        }

                                        // 2. Load clicked item into form
                                        setMealFormData({
                                            name: m.name,
                                            meal_type: m.meal_type || 'other',
                                            meal_source: (m.meal_source === 'out' || m.meal_source === 'outside') ? 'outside' : 'home',
                                            ingredients_used: m.ingredients_used || [],
                                            calories: m.calories || '',
                                            protein_g: m.protein_g || '',
                                            carbs_g: m.carbs_g || '',
                                            fat_g: m.fat_g || ''
                                        });

                                        // 3. Remove clicked item from queue
                                        // 'i' is stable because we only appended to the end of newQueue
                                        newQueue.splice(i, 1);
                                        setMealQueue(newQueue);
                                        showToast("Loaded meal for editing", "success");
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-2 pointer-events-none">
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
                                        onClick={(e) => {
                                            e.stopPropagation();
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
                            {!editingMealId && (
                                <button
                                    onClick={handleAddAnotherMeal}
                                    type="button"
                                    className="w-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 py-3 rounded-xl font-bold transition-all border border-white/10 uppercase tracking-wider text-sm"
                                >
                                    + Add Another Meal
                                </button>
                            )}
                            <button type="submit" className="w-full btn-primary flex justify-center items-center gap-2 py-4">
                                <Utensils size={18} />
                                {editingMealId ? "Update Meal" : (
                                    mealQueue.length > 0
                                        ? `Log All (${mealQueue.length + (mealFormData.name ? 1 : 0)})`
                                        : "Log Meal"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold z-[3000] animate-fade-in border border-white/10 whitespace-nowrap
                    ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}
                `}>
                    {toast.type === 'error' ? <X size={20} /> : <Sparkles size={20} />}
                    {toast.message}
                </div>
            )}

            {/* Leftover Prompt Modal */}
            {pendingLeftovers && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 4000
                }}>
                    <div className="glass-panel p-6 w-[90%] max-w-sm text-center border border-accent/20">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent animate-pulse">
                            <Box size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Pantry Check</h3>
                        <p className="text-stone-400 text-sm mb-6">
                            Assuming stock from previously homecooked meal is still left, shall I go forward adding the stock to pantry?
                            <br /><span className="text-xs text-stone-500 mt-2 block">({pendingLeftovers.length} new items detected)</span>
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setPendingLeftovers(null);
                                    navigate('/');
                                }}
                                className="flex-1 py-3 text-stone-400 hover:text-white font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Navigate to Stock Add with 2x Quantity drafts
                                    const stockDrafts = pendingLeftovers.map(ing => {
                                        let qty = parseFloat(ing.qty) || 0;
                                        // Attempt to extract unit
                                        const unitMatch = ing.qty ? ing.qty.match(/[a-zA-Z]+/) : null;
                                        const unit = unitMatch ? unitMatch[0] : '';

                                        // Heuristic: 2x quantity
                                        const newQty = qty * 2;
                                        const quantityStr = unit ? `${newQty}${unit}` : `${newQty}`;

                                        return {
                                            item_name: ing.item,
                                            quantity: quantityStr,
                                            category: 'other' // Default, user can change
                                        };
                                    });

                                    setPendingLeftovers(null);
                                    navigate('/add?mode=stock', { state: { stockDrafts: stockDrafts } });
                                }}
                                className="flex-1 btn-primary justify-center font-bold"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddItem;
