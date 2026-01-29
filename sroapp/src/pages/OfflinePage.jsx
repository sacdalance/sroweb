import { Button } from "@/components/ui/button";

/**
 * Offline page that displays when no internet connection.
 * Uses only CSS - no external images that might fail to load offline.
 */
const OfflinePage = () => {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 w-full h-screen bg-white flex flex-col items-center justify-center z-[9999]">
            {/* Offline Icon */}
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
                            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                        />
                    </svg>
                </div>
                {/* Disconnected line */}
                <div className="absolute top-1/2 left-1/2 w-40 h-1 bg-sro-primary -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full" />
            </div>

            {/* Text Content */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-sro-primary mb-4 text-center">
                No Internet Connection
            </h1>
            <p className="text-lg text-gray-600 mb-8 text-center max-w-md px-4">
                Please check your network connection and try again.
            </p>

            {/* Retry Button */}
            <Button
                onClick={handleRetry}
                className="cursor-pointer bg-sro-primary text-white px-8 py-3 text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:bg-sro-primary/90"
            >
                Retry Connection
            </Button>

            {/* Animated dots */}
            <div className="mt-8 flex space-x-2">
                <div className="w-3 h-3 bg-sro-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-sro-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-sro-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    );
};

export default OfflinePage;
