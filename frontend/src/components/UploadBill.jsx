import React, { useState, useContext } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, AlertCircle, Camera, Utensils, Flame, Activity, Wheat, Droplet } from 'lucide-react';
import LoadingOverlay from './LoadingOverlay';
import { UserContext } from '../context/UserContext';

import { compressImage } from '../utils/compressImage';

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

        setLoading(true);
        setStatus(null);
        setMessage("Compressing image...");

        try {
            // 0. Compress Image (Client-side)
            const compressedFile = await compressImage(file);

            const formData = new FormData();
            formData.append("file", compressedFile);

            const uploadType = isMealMode ? "meal" : "stock";

            setMessage("Uploading... 0%");

            // 1. Initiate Upload (Async)
            const res = await api.post(`/upload/?user_id=${user.id}&upload_type=${uploadType}`, formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setMessage(`Uploading... ${percentCompleted}%`);
                }
            });
            const { job_id } = res.data;

            setMessage("Analyzing image... (You can minimize this tab)");

            // 2. Poll for Status
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await api.get(`/upload/status/${job_id}`);
                    const { status, data, error } = statusRes.data;

                    if (status === 'completed') {
                        clearInterval(pollInterval);
                        setLoading(false);

                        if (isMealMode) {
                            // Redirect to Meal Add Form (Draft Mode)
                            const draft = {
                                name: data.name || "Unknown Meal",
                                meal_type: data.meal_type || 'other',
                                deduct_stock: mealSource === 'home', // Default assumptions
                                nutrition: {
                                    calories: data.nutrition?.calories || 0,
                                    protein: data.nutrition?.protein_g || 0,
                                    carbs: data.nutrition?.carbs_g || 0,
                                    fat: data.nutrition?.fat_g || 0
                                },
                                ingredients: data.ingredients || []
                            };
                            // Using same format as Chatbot drafts
                            navigate('/add?mode=meal', { state: { drafts: [draft] } });
                        } else {
                            // Redirect to Stock Add Form (Draft Mode)
                            // Expecting { items: [...] } or just [...]
                            const items = Array.isArray(data) ? data : (data.items || []);

                            const drafts = items.map(item => ({
                                item_name: item.item_name,
                                quantity: item.quantity,
                                category: item.category
                            }));

                            navigate('/add?mode=stock', { state: { stockDrafts: drafts } });
                        }
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
                    // Show specific error from backend if available
                    const specificError = err.response?.data?.detail || err.message;
                    setMessage(specificError || "Failed to check status. Network issue?");
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



    // --- Render Scan UI ---


    return (
        <div className="max-w-[600px] mx-auto relative overflow-hidden pb-24">
            {loading && (
                <LoadingOverlay
                    message={status === 'review' ? "Saving..." : (isMealMode ? "Analyzing Nutrients..." : "AI Chef is reading...")}
                    subMessage={status === 'review' ? "Almost done!" : "Identifying items and quantities."}
                />
            )}
            <div className="glass-panel p-6 md:p-8 text-center">
                <div className="mb-6 inline-block p-4 bg-white/5 rounded-full">
                    <Icon size={48} className="text-accent" />
                </div>
                <h2 className="mb-4 text-xl md:text-2xl font-bold text-white">{title}</h2>
                <p className="text-stone-400 mb-8 max-w-sm mx-auto text-sm md:text-base">
                    {description}
                </p>

                <form onSubmit={handleUpload} className="flex flex-col gap-6 items-center w-full">

                    <div className="flex gap-4 w-full">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="flex-1 btn-primary bg-transparent border border-accent cursor-pointer text-center py-3 md:py-4 transition-all hover:bg-accent/10">
                            {file ? "Change File" : "Choose Image"}
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                            id="camera-upload"
                        />
                        <label htmlFor="camera-upload" className="flex-1 btn-primary bg-transparent border border-accent cursor-pointer text-center flex items-center justify-center gap-2 py-3 md:py-4 transition-all hover:bg-accent/10">
                            <Camera size={20} />
                            Take Photo
                        </label>
                    </div>

                    {file && (
                        <div className="text-stone-400 font-medium">Selected: {file.name}</div>
                    )}

                    {file && (
                        <button type="submit" className="btn-primary w-full py-4 text-base md:text-lg shadow-lg shadow-orange-500/20" disabled={loading}>
                            {loading ? 'Analyzing with AI...' : 'Upload & Process'}
                        </button>
                    )}
                </form>

                {status === 'success' && (
                    <div className="mt-5 p-4 bg-emerald-500/20 rounded-xl border border-emerald-500 flex items-center gap-3 animate-fade-in">
                        <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                        <span className="text-left text-white text-sm">{message}</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-5 p-4 bg-red-500/20 rounded-xl border border-red-500 flex items-center gap-3 animate-fade-in">
                        <AlertCircle size={20} className="text-red-500 shrink-0" />
                        <span className="text-left text-white text-sm">{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadBill;
