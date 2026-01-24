import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-8 text-white text-center">
                    <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong.</h2>
                    <p className="text-stone-400 mb-6">Could not load the application. Please try refreshing.</p>
                    <div className="bg-stone-900 p-4 rounded text-xs text-left font-mono overflow-auto max-w-full">
                        {this.state.error?.toString()}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-accent rounded-full text-white hover:bg-orange-600 transition"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
