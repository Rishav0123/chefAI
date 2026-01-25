import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const [errorMsg, setErrorMsg] = useState('');
    const [needsConfirmation, setNeedsConfirmation] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setNeedsConfirmation(false);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Sign up successful! Please check your email to confirm your account.');
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error) {
            setErrorMsg(error.message);
            if (error.message.includes('Email not confirmed')) {
                setNeedsConfirmation(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });
            if (error) throw error;
            alert(`Confirmation email resent to ${email}`);
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}`
                }
            });
            if (error) throw error;
        } catch (error) {
            setErrorMsg(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto mt-12 md:mt-20 px-4">
            <div className="glass-panel p-6 md:p-10 text-center">
                <h1 className="text-3xl font-black mb-2 text-white">Kitchen Buddy 🍳</h1>
                <p className="text-stone-400 mb-8">{isSignUp ? 'Create your account' : 'Welcome back, Chef'}</p>

                {!isSignUp && (
                    <div className="bg-yellow-500/10 p-3 rounded-xl mb-6 text-sm text-yellow-200 border border-yellow-500/20 text-left flex gap-3 items-start">
                        <span className="text-lg">⚠️</span>
                        <span>If you just signed up, please <b>check your email</b> to confirm your account before logging in.</span>
                    </div>
                )}

                {errorMsg && (
                    <div className="bg-red-500/20 p-4 rounded-xl mb-6 text-sm text-red-300 border border-red-500/50 text-left">
                        <p className="mb-2 font-bold flex items-center gap-2"><Lock size={16} /> Error</p>
                        {errorMsg}
                        {needsConfirmation && (
                            <div className="mt-2 text-center">
                                <button onClick={handleResend} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors">
                                    Resend Confirmation Email
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full p-3 rounded-xl bg-white text-stone-900 font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform mb-6 shadow-lg shadow-white/5 active:scale-95"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <div className="flex items-center gap-4 mb-6 text-stone-500 text-xs font-bold uppercase tracking-widest">
                    <div className="h-px flex-1 bg-white/10"></div>
                    <span>Or continue with email</span>
                    <div className="h-px flex-1 bg-white/10"></div>
                </div>

                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                        <input
                            type="email"
                            className="input-field pl-12"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                        <input
                            type="password"
                            className="input-field pl-12"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full justify-center py-4 mt-2" disabled={loading}>
                        {isSignUp ? <><UserPlus size={20} /> Create Account</> : <><LogIn size={20} /> Sign In</>}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-stone-400 text-sm mb-3">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    </p>
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="w-full py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                    >
                        {isSignUp ? 'Switch to Sign In' : 'Create New Account'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
