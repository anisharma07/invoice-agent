import { useState, useCallback, useRef } from 'react';
import {
  loadScriptsSequentially,
  loadStylesheets,
  type ScriptConfig,
} from '../../components/socialcalc-editor/utils/scriptLoader';

// SocialCalc scripts must be loaded in this exact order due to dependencies
// This matches the original importcollabload.html load order from Flask app
const SOCIALCALC_SCRIPTS: ScriptConfig[] = [
  { src: '/legacy/js/socialcalcconstants.js' },
  { src: '/legacy/js/socialcalc-3.js' },
  { src: '/legacy/js/socialcalctouch.js' },  // Touch/mouse event handling - must be before tableeditor
  { src: '/legacy/js/socialcalctableeditor.js' },
  { src: '/legacy/js/formatnumber2.js' },
  { src: '/legacy/js/formula1.js' },
  { src: '/legacy/js/socialcalcpopup.js' },
  { src: '/legacy/js/socialcalcspreadsheetcontrol.js' },
  { src: '/legacy/js/socialcalcworkbook.js' },
  { src: '/legacy/js/socialcalcworkbookcontrol.js' },
  { src: '/legacy/js/socialcalcimages.js' },  // Image handling - after workbook control
  { src: '/legacy/js/json2.js' },
  { src: '/legacy/js/jquery.min.js' },
  { src: '/legacy/highslide/highslide/highslide-with-html.min.js' },
];

const SOCIALCALC_STYLES = [
  '/legacy/css/socialcalc.css',
  '/legacy/highslide/highslide/highslide.css',
];

export type LoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface UseScriptLoaderReturn {
  status: LoadingStatus;
  error: Error | null;
  loadAll: () => Promise<void>;
}

/**
 * Hook to load SocialCalc legacy scripts and stylesheets
 */
export function useScriptLoader(): UseScriptLoaderReturn {
  const [status, setStatus] = useState<LoadingStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  const loadAll = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current || status === 'loaded') {
      return;
    }

    loadingRef.current = true;
    setStatus('loading');

    try {
      // Load stylesheets first (non-blocking)
      loadStylesheets(SOCIALCALC_STYLES);

      // Load scripts sequentially (order matters!)
      await loadScriptsSequentially(SOCIALCALC_SCRIPTS);

      // Configure Highslide after it's loaded
      const win = window as any;
      if (win.hs) {
        win.hs.graphicsDir = '/legacy/highslide/highslide/graphics/';
        win.hs.outlineType = 'rounded-white';
        win.hs.showCredits = false;
        win.hs.wrapperClassName = 'draggable-header';
      }

      // Verify SocialCalc is loaded
      if (!win.SocialCalc) {
        throw new Error('SocialCalc failed to initialize');
      }

      setStatus('loaded');
    } catch (err) {
      const loadError = err instanceof Error ? err : new Error(String(err));
      setError(loadError);
      setStatus('error');
      console.error('Failed to load SocialCalc:', loadError);
    } finally {
      loadingRef.current = false;
    }
  }, [status]);

  return { status, error, loadAll };
}
