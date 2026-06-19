import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/api-config';

/**
 * Custom hook for monitoring network connectivity via backend ping.
 * Returns { isOnline, isChecking } state.
 * Responds INSTANTLY to browser offline events.
 */
// Number of consecutive failed pings before we declare the app offline.
// A single slow/failed backend ping should NOT kick the user to the offline
// page — only sustained failures (or a real browser offline event) should.
const FAILURE_THRESHOLD = 3;

export const useNetworkStatus = (pingInterval = 10000) => {
    // Initialize with current browser status
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isChecking, setIsChecking] = useState(false);
    const intervalRef = useRef(null);
    const failureCountRef = useRef(0);

    const checkConnectivity = useCallback(async () => {
        // The browser's own offline signal is authoritative — trust it instantly.
        if (!navigator.onLine) {
            failureCountRef.current = FAILURE_THRESHOLD;
            setIsOnline(false);
            return false;
        }

        setIsChecking(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout (tolerate cold starts)

            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store',
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                failureCountRef.current = 0;
                setIsOnline(true);
                return true;
            } else {
                // Backend responded but unhealthy — count it, but don't trip on one blip.
                failureCountRef.current += 1;
                if (failureCountRef.current >= FAILURE_THRESHOLD) {
                    setIsOnline(false);
                }
                return false;
            }
        } catch (error) {
            // If the browser still reports online, a single ping failure is likely
            // a transient backend hiccup, not a real connectivity loss.
            failureCountRef.current += 1;
            if (failureCountRef.current >= FAILURE_THRESHOLD || !navigator.onLine) {
                setIsOnline(false);
            }
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
            failureCountRef.current = 0;
            setIsOnline(true);
            checkConnectivity(); // Verify with backend
        };

        const handleOffline = () => {
            // Real browser offline event — instant, no consecutive failures needed.
            failureCountRef.current = FAILURE_THRESHOLD;
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
