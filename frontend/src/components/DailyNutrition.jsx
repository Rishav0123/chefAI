import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { UserContext } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { Activity, Flame, Wheat, Droplet, Utensils } from 'lucide-react';

const DailyNutrition = () => {
    const { user, stockRefreshTrigger } = useContext(UserContext);
    const [stats, setStats] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [goals, setGoals] = useState({
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 70
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }

        const onFocus = () => {
            if (user?.id) fetchData();
        };

        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user?.id, stockRefreshTrigger]);

    const fetchData = async () => {
        await Promise.all([calculateDailyStats(), fetchUserGoals()]);
        setLoading(false);
    };

    const fetchUserGoals = async () => {
        try {
            const res = await api.get(`/users/${user.id}`);
            if (res.data) {
                setGoals({
                    calories: res.data.daily_calories || 2000,
                    protein: res.data.daily_protein || 150,
                    carbs: res.data.daily_carbs || 250,
                    fat: res.data.daily_fat || 70
                });
            }
        } catch (error) {
            console.error("Error fetching goals:", error);
        }
    };

    const calculateDailyStats = async () => {
        try {
            const response = await api.get(`/meals/${user.id}`);
            const meals = response.data;

            const today = new Date().toDateString(); // "Mon Jan 01 2024"

            const dailyMeals = meals.filter(meal => {
                const mealDate = new Date(meal.created_at).toDateString();
                return mealDate === today;
            });

            const totals = dailyMeals.reduce((acc, meal) => ({
                calories: acc.calories + (meal.calories || 0),
                protein: acc.protein + (meal.protein_g || 0),
                carbs: acc.carbs + (meal.carbs_g || 0),
                fat: acc.fat + (meal.fat_g || 0),
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

            setStats(totals);
        } catch (error) {
            console.error("Error calculating nutrition:", error);
        }
    };

    const ProgressBar = ({ label, current, max, icon: Icon, color }) => {
        const percentage = Math.min((current / max) * 100, 100);
        return (
            <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-stone-300 flex items-center gap-2">
                        <Icon size={14} className={color} /> {label}
                    </span>
                    <span className="text-xs text-stone-500 font-bold">
                        {Math.round(current)} / {max}
                    </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 bg-current ${color}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="glass-panel p-6 animate-pulse h-[300px]">
            <div className="h-6 bg-white/10 w-1/2 mb-6 rounded"></div>
            <div className="space-y-4">
                <div className="h-12 bg-white/5 rounded"></div>
                <div className="h-12 bg-white/5 rounded"></div>
                <div className="h-12 bg-white/5 rounded"></div>
            </div>
        </div>
    );

    return (
        <Link to="/body-goals" className="glass-panel p-4 md:p-6 relative overflow-hidden block hover:border-accent/50 transition-colors group">
            {/* Decorative Background Blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none group-hover:bg-green-500/10 transition-colors"></div>

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <Activity size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Daily Nutrition</h3>
                    <p className="text-xs text-stone-500">Today's Intake</p>
                </div>
            </div>

            {/* Calories (Big Display) */}
            <div className="mb-6 md:mb-8 text-center pt-2">
                <div className="text-3xl md:text-4xl font-black text-white mb-1 flex justify-center items-baseline gap-1">
                    {Math.round(stats.calories)} <span className="text-sm text-stone-500 font-medium">kcal</span>
                </div>
                <div className="text-xs font-bold text-green-500 uppercase tracking-widest bg-green-500/10 py-1 px-3 rounded-full inline-block">
                    {Math.round((stats.calories / goals.calories) * 100)}% of Goal
                </div>
            </div>

            {/* Macros */}
            <div>
                <ProgressBar
                    label="Protein"
                    current={stats.protein}
                    max={goals.protein}
                    icon={Utensils}
                    color="text-blue-500"
                />
                <ProgressBar
                    label="Carbs"
                    current={stats.carbs}
                    max={goals.carbs}
                    icon={Wheat}
                    color="text-yellow-500"
                />
                <ProgressBar
                    label="Fat"
                    current={stats.fat}
                    max={goals.fat}
                    icon={Droplet}
                    color="text-red-500"
                />
            </div>
        </Link>
    );
};

export default DailyNutrition;
