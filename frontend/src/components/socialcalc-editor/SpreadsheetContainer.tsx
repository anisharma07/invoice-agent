import React, { useEffect } from 'react';
import { useSocialCalc, type SocialCalcConfig } from './hooks/useSocialCalc';
import { useLocalPersistence } from './hooks/useLocalPersistence';
import { SpreadsheetEditor } from './SpreadsheetEditor';
import { WorkbookControl } from './WorkbookControl';

export interface SpreadsheetAPI {
  getData: () => string | null;
  loadData: (data: string) => void;
  executeCommand: (cmd: string, params?: string) => void;
  saveToLocal: () => void;
  clearLocal: () => void;
  getHTML: () => string | null;
}

interface SpreadsheetContainerProps {
  config?: SocialCalcConfig;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (api: SpreadsheetAPI) => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
  skipInitialLoad?: boolean;
}

/**
 * Main container component for the SocialCalc spreadsheet.
 * Handles loading, initialization, and provides a clean API.
 */
export const SpreadsheetContainer: React.FC<SpreadsheetContainerProps> = ({
  config,
  className,
  style,
  onReady,
  autoSave = true,
  autoSaveInterval = 30000,
  skipInitialLoad = false,
}) => {
  const {
    status,
    error,
    getSheetData,
    loadSheetData,
    executeCommand,
    getSheetHTML,
  } = useSocialCalc(config);

  const { saveToLocal, clearLocal, loadFromLocal, hasLocalData } = useLocalPersistence(
    getSheetData,
    loadSheetData,
    { autoSave, autoSaveInterval, skipInitialLoad }
  );

  // Load saved data when spreadsheet is ready if skipInitialLoad is false
  useEffect(() => {
    if (skipInitialLoad) return;

    if (status === 'loaded' && hasLocalData()) {
      const savedData = loadFromLocal();
      if (savedData) {
        // Small delay to ensure SocialCalc is fully initialized
        const timer = setTimeout(() => {
          loadSheetData(savedData);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [status, hasLocalData, loadFromLocal, loadSheetData, skipInitialLoad]);

  // Expose API when ready
  useEffect(() => {
    if (status === 'loaded' && onReady) {
      onReady({
        getData: getSheetData,
        loadData: loadSheetData,
        executeCommand,
        saveToLocal,
        clearLocal,
        getHTML: getSheetHTML,
      });
    }
  }, [status, onReady, getSheetData, loadSheetData, executeCommand, saveToLocal, clearLocal, getSheetHTML]);

  if (status === 'error') {
    return (
      <div
        className="spreadsheet-error"
        style={{
          padding: 20,
          color: '#dc3545',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: 4,
          margin: 10,
        }}
      >
        <strong>Error loading spreadsheet:</strong> {error?.message || 'Unknown error'}
        <br />
        <small>Please refresh the page and try again.</small>
      </div>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <div
        className="spreadsheet-loading"
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#666',
        }}
      >
        <div style={{ marginBottom: 10 }}>Loading spreadsheet...</div>
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }}
        />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div
      className={`spreadsheet-container ${className || ''}`}
      style={{
        backgroundColor: '#FFF',
        height: '100%',
        ...style,
      }}
    >
      <WorkbookControl id="workbookControl" />
      <SpreadsheetEditor id="tableeditor" />
    </div>
  );
};

export default SpreadsheetContainer;
