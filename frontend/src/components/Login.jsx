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
                    redirectTo: `https://${window.location.hostname === 'localhost' ? 'localhost:5173' : window.location.hostname}/`
                }
            });
            if (error) throw error;
        } catch (error) {
            setErrorMsg(error.message);
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto' }}>
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '2rem' }}>Kitchen Buddy 🍳</h1>
                <h3 style={{ marginBottom: '1.5rem' }}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h3>

                {!isSignUp && (
                    <div style={{ background: 'rgba(255, 255, 0, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        ⚠️ If you just signed up, please <b>check your email</b> to confirm your account before logging in.
                    </div>
                )}

                {errorMsg && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', color: '#fca5a5', border: '1px solid #ef4444' }}>
                        {errorMsg}
                        {needsConfirmation && (
                            <div style={{ marginTop: '8px' }}>
                                <button onClick={handleResend} style={{ background: 'var(--accent)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    Resend Confirmation Email
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'white',
                        color: '#333',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" style={{ width: '20px', height: '20px' }} />
                    Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <div style={{ h: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                    <span>OR</span>
                    <div style={{ h: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="email"
                            className="input-field"
                            placeholder="Email"
                            style={{ paddingLeft: '40px' }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Password"
                            style={{ paddingLeft: '40px' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {isSignUp ? <><UserPlus size={18} /> Sign Up</> : <><LogIn size={18} /> Sign In</>}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginLeft: '5px', fontWeight: 'bold' }}>
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
