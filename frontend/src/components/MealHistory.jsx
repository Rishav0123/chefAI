import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { UserContext } from '../context/UserContext';
import { Utensils, Clock } from 'lucide-react';

import { Link } from 'react-router-dom';

const MealHistory = (props) => {
    const { user, stockRefreshTrigger } = useContext(UserContext); // Refetch when stock refreshes (implies meal logged)
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) fetchHistory();
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

    if (loading) return <div></div>; // Silent loading
    if (meals.length === 0) return null; // Hide if empty

    // logic to show only first N items if limit prop is present
    const displayedMeals = props.limit ? meals.slice(0, props.limit) : meals;

    return (
        <div style={{ marginTop: '2rem' }}>
            {/* Header - No Button Here */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <Utensils size={24} color="var(--accent)" />
                    Recent Meals
                </h2>
            </div>

            {/* Grid of Meals */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {displayedMeals.map((meal) => (
                    <div key={meal.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{meal.name}</h3>
                            <div style={{
                                background: 'rgba(255,255,255,0.1)',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <Clock size={12} />
                                {/* Robust date parsing: handle ISO strings safely */}
                                {meal.created_at ? new Date(meal.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date N/A'}
                            </div>
                        </div>

                        {/* Nutrition Badges */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            {meal.calories && (
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    🔥 {meal.calories} kcal
                                </div>
                            )}
                            {meal.protein_g && (
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                    💪 {meal.protein_g}g protein
                                </div>
                            )}
                            {meal.protein_g > 20 && (
                                <span style={{
                                    fontSize: '0.7rem', background: '#3b82f6', color: 'white',
                                    padding: '2px 6px', borderRadius: '4px', alignSelf: 'center'
                                }}>
                                    High Protein
                                </span>
                            )}
                        </div>

                        {meal.ingredients_used && meal.ingredients_used.length > 0 && (
                            <div style={{ marginTop: '5px' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Ingredients Used:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {meal.ingredients_used.map((ing, idx) => (
                                        <span key={idx} style={{
                                            fontSize: '0.8rem',
                                            background: 'rgba(16, 185, 129, 0.2)',
                                            color: '#6ee7b7',
                                            padding: '2px 8px',
                                            borderRadius: '4px'
                                        }}>
                                            {ing.item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer - View All Button Here */}
            {props.limit && meals.length > props.limit && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <Link
                        to="/meals"
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--accent)',
                            color: 'var(--accent)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            textDecoration: 'none',
                            display: 'inline-block',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--accent)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--accent)';
                        }}
                    >
                        View All ({meals.length})
                    </Link>
                </div>
            )}
        </div>
    );
};

export default MealHistory;
