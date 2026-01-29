import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api-config';

/**
 * Custom hook for monitoring network connectivity via backend ping.
 * Returns { isOnline, isChecking } state.
 * Responds INSTANTLY to browser offline events.
 */
export const useNetworkStatus = (pingInterval = 10000) => {
    // Initialize with current browser status
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isChecking, setIsChecking] = useState(false);
    const intervalRef = useRef(null);

    const checkConnectivity = useCallback(async () => {
        // Quick check with navigator.onLine first
        if (!navigator.onLine) {
            setIsOnline(false);
            return false;
        }

        setIsChecking(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store',
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                setIsOnline(true);
                return true;
            } else {
                setIsOnline(false);
                return false;
            }
        } catch (error) {
            setIsOnline(false);
            return false;
        } finally {
            setIsChecking(false);
        }
    }, []);

    useEffect(() => {
        // Initial check on mount
        if (!navigator.onLine) {
            setIsOnline(false);
        } else {
            checkConnectivity();
        }

        // Set up periodic ping
        intervalRef.current = setInterval(checkConnectivity, pingInterval);

        // Listen for browser online/offline events for INSTANT detection
        const handleOnline = () => {
            setIsOnline(true);
            checkConnectivity(); // Verify with backend
        };

        const handleOffline = () => {
            // INSTANT - no delay, no consecutive failures needed
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [checkConnectivity, pingInterval]);

    return { isOnline, isChecking, checkConnectivity };
};

export default useNetworkStatus;
