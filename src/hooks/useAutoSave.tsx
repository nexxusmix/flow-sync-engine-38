/**
 * useAutoSave - Hook for auto-saving text fields with debounce
 * Provides: debounced save, local draft persistence, save status indicator
 */

import { useState, useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions {
  /** Unique key for localStorage draft persistence */
  storageKey: string;
  /** Debounce delay in ms (default: 800) */
  debounceMs?: number;
  /** Callback to save the value */
  onSave: (value: string) => Promise<void> | void;
  /** Initial value from database */
  initialValue: string;
  /** Enable local draft persistence (default: true) */
  persistDraft?: boolean;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave({
  storageKey,
  debounceMs = 800,
  onSave,
  initialValue,
  persistDraft = true,
}: UseAutoSaveOptions) {
  // Check for existing draft on mount
  const getDraft = useCallback(() => {
    if (!persistDraft) return null;
    try {
      const draft = localStorage.getItem(`draft:${storageKey}`);
      return draft;
    } catch {
      return null;
    }
  }, [storageKey, persistDraft]);

  const existingDraft = getDraft();
  const [value, setValue] = useState(existingDraft || initialValue);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [hasDraft, setHasDraft] = useState(!!existingDraft && existingDraft !== initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(initialValue);
  const isMountedRef = useRef(true);

  // Update value when initialValue changes (new data from server)
  useEffect(() => {
    if (initialValue !== lastSavedRef.current) {
      setValue(initialValue);
      lastSavedRef.current = initialValue;
      // Clear draft since server has new data
      if (persistDraft) {
        localStorage.removeItem(`draft:${storageKey}`);
        setHasDraft(false);
      }
    }
  }, [initialValue, storageKey, persistDraft]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clearDraft = useCallback(() => {
    if (persistDraft) {
      localStorage.removeItem(`draft:${storageKey}`);
      setHasDraft(false);
    }
  }, [storageKey, persistDraft]);

  const saveDraft = useCallback((val: string) => {
    if (persistDraft && val !== lastSavedRef.current) {
      localStorage.setItem(`draft:${storageKey}`, val);
      setHasDraft(true);
    }
  }, [storageKey, persistDraft]);

  const doSave = useCallback(async (val: string) => {
    // Don't save if value hasn't changed from last saved
    if (val === lastSavedRef.current) {
      setStatus('idle');
      return;
    }

    setStatus('saving');
    try {
      await onSave(val);
      if (isMountedRef.current) {
        lastSavedRef.current = val;
        clearDraft();
        setStatus('saved');
        // Reset to idle after 2 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus('idle');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      if (isMountedRef.current) {
        setStatus('error');
        saveDraft(val); // Keep draft on error
      }
    }
  }, [onSave, clearDraft, saveDraft]);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    saveDraft(newValue);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      doSave(newValue);
    }, debounceMs);
  }, [debounceMs, doSave, saveDraft]);

  // Force save immediately (for blur events, etc.)
  const saveNow = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    doSave(value);
  }, [doSave, value]);

  // Discard draft and revert to saved value
  const discardDraft = useCallback(() => {
    setValue(lastSavedRef.current);
    clearDraft();
  }, [clearDraft]);

  return {
    value,
    setValue: handleChange,
    status,
    saveNow,
    hasDraft,
    discardDraft,
    clearDraft,
  };
}
