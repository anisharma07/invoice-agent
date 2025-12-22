import { useState, useCallback, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { SpreadsheetContainer, type SpreadsheetAPI, AIChat, PDFExportModal, type PDFSettings } from '../components/socialcalc-editor';
import { agentService } from '../components/socialcalc-editor/services/agentService';
import { pdfService } from '../components/socialcalc-editor/services/pdfService';
import './InvoiceAIPage.css';
import { DATA } from '../templates';

const InvoiceAIPage: React.FC = () => {
    const [spreadsheetApi, setSpreadsheetApi] = useState<SpreadsheetAPI | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [templateName, setTemplateName] = useState<string>('Template');
    const { templateId } = useParams<{ templateId?: string }>();
    const location = useLocation<{ mscCode?: string; templateId?: number }>();

    useEffect(() => {
        if (!spreadsheetApi) return;

        // priority 1: URL parameter
        if (templateId) {
            console.log('Loading template from URL param:', templateId);
            const tid = parseInt(templateId, 10);
            const templateData = DATA[tid];
            if (templateData && templateData.msc) {
                // Set template name (use category as fallback if name doesn't exist)
                setTemplateName((templateData as any).name || templateData.category || `Template ${tid}`);
                const currentSheetId = templateData.msc.currentid;
                const mscCode = templateData.msc.sheetArr[currentSheetId]?.sheetstr?.savestr;
                if (mscCode) {
                    try {
                        spreadsheetApi.loadData(mscCode);
                    } catch (err) {
                        console.error('Error loading template from URL:', err);
                        alert('Failed to load template data.');
                    }
                }
            } else {
                console.error('Template not found:', tid);
            }
        }
        // priority 2: Navigation state (legacy support or if used elsewhere)
        else if (location.state?.mscCode) {
            console.log('Loading template from navigation state:', location.state.templateId);
            try {
                spreadsheetApi.loadData(location.state.mscCode);
            } catch (err) {
                console.error('Error loading template MSC:', err);
            }
        }
    }, [spreadsheetApi, templateId, location.state]);



    const handleReady = useCallback((api: SpreadsheetAPI) => {
        setSpreadsheetApi(api);
        console.log('Spreadsheet is ready!');
    }, []);

    const handleAIGenerate = useCallback(async (prompt: string) => {
        if (!spreadsheetApi) {
            alert('Spreadsheet is not ready yet. Please wait.');
            return;
        }

        setIsGenerating(true);

        try {
            // Get current sheet data for editing mode (getData returns raw MSC savestr format)
            const currentCode = spreadsheetApi.getData() || '';

            // Call the agent API
            const response = await agentService.generate({
                prompt,
                current_code: currentCode || undefined,
            });

            if (!response.success || !response.data) {
                alert(`Error: ${response.error || 'Failed to generate code'}`);
                return;
            }

            const { savestr, mode, reasoning } = response.data;

            console.log('=== AI Generated Code ===');
            console.log('Mode:', mode);
            console.log('Reasoning:', reasoning);
            console.log('MSC Savestr:', savestr);

            // Show confirmation dialog
            const modeText = mode === 'edit' ? 'modified your current sheet' : 'created a new sheet';
            const confirmed = window.confirm(
                `AI has ${modeText}.\n\n${reasoning}\n\nWould you like to apply these changes?`
            );

            if (!confirmed) {
                console.log('User cancelled AI generation');
                return;
            }

            // Load the generated MSC code directly into the spreadsheet
            console.log('=== Applying MSC code to spreadsheet ===');
            console.log('SpreadsheetAPI:', spreadsheetApi);
            console.log('LoadData function:', spreadsheetApi.loadData);

            try {
                spreadsheetApi.loadData(savestr);
                console.log('✅ LoadData called successfully');
            } catch (error) {
                console.error('❌ Error calling loadData:', error);
                alert(`Error applying code: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return;
            }

            // Save to local storage
            setTimeout(() => {
                spreadsheetApi.saveToLocal();
            }, 500);

            console.log('AI-generated code applied successfully');
        } catch (error) {
            console.error('Error in AI generation:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        } finally {
            setIsGenerating(false);
        }
    }, [spreadsheetApi]);

    const handleExportPDF = useCallback(async (settings: PDFSettings) => {
        if (!spreadsheetApi) {
            alert('Spreadsheet is not ready yet. Please wait.');
            return;
        }

        setIsGeneratingPDF(true);

        try {
            // Get current sheet HTML (same as preview uses)
            const sheetHTML = spreadsheetApi.getHTML();
            if (!sheetHTML) {
                alert('No data to export');
                return;
            }

            console.log('Generating PDF with settings:', settings);

            // Call PDF generation API with HTML
            const response = await pdfService.generatePDFFromHTML({
                sheetHTML,
                settings,
            });

            if (!response.success || !response.data) {
                alert(`Error: ${response.error || 'Failed to generate PDF'}`);
                return;
            }

            // Download the PDF
            pdfService.downloadPDF(response.data.pdf, response.data.filename);

            console.log('PDF downloaded successfully');
            setIsPDFModalOpen(false);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        } finally {
            setIsGeneratingPDF(false);
        }
    }, [spreadsheetApi]);

    const handleOpenPDFModal = useCallback(() => {
        if (!spreadsheetApi) {
            alert('Spreadsheet is not ready yet. Please wait.');
            return;
        }
        setIsPDFModalOpen(true);
    }, [spreadsheetApi]);

    return (
        <div>

            <div className="invoice-ai-app">
                <header className="invoice-ai-header">
                    <h1>Editing Template: {templateName}</h1>
                    <div className="header-actions">
                        <button onClick={handleOpenPDFModal} disabled={!spreadsheetApi}>
                            Export PDF
                        </button>
                    </div>
                </header>
                <main className="invoice-ai-main">
                    <SpreadsheetContainer
                        config={{
                            defaultSheetName: 'sheet1',
                            spaceBelow: 20,
                        }}
                        onReady={handleReady}
                        autoSave={true}
                        autoSaveInterval={30000}
                        skipInitialLoad={!!templateId || !!location.state?.mscCode}
                    />
                    <AIChat onGenerate={handleAIGenerate} isLoading={isGenerating} />
                </main>

                <PDFExportModal
                    isOpen={isPDFModalOpen}
                    onClose={() => setIsPDFModalOpen(false)}
                    onExport={handleExportPDF}
                    sheetData={spreadsheetApi?.getData() || null}
                    isGenerating={isGeneratingPDF}
                    getSheetHTML={spreadsheetApi?.getHTML}
                />
            </div>
        </div>
    );
};

export default InvoiceAIPage;
