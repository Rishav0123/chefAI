import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { UserContext } from '../context/UserContext';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Calendar, Tag, Trash2, Edit2, X, Check, UploadCloud, Camera, Search } from 'lucide-react';

const StockList = (props) => {
    const navigate = useNavigate();
    const { user, stockRefreshTrigger } = useContext(UserContext);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.id) fetchStock();

        const onFocus = () => {
            if (user?.id) fetchStock();
        };

        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
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
        navigate('/add?mode=stock', { state: { editStock: item } });
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading kitchen assets...</div>;

    // Helper to render a single card (Used in both Widget and Full views)
    const renderStockCard = (item) => (
        <div key={item.stock_id} className="glass-panel p-4 md:p-6 relative group transition-all hover:scale-[1.02]">
            {/* Category Indicator Dot */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditClick(item)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg text-stone-400 hover:text-white transition-colors">
                    <Edit2 size={14} className="md:w-4 md:h-4" />
                </button>
                <button onClick={() => handleDelete(item.stock_id)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg text-stone-400 hover:text-danger transition-colors">
                    <Trash2 size={14} className="md:w-4 md:h-4" />
                </button>
            </div>

            <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full mt-2 ${item.category === 'vegetable' ? 'bg-emerald-500' :
                    item.category === 'fruit' ? 'bg-yellow-500' :
                        item.category === 'meat' ? 'bg-red-500' :
                            item.category === 'dairy' ? 'bg-blue-500' : 'bg-accent'
                    }`}></div>
            </div>

            <h3 className="text-lg md:text-xl font-bold mb-2 text-white pr-8 md:pr-10 truncate">{item.item_name}</h3>

            <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-stone-500 font-bold uppercase tracking-wider text-[10px] md:text-xs">Quantity</span>
                    <span className="text-white font-bold bg-white/5 px-2 py-0.5 md:px-3 md:py-1 rounded-lg border border-white/5">
                        {item.quantity || 'N/A'}
                    </span>
                </div>

                <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-stone-500 font-bold uppercase tracking-wider text-[10px] md:text-xs">Category</span>
                    <span className="text-stone-400 capitalize">{item.category || 'Other'}</span>
                </div>

                {item.expiry_date && (
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-danger bg-danger/10 px-2 py-1.5 md:px-3 md:py-2 rounded-lg mt-1 md:mt-2">
                        <Calendar size={10} className="md:w-3 md:h-3" />
                        <span>Expires {item.expiry_date}</span>
                    </div>
                )}
            </div>
        </div>
    );

    // Empty State Component
    const EmptyState = () => (
        <div className="glass-panel p-8 md:p-12 text-center flex flex-col items-center justify-center border border-white/5 shadow-2xl">
            <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <UploadCloud size={40} className="text-stone-400" />
            </div>

            <h2 className="text-xl md:text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-stone-400">
                Your kitchen is looking bare!
            </h2>
            <p className="text-stone-400 mb-8 max-w-sm mx-auto text-sm md:text-base">
                Let's fill it up so I can recommend some delicious recipes for you.
            </p>

            <div className="flex flex-col w-full max-w-xs gap-3">
                <Link to="/scan/bill" className="btn-primary w-full justify-center py-3 text-base flex items-center gap-2">
                    <UploadCloud size={20} />
                    Scan a Receipt
                </Link>

                <Link to="/scan/item" className="btn-glass w-full justify-center py-3 text-base flex items-center gap-2">
                    <Camera size={20} className="text-accent" />
                    Scan Single Item
                </Link>
            </div>
        </div>
    );

    // --- Filtering Logic ---
    const filteredStocks = stocks.filter(item => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
            item.item_name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        );
    });

    // --- Stats & Grouping Logic (Only for Full Page) ---
    const stats = !props.limit ? {
        total: stocks.length,
        lowStock: stocks.filter(i => {
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
    const groupedStocks = !props.limit ? filteredStocks.reduce((acc, item) => {
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
                <div className="mb-6 md:mb-10 animate-fade-in">
                    <div className="flex justify-between items-end mb-6 md:mb-8">
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black text-white mb-2">Kitchen Inventory</h2>
                            <p className="text-sm md:text-base text-stone-400">Manage your stock, track expiry, and organize your pantry.</p>
                        </div>
                        <Link to="/add" className="btn-primary flex items-center gap-2 text-sm md:text-base px-4 py-2">
                            <Package size={18} className="md:w-5 md:h-5" /> <span className="hidden md:inline">Add New Item</span><span className="md:hidden">Add</span>
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search pantry..."
                            className="w-full bg-stone-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                        <div className="glass-panel p-4 md:p-6 flex items-center justify-between bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
                            <div>
                                <p className="text-orange-200 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">Total Items</p>
                                <h3 className="text-3xl md:text-4xl font-black text-orange-500">{stats.total}</h3>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                                <Tag size={20} className="md:w-6 md:h-6" />
                            </div>
                        </div>

                        <div className="glass-panel p-4 md:p-6 flex items-center justify-between">
                            <div>
                                <p className="text-stone-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">Expiring Soon</p>
                                <h3 className={`text-3xl md:text-4xl font-black ${stats.expiringSoon > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {stats.expiringSoon}
                                </h3>
                            </div>
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${stats.expiringSoon > 0 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                <Calendar size={20} className="md:w-6 md:h-6" />
                            </div>
                        </div>

                        <div className="glass-panel p-4 md:p-6 flex items-center justify-between">
                            <div>
                                <p className="text-stone-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-1">Stock Health</p>
                                <h3 className="text-3xl md:text-4xl font-black text-blue-500">{stats.lowStock > 0 ? 'Action Needed' : 'Healthy'}</h3>
                            </div>
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <Check size={20} className="md:w-6 md:h-6" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Widget Header */
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                        <Package size={24} className="text-accent" />
                        Pantry Intelligence
                    </h2>
                </div>
            )}

            {/* Content: Either Grouped Sections (Full Page) or Flat Grid (Widget) */}
            {!props.limit ? (
                <div className="space-y-8 md:space-y-12">
                    {Object.entries(groupedStocks).sort().map(([category, items]) => (
                        <div key={category} className="animate-fade-in-up">
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                <span className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${category === 'vegetable' ? 'bg-emerald-500' :
                                    category === 'fruit' ? 'bg-yellow-500' :
                                        category === 'meat' ? 'bg-red-500' :
                                            category === 'grain' ? 'bg-amber-600' : 'bg-accent'
                                    }`}></span>
                                {capitalize(category)}
                                <span className="text-xs md:text-sm font-normal text-stone-500 bg-white/5 px-2 py-1 rounded-full ml-2">{items.length}</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
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
                stocks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {stocks.slice(0, props.limit).map(renderStockCard)}
                    </div>
                ) : (
                    <EmptyState />
                )
            )}

            {props.limit && stocks.length > 0 && (
                <div className="flex justify-center mt-8">
                    <Link
                        to="/inventory"
                        className="btn-glass text-sm"
                    >
                        View All Inventory ({stocks.length})
                    </Link>
                </div>
            )}


        </div>
    );
};

export default StockList;
