import React, { useState, useContext, useRef, useEffect } from 'react';
import api from '../api';
import { UserContext } from '../context/UserContext';
import { Bot, X, Send, User, Sparkles, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

const ChatAssistant = () => {
    const { user, triggerStockRefresh } = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    const navigate = useNavigate();

    // Proactive Welcome Message
    useEffect(() => {
        if (!user) return;

        const fetchContextAndGreet = async () => {
            try {
                // Check stock to generate context-aware greeting
                const stockRes = await api.get(`/stock/${user.id}`);
                const stocks = stockRes.data;

                let greeting = "";
                if (stocks.length === 0) {
                    greeting = "Hi! Your kitchen is empty. I can help you plan a grocery list or find easy recipes with pantry staples. What do you need?";
                } else {
                    // Pick up to 3 random items to mention
                    const items = stocks.map(s => s.item_name).slice(0, 3).join(', ');
                    greeting = `Hi! I see you have ${items} and more. \n\nWant me to suggest a recipe using these ingredients?`;
                }

                setMessages([{ role: 'assistant', content: greeting }]);
            } catch (err) {
                setMessages([{ role: 'assistant', content: "Hi! I am your AI Chef. I can help you plan meals, track nutrition, or find recipes based on what you have.\n\n**What would you like to cook today?**" }]);
            }
        };

        if (messages.length === 0) {
            fetchContextAndGreet();
        }
    }, [user, messages.length]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await api.post('/chat/', {
                message: userMsg,
                user_id: user.id
            });

            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);

            // Check for backend actions
            if (res.data.actions && res.data.actions.includes("MEAL_LOGGED")) {
                showToast("🍲 Kitchen Updated! Ingredients removed from stock.");
                triggerStockRefresh();
            }

            if (res.data.actions && res.data.actions.includes("DRAFT_MEAL") && res.data.redirect_payload) {
                showToast("📝 Opening Meal Log...");
                // Small delay to let user see the "Draft created" message
                setTimeout(() => {
                    navigate('/add?mode=meal', { state: { draft: res.data.redirect_payload } });
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the kitchen server. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const [toast, setToast] = useState(null);
    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    if (!user) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] w-full glass-panel overflow-hidden md:rounded-3xl animate-fade-in shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-stone-900/50 border-b border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl leading-tight text-white">AI Chef Assistant</h3>
                        <p className="text-sm text-stone-400 font-medium">Ready to discuss recipes & ingredients</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-950/30">
                {messages.map((msg, idx) => {
                    let content = msg.content;
                    let suggestion = null;

                    // Parse Suggestion Token
                    if (msg.role === 'assistant') {
                        const match = content.match(/<<VIDEO_SUGGESTION:\s*(.*?)>>/);
                        if (match) {
                            suggestion = match[1];
                            content = content.replace(match[0], '').trim();
                        }
                    }

                    return (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] self-${msg.role === 'user' ? 'end' : 'start'}`}>
                            <div className={`
                                p-5 rounded-2xl text-base leading-relaxed shadow-sm
                                ${msg.role === 'user'
                                    ? 'bg-accent text-white rounded-br-none'
                                    : 'bg-stone-800 text-stone-200 rounded-bl-none border border-white/5'}
                            `}>
                                {msg.role === 'assistant' ? (
                                    <ReactMarkdown
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                                            img: ({ node, ...props }) => (
                                                <img
                                                    {...props}
                                                    className="w-full rounded-xl mt-4 mb-2 border border-white/10 shadow-lg"
                                                    alt="Recipe Preview"
                                                />
                                            ),
                                        }}
                                    >
                                        {content}
                                    </ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                            </div>

                            {/* Suggestion Button inside Chat */}
                            {suggestion && (
                                <button
                                    onClick={() => setInput(suggestion)}
                                    className="mt-3 flex items-center gap-2 bg-stone-800 border border-orange-500/30 text-orange-400 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-orange-500 hover:text-white transition-all shadow-lg animate-pulse"
                                >
                                    <Play size={12} fill="currentColor" />
                                    Show me video
                                </button>
                            )}

                            {/* Quick Prompts - Only show after the very first assistant message */}
                            {idx === 0 && msg.role === 'assistant' && (
                                <div className="mt-4 flex flex-wrap gap-2 animate-fade-in">
                                    {[
                                        "What can I cook with my stock?",
                                        "Suggest a healthy dinner",
                                        "Show me a pasta recipe",
                                        "How do I scan a bill?"
                                    ].map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setInput(prompt)}
                                            className="px-4 py-2 bg-stone-800/50 hover:bg-stone-700 border border-white/10 rounded-xl text-sm text-stone-300 transition-all hover:text-white hover:border-accent/50 text-left"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {loading && (
                    <div className="flex items-center gap-2 text-stone-500 text-sm font-bold uppercase tracking-widest pl-4">
                        <span className="w-2 h-2 bg-accent rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200"></span>
                        Cooking up response...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-6 bg-stone-900/80 border-t border-white/5 backdrop-blur-md flex gap-4">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask for a recipe, ingredient swap, or cooking tip..."
                    className="flex-1 bg-stone-950 border border-stone-800 rounded-2xl px-6 py-4 text-white placeholder-stone-600 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-base"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-accent text-white rounded-2xl w-16 flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
                >
                    <Send size={24} />
                </button>
            </form>

            {/* Toast Notification */}
            {toast && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold z-[3000] animate-fade-in border border-emerald-400/20">
                    <Sparkles size={20} className="text-emerald-200" />
                    {toast}
                </div>
            )}
        </div>
    );
};

export default ChatAssistant;
