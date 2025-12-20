import type { PDFSettings } from '../PDFExportModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface GeneratePDFRequest {
  sheetData: string;
  settings: PDFSettings;
}

export interface GeneratePDFFromHTMLRequest {
  sheetHTML: string;
  settings: PDFSettings;
}

export interface GeneratePDFResponse {
  success: boolean;
  data?: {
    pdf: string; // base64 encoded PDF
    filename: string;
  };
  error?: string;
}

class PDFService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate a PDF from SocialCalc sheet data
   */
  async generatePDF(request: GeneratePDFRequest): Promise<GeneratePDFResponse> {
    try {
      console.log('📤 Sending PDF generation request to:', `${this.baseUrl}/api/generate-pdf`);
      console.log('Request payload:', {
        sheetDataLength: request.sheetData.length,
        settings: request.settings
      });

      const response = await fetch(`${this.baseUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ PDF generated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error generating PDF:', error);

      // Provide more helpful error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to backend server. Make sure the backend is running on http://localhost:5000';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate a PDF from SocialCalc HTML (same as preview)
   */
  async generatePDFFromHTML(request: GeneratePDFFromHTMLRequest): Promise<GeneratePDFResponse> {
    try {
      console.log('📤 Sending PDF generation request (HTML mode) to:', `${this.baseUrl}/api/generate-pdf-from-html`);

      const response = await fetch(`${this.baseUrl}/api/generate-pdf-from-html`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ PDF generated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error generating PDF:', error);

      // Provide more helpful error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to backend server. Make sure the backend is running on http://localhost:5000';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate preview image from sheet data
   */
  async generatePreview(sheetData: string, settings: any): Promise<{ success: boolean; preview?: string; error?: string }> {
    try {
      console.log('📸 Requesting preview from backend...');

      const response = await fetch(`${this.baseUrl}/api/generate-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetData,
          settings
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success && data.data?.preview) {
        console.log('✅ Preview generated successfully');
        return { success: true, preview: data.data.preview };
      } else {
        return { success: false, error: data.error || 'Failed to generate preview' };
      }
    } catch (error) {
      console.error('❌ Error generating preview:', error);

      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to backend server. Make sure the backend is running on http://localhost:5000';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Download PDF file
   */
  downloadPDF(base64Data: string, filename: string = 'spreadsheet.pdf') {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Get preview URL for PDF
   */
  getPreviewURL(base64Data: string): string {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    return window.URL.createObjectURL(blob);
  }
}

export const pdfService = new PDFService();
