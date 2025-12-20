import { useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'socialcalc_spreadsheet_data';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export interface UseLocalPersistenceOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  storageKey?: string;
}

export interface UseLocalPersistenceReturn {
  saveToLocal: () => void;
  loadFromLocal: () => string | null;
  clearLocal: () => void;
  hasLocalData: () => boolean;
}

/**
 * Hook for persisting spreadsheet data to localStorage
 */
export function useLocalPersistence(
  getSheetData: () => string | null,
  loadSheetData: (data: string) => void,
  options: UseLocalPersistenceOptions = {}
): UseLocalPersistenceReturn {
  const {
    autoSave = true,
    autoSaveInterval = AUTO_SAVE_INTERVAL,
    storageKey = STORAGE_KEY,
  } = options;

  const hasInitializedRef = useRef(false);

  // Save to localStorage
  const saveToLocal = useCallback(() => {
    const data = getSheetData();
    if (data) {
      try {
        localStorage.setItem(storageKey, data);
        console.log('Spreadsheet saved to localStorage');
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }
  }, [getSheetData, storageKey]);

  // Load from localStorage
  const loadFromLocal = useCallback((): string | null => {
    try {
      return localStorage.getItem(storageKey);
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      return null;
    }
  }, [storageKey]);

  // Clear localStorage
  const clearLocal = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      console.log('Spreadsheet data cleared from localStorage');
    } catch (err) {
      console.error('Failed to clear localStorage:', err);
    }
  }, [storageKey]);

  // Check if local data exists
  const hasLocalData = useCallback((): boolean => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Load saved data on initial mount (only once)
  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    const savedData = loadFromLocal();
    if (savedData) {
      // Small delay to ensure SocialCalc is fully initialized
      const timer = setTimeout(() => {
        loadSheetData(savedData);
        console.log('Loaded spreadsheet from localStorage');
      }, 100);
      return () => clearTimeout(timer);
    }

    hasInitializedRef.current = true;
  }, [loadFromLocal, loadSheetData]);

  // Auto-save on interval
  useEffect(() => {
    if (!autoSave) {
      return;
    }

    const interval = setInterval(saveToLocal, autoSaveInterval);
    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, saveToLocal]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToLocal();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveToLocal]);

  return {
    saveToLocal,
    loadFromLocal,
    clearLocal,
    hasLocalData,
  };
}
