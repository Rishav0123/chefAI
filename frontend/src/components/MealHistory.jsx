import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { UserContext } from '../context/UserContext';
import { Utensils, Clock, Plus, Trash2, Edit2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MealHistory = (props) => {
    const navigate = useNavigate();
    const { user, stockRefreshTrigger } = useContext(UserContext); // Refetch when stock refreshes (implies meal logged)
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) fetchHistory();

        const onFocus = () => {
            if (user?.id) fetchHistory();
        };

        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [user?.id, stockRefreshTrigger]);

    const fetchHistory = async () => {
        try {
            const response = await api.get(`/meals/${user.id}`);
            setMeals(response.data);
        } catch (error) {
            console.error("Error fetching meal history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (mealId) => {
        if (!window.confirm("Are you sure you want to delete this meal log?")) return;
        try {
            await api.delete(`/meals/${mealId}`);
            setMeals(meals.filter(m => m.id !== mealId));
        } catch (error) {
            alert("Failed to delete meal");
            console.error(error);
        }
    };

    if (loading) return <div></div>; // Silent loading
    // Empty State Card
    if (meals.length === 0 && !loading) {
        return (
            <div className="mt-8 animate-fade-in">
                {/* Header (still show header if it's the full page, or just the widget title) */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                        <Utensils size={24} className="text-accent" />
                        {props.limit ? 'Recent Meals' : 'Meal History'}
                    </h2>
                </div>

                <div className="glass-panel p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 bg-stone-900/50 border border-white/5 shadow-2xl">
                    <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mb-2 animate-bounce-slow">
                        <Utensils size={40} className="text-stone-400" />
                    </div>

                    <div className="max-w-md space-y-2">
                        <h3 className="text-xl md:text-2xl font-bold text-white">Your plate is empty!</h3>
                        <p className="text-stone-400 text-sm md:text-base leading-relaxed">
                            Log your first meal to start tracking nutrition and unlocking personalized AI chef recommendations.
                        </p>
                    </div>

                    <div className="flex flex-col w-full max-w-xs gap-3 pt-4">
                        <Link to="/scan/meal" className="btn-primary w-full justify-center py-3 text-base flex items-center gap-2 shadow-orange-500/20 shadow-lg group">
                            <Utensils size={18} className="group-hover:rotate-12 transition-transform" />
                            Scan Meal
                        </Link>
                        <Link to="/add?mode=meal" className="px-6 py-3 rounded-xl border border-white/10 text-stone-300 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all font-bold w-full flex justify-center text-sm md:text-base">
                            Manual Entry
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // logic to show only first N items if limit prop is present
    const displayedMeals = props.limit ? meals.slice(0, props.limit) : meals;

    // --- Stats & Grouping Logic ---
    const stats = !props.limit ? {
        totalMeals: meals.length,
        totalCalories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
        avgProtein: Math.round(meals.reduce((sum, m) => sum + (m.protein_g || 0), 0) / (meals.length || 1))
    } : null;

    const groupedMeals = !props.limit ? meals.reduce((acc, meal) => {
        const dateStr = meal.created_at
            ? new Date(meal.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
            : 'Unknown Date';
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(meal);
        return acc;
    }, {}) : null;

    // Helper: Render Card
    const renderMealCard = (meal) => (
        <div key={meal.id} className="glass-panel p-4 md:p-6 relative group hover:scale-[1.02] transition-transform">
            {/* Edit/Delete Overlay */}
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                {/* Note: Edit isn't fully implemented, linking to same page for now or just visual */}
                <button
                    onClick={() => navigate('/add?mode=meal', { state: { editMeal: meal } })}
                    className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit Meal"
                >
                    <Edit2 size={14} className="md:w-4 md:h-4" />
                </button>
                <button onClick={(e) => { e.preventDefault(); handleDelete(meal.id); }} className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg text-stone-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} className="md:w-4 md:h-4" />
                </button>
            </div>

            <div className="flex justify-between items-start mb-3 md:mb-4">
                <h3 className="text-lg md:text-xl font-bold text-white truncate pr-4">{meal.name}</h3>
                <div className="flex items-center gap-1 text-xs font-medium text-stone-400 bg-white/5 px-2 py-1 rounded-lg">
                    <Clock size={12} />
                    {meal.created_at ? new Date(meal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </div>
            </div>

            {/* Nutrition Badges */}
            {/* Nutrition Badges */}
            <div className="flex gap-2 mb-4">
                {meal.calories && (
                    <span className="text-sm font-bold text-orange-400">🔥 {meal.calories} kcal</span>
                )}
                {meal.protein_g && (
                    <span className="text-sm font-bold text-blue-400">💪 {meal.protein_g}g prot</span>
                )}
            </div>

            {/* Ingredients */}
            {meal.ingredients_used && meal.ingredients_used.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider font-bold">Ingredients</p>
                    <div className="flex flex-wrap gap-2">
                        {meal.ingredients_used.slice(0, 4).map((ing, idx) => (
                            <span key={idx} className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/10">
                                {ing.item}
                            </span>
                        ))}
                        {meal.ingredients_used.length > 4 && (
                            <span className="text-xs text-stone-500 px-1">+{meal.ingredients_used.length - 4} more</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="mt-8">
            {/* Header / Stats (Full Page) */}
            {!props.limit ? (
                <div className="mb-10 animate-fade-in">
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black text-white mb-2">Meal History</h2>
                            <p className="text-sm md:text-base text-stone-400">Track your culinary journey and nutrition.</p>
                        </div>
                        <Link to="/add?mode=meal" className="btn-primary flex items-center gap-2">
                            <Plus size={18} />
                            Add New Meal
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="glass-panel p-4 md:p-6 flex flex-col justify-between border-blue-500/20 bg-blue-500/5">
                            <span className="text-blue-200 text-xs font-bold uppercase">Average Protein</span>
                            <span className="text-3xl md:text-4xl font-black text-blue-500 mt-2">{stats.avgProtein}g</span>
                        </div>
                        <div className="glass-panel p-4 md:p-6 flex flex-col justify-between border-orange-500/20 bg-orange-500/5">
                            <span className="text-orange-200 text-xs font-bold uppercase">Total Calories</span>
                            <span className="text-3xl md:text-4xl font-black text-orange-500 mt-2">{stats.totalCalories}</span>
                        </div>
                        <div className="glass-panel p-4 md:p-6 flex flex-col justify-between">
                            <span className="text-stone-400 text-xs font-bold uppercase">Meals Logged</span>
                            <span className="text-3xl md:text-4xl font-black text-white mt-2">{stats.totalMeals}</span>
                        </div>
                    </div>
                </div>
            ) : (
                /* Widget Header */
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                        <Utensils size={24} className="text-accent" />
                        Recent Meals
                    </h2>
                </div>
            )}

            {/* Content Groups */}
            {!props.limit ? (
                <div className="space-y-12">
                    {Object.entries(groupedMeals).map(([date, meals]) => (
                        <div key={date} className="animate-fade-in-up">
                            <h3 className="text-lg font-bold text-stone-300 mb-6 border-b border-white/5 pb-2 sticky top-0 bg-stone-950/80 backdrop-blur-md z-10 py-4">
                                {date}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {meals.map(renderMealCard)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {displayedMeals.map(renderMealCard)}
                </div>
            )}

            {props.limit && meals.length > 0 && (
                <div className="flex justify-center mt-8">
                    <Link
                        to="/meals"
                        className="btn-glass text-sm"
                    >
                        View All ({meals.length})
                    </Link>
                </div>
            )}
        </div>
    );
};

export default MealHistory;
