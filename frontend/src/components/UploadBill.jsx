import React, { useState, useContext } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, AlertCircle, Camera, Utensils, Flame, Activity, Wheat, Droplet } from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';
import { UserContext } from '../context/UserContext';

const UploadBill = ({ mode = 'bill' }) => {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error' | 'review'
    const [message, setMessage] = useState('');

    // State for Stock/Bill Mode
    const [detectedItems, setDetectedItems] = useState([]);

    // State for Meal Mode
    const [mealData, setMealData] = useState({
        name: '',
        ingredients: [],
        nutrition: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
        meal_type: 'other'
    });
    const [mealSource, setMealSource] = useState('home'); // 'home' | 'outside'

    const isSingleItem = mode === 'single';
    const isMealMode = mode === 'meal';

    let title = "Upload Bill or Screenshot";
    let description = "Take a photo of your grocery receipt or a screenshot of your online cart. AI will automatically extract items.";
    let Icon = UploadCloud;

    if (isSingleItem) {
        title = "Scan Single Item";
        description = "Take a clear photo of a single ingredient. AI will identify it and add it to your stock.";
        Icon = Camera;
    } else if (isMealMode) {
        title = "Scan Cooked Meal";
        description = "Take a photo of your finished dish. AI will estimate nutrition and log it to your history.";
        Icon = Utensils;
    }

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus(null);
        setMessage('');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please select a file first");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const uploadType = isMealMode ? "meal" : "stock";

        setLoading(true);
        setStatus(null);
        setMessage("Uploading...");

        try {
            // 1. Initiate Upload (Async)
            const res = await api.post(`/upload/?user_id=${user.id}&upload_type=${uploadType}`, formData);
            const { job_id } = res.data;

            setMessage("Analyzing image... (You can minimize this tab)");

            // 2. Poll for Status
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await api.get(`/upload/status/${job_id}`);
                    const { status, data, error } = statusRes.data;

                    if (status === 'completed') {
                        clearInterval(pollInterval);

                        if (isMealMode) {
                            // Expecting structured meal data
                            setMealData({
                                name: data.name || "Unknown Meal",
                                ingredients: data.ingredients || [],
                                nutrition: data.nutrition || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
                                meal_type: data.meal_type || 'other'
                            });
                        } else {
                            // Expecting list of items for stock
                            setDetectedItems(data || []);
                        }

                        setStatus('review');
                        setMessage("Please review the detected details.");
                        setLoading(false);
                    } else if (status === 'error') {
                        clearInterval(pollInterval);
                        throw new Error(error || "AI Processing Failed");
                    } else {
                        // Still processing...
                        console.log(`Job ${job_id}: ${status}`);
                    }
                } catch (err) {
                    clearInterval(pollInterval);
                    console.error("Polling Error:", err);
                    setStatus('error');
                    setMessage("Failed to check status. Network issue?");
                    setLoading(false);
                }
            }, 2000); // Check every 2 seconds

        } catch (error) {
            console.error(error);
            setStatus('error');
            let errorMessage = "Failed to initiate upload.";
            if (error.response?.data?.detail) {
                errorMessage = typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : JSON.stringify(error.response.data.detail);
            } else if (error.message) {
                errorMessage = error.message;
            }
            setMessage(errorMessage);
            setLoading(false);
        }
    };

    // --- Stock Mode Handlers ---
    const handleItemChange = (index, field, value) => {
        const newItems = [...detectedItems];
        newItems[index][field] = value;
        setDetectedItems(newItems);
    };

    const handleDeleteItem = (index) => {
        const newItems = detectedItems.filter((_, i) => i !== index);
        setDetectedItems(newItems);
    };

    const handleConfirmStock = async () => {
        setLoading(true);
        try {
            const itemsPayload = detectedItems.map(item => ({
                user_id: user.id,
                item_name: item.item_name,
                quantity: item.quantity,
                category: item.category,
                source: isSingleItem ? "scan" : "bill"
            }));

            await api.post('/stock/batch', itemsPayload);
            setStatus('success');
            setMessage(`Successfully added ${detectedItems.length} items to your stock!`);
            setTimeout(() => navigate('/'), 2000);
        } catch (error) {
            console.error('Batch add failed:', error);
            setStatus('error');
            setMessage("Failed to save items. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- Meal Mode Handlers ---
    const handleMealChange = (field, value) => {
        setMealData(prev => ({ ...prev, [field]: value }));
    };

    const handleNutritionChange = (field, value) => {
        setMealData(prev => ({
            ...prev,
            nutrition: { ...prev.nutrition, [field]: parseInt(value) || 0 }
        }));
    };

    const handleConfirmMeal = async () => {
        setLoading(true);
        try {
            const payload = {
                user_id: user.id,
                name: mealData.name,
                ingredients_used: mealData.ingredients,
                confidence: 90,
                meal_type: mealData.meal_type,
                meal_source: mealSource,
                calories: mealData.nutrition.calories,
                protein_g: mealData.nutrition.protein_g,
                carbs_g: mealData.nutrition.carbs_g,
                fat_g: mealData.nutrition.fat_g
            };

            await api.post('/meals/', payload);
            setStatus('success');
            setMessage(`Bon Appétit! "${mealData.name}" has been logged.`);
            setTimeout(() => navigate('/'), 2000); // Or navigate to meal history?
        } catch (error) {
            console.error('Meal log failed:', error);
            setStatus('error');
            setMessage("Failed to log meal. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    if (status === 'review') {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
                <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>{isMealMode ? "Review Meal Details" : "Review Items"}</h2>

                {isMealMode ? (
                    // --- Meal Review UI ---
                    <div className="space-y-6">
                        {/* Meal Name & Type */}
                        <div className="glass-panel p-6 space-y-4">
                            <div>
                                <label className="text-sm text-stone-400 mb-1 block">Dish Name</label>
                                <input
                                    className="input-field text-lg font-bold"
                                    value={mealData.name}
                                    onChange={e => handleMealChange('name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-stone-400 mb-1 block">Meal Type</label>
                                <select
                                    className="input-field"
                                    value={mealData.meal_type}
                                    onChange={e => handleMealChange('meal_type', e.target.value)}
                                >
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Meal Source Selector */}
                            <div>
                                <label className="text-sm text-stone-400 mb-1 block">Source</label>
                                <select
                                    className="input-field"
                                    value={mealSource}
                                    onChange={e => setMealSource(e.target.value)}
                                >
                                    <option value="home">Home Cooked (Deduct Stock)</option>
                                    <option value="outside">Ordered / Outside (No Deduction)</option>
                                </select>
                            </div>
                        </div>

                        {/* Nutrition Grid */}
                        <div className="glass-panel p-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
                                <Activity size={16} /> Nutrition Estimates
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Flame size={12} /> Calories</label>
                                    <input type="number" className="input-field" value={mealData.nutrition.calories} onChange={e => handleNutritionChange('calories', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Utensils size={12} /> Protein (g)</label>
                                    <input type="number" className="input-field" value={mealData.nutrition.protein_g} onChange={e => handleNutritionChange('protein_g', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Wheat size={12} /> Carbs (g)</label>
                                    <input type="number" className="input-field" value={mealData.nutrition.carbs_g} onChange={e => handleNutritionChange('carbs_g', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-400 mb-1 flex items-center gap-1"><Droplet size={12} /> Fat (g)</label>
                                    <input type="number" className="input-field" value={mealData.nutrition.fat_g} onChange={e => handleNutritionChange('fat_g', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Ingredients (Read Only for now, roughly) */}
                        <div className="glass-panel p-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-4">Detected Ingredients</h3>
                            <div className="space-y-2">
                                {mealData.ingredients.map((ing, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded">
                                        <span className="text-white">{ing.item}</span>
                                        <span className="text-stone-400">{ing.qty}</span>
                                    </div>
                                ))}
                                {mealData.ingredients.length === 0 && <p className="text-stone-500 text-sm">No ingredients extracted.</p>}
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- Stock Review UI ---
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {detectedItems.map((item, idx) => {
                            // Helper to parse quantity string into num and unit if not already parsed
                            // We store split values in the item state for editing
                            if (item.qty_num === undefined) {
                                let qStr = (item.quantity || "1").toString().toLowerCase();
                                let num = parseFloat(qStr) || 0;
                                let unit = 'pcs';

                                if (qStr.includes('kg')) { num *= 1000; unit = 'g'; }
                                else if (qStr.includes('mg')) { num /= 1000; unit = 'g'; } // minimal support
                                else if (qStr.includes('g')) { unit = 'g'; }
                                else if (qStr.includes('l') && !qStr.includes('ml')) { num *= 1000; unit = 'ml'; }
                                else if (qStr.includes('ml')) { unit = 'ml'; }

                                // Update the item in state immediately to avoid re-parsing
                                // Note: This is a bit side-effecty inside render, but we need to init the state. 
                                // Better to do this when setting detectedItems, but for now we handle it via safe defaults in render
                                // or better, just render separate inputs and update the 'quantity' string on change.
                                item.qty_num = num;
                                item.unit = unit;
                            }

                            const handleQtyChange = (val) => {
                                const newItems = [...detectedItems];
                                newItems[idx].qty_num = val;
                                newItems[idx].quantity = `${val} ${newItems[idx].unit}`; // Update the main field
                                setDetectedItems(newItems);
                            };

                            const handleUnitChange = (val) => {
                                const newItems = [...detectedItems];
                                newItems[idx].unit = val;
                                newItems[idx].quantity = `${newItems[idx].qty_num} ${val}`;
                                setDetectedItems(newItems);
                            };

                            return (
                                <div key={idx} className="glass-panel" style={{ padding: '15px', position: 'relative' }}>
                                    <button
                                        onClick={() => handleDeleteItem(idx)}
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        ✕
                                    </button>

                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Item Name</label>
                                            <input
                                                className="input-field"
                                                value={item.item_name || ''}
                                                onChange={e => handleItemChange(idx, 'item_name', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantity</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <input
                                                        type="number"
                                                        className="input-field"
                                                        value={item.qty_num}
                                                        onChange={e => handleQtyChange(e.target.value)}
                                                    />
                                                    <select
                                                        className="input-field"
                                                        style={{ width: '80px', padding: '0 5px' }}
                                                        value={item.unit}
                                                        onChange={e => handleUnitChange(e.target.value)}
                                                    >
                                                        <option value="g">g</option>
                                                        <option value="ml">ml</option>
                                                        <option value="pcs">pcs</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
                                                <select
                                                    className="input-field"
                                                    value={item.category || 'other'}
                                                    onChange={e => handleItemChange(idx, 'category', e.target.value)}
                                                >
                                                    <option value="vegetable">Vegetable</option>
                                                    <option value="fruit">Fruit</option>
                                                    <option value="dairy">Dairy</option>
                                                    <option value="meat">Meat</option>
                                                    <option value="grain">Grain</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                )}

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setStatus(null)}
                        className="btn-primary"
                        style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={isMealMode ? handleConfirmMeal : handleConfirmStock}
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (isMealMode ? 'Log Meal' : 'Confirm & Add All')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
            {loading && (
                <LoadingOverlay
                    message={status === 'review' ? "Saving..." : (isMealMode ? "Analyzing Nutrients..." : "AI Chef is reading...")}
                    subMessage={status === 'review' ? "Almost done!" : "Identifying items and quantities."}
                />
            )}
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '1.5rem', display: 'inline-block', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                    <Icon size={48} color="var(--accent)" />
                </div>
                <h2 style={{ marginBottom: '1rem' }}>{title}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    {description}
                </p>

                <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', width: '100%' }}>

                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent)', cursor: 'pointer', flex: 1, textAlign: 'center' }}>
                            {file ? "Change File" : "Choose Image"}
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            id="camera-upload"
                        />
                        <label htmlFor="camera-upload" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent)', cursor: 'pointer', flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Camera size={20} />
                            Take Photo
                        </label>
                    </div>

                    {file && (
                        <div style={{ color: 'var(--text-secondary)' }}>Selected: {file.name}</div>
                    )}

                    {file && (
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Analyzing with AI...' : 'Upload & Process'}
                        </button>
                    )}
                </form>

                {status === 'success' && (
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle size={20} color="#10b981" />
                        <span style={{ textAlign: 'left' }}>{message}</span>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={20} color="#ef4444" />
                        <span>{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadBill;
