/**
 * usePersistedState - Hook for persisting state in localStorage
 * For things that shouldn't be in URL (scroll, UI preferences, etc.)
 */

import { useState, useEffect, useCallback, useRef } from "react";

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Sync to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to persist state:", error);
    }
  }, [key, state]);

  const clear = useCallback(() => {
    localStorage.removeItem(key);
    setState(defaultValue);
  }, [key, defaultValue]);

  return [state, setState, clear];
}

// Hook to save and restore scroll position
export function useScrollPersistence(key: string, containerRef?: React.RefObject<HTMLElement>) {
  const scrollKey = `scroll:${key}`;
  const restoredRef = useRef(false);

  // Restore scroll on mount
  useEffect(() => {
    const restoreScroll = () => {
      if (restoredRef.current) return;
      
      try {
        const saved = sessionStorage.getItem(scrollKey);
        if (saved) {
          const scrollY = parseInt(saved, 10);
          if (containerRef?.current) {
            containerRef.current.scrollTop = scrollY;
          } else {
            window.scrollTo(0, scrollY);
          }
          restoredRef.current = true;
        }
      } catch {
        // Ignore
      }
    };

    // Delay to ensure content is rendered
    const timer = setTimeout(restoreScroll, 100);
    return () => clearTimeout(timer);
  }, [scrollKey, containerRef]);

  // Save scroll on scroll
  useEffect(() => {
    const handleScroll = () => {
      try {
        const scrollY = containerRef?.current 
          ? containerRef.current.scrollTop 
          : window.scrollY;
        sessionStorage.setItem(scrollKey, String(scrollY));
      } catch {
        // Ignore
      }
    };

    const target = containerRef?.current || window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [scrollKey, containerRef]);
}

// Hook to track last viewed tab per entity
export function useTabPersistence(entityType: string, entityId?: string) {
  const key = entityId ? `${entityType}:${entityId}:tab` : `${entityType}:tab`;
  
  const getPersistedTab = useCallback(() => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const setPersistedTab = useCallback((tab: string) => {
    try {
      localStorage.setItem(key, tab);
    } catch {
      // Ignore
    }
  }, [key]);

  return { getPersistedTab, setPersistedTab };
}
