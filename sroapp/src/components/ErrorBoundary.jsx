import React from "react";
import { Button } from "@/components/ui/button";

/**
 * ErrorBoundary - Catches JavaScript errors in child component tree
 * and displays a fallback UI instead of crashing the whole app.
 * 
 * Design matches OfflinePage for consistency.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = "/dashboard";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full min-h-[60vh] bg-white flex flex-col items-center justify-center">
                    {/* Error Icon */}
                    <div className="mb-8 relative">
                        <div className="w-32 h-32 rounded-full bg-sro-primary/10 flex items-center justify-center">
                            <svg
                                className="w-16 h-16 text-sro-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Text Content */}
                    <h1 className="text-4xl md:text-5xl font-extrabold text-sro-primary mb-4 text-center">
                        Something Went Wrong
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 text-center max-w-md px-4">
                        An unexpected error occurred. Don't worry, your data is safe.
                    </p>

                    {/* Error details (only in development) */}
                    {import.meta.env.DEV && this.state.error && (
                        <details className="mb-8 max-w-lg w-full px-4">
                            <summary className="text-sm text-gray-500 cursor-pointer hover:text-sro-primary text-center">
                                Show error details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-sro-primary overflow-auto max-h-48">
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            onClick={this.handleRetry}
                            className="cursor-pointer bg-sro-primary text-white px-8 py-3 text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:bg-sro-primary/90"
                        >
                            Try Again
                        </Button>
                        <Button
                            onClick={this.handleGoHome}
                            variant="outline"
                            className="cursor-pointer border-sro-primary text-sro-primary px-8 py-3 text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:bg-sro-primary/10"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
