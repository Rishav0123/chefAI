import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import api from '../api'; // Import our backend API wrapper

// Create Context
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            clearTimeout(timeout);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch(err => {
            console.error("Auth check failed:", err);
            clearTimeout(timeout);
            setLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const [stockRefreshTrigger, setStockRefreshTrigger] = useState(0);

    const triggerStockRefresh = () => {
        setStockRefreshTrigger(prev => prev + 1);
    };

    // --- Kitchen / Workspace Logic ---
    const [kitchens, setKitchens] = useState([]);
    const [activeKitchen, setActiveKitchen] = useState(null);

    // Fetch Kitchens when user loads
    useEffect(() => {
        if (!user) {
            setKitchens([]);
            setActiveKitchen(null);
            return;
        }

        fetchKitchens();
    }, [user]);

    const fetchKitchens = async () => {
        try {
            const res = await api.get(`/kitchens/user/${user.id}`);
            const kitchenList = res.data;
            setKitchens(kitchenList);

            if (kitchenList.length > 0) {
                // Try retrieving last used kitchen from local storage
                const lastUsedId = localStorage.getItem(`activeKitchen_${user.id}`);
                const foundLast = kitchenList.find(k => k.id === lastUsedId);

                if (foundLast) {
                    setActiveKitchen(foundLast);
                } else {
                    // Default to first one
                    setActiveKitchen(kitchenList[0]);
                }
            } else {
                setActiveKitchen(null);
            }
        } catch (error) {
            console.error("Failed to fetch kitchens:", error);
        }
    };

    const switchKitchen = (kitchenId) => {
        const target = kitchens.find(k => k.id === kitchenId);
        if (target) {
            setActiveKitchen(target);
            localStorage.setItem(`activeKitchen_${user.id}`, kitchenId);
            // Also trigger stock refresh so UI updates
            triggerStockRefresh();
        }
    };

    return (
        <UserContext.Provider value={{
            user,
            session,
            logout,
            loading,
            stockRefreshTrigger,
            triggerStockRefresh,
            kitchens,
            activeKitchen,
            switchKitchen,
            refreshKitchens: fetchKitchens
        }}>
            {loading ? (
                <div className="flex h-screen items-center justify-center bg-stone-950 text-stone-500">
                    Initializing Chef AI...
                </div>
            ) : children}
        </UserContext.Provider>
    );
};
