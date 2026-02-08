/**
 * useUrlState - Hook for persisting state in URL search params
 * Keeps tabs, filters, selections in sync with URL for back/forward and refresh
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function useUrlState(
  key: string,
  defaultValue: string
): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo(() => {
    const param = searchParams.get(key);
    return param || defaultValue;
  }, [searchParams, key, defaultValue]);

  const setValue = useCallback(
    (newValue: string) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (newValue === defaultValue || newValue === '') {
            updated.delete(key);
          } else {
            updated.set(key, newValue);
          }
          return updated;
        },
        { replace: true }
      );
    },
    [key, defaultValue, setSearchParams]
  );

  return [value, setValue];
}

// For multiple values (like filters)
export function useUrlStateMultiple(
  keys: string[],
  defaults: Record<string, string>
): [Record<string, string>, (key: string, value: string) => void, () => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result: Record<string, string> = {};
    keys.forEach((key) => {
      result[key] = searchParams.get(key) || defaults[key] || "";
    });
    return result;
  }, [searchParams, keys, defaults]);

  const setValue = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (!value || value === defaults[key]) {
            updated.delete(key);
          } else {
            updated.set(key, value);
          }
          return updated;
        },
        { replace: true }
      );
    },
    [defaults, setSearchParams]
  );

  const clearAll = useCallback(() => {
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams(prev);
        keys.forEach((key) => updated.delete(key));
        return updated;
      },
      { replace: true }
    );
  }, [keys, setSearchParams]);

  return [values, setValue, clearAll];
}
