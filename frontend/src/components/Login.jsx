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
                    className="w-full p-3 rounded-xl bg-white text-stone-900 font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform mb-6 shadow-lg shadow-white/5"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" className="w-5 h-5" />
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

                <p className="mt-8 text-stone-400 text-sm">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="ml-2 text-accent font-bold hover:underline"
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
