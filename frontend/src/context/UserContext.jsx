import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Create Context
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const [stockRefreshTrigger, setStockRefreshTrigger] = useState(0);

    const triggerStockRefresh = () => {
        setStockRefreshTrigger(prev => prev + 1);
    };

    return (
        <UserContext.Provider value={{ user, session, logout, loading, stockRefreshTrigger, triggerStockRefresh }}>
            {!loading && children}
        </UserContext.Provider>
    );
};
