import { useState, useCallback, useEffect, useRef } from 'react';
import { pdfService } from './services/pdfService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
}

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: PDFSettings) => Promise<void>;
  sheetData: string | null;
  isGenerating: boolean;
  getSheetHTML?: () => string | null;
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
};

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  sheetData,
  isGenerating,
  getSheetHTML,
}) => {
  const [settings, setSettings] = useState<PDFSettings>(DEFAULT_SETTINGS);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Generate preview when modal opens or settings change
  useEffect(() => {
    if (isOpen && sheetData) {
      loadPreview();
    }
  }, [isOpen, sheetData, settings.orientation, settings.paperSize, settings.scale, settings.fitToPage]);

  const loadPreview = async () => {
    if (!getSheetHTML) {
      console.warn('⚠️ getSheetHTML not available');
      return;
    }

    setIsLoadingPreview(true);
    try {
      // Get HTML directly from SocialCalc
      const html = getSheetHTML();

      if (html) {
        console.log('✅ Got sheet HTML from SocialCalc');

        // Parse the HTML to extract the table
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const table = doc.querySelector('table');

        if (!table) {
          console.error('❌ No table found in HTML');
          setPreviewImage(null);
          setIsLoadingPreview(false);
          return;
        }

        // Get all table HTML (we'll let CSS handle the pagination with page-break)
        const tableHTML = table.outerHTML;

        // Calculate page dimensions in pixels for proper pagination (96 DPI)
        const pageSizes = {
          a3: { portrait: { width: 1123, height: 1587 }, landscape: { width: 1587, height: 1123 } },
          a4: { portrait: { width: 794, height: 1123 }, landscape: { width: 1123, height: 794 } },
          a5: { portrait: { width: 559, height: 794 }, landscape: { width: 794, height: 559 } },
          b4: { portrait: { width: 945, height: 1334 }, landscape: { width: 1334, height: 945 } },
          b5: { portrait: { width: 665, height: 945 }, landscape: { width: 945, height: 665 } },
          letter: { portrait: { width: 816, height: 1056 }, landscape: { width: 1056, height: 816 } },
          legal: { portrait: { width: 816, height: 1344 }, landscape: { width: 1344, height: 816 } },
          tabloid: { portrait: { width: 1056, height: 1632 }, landscape: { width: 1632, height: 1056 } },
          statement: { portrait: { width: 528, height: 816 }, landscape: { width: 816, height: 528 } },
          executive: { portrait: { width: 694, height: 1008 }, landscape: { width: 1008, height: 694 } },
          folio: { portrait: { width: 816, height: 1248 }, landscape: { width: 1248, height: 816 } }
        };

        const pageSize = pageSizes[settings.paperSize][settings.orientation];

        // Convert margin from mm to pixels (approximately 3.78 pixels per mm)
        const marginTop = settings.margins.top * 3.78;
        const marginBottom = settings.margins.bottom * 3.78;
        const contentHeight = pageSize.height - marginTop - marginBottom;

        // Wrap the SocialCalc HTML with proper styling based on settings
        const wrappedHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: auto;
      overflow: visible;
      background: #f0f0f0;
    }

    /* Page container */
    .page-container {
      width: 100%;
      min-height: 100%;
      overflow: visible;
      background: #f0f0f0;
      padding: 20px;
    }

    /* Individual page */
    .page {
      background: white;
      margin: 0 auto 20px auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: relative;
      min-height: auto;
      page-break-after: always;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* Page sizes - show width correctly, allow height to expand */
    /* A Series */
    .page.a3.portrait {
      width: 297mm;
      min-height: 420mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(420mm - 1px), #e0e0e0 calc(420mm - 1px), #e0e0e0 420mm, white 420mm);
      background-size: 100% 420mm;
    }
    .page.a3.landscape {
      width: 420mm;
      min-height: 297mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(297mm - 1px), #e0e0e0 calc(297mm - 1px), #e0e0e0 297mm, white 297mm);
      background-size: 100% 297mm;
    }

    .page.a4.portrait {
      width: 210mm;
      min-height: 297mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(297mm - 1px), #e0e0e0 calc(297mm - 1px), #e0e0e0 297mm, white 297mm);
      background-size: 100% 297mm;
    }
    .page.a4.landscape {
      width: 297mm;
      min-height: 210mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(210mm - 1px), #e0e0e0 calc(210mm - 1px), #e0e0e0 210mm, white 210mm);
      background-size: 100% 210mm;
    }

    .page.a5.portrait {
      width: 148mm;
      min-height: 210mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(210mm - 1px), #e0e0e0 calc(210mm - 1px), #e0e0e0 210mm, white 210mm);
      background-size: 100% 210mm;
    }
    .page.a5.landscape {
      width: 210mm;
      min-height: 148mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(148mm - 1px), #e0e0e0 calc(148mm - 1px), #e0e0e0 148mm, white 148mm);
      background-size: 100% 148mm;
    }

    /* B Series */
    .page.b4.portrait {
      width: 250mm;
      min-height: 353mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(353mm - 1px), #e0e0e0 calc(353mm - 1px), #e0e0e0 353mm, white 353mm);
      background-size: 100% 353mm;
    }
    .page.b4.landscape {
      width: 353mm;
      min-height: 250mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(250mm - 1px), #e0e0e0 calc(250mm - 1px), #e0e0e0 250mm, white 250mm);
      background-size: 100% 250mm;
    }

    .page.b5.portrait {
      width: 176mm;
      min-height: 250mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(250mm - 1px), #e0e0e0 calc(250mm - 1px), #e0e0e0 250mm, white 250mm);
      background-size: 100% 250mm;
    }
    .page.b5.landscape {
      width: 250mm;
      min-height: 176mm;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(176mm - 1px), #e0e0e0 calc(176mm - 1px), #e0e0e0 176mm, white 176mm);
      background-size: 100% 176mm;
    }

    /* US/Imperial Sizes */
    .page.letter.portrait {
      width: 8.5in;
      min-height: 11in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(11in - 1px), #e0e0e0 calc(11in - 1px), #e0e0e0 11in, white 11in);
      background-size: 100% 11in;
    }
    .page.letter.landscape {
      width: 11in;
      min-height: 8.5in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(8.5in - 1px), #e0e0e0 calc(8.5in - 1px), #e0e0e0 8.5in, white 8.5in);
      background-size: 100% 8.5in;
    }

    .page.legal.portrait {
      width: 8.5in;
      min-height: 14in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(14in - 1px), #e0e0e0 calc(14in - 1px), #e0e0e0 14in, white 14in);
      background-size: 100% 14in;
    }
    .page.legal.landscape {
      width: 14in;
      min-height: 8.5in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(8.5in - 1px), #e0e0e0 calc(8.5in - 1px), #e0e0e0 8.5in, white 8.5in);
      background-size: 100% 8.5in;
    }

    .page.tabloid.portrait {
      width: 11in;
      min-height: 17in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(17in - 1px), #e0e0e0 calc(17in - 1px), #e0e0e0 17in, white 17in);
      background-size: 100% 17in;
    }
    .page.tabloid.landscape {
      width: 17in;
      min-height: 11in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(11in - 1px), #e0e0e0 calc(11in - 1px), #e0e0e0 11in, white 11in);
      background-size: 100% 11in;
    }

    .page.statement.portrait {
      width: 5.5in;
      min-height: 8.5in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(8.5in - 1px), #e0e0e0 calc(8.5in - 1px), #e0e0e0 8.5in, white 8.5in);
      background-size: 100% 8.5in;
    }
    .page.statement.landscape {
      width: 8.5in;
      min-height: 5.5in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(5.5in - 1px), #e0e0e0 calc(5.5in - 1px), #e0e0e0 5.5in, white 5.5in);
      background-size: 100% 5.5in;
    }

    .page.executive.portrait {
      width: 7.25in;
      min-height: 10.5in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(10.5in - 1px), #e0e0e0 calc(10.5in - 1px), #e0e0e0 10.5in, white 10.5in);
      background-size: 100% 10.5in;
    }
    .page.executive.landscape {
      width: 10.5in;
      min-height: 7.25in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(7.25in - 1px), #e0e0e0 calc(7.25in - 1px), #e0e0e0 7.25in, white 7.25in);
      background-size: 100% 7.25in;
    }

    .page.folio.portrait {
      width: 8.5in;
      min-height: 13in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(13in - 1px), #e0e0e0 calc(13in - 1px), #e0e0e0 13in, white 13in);
      background-size: 100% 13in;
    }
    .page.folio.landscape {
      width: 13in;
      min-height: 8.5in;
      padding: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      background: linear-gradient(to bottom, white 0%, white calc(8.5in - 1px), #e0e0e0 calc(8.5in - 1px), #e0e0e0 8.5in, white 8.5in);
      background-size: 100% 8.5in;
    }

    /* Table styling */
    table {
      width: 100%;
      border-collapse: collapse;
      ${settings.fitToPage ? '' : `transform: scale(${settings.scale / 100}); transform-origin: top left;`}
    }

    /* Remove gridlines if disabled */
    ${!settings.includeGridlines ? `
    table td,
    table th {
      border: none !important;
    }
    ` : ''}

    /* Print styles */
    @media print {
      html, body {
        background: white;
      }

      .page-container {
        padding: 0;
        background: white;
      }

      .page {
        margin: 0;
        box-shadow: none;
      }

      @page {
        size: ${settings.paperSize} ${settings.orientation};
        margin: ${settings.margins.top}mm ${settings.margins.right}mm ${settings.margins.bottom}mm ${settings.margins.left}mm;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="page ${settings.paperSize} ${settings.orientation}">
${tableHTML}
    </div>
  </div>
</body>
</html>`;

        // Convert to base64 for iframe srcDoc
        setPreviewImage(btoa(unescape(encodeURIComponent(wrappedHTML))));
      } else {
        console.error('❌ Failed to get HTML from SocialCalc');
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('❌ Error loading preview:', error);
      setPreviewImage(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSettings(DEFAULT_SETTINGS);
      setZoom(100);
      setPreviewImage(null);
    }
  }, [isOpen]);

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

  const handleClientExport = useCallback(async () => {
    if (!getSheetHTML) {
      console.error('getSheetHTML not available');
      return;
    }

    try {
      console.log('Starting client-side PDF export...');

      // Get the preview iframe
      const iframe = document.querySelector('.pdf-preview-iframe') as HTMLIFrameElement;
      if (!iframe || !iframe.contentDocument) {
        console.error('Preview iframe not found');
        return;
      }

      const iframeDoc = iframe.contentDocument;
      const pageElement = iframeDoc.querySelector('.page') as HTMLElement;

      if (!pageElement) {
        console.error('Page element not found in iframe');
        return;
      }

      // Paper size mappings in mm for jsPDF
      const paperSizes: Record<string, { width: number; height: number }> = {
        a3: { width: 297, height: 420 },
        a4: { width: 210, height: 297 },
        a5: { width: 148, height: 210 },
        b4: { width: 250, height: 353 },
        b5: { width: 176, height: 250 },
        letter: { width: 216, height: 279 },
        legal: { width: 216, height: 356 },
        tabloid: { width: 279, height: 432 },
        statement: { width: 140, height: 216 },
        executive: { width: 184, height: 267 },
        folio: { width: 216, height: 330 }
      };

      const size = paperSizes[settings.paperSize];
      const width = settings.orientation === 'landscape' ? size.height : size.width;
      const height = settings.orientation === 'landscape' ? size.width : size.height;

      // Capture the page element as canvas
      console.log('Rendering page to canvas...');
      const canvas = await html2canvas(pageElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      console.log('Creating PDF...');
      const pdf = new jsPDF({
        orientation: settings.orientation,
        unit: 'mm',
        format: [width, height]
      });

      // Calculate dimensions to fit the page
      const imgWidth = width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Save PDF
      const filename = `spreadsheet_${settings.paperSize}_${settings.orientation}.pdf`;
      pdf.save(filename);

      console.log('✅ Client-side PDF exported successfully');
    } catch (error) {
      console.error('❌ Error exporting PDF on client:', error);
      alert('Failed to export PDF. Please try the server export option.');
    }
  }, [getSheetHTML, settings]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 10, 50));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(100);
  }, []);

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
          <div className="pdf-preview-panel">
            <div className="pdf-preview-header">
              <span>Preview</span>
              <div className="pdf-zoom-controls">
                <button onClick={handleZoomOut} disabled={zoom <= 50} title="Zoom out">
                  -
                </button>
                <span className="pdf-zoom-level">{zoom}%</span>
                <button onClick={handleZoomIn} disabled={zoom >= 200} title="Zoom in">
                  +
                </button>
                <button onClick={handleZoomReset} className="pdf-zoom-reset" title="Reset zoom">
                  Reset
                </button>
              </div>
            </div>
            <div className="pdf-preview-container">
              {isLoadingPreview || isGenerating ? (
                <div className="pdf-preview-loading">
                  <div className="spinner-large" />
                  <p>{isGenerating ? 'Generating PDF...' : 'Loading preview...'}</p>
                </div>
              ) : previewImage ? (
                <div
                  className={`pdf-preview-page ${settings.orientation}`}
                  style={{
                    transform: `scale(${zoom / 100})`,
                  }}
                >
                  <iframe
                    srcDoc={atob(previewImage)}
                    title="PDF Preview"
                    className="pdf-preview-iframe"
                  />
                </div>
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
                  <option value="all">All sheets</option>
                  <option value="selection">Selection</option>
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
          </div>
        </div>

        <div className="pdf-modal-footer">
          <button className="pdf-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="pdf-btn-primary"
              onClick={handleClientExport}
              disabled={!sheetData}
              title="Export PDF using browser (matches preview exactly)"
            >
              Export Client
            </button>
            <button
              className="pdf-btn-primary"
              onClick={handleExport}
              disabled={isGenerating || !sheetData}
              title="Export PDF using server"
            >
              {isGenerating ? (
                <>
                  <span className="spinner-small" />
                  Exporting...
                </>
              ) : (
                'Export Server'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFExportModal;
