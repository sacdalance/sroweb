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

        // Stale deployment: the loaded page still references a JS chunk hash
        // that no longer exists on the server after a new Vercel deploy.
        // Reload once to pick up the fresh index.html with correct hashes.
        const isChunkLoadError = /Failed to fetch dynamically imported module|Importing a module script failed/i.test(error?.message || "");
        if (isChunkLoadError && !sessionStorage.getItem("chunk-reload")) {
            sessionStorage.setItem("chunk-reload", "1");
            window.location.reload();
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        if (window.location.pathname.startsWith("/admin")) {
            window.location.href = "/admin/dashboard";
        } else {
            window.location.href = "/dashboard";
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full min-h-[60vh] bg-white flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-[64px] lg:text-[80px] font-extrabold text-sro-primary leading-tight">
                        OOPS!
                    </h1>
                    <h2 className="text-[32px] lg:text-[44px] font-bold text-sro-primary mb-4">
                        SOMETHING WENT WRONG
                    </h2>
                    <p className="text-sm sm:text-base text-gray-700 mb-6">
                        An unexpected error occurred. Don&apos;t worry, your data is safe.
                    </p>

                    {/* Error details (only in development) */}
                    {import.meta.env.DEV && this.state.error && (
                        <details className="mb-6 max-w-lg w-full">
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
                            className="cursor-pointer bg-sro-primary text-white px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:bg-sro-primary/90"
                        >
                            Try Again
                        </Button>
                        <Button
                            onClick={this.handleGoHome}
                            variant="outline"
                            className="cursor-pointer border-sro-primary text-sro-primary px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:bg-sro-primary/10"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            );
        }

        sessionStorage.removeItem("chunk-reload");
        return this.props.children;
    }
}

export default ErrorBoundary;
