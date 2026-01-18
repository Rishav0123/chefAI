import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Camera, ArrowRight, Utensils } from 'lucide-react';

const ScanMethod = () => {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>What would you like to scan?</h2>

            {/* Scan Single Item Option */}
            <div
                onClick={() => navigate('/scan/item')}
                className="glass-panel"
                style={{
                    padding: '2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    transition: 'transform 0.2s, background 0.2s',
                    position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <div style={{ padding: '15px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '50%' }}>
                    <Camera size={40} color="#eab308" />
                </div>
                <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>Scan Single Item</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Take a photo of a single ingredient (e.g. Apple, Milk).
                    </p>
                </div>
                <ArrowRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
            </div>

            {/* Scan Bill Option */}
            <div
                onClick={() => navigate('/scan/bill')}
                className="glass-panel"
                style={{
                    padding: '2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    transition: 'transform 0.2s, background 0.2s',
                    position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <div style={{ padding: '15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%' }}>
                    <UploadCloud size={40} color="#3b82f6" />
                </div>
                <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>Upload Bill</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Upload a grocery receipt or cart screenshot.
                    </p>
                </div>
                <ArrowRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
            </div>

            {/* Scan Meal Option */}
            <div
                onClick={() => navigate('/scan/meal')}
                className="glass-panel"
                style={{
                    padding: '2rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    transition: 'transform 0.2s, background 0.2s',
                    position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
                    <Utensils size={40} color="#ef4444" />
                </div>
                <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>Scan Meal</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Snap a photo of your dish to track nutrition.
                    </p>
                </div>
                <ArrowRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
            </div>
        </div>
    );
};

export default ScanMethod;
