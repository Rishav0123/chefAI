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
