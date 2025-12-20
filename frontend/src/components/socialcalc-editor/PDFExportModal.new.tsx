import { useState, useCallback, useEffect } from 'react';
import './PDFExportModal.css';

export interface PDFSettings {
  orientation: 'portrait' | 'landscape';
  paperSize: 'a4' | 'letter' | 'legal';
  scale: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fitToPage: boolean;
  includeGridlines: boolean;
  printRange: 'current' | 'all' | 'selection';
  customRange?: string;
}

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: PDFSettings) => Promise<void>;
  sheetData: string | null;
  isGenerating: boolean;
}

const DEFAULT_SETTINGS: PDFSettings = {
  orientation: 'portrait',
  paperSize: 'a4',
  scale: 100,
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  fitToPage: false,
  includeGridlines: true,
  printRange: 'current',
};

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  sheetData,
  isGenerating,
}) => {
  const [settings, setSettings] = useState<PDFSettings>(DEFAULT_SETTINGS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSettings(DEFAULT_SETTINGS);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen, previewUrl]);

  const handleSettingChange = useCallback(
    <K extends keyof PDFSettings>(key: K, value: PDFSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleMarginChange = useCallback(
    (side: keyof PDFSettings['margins'], value: number) => {
      setSettings((prev) => ({
        ...prev,
        margins: {
          ...prev.margins,
          [side]: value,
        },
      }));
    },
    []
  );

  const handleExport = useCallback(async () => {
    await onExport(settings);
  }, [onExport, settings]);

  if (!isOpen) return null;

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <h2>Print settings</h2>
          <button className="pdf-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="pdf-modal-body">
          {/* Left Panel - Preview */}
          <div className="pdf-preview-panel">
            <div className="pdf-preview-header">
              <span>Total: 1 page</span>
            </div>
            <div className="pdf-preview-container">
              {isGenerating ? (
                <div className="pdf-preview-loading">
                  <div className="spinner-large" />
                  <p>Generating preview...</p>
                </div>
              ) : (
                <div
                  className={`pdf-preview-page ${settings.orientation}`}
                  style={{
                    transform: `scale(${Math.min(1, 600 / (settings.orientation === 'portrait' ? 842 : 595))})`,
                  }}
                >
                  <div
                    className="pdf-preview-content"
                    style={{
                      padding: `${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm`,
                    }}
                  >
                    <div className="pdf-preview-placeholder">
                      <p>Preview will appear here</p>
                      <small>Click "Generate Preview" to see your sheet</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="pdf-preview-controls">
              <button
                className="pdf-btn-secondary"
                onClick={handleExport}
                disabled={isGenerating || !sheetData}
              >
                Generate Preview
              </button>
            </div>
          </div>

          {/* Right Panel - Settings */}
          <div className="pdf-settings-panel">
            {/* Export Section */}
            <div className="pdf-setting-section">
              <h3>Export</h3>
              <div className="pdf-control-group">
                <label>Sheet to export</label>
                <select
                  value={settings.printRange}
                  onChange={(e) =>
                    handleSettingChange('printRange', e.target.value as PDFSettings['printRange'])
                  }
                >
                  <option value="current">Current sheet</option>
                  <option value="all">All sheets</option>
                  <option value="selection">Selection</option>
                </select>
              </div>
            </div>

            {/* Paper Size Section */}
            <div className="pdf-setting-section">
              <h3>Paper size</h3>
              <div className="pdf-control-group">
                <select
                  value={settings.paperSize}
                  onChange={(e) =>
                    handleSettingChange('paperSize', e.target.value as PDFSettings['paperSize'])
                  }
                >
                  <option value="a4">A4 (21.0 cm x 29.7 cm)</option>
                  <option value="letter">Letter (21.6 cm x 27.9 cm)</option>
                  <option value="legal">Legal (21.6 cm x 35.6 cm)</option>
                </select>
              </div>
            </div>

            {/* Page Orientation Section */}
            <div className="pdf-setting-section">
              <h3>Page orientation</h3>
              <div className="pdf-radio-group">
                <label className="pdf-radio-label">
                  <input
                    type="radio"
                    name="orientation"
                    value="landscape"
                    checked={settings.orientation === 'landscape'}
                    onChange={(e) => handleSettingChange('orientation', 'landscape')}
                  />
                  <span className="pdf-radio-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <rect x="2" y="6" width="20" height="12" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </span>
                  <span>Landscape</span>
                </label>
                <label className="pdf-radio-label">
                  <input
                    type="radio"
                    name="orientation"
                    value="portrait"
                    checked={settings.orientation === 'portrait'}
                    onChange={(e) => handleSettingChange('orientation', 'portrait')}
                  />
                  <span className="pdf-radio-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <rect x="6" y="2" width="12" height="20" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </span>
                  <span>Portrait</span>
                </label>
              </div>
            </div>

            {/* Scale Section */}
            <div className="pdf-setting-section">
              <h3>Scale</h3>
              <div className="pdf-control-group">
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.fitToPage}
                    onChange={(e) => handleSettingChange('fitToPage', e.target.checked)}
                  />
                  <span>Fit to page width (100%)</span>
                </label>
              </div>
              {!settings.fitToPage && (
                <div className="pdf-control-group">
                  <label>Custom scale</label>
                  <div className="pdf-scale-control">
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="5"
                      value={settings.scale}
                      onChange={(e) => handleSettingChange('scale', parseInt(e.target.value))}
                    />
                    <span className="pdf-scale-value">{settings.scale}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Margins Section */}
            <div className="pdf-setting-section">
              <h3>Margins</h3>
              <div className="pdf-margins-grid">
                <div className="pdf-margin-control">
                  <label>Top</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.margins.top}
                    onChange={(e) => handleMarginChange('top', parseFloat(e.target.value))}
                  />
                  <span>mm</span>
                </div>
                <div className="pdf-margin-control">
                  <label>Right</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.margins.right}
                    onChange={(e) => handleMarginChange('right', parseFloat(e.target.value))}
                  />
                  <span>mm</span>
                </div>
                <div className="pdf-margin-control">
                  <label>Bottom</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.margins.bottom}
                    onChange={(e) => handleMarginChange('bottom', parseFloat(e.target.value))}
                  />
                  <span>mm</span>
                </div>
                <div className="pdf-margin-control">
                  <label>Left</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.margins.left}
                    onChange={(e) => handleMarginChange('left', parseFloat(e.target.value))}
                  />
                  <span>mm</span>
                </div>
              </div>
              <button className="pdf-btn-link" onClick={() => handleSettingChange('margins', { top: 10, right: 10, bottom: 10, left: 10 })}>
                Reset to Normal
              </button>
            </div>

            {/* Formatting Section */}
            <div className="pdf-setting-section">
              <h3>Formatting</h3>
              <div className="pdf-control-group">
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.includeGridlines}
                    onChange={(e) => handleSettingChange('includeGridlines', e.target.checked)}
                  />
                  <span>Show gridlines</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="pdf-modal-footer">
          <button className="pdf-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pdf-btn-primary"
            onClick={handleExport}
            disabled={isGenerating || !sheetData}
          >
            {isGenerating ? (
              <>
                <span className="spinner-small" />
                Exporting...
              </>
            ) : (
              'Export PDF'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFExportModal;
