
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';

const ChatWidgetButton = () => {
    const location = useLocation();

    // Hide button if already on chat page
    if (location.pathname === '/chat') {
        return null;
    }

    return (
        <Link
            to="/chat"
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-orange-500/30 hover:scale-110 hover:bg-orange-600 transition-all z-50 animate-fade-in group"
        >
            <Bot size={32} className="group-hover:rotate-12 transition-transform" />
        </Link>
    );
};

export default ChatWidgetButton;
