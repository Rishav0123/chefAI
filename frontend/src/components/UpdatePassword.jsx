import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpdatePassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (error) {
            console.error(error);
            setErrorMsg(error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
                <div className="glass-panel p-8 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Password Updated!</h2>
                    <p className="text-stone-400 mb-6">Your password has been changed successfully. Redirecting you to the dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
            <div className="glass-panel p-8 max-w-sm w-full">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-accent">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Set New Password</h1>
                    <p className="text-stone-400 text-sm mt-2">Enter your new password below to update your account.</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                        <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">New Password</label>
                        <input
                            type="password"
                            required
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Retype password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full justify-center py-3 mt-4"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;
