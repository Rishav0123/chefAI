import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Calendar, Activity, Flame, Utensils, Wheat, Droplet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../api';
import { UserContext } from '../context/UserContext';

const BodyGoals = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [todayStats, setTodayStats] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 70 });

    useEffect(() => {
        if (user?.id) {
            Promise.all([fetchMeals(), fetchGoals()]).finally(() => setLoading(false));
        }
    }, [user?.id]);

    const fetchGoals = async () => {
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
            console.error("Error fetching goals", error);
        }
    };

    const fetchMeals = async () => {
        try {
            const res = await api.get(`/meals/${user.id}`);
            processMealData(res.data);
        } catch (error) {
            console.error("Error fetching meals", error);
        }
    };

    const processMealData = (meals) => {
        const today = new Date().toDateString();
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toDateString();
        });

        // Calculate Today's Stats
        const todaysMeals = meals.filter(m => new Date(m.created_at).toDateString() === today);
        const currentStats = todaysMeals.reduce((acc, meal) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein_g || 0),
            carbs: acc.carbs + (meal.carbs_g || 0),
            fat: acc.fat + (meal.fat_g || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setTodayStats(currentStats);

        // Calculate History
        const historyData = last7Days.map(dateStr => {
            const dayMeals = meals.filter(m => new Date(m.created_at).toDateString() === dateStr);
            const cals = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
            return {
                name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                calories: cals,
                fullDate: dateStr
            };
        });
        setHistory(historyData);
    };

    const getProgressColor = (current, target) => {
        const percentage = (current / target) * 100;
        if (percentage > 110) return 'text-red-500';
        if (percentage >= 90) return 'text-green-500';
        return 'text-accent';
    };

    if (loading) return <div className="p-8 text-center text-stone-500 animate-pulse">Loading body metrics...</div>;

    return (
        <div className="min-h-screen pb-20 animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-stone-950/80 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-4">
                <Link to="/" className="p-2 hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Activity size={20} className="text-accent" /> Body Goals
                    </h1>
                    <p className="text-xs text-stone-500">Track your transformation</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-8">

                {/* Today's Summary Cards */}
                <section>
                    <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">Today's Macros</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MacroCard
                            title="Calories"
                            current={todayStats.calories}
                            target={goals.calories}
                            unit="kcal"
                            icon={Flame}
                            color="orange"
                        />
                        <MacroCard
                            title="Protein"
                            current={todayStats.protein}
                            target={goals.protein}
                            unit="g"
                            icon={Utensils}
                            color="blue"
                        />
                        <MacroCard
                            title="Carbs"
                            current={todayStats.carbs}
                            target={goals.carbs}
                            unit="g"
                            icon={Wheat}
                            color="yellow"
                        />
                        <MacroCard
                            title="Fat"
                            current={todayStats.fat}
                            target={goals.fat}
                            unit="g"
                            icon={Droplet}
                            color="purple"
                        />
                    </div>
                </section>

                {/* History Chart */}
                <section className="glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-green-500" />
                            Calorie History
                        </h2>
                        <span className="text-xs text-stone-500 bg-white/5 px-3 py-1 rounded-full">Last 7 Days</span>
                    </div>

                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#78716c"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#78716c"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                                    {history.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.calories > goals.calories ? '#ef4444' : '#f97316'}
                                            opacity={entry.calories === 0 ? 0.2 : 1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-6 text-xs text-stone-500">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-orange-500"></div> On Track
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-500"></div> Over Limit
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

const MacroCard = ({ title, current, target, unit, icon: Icon, color }) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    const colorClasses = {
        orange: 'text-orange-500 bg-orange-500',
        blue: 'text-blue-500 bg-blue-500',
        yellow: 'text-yellow-500 bg-yellow-500',
        purple: 'text-purple-500 bg-purple-500',
    };

    // Split for text/bg usage
    const textColor = colorClasses[color].split(' ')[0];
    const bgColor = colorClasses[color].split(' ')[1];

    return (
        <div className="glass-panel p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-16 h-16 ${bgColor}/5 rounded-full blur-2xl -mr-8 -mt-8 transition-opacity group-hover:opacity-100 opacity-50`}></div>

            <Icon size={20} className={`${textColor} mb-2`} />
            <div className="text-2xl font-black text-white mb-0.5">
                {Math.round(current)}<span className="text-xs font-medium text-stone-500 ml-0.5">{unit}</span>
            </div>
            <div className="text-xs text-stone-400 mb-2">{title}</div>

            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${bgColor} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <div className="text-[10px] text-stone-600 mt-1 font-mono">
                {percentage}%
            </div>
        </div>
    );
};

export default BodyGoals;
