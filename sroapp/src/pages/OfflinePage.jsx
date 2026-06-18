import { Button } from "@/components/ui/button";

const OfflinePage = () => {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[9999] w-full h-full bg-white flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-[64px] lg:text-[80px] font-extrabold text-sro-primary leading-tight">
                OOPS!
            </h1>
            <h2 className="text-[32px] lg:text-[44px] font-bold text-sro-primary mb-4">
                NO INTERNET CONNECTION
            </h2>
            <p className="text-sm sm:text-base text-gray-700 mb-6">
                Check your network connection and try again.
            </p>
            <Button
                onClick={handleRetry}
                className="cursor-pointer bg-sro-primary text-white px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:bg-sro-primary/90"
            >
                Retry Connection
            </Button>
        </div>
    );
};

export default OfflinePage;
