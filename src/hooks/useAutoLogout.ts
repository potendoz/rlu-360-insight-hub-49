import { useEffect, useRef, useCallback } from 'react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';

interface AutoLogoutConfig {
  timeout: number; // in milliseconds
  warningTime: number; // in milliseconds before logout to show warning
}

const DEFAULT_CONFIG: AutoLogoutConfig = {
  timeout: 30 * 60 * 1000, // 30 minutes
  warningTime: 5 * 60 * 1000, // 5 minutes warning
};

export const useAutoLogout = (config: Partial<AutoLogoutConfig> = {}) => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  const configRef = useRef<AutoLogoutConfig>({ ...DEFAULT_CONFIG, ...config });

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        toast({
          title: "Session Warning",
          description: "You will be logged out in 5 minutes due to inactivity.",
          variant: "destructive",
          duration: 10000,
        });
      }
    }, configRef.current.timeout - configRef.current.warningTime);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        authService.logout();
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }, configRef.current.timeout);
  }, [toast]);

  const handleActivity = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      resetTimer();
    }
  }, [resetTimer]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    // List of events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity handler to avoid too many calls
    let throttleTimer: NodeJS.Timeout;
    const throttledActivityHandler = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        handleActivity();
        clearTimeout(throttleTimer);
        throttleTimer = undefined as any;
      }, 1000); // Throttle to once per second
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledActivityHandler, true);
    });

    // Start the timer initially
    resetTimer();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledActivityHandler, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [handleActivity, resetTimer]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((authState) => {
      if (authState.isAuthenticated) {
        resetTimer();
      } else {
        // Clear timers when user logs out
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
      }
    });

    return unsubscribe;
  }, [resetTimer]);

  return {
    resetTimer: handleActivity,
    getLastActivity: () => lastActivityRef.current,
    getTimeUntilLogout: () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      return Math.max(0, configRef.current.timeout - timeSinceLastActivity);
    }
  };
};