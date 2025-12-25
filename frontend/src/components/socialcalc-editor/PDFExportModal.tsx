import { useState, useCallback, useEffect } from 'react';
import { pdfService } from './services/pdfService';
import './PDFExportModal.css';

export interface PDFSettings {
  orientation: 'portrait' | 'landscape';
  paperSize: 'a4' | 'a3' | 'a5' | 'b4' | 'b5' | 'letter' | 'legal' | 'tabloid' | 'statement' | 'executive' | 'folio';
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
  // Header/Footer settings
  header: {
    left: string;
    center: string;
    right: string;
  };
  footer: {
    left: string;
    center: string;
    right: string;
  };
  // Header/Footer toggles
  showPageNumbers: boolean;
  showSheetName: boolean;
  showWorkbookTitle: boolean;
  showCurrentDate: boolean;
  showCurrentTime: boolean;
}

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: PDFSettings) => Promise<void>;
  onSaveSettings?: (settings: PDFSettings) => Promise<void>;
  initialSettings?: PDFSettings;
  sheetData: string | null;
  isGenerating: boolean;
  getSheetHTML?: () => string | null;
  templateName?: string;
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
  includeGridlines: false,
  printRange: 'current',
  header: {
    left: '',
    center: '',
    right: '',
  },
  footer: {
    left: '',
    center: '',
    right: '',
  },
  showPageNumbers: true,
  showSheetName: true,
  showWorkbookTitle: false,
  showCurrentDate: true,
  showCurrentTime: false,
};

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onSaveSettings,
  initialSettings,
  sheetData,
  isGenerating,
  getSheetHTML,
  templateName = 'Document',
}) => {
  const [settings, setSettings] = useState<PDFSettings>(initialSettings || DEFAULT_SETTINGS);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [currentPdfBase64, setCurrentPdfBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Update settings when initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  // Generate PDF preview from backend only when modal opens (initial load)
  useEffect(() => {
    if (isOpen && getSheetHTML) {
      loadPdfPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only trigger on modal open, not on settings change

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const loadPdfPreview = async () => {
    if (!getSheetHTML) {
      console.warn('⚠️ getSheetHTML not available');
      return;
    }

    const html = getSheetHTML();
    if (!html) {
      console.warn('⚠️ No HTML available from sheet');
      return;
    }

    setIsLoadingPreview(true);
    try {
      // Call backend to generate PDF
      const result = await pdfService.generatePDFFromHTML({
        sheetHTML: html,
        settings: settings,
      });

      if (result.success && result.data?.pdf) {
        // Store base64 for download
        setCurrentPdfBase64(result.data.pdf);

        // Convert base64 to blob URL for preview
        const byteCharacters = atob(result.data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // Revoke old URL if exists
        if (pdfPreviewUrl) {
          URL.revokeObjectURL(pdfPreviewUrl);
        }

        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
        console.log('✅ PDF preview loaded from backend');
      } else {
        console.error('❌ Failed to generate PDF:', result.error);
        setPdfPreviewUrl(null);
        setCurrentPdfBase64(null);
      }
    } catch (error) {
      console.error('❌ Error loading PDF preview:', error);
      setPdfPreviewUrl(null);
      setCurrentPdfBase64(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset logic: if initialSettings exist, revert to them, else default
      setSettings(initialSettings || DEFAULT_SETTINGS);
      setZoom(100);
      setPdfPreviewUrl(null);
      setCurrentPdfBase64(null);
    }
  }, [isOpen, initialSettings]);

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

  const handleHeaderChange = useCallback(
    (position: 'left' | 'center' | 'right', value: string) => {
      setSettings((prev) => ({
        ...prev,
        header: {
          ...prev.header,
          [position]: value,
        },
      }));
    },
    []
  );

  const handleFooterChange = useCallback(
    (position: 'left' | 'center' | 'right', value: string) => {
      setSettings((prev) => ({
        ...prev,
        footer: {
          ...prev.footer,
          [position]: value,
        },
      }));
    },
    []
  );

  const handleSaveToTemplate = async () => {
    if (onSaveSettings) {
      setIsSaving(true);
      try {
        await onSaveSettings(settings);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDownload = useCallback(() => {
    if (!currentPdfBase64) {
      console.error('No PDF to download');
      return;
    }

    try {
      // Convert base64 to blob and download
      const byteCharacters = atob(currentPdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spreadsheet_${settings.paperSize}_${settings.orientation}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ PDF downloaded');
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert('Failed to download PDF.');
    }
  }, [currentPdfBase64, settings.paperSize, settings.orientation]);

  // Removed zoom controls - PDF embed has its own controls

  if (!isOpen) return null;

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <h2>Export PDF</h2>
          <div className="pdf-header-actions">
            {onSaveSettings && (
              <button
                className="pdf-btn-secondary"
                onClick={handleSaveToTemplate}
                disabled={isSaving}
                style={{ marginRight: '10px' }}
              >
                {isSaving ? 'Saving...' : 'Save to Template'}
              </button>
            )}
            <button
              className="pdf-btn-primary"
              onClick={handleDownload}
              disabled={isLoadingPreview || !currentPdfBase64}
              title="Download the PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
            <button className="pdf-close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="pdf-modal-body">
          <div className="pdf-preview-panel">
            <div className="pdf-preview-container pdf-preview-fullframe">
              {isLoadingPreview || isGenerating ? (
                <div className="pdf-preview-loading">
                  <div className="spinner-large" />
                  <p>{isGenerating ? 'Generating PDF...' : 'Loading preview...'}</p>
                </div>
              ) : pdfPreviewUrl ? (
                <embed
                  src={pdfPreviewUrl}
                  type="application/pdf"
                  className="pdf-preview-embed-fullframe"
                />
              ) : (
                <div className="empty-sheet">
                  <p>No preview available</p>
                  <small>Make sure the backend is running</small>
                </div>
              )}
            </div>
          </div>

          <div className="pdf-settings-panel">
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
                  <option value="all" disabled>All sheets (coming soon)</option>
                  <option value="selection" disabled>Selection (coming soon)</option>
                </select>
              </div>
            </div>

            <div className="pdf-setting-section">
              <h3>Paper size</h3>
              <div className="pdf-control-group">
                <select
                  value={settings.paperSize}
                  onChange={(e) =>
                    handleSettingChange('paperSize', e.target.value as PDFSettings['paperSize'])
                  }
                >
                  <optgroup label="ISO A Series">
                    <option value="a3">A3 (29.7 cm × 42.0 cm)</option>
                    <option value="a4">A4 (21.0 cm × 29.7 cm)</option>
                    <option value="a5">A5 (14.8 cm × 21.0 cm)</option>
                  </optgroup>
                  <optgroup label="ISO B Series">
                    <option value="b4">B4 (25.0 cm × 35.3 cm)</option>
                    <option value="b5">B5 (17.6 cm × 25.0 cm)</option>
                  </optgroup>
                  <optgroup label="US/Imperial">
                    <option value="letter">Letter (21.6 cm × 27.9 cm)</option>
                    <option value="legal">Legal (21.6 cm × 35.6 cm)</option>
                    <option value="tabloid">Tabloid (27.9 cm × 43.2 cm)</option>
                    <option value="statement">Statement (14.0 cm × 21.6 cm)</option>
                    <option value="executive">Executive (18.4 cm × 26.7 cm)</option>
                    <option value="folio">Folio (21.6 cm × 33.0 cm)</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="pdf-setting-section">
              <h3>Page orientation</h3>
              <div className="pdf-radio-group">
                <label className="pdf-radio-label">
                  <input
                    type="radio"
                    name="orientation"
                    value="landscape"
                    checked={settings.orientation === 'landscape'}
                    onChange={() => handleSettingChange('orientation', 'landscape')}
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
                    onChange={() => handleSettingChange('orientation', 'portrait')}
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

            <div className="pdf-setting-section">
              <h3>Options</h3>
              <div className="pdf-control-group">
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.includeGridlines}
                    onChange={(e) => handleSettingChange('includeGridlines', e.target.checked)}
                  />
                  <span>Include gridlines</span>
                </label>
              </div>
            </div>

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
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
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
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
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
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
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
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                  />
                  <span>mm</span>
                </div>
              </div>
              <button className="pdf-btn-link" onClick={() => handleSettingChange('margins', { top: 10, right: 10, bottom: 10, left: 10 })}>
                Reset to Normal
              </button>
            </div>

            {/* Headers & Footers Section */}
            <div className="pdf-setting-section">
              <h3>Headers & Footers</h3>

              {/* Toggle Options */}
              <div className="pdf-control-group" style={{ marginBottom: '16px' }}>
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showPageNumbers}
                    onChange={(e) => handleSettingChange('showPageNumbers', e.target.checked)}
                  />
                  <span>Page numbers</span>
                </label>
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showSheetName}
                    onChange={(e) => handleSettingChange('showSheetName', e.target.checked)}
                  />
                  <span>Sheet name</span>
                </label>
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showWorkbookTitle}
                    onChange={(e) => handleSettingChange('showWorkbookTitle', e.target.checked)}
                  />
                  <span>Workbook title</span>
                </label>
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showCurrentDate}
                    onChange={(e) => handleSettingChange('showCurrentDate', e.target.checked)}
                  />
                  <span>Current date</span>
                </label>
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.showCurrentTime}
                    onChange={(e) => handleSettingChange('showCurrentTime', e.target.checked)}
                  />
                  <span>Current time</span>
                </label>
              </div>

              {/* Header Inputs */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Header</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Left"
                    value={settings.header.left}
                    onChange={(e) => handleHeaderChange('left', e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="Center"
                    value={settings.header.center}
                    onChange={(e) => handleHeaderChange('center', e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="Right"
                    value={settings.header.right}
                    onChange={(e) => handleHeaderChange('right', e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Footer Inputs */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Footer</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Left"
                    value={settings.footer.left}
                    onChange={(e) => handleFooterChange('left', e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="Center"
                    value={settings.footer.center}
                    onChange={(e) => handleFooterChange('center', e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="Right"
                    value={settings.footer.right}
                    onChange={(e) => handleFooterChange('right', e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>

            {/* JSON Preview Section */}
            <div className="pdf-setting-section">
              <div
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <h3 style={{ margin: 0 }}>Export Options JSON</h3>
                <span style={{ fontSize: '12px', color: '#666' }}>{showJsonPreview ? '▲' : '▼'}</span>
              </div>
              {showJsonPreview && (
                <div style={{ marginTop: '12px' }}>
                  <pre style={{
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '11px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {JSON.stringify(settings, null, 2)}
                  </pre>
                  <button
                    className="pdf-btn-link"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
                      alert('JSON copied to clipboard!');
                    }}
                    style={{ marginTop: '8px' }}
                  >
                    Copy JSON
                  </button>
                </div>
              )}
            </div>

            {/* Apply Changes Button */}
            <div className="pdf-setting-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <button
                className="pdf-btn-primary"
                onClick={() => loadPdfPreview()}
                disabled={isLoadingPreview}
                style={{ width: '100%' }}
              >
                {isLoadingPreview ? (
                  <>
                    <span className="spinner-small" />
                    Generating...
                  </>
                ) : (
                  'Apply Changes'
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PDFExportModal;
