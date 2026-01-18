import React from 'react';
import { ChefHat } from 'lucide-react';

const LoadingOverlay = ({ message = "AI Chef is working...", subMessage = "This usually takes a few seconds." }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 50,
            borderRadius: 'inherit' // Inherit border radius from parent
        }}>
            <div className="bounce-animation" style={{
                background: 'var(--accent)',
                padding: '20px',
                borderRadius: '50%',
                boxShadow: '0 0 30px var(--accent)'
            }}>
                <ChefHat size={48} color="white" />
            </div>
            <h3 style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: '600' }}>{message}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px' }}>{subMessage}</p>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .bounce-animation {
                    animation: bounce 1s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default LoadingOverlay;
