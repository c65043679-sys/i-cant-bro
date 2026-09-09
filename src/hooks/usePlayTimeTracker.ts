import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';

/**
 * Formats a duration in seconds into a clean, human-readable string.
 * Examples:
 *   45 -> "45s"
 *   150 -> "2m 30s"
 *   3665 -> "1h 1m 5s"
 */
export function formatPlayTime(totalSeconds: number = 0): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Formats a duration in seconds into an expanded descriptive string.
 * Examples:
 *   45 -> "45 seconds"
 *   120 -> "2 minutes"
 *   3660 -> "1 hr 1 min"
 */
export function formatPlayTimeDetailed(totalSeconds: number = 0): string {
  if (!totalSeconds || totalSeconds <= 0) return '0 minutes';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  if (hours === 0 && (seconds > 0 || parts.length === 0)) {
    parts.push(`${seconds} sec${seconds !== 1 ? 's' : ''}`);
  }
  return parts.join(' ') || '0 minutes';
}

export interface UsePlayTimeTrackerOptions {
  /** How frequently in seconds to sync accumulated play time to the user profile. Default is 5s. */
  flushIntervalSeconds?: number;
}

export interface UsePlayTimeTrackerReturn {
  /** Seconds spent in the current Play view session */
  sessionSeconds: number;
  /** Total seconds played across all sessions from the user profile */
  totalPlayTime: number;
  /** Formatted session duration, e.g. "2m 15s" */
  formattedSessionTime: string;
  /** Formatted all-time total play time, e.g. "1h 45m 12s" */
  formattedTotalPlayTime: string;
  /** Formatted all-time total play time in expanded words, e.g. "1 hr 45 min" */
  formattedTotalPlayTimeDetailed: string;
  /** True when the tab is focused/visible and time is actively accumulating */
  isActive: boolean;
  /** Manually flush any uncommitted seconds to the profile immediately */
  flushNow: () => void;
}

/**
 * Hook that tracks active time spent in the 'Play' view and updates
 * the user's 'Total Play Time' in their profile and persistence layer.
 */
export function usePlayTimeTracker(options: UsePlayTimeTrackerOptions = {}): UsePlayTimeTrackerReturn {
  const { flushIntervalSeconds = 5 } = options;
  const { profile, addPlayTime } = useAuth();
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isActive, setIsActive] = useState(() => (typeof document !== 'undefined' ? document.visibilityState === 'visible' : true));

  const addPlayTimeRef = useRef(addPlayTime);
  useEffect(() => {
    addPlayTimeRef.current = addPlayTime;
  }, [addPlayTime]);

  // Track uncommitted delta seconds waiting to be flushed to profile
  const pendingDeltaRef = useRef(0);

  // Flush pending seconds to user profile
  const flush = useCallback(() => {
    const delta = pendingDeltaRef.current;
    if (delta > 0) {
      pendingDeltaRef.current = 0;
      try {
        addPlayTimeRef.current(delta);
      } catch (err) {
        console.warn('Error flushing play time to profile:', err);
      }
    }
  }, []);

  // Monitor visibility state so we only track active screen time
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsActive(isVisible);
      if (!isVisible) {
        // Tab hidden or backgrounded: flush immediately
        flush();
      }
    };

    const handleBeforeUnload = () => {
      flush();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flush]);

  // Main 1-second active ticker
  useEffect(() => {
    const interval = setInterval(() => {
      // Only increment if document is active / visible
      if (document.visibilityState === 'visible') {
        setSessionSeconds((prev) => prev + 1);
        pendingDeltaRef.current += 1;

        // Periodically flush accumulated time
        if (pendingDeltaRef.current >= flushIntervalSeconds) {
          flush();
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      // On unmount (leaving the 'Play' view), commit remaining unwritten seconds immediately
      flush();
    };
  }, [flush, flushIntervalSeconds]);

  const currentTotal = (profile?.totalPlayTime ?? 0) + pendingDeltaRef.current;

  return {
    sessionSeconds,
    totalPlayTime: currentTotal,
    formattedSessionTime: formatPlayTime(sessionSeconds),
    formattedTotalPlayTime: formatPlayTime(currentTotal),
    formattedTotalPlayTimeDetailed: formatPlayTimeDetailed(currentTotal),
    isActive,
    flushNow: flush,
  };
}
