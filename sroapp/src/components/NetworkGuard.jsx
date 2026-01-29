import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import OfflinePage from '@/pages/OfflinePage';

/**
 * NetworkGuard component that monitors connectivity and:
 * - Shows a toast INSTANTLY when connection issues are detected
 * - Renders the OfflinePage (full screen, no layout) when offline
 */
const NetworkGuard = ({ children }) => {
    const { isOnline } = useNetworkStatus();

    useEffect(() => {
        if (!isOnline) {
            // Show toast immediately
            toast.error('No internet connection. Please check your network.', {
                duration: Infinity,
                id: 'network-offline',
            });
        } else {
            // Dismiss and show success when back online
            toast.dismiss('network-offline');
        }
    }, [isOnline]);

    // When offline, render the offline page instead of children
    if (!isOnline) {
        return <OfflinePage />;
    }

    return children;
};

export default NetworkGuard;
