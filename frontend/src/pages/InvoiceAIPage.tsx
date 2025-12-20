import { useState, useCallback, useRef } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { SpreadsheetContainer, type SpreadsheetAPI, AIChat, PDFExportModal, type PDFSettings } from '../components/socialcalc-editor';
import { agentService } from '../components/socialcalc-editor/services/agentService';
import { pdfService } from '../components/socialcalc-editor/services/pdfService';
import './InvoiceAIPage.css';

const InvoiceAIPage: React.FC = () => {
    const [spreadsheetApi, setSpreadsheetApi] = useState<SpreadsheetAPI | null>(null);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReady = useCallback((api: SpreadsheetAPI) => {
        setSpreadsheetApi(api);
        console.log('Spreadsheet is ready!');
    }, []);

    const handleSaveNow = useCallback(() => {
        if (spreadsheetApi) {
            spreadsheetApi.saveToLocal();
            setLastSaved(new Date().toLocaleTimeString());
        }
    }, [spreadsheetApi]);

    const handleClearData = useCallback(() => {
        if (spreadsheetApi && window.confirm('Are you sure you want to clear all saved data?')) {
            spreadsheetApi.clearLocal();
            window.location.reload();
        }
    }, [spreadsheetApi]);

    const handleImportClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
                try {
                    // Get SocialCalc from window
                    const SC = (window as any).SocialCalc;
                    if (SC && SC.WorkBookControlLoad) {
                        SC.WorkBookControlLoad(content);
                        console.log('MSC file loaded successfully');
                    } else {
                        alert('SocialCalc is not ready. Please try again.');
                    }
                } catch (err) {
                    console.error('Failed to load MSC file:', err);
                    alert('Failed to load file. Make sure it is a valid .msc file.');
                }
            }
        };
        reader.readAsText(file);

        // Reset file input so same file can be selected again
        event.target.value = '';
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
                setLastSaved(new Date().toLocaleTimeString());
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
                    <h1>SocialCalc Spreadsheet</h1>
                    <div className="header-actions">
                        <button onClick={handleImportClick} disabled={!spreadsheetApi}>
                            Import MSC
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".msc,.txt"
                            style={{ display: 'none' }}
                        />
                        <button onClick={handleSaveNow} disabled={!spreadsheetApi}>
                            Save Now
                        </button>
                        <button onClick={handleOpenPDFModal} disabled={!spreadsheetApi}>
                            Export PDF
                        </button>
                        <button onClick={handleClearData} disabled={!spreadsheetApi} className="danger">
                            Clear Data
                        </button>
                        {lastSaved && <span className="last-saved">Last saved: {lastSaved}</span>}
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
