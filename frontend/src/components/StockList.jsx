import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { UserContext } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { Package, Calendar, Tag, Trash2, Edit2, X, Check, UploadCloud, Camera } from 'lucide-react';

const StockList = (props) => {
    const { user, stockRefreshTrigger } = useContext(UserContext);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        if (user?.id) fetchStock();
    }, [user?.id, stockRefreshTrigger]);

    const fetchStock = async () => {
        try {
            const response = await api.get(`/stock/${user.id}`);
            setStocks(response.data);
        } catch (error) {
            console.error("Error fetching stock:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (stockId) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await api.delete(`/stock/${stockId}`);
            setStocks(stocks.filter(item => item.stock_id !== stockId));
        } catch (error) {
            alert("Failed to delete item");
        }
    };

    const handleEditClick = (item) => {
        setEditingItem({ ...item });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/stock/${editingItem.stock_id}`, editingItem);
            setStocks(stocks.map(item => item.stock_id === editingItem.stock_id ? res.data : item));
            setEditingItem(null);
        } catch (error) {
            alert("Failed to update item");
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading kitchen assets...</div>;

    if (stocks.length === 0) {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    borderRadius: '24px',
                    padding: '3rem 2rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '10px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Your kitchen is looking bare!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                        Let's fill it up so I can recommend some delicious recipes for you.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <Link to="/scan/bill" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '15px', fontSize: '1.1rem' }}>
                            <UploadCloud size={24} />
                            Scan a Receipt
                        </Link>

                        <Link to="/scan/item" className="glass-panel" style={{
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                            padding: '15px', color: 'var(--text-primary)', textDecoration: 'none',
                            border: '1px solid rgba(255,255,255,0.2)', background: 'transparent'
                        }}>
                            <Camera size={24} color="var(--accent)" />
                            Scan Single Item
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Helper to render a single card (Used in both Widget and Full views)
    const renderStockCard = (item) => (
        <div key={item.stock_id} className="glass-panel p-6 relative group transition-all hover:scale-[1.02]">
            {/* Category Indicator Dot */}
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditClick(item)} className="p-2 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors">
                    <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(item.stock_id)} className="p-2 hover:bg-white/10 rounded-lg text-stone-400 hover:text-danger transition-colors">
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex items-start justify-between mb-4">
                <div className={`w-3 h-3 rounded-full mt-2 ${item.category === 'vegetable' ? 'bg-emerald-500' :
                    item.category === 'fruit' ? 'bg-yellow-500' :
                        item.category === 'meat' ? 'bg-red-500' :
                            item.category === 'dairy' ? 'bg-blue-500' : 'bg-accent'
                    }`}></div>
            </div>

            <h3 className="text-xl font-bold mb-2 text-white pr-10 truncate">{item.item_name}</h3>

            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500 font-bold uppercase tracking-wider text-xs">Quantity</span>
                    <span className="text-white font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                        {item.quantity || 'N/A'}
                    </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500 font-bold uppercase tracking-wider text-xs">Category</span>
                    <span className="text-stone-400 capitalize">{item.category || 'Other'}</span>
                </div>

                {item.expiry_date && (
                    <div className="flex items-center gap-2 text-xs font-medium text-danger bg-danger/10 px-3 py-2 rounded-lg mt-2">
                        <Calendar size={12} />
                        <span>Expires {item.expiry_date}</span>
                    </div>
                )}
            </div>
        </div>
    );

    // --- Stats & Grouping Logic (Only for Full Page) ---
    const stats = !props.limit ? {
        total: stocks.length,
        lowStock: stocks.filter(i => {
            // Simple heuristic: if quantity contains "1" (like "1 kg" or "1 unit") it might be low, 
            // but specific "low" logic depends on usage. For now, count items without specific quantity or "0".
            return !i.quantity || i.quantity === '0' || parseInt(i.quantity) <= 1
        }).length,
        expiringSoon: stocks.filter(item => {
            if (!item.expiry_date) return false;
            const days = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
            return days <= 3;
        }).length,
        categoryCounts: stocks.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {})
    } : null;

    // Group items by category for the full view
    const groupedStocks = !props.limit ? stocks.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {}) : null;

    // Capitalize helper
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

    return (
        <div>
            {/* Header / Stats Section */}
            {!props.limit ? (
                <div className="mb-10 animate-fade-in">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-4xl font-black text-white mb-2">Kitchen Inventory</h2>
                            <p className="text-stone-400">Manage your stock, track expiry, and organize your pantry.</p>
                        </div>
                        <Link to="/add" className="btn-primary flex items-center gap-2">
                            <Package size={20} /> Add New Item
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="glass-panel p-6 flex items-center justify-between bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                            <div>
                                <p className="text-orange-200 text-sm font-bold uppercase tracking-wider mb-1">Total Items</p>
                                <h3 className="text-4xl font-black text-orange-500">{stats.total}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                                <Tag size={24} />
                            </div>
                        </div>

                        <div className="glass-panel p-6 flex items-center justify-between">
                            <div>
                                <p className="text-stone-400 text-sm font-bold uppercase tracking-wider mb-1">Expiring Soon</p>
                                <h3 className={`text-4xl font-black ${stats.expiringSoon > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {stats.expiringSoon}
                                </h3>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.expiringSoon > 0 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                <Calendar size={24} />
                            </div>
                        </div>

                        <div className="glass-panel p-6 flex items-center justify-between">
                            <div>
                                <p className="text-stone-400 text-sm font-bold uppercase tracking-wider mb-1">Stock Health</p>
                                <h3 className="text-4xl font-black text-blue-500">{stats.lowStock > 0 ? 'Action Needed' : 'Healthy'}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <Check size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Widget Header */
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-accent">
                            <Package size={20} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white">
                            Pantry Intelligence
                        </h2>
                    </div>
                </div>
            )}

            {/* Content: Either Grouped Sections (Full Page) or Flat Grid (Widget) */}
            {!props.limit ? (
                <div className="space-y-12">
                    {Object.entries(groupedStocks).sort().map(([category, items]) => (
                        <div key={category} className="animate-fade-in-up">
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                <span className={`w-4 h-4 rounded-full ${category === 'vegetable' ? 'bg-emerald-500' :
                                    category === 'fruit' ? 'bg-yellow-500' :
                                        category === 'meat' ? 'bg-red-500' :
                                            category === 'grain' ? 'bg-amber-600' : 'bg-accent'
                                    }`}></span>
                                {capitalize(category)}
                                <span className="text-sm font-normal text-stone-500 bg-white/5 px-2 py-1 rounded-full ml-2">{items.length}</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {items.map(renderStockCard)}
                            </div>
                        </div>
                    ))}

                    {stocks.length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            No items found. Add some!
                        </div>
                    )}
                </div>
            ) : (
                /* Widget Flat Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {stocks.slice(0, props.limit).map(renderStockCard)}
                </div>
            )}

            {props.limit && stocks.length > props.limit && (
                <div className="flex justify-center mt-8">
                    <Link
                        to="/inventory"
                        className="btn-glass text-sm"
                    >
                        View All Inventory ({stocks.length})
                    </Link>
                </div>
            )}

            {editingItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Edit Item</h3>
                            <button onClick={() => setEditingItem(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Item Name</label>
                                <input
                                    className="input-field"
                                    value={editingItem.item_name}
                                    onChange={e => setEditingItem({ ...editingItem, item_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Quantity</label>
                                <input
                                    className="input-field"
                                    value={editingItem.quantity || ''}
                                    onChange={e => setEditingItem({ ...editingItem, quantity: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Category</label>
                                <select
                                    className="input-field"
                                    value={editingItem.category || ''}
                                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                                >
                                    <option value="vegetable">Vegetable</option>
                                    <option value="fruit">Fruit</option>
                                    <option value="dairy">Dairy</option>
                                    <option value="meat">Meat</option>
                                    <option value="grain">Grain</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <Check size={18} /> Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockList;
