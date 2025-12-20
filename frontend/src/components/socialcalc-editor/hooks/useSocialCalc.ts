import { useRef, useEffect, useCallback, useState } from 'react';
import { useScriptLoader, type LoadingStatus } from './useScriptLoader';

// Define interfaces locally to avoid namespace issues with global SocialCalc
export interface SocialCalcConfig {
  defaultSheetName?: string;
  initialData?: string;
  height?: number;
  width?: number;
  spaceBelow?: number;
  editorId?: string;
  workbookControlId?: string;
}

// Use any for the SocialCalc types since they're defined at runtime
export interface SocialCalcInstance {
  spreadsheet: any | null;
  workbook: any | null;
  workbookControl: any | null;
}

export interface UseSocialCalcReturn {
  status: LoadingStatus;
  error: Error | null;
  instance: SocialCalcInstance;
  editorRef: React.RefObject<HTMLDivElement | null>;
  workbookControlRef: React.RefObject<HTMLDivElement | null>;
  getSheetData: () => string | null;
  loadSheetData: (data: string) => void;
  executeCommand: (cmd: string, params?: string) => void;
  getWorkbookInstance: () => any | null;
  getSheetHTML: () => string | null;
}

const DEFAULT_CONFIG: Required<SocialCalcConfig> = {
  defaultSheetName: 'sheet1',  // Must be lowercase to match auto-generated button ID
  initialData: '',
  height: 0,
  width: 0,
  spaceBelow: 20,
  editorId: 'tableeditor',
  workbookControlId: 'workbookControl',
};

// Get SocialCalc from window
const getSocialCalc = () => (window as any).SocialCalc;

/**
 * Main hook for managing SocialCalc lifecycle within React
 */
export function useSocialCalc(config: SocialCalcConfig = {}): UseSocialCalcReturn {
  const { status, error, loadAll } = useScriptLoader();
  const [instance, setInstance] = useState<SocialCalcInstance>({
    spreadsheet: null,
    workbook: null,
    workbookControl: null,
  });

  const editorRef = useRef<HTMLDivElement | null>(null);
  const workbookControlRef = useRef<HTMLDivElement | null>(null);
  const isInitialized = useRef(false);

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Initialize scripts on mount
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Initialize SocialCalc once scripts are loaded
  useEffect(() => {
    if (status !== 'loaded' || isInitialized.current) {
      return;
    }

    // Check if DOM elements exist by ID
    const editorElement = document.getElementById(mergedConfig.editorId);
    const workbookElement = document.getElementById(mergedConfig.workbookControlId);

    if (!editorElement || !workbookElement) {
      console.error('Required DOM elements not found:', {
        editorId: mergedConfig.editorId,
        workbookControlId: mergedConfig.workbookControlId,
        editorFound: !!editorElement,
        workbookFound: !!workbookElement,
      });
      return;
    }

    const SC = getSocialCalc();
    if (!SC) {
      console.error('SocialCalc not available on window');
      return;
    }

    try {
      // Disable backend callbacks (no server integration)
      SC.Callbacks.broadcast = () => { };
      SC.Callbacks.editAutoSave = undefined;

      // Suppress SocialCalc alerts (replace with console warnings)
      const originalAlert = window.alert;
      window.alert = (message: any) => {
        // Only suppress SocialCalc-related alerts
        if (typeof message === 'string' && message.includes('SocialCalc')) {
          console.warn('SocialCalc warning (suppressed):', message);
        } else {
          originalAlert(message);
        }
      };

      // Update image prefixes for asset location
      SC.Constants.defaultImagePrefix = '/legacy/images/sc-';
      if (SC.Popup) {
        SC.Popup.imagePrefix = '/legacy/images/sc-';
      }

      // Create SpreadsheetControl instance
      const spreadsheet = new SC.SpreadsheetControl();

      // Create WorkBook instance
      const workbook = new SC.WorkBook(spreadsheet);
      workbook.InitializeWorkBook(mergedConfig.defaultSheetName);

      // Initialize SpreadsheetControl using the string ID (as in original SocialCalc)
      spreadsheet.InitializeSpreadsheetControl(
        mergedConfig.editorId,
        mergedConfig.height,
        mergedConfig.width,
        mergedConfig.spaceBelow
      );

      spreadsheet.ExecuteCommand('redisplay', '');

      // Create WorkBookControl using the string ID
      const workbookControl = new SC.WorkBookControl(
        workbook,
        mergedConfig.workbookControlId,
        mergedConfig.defaultSheetName
      );
      workbookControl.InitializeWorkBookControl();

      // Trigger initial resize
      spreadsheet.DoOnResize();

      // Load initial data if provided
      if (mergedConfig.initialData) {
        spreadsheet.DecodeSpreadsheetSave(mergedConfig.initialData);
        spreadsheet.ExecuteCommand('redisplay', '');
      }

      setInstance({ spreadsheet, workbook, workbookControl });
      isInitialized.current = true;

      // Store refs
      editorRef.current = editorElement as HTMLDivElement;
      workbookControlRef.current = workbookElement as HTMLDivElement;

      console.log('SocialCalc initialized successfully');
    } catch (err) {
      console.error('Failed to initialize SocialCalc:', err);
    }

    // Cleanup on unmount
    return () => {
      const editor = document.getElementById(mergedConfig.editorId);
      const workbookCtrl = document.getElementById(mergedConfig.workbookControlId);
      if (editor) {
        editor.innerHTML = '';
      }
      if (workbookCtrl) {
        workbookCtrl.innerHTML = '';
      }
      isInitialized.current = false;
      setInstance({
        spreadsheet: null,
        workbook: null,
        workbookControl: null,
      });
    };
  }, [
    status,
    mergedConfig.defaultSheetName,
    mergedConfig.height,
    mergedConfig.width,
    mergedConfig.spaceBelow,
    mergedConfig.initialData,
    mergedConfig.editorId,
    mergedConfig.workbookControlId,
  ]);

  // Handle window resize
  useEffect(() => {
    if (!instance.spreadsheet) {
      return;
    }

    const handleResize = () => {
      instance.spreadsheet?.DoOnResize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [instance.spreadsheet]);

  // API: Get current sheet data
  const getSheetData = useCallback((): string | null => {
    if (!instance.spreadsheet) {
      return null;
    }
    try {
      return instance.spreadsheet.CreateSpreadsheetSave();
    } catch (err) {
      console.error('Failed to get sheet data:', err);
      return null;
    }
  }, [instance.spreadsheet]);

  // API: Load sheet data
  const loadSheetData = useCallback(
    (data: string) => {
      if (!instance.spreadsheet) {
        console.error('❌ Cannot load data: spreadsheet instance not available');
        return;
      }
      try {
        console.log('📥 Loading data into spreadsheet...');
        console.log('Data length:', data.length);
        console.log('Data preview:', data.substring(0, 200));

        const SC = getSocialCalc();
        if (!SC) {
          throw new Error('SocialCalc not available');
        }

        // Try to parse as JSON first (workbook JSON format)
        let isJsonFormat = false;
        try {
          JSON.parse(data);
          isJsonFormat = true;
        } catch {
          isJsonFormat = false;
        }

        if (isJsonFormat) {
          console.log('📋 Detected JSON workbook format, using WorkBookControlLoad');
          // Use the global WorkBookControlLoad function for JSON workbook format
          if (SC.WorkBookControlLoad) {
            SC.WorkBookControlLoad(data);
            console.log('✅ Workbook data loaded successfully');
          } else {
            throw new Error('WorkBookControlLoad not available');
          }
        } else {
          console.log('📄 Detected raw MSC format, converting to JSON and loading');

          // Convert raw MSC savestr to JSON format expected by WorkBookControlLoad
          const sheetName = mergedConfig.defaultSheetName || 'sheet1';
          const jsonData = {
            numsheets: 1,
            currentid: sheetName,
            currentname: sheetName,
            sheetArr: {
              [sheetName]: {
                sheetstr: {
                  savestr: data
                },
                name: sheetName,
                hidden: "0"
              }
            }
          };

          // Use WorkBookControlLoad with the JSON-wrapped data
          if (SC.WorkBookControlLoad) {
            SC.WorkBookControlLoad(JSON.stringify(jsonData));
            console.log('✅ Converted and loaded MSC data successfully');
          } else {
            // Fallback: use DecodeSpreadsheetSave for single sheet
            console.log('⚠️ WorkBookControlLoad not available, using DecodeSpreadsheetSave');
            instance.spreadsheet.DecodeSpreadsheetSave(data);
            instance.spreadsheet.ExecuteCommand('redisplay', '');
            instance.spreadsheet.ExecuteCommand('recalc', '');
            console.log('✅ Data loaded via DecodeSpreadsheetSave');
          }
        }
      } catch (err) {
        console.error('❌ Failed to load sheet data:', err);
        throw err;
      }
    },
    [instance.spreadsheet]
  );

  // API: Execute a command
  const executeCommand = useCallback(
    (cmd: string, params: string = '') => {
      if (!instance.spreadsheet) {
        return;
      }
      try {
        instance.spreadsheet.ExecuteCommand(cmd, params);
      } catch (err) {
        console.error('Failed to execute command:', err);
      }
    },
    [instance.spreadsheet]
  );

  // API: Get workbook instance
  const getWorkbookInstance = useCallback(() => {
    return instance.workbook;
  }, [instance.workbook]);

  // API: Get sheet HTML
  const getSheetHTML = useCallback((): string | null => {
    const SC = getSocialCalc();
    if (!SC || !instance.spreadsheet) {
      console.warn('⚠️ SocialCalc not ready for HTML generation');
      return null;
    }

    try {
      // Use SocialCalc's built-in CreateSheetHTML method
      if (instance.spreadsheet.CreateSheetHTML) {
        const html = instance.spreadsheet.CreateSheetHTML();
        console.log('✅ Generated sheet HTML');
        return html;
      } else {
        console.error('❌ CreateSheetHTML method not available');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to generate sheet HTML:', error);
      return null;
    }
  }, [instance.spreadsheet]);

  return {
    status,
    error,
    instance,
    editorRef,
    workbookControlRef,
    getSheetData,
    loadSheetData,
    executeCommand,
    getWorkbookInstance,
    getSheetHTML,
  };
}
