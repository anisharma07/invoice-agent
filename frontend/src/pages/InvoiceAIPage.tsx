import { useState, useCallback, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { SpreadsheetContainer, type SpreadsheetAPI, AIChat, PDFExportModal, type PDFSettings } from '../components/socialcalc-editor';
import { agentService } from '../components/socialcalc-editor/services/agentService';
import { pdfService } from '../components/socialcalc-editor/services/pdfService';
import './InvoiceAIPage.css';
import { storageApi } from '../services/storage-api';
import MappingGeneratorModal from '../components/MappingGenerator/MappingGeneratorModal';
import { useAuth } from '../contexts/AuthContext';
import { AppMappingItem } from '../types/template';
import { IonSpinner } from '@ionic/react';

const InvoiceAIPage: React.FC = () => {
    const { user } = useAuth();
    const [spreadsheetApi, setSpreadsheetApi] = useState<SpreadsheetAPI | null>(null);
    const [currentMapping, setCurrentMapping] = useState<{ [key: string]: AppMappingItem }>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [templateName, setTemplateName] = useState<string>('Template');
    const [pdfSettings, setPdfSettings] = useState<PDFSettings | undefined>(undefined);
    const [originalTemplateId, setOriginalTemplateId] = useState<string | number | undefined>(undefined);
    const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const { templateId } = useParams<{ templateId?: string }>();
    const location = useLocation<{ mscCode?: string; templateId?: number }>();

    useEffect(() => {
        if (!spreadsheetApi) return;

        const loadTemplate = async () => {
            setIsLoading(true);
            // priority 1: URL parameter
            if (templateId) {
                console.log('Loading template from URL param:', templateId);

                // Check if it looks like a user template (filename/string vs numeric ID)
                const isUserTemplate = isNaN(Number(templateId));

                if (isUserTemplate || templateId.endsWith('.json')) {
                    // It's a user invoice/template file
                    try {
                        let isLoaded = false;
                        const userId = user?.sub || 'default_user';

                        // Normalize ID: ensure it ends with .json if checking file
                        const targetFilename = templateId.endsWith('.json') ? templateId : `${templateId}.json`;

                        // 1. Try loading as a Template first (from templates/data/)
                        const template = await storageApi.fetchTemplate(targetFilename, false, userId);
                        if (template) {
                            // Extract MSC Code
                            let mscCode = '';
                            if (template.msc) {
                                const currentSheetId = template.msc.currentid || 'sheet1';
                                const sheet = template.msc.sheetArr?.[currentSheetId];
                                mscCode = sheet?.sheetstr?.savestr;
                            } else if (template.savestr) {
                                mscCode = template.savestr;
                            }

                            if (mscCode) {
                                setTemplateName(template.name || templateId.replace('.json', ''));
                                spreadsheetApi.loadData(mscCode);
                                setOriginalTemplateId(targetFilename);

                                // Load app mapping if exists
                                const currentSheetId = template.msc?.currentid || 'sheet1';
                                if (template.appMapping && template.appMapping[currentSheetId]) {
                                    setCurrentMapping(template.appMapping[currentSheetId]);
                                }

                                isLoaded = true;
                                setIsDataLoaded(true);
                            }
                        }

                        if (!isLoaded) {
                            // 2. Fallback to fetchInvoice (invoices/)
                            const invoice = await storageApi.fetchInvoice(targetFilename, userId);
                            if (invoice) {
                                if (invoice.template_id) {
                                    setOriginalTemplateId(invoice.template_id);
                                }

                                if (invoice.content) {
                                    // Check for PDF settings
                                    if (invoice.content.pdfSettings) {
                                        setPdfSettings(invoice.content.pdfSettings);
                                    }

                                    // Assuming content saves as { savestr: ... } or { sheetArr: ... }
                                    let mscCode = '';
                                    if (invoice.content.savestr) {
                                        mscCode = invoice.content.savestr;
                                    } else if (invoice.content.sheetArr) {
                                        const currentId = invoice.content.currentid || 'sheet1';
                                        mscCode = invoice.content.sheetArr[currentId]?.sheetstr?.savestr;
                                    }

                                    if (mscCode) {
                                        setTemplateName(invoice.filename?.replace('.json', '') || templateId);
                                        spreadsheetApi.loadData(mscCode);
                                        setIsDataLoaded(true);
                                        setIsLoading(false);
                                        return; // Success
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Error loading user template", err);
                    }
                } else {
                    // It's a store template ID (fetch from cloud)
                    try {
                        const template = await storageApi.fetchTemplate(templateId);
                        if (template && template.msc) {
                            setTemplateName(template.name || `Template ${templateId}`);
                            // Assuming standard template structure
                            const currentSheetId = template.msc.currentid || 'sheet1';
                            // Handle optional chaining safely
                            const sheet = template.msc.sheetArr?.[currentSheetId];
                            const mscCode = sheet?.sheetstr?.savestr;

                            if (mscCode) {
                                spreadsheetApi.loadData(mscCode);
                                setOriginalTemplateId(templateId); // Track origin

                                // Load app mapping if exists
                                const currentSheetId = template.msc?.currentid || 'sheet1';
                                if (template.appMapping && template.appMapping[currentSheetId]) {
                                    setCurrentMapping(template.appMapping[currentSheetId]);
                                }
                                setIsDataLoaded(true);
                            } else {
                                console.error("Invalid MSC structure in fetched template");
                                alert("Error: Invalid template data from server.");
                            }
                        } else {
                            console.error("Template not found or invalid response:", templateId);
                            alert("Template not found on server.");
                        }
                    } catch (err) {
                        console.error("Error fetching store template:", err);
                        alert("Failed to load template from server.");
                    }
                }
            }
            // priority 2: Navigation state (legacy support or if used elsewhere)
            else if (location.state?.mscCode) {
                console.log('Loading template from navigation state:', location.state.templateId);
                try {
                    spreadsheetApi.loadData(location.state.mscCode);
                    setIsDataLoaded(true);
                } catch (err) {
                    console.error('Error loading template MSC:', err);
                }
            } else {
                // No template to load, mark as ready
                setIsDataLoaded(true);
            }
            setIsLoading(false);
        };

        loadTemplate();
    }, [spreadsheetApi, templateId, location.state]);

    const handleSavePDFSettings = useCallback(async (settings: PDFSettings) => {
        if (!templateId || !spreadsheetApi) return;

        // Only allow saving for user templates (filenames)
        if (!isNaN(Number(templateId)) && !templateId.endsWith('.json')) {
            alert("Cannot save settings to a store template. Please import it first.");
            return;
        }

        try {
            const currentData = spreadsheetApi.getData(); // Get MSC string
            const contentToSave = {
                savestr: currentData,
                pdfSettings: settings
            };

            const success = await storageApi.saveInvoice(
                templateId,
                contentToSave,
                originalTemplateId || ''
            );

            if (success) {
                setPdfSettings(settings);
                alert("Settings saved to template!");
            } else {
                alert("Failed to save settings.");
            }
        } catch (error) {
            console.error("Error saving PDF settings:", error);
            alert("Error saving settings.");
        }
    }, [templateId, spreadsheetApi, originalTemplateId]);

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
        if (!isDataLoaded) {
            alert('Template data is still loading. Please wait.');
            return;
        }
        setIsPDFModalOpen(true);
    }, [spreadsheetApi, isDataLoaded]);

    return (
        <div>
            {/* Loading State */}
            {isLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--ion-background-color, #fff)',
                    zIndex: 9999
                }}>
                    <IonSpinner name="crescent" style={{ width: '48px', height: '48px' }} />
                    <p style={{ marginTop: '16px', color: 'var(--ion-color-medium)' }}>Loading template...</p>
                </div>
            )}

            <div className="invoice-ai-app" style={{ opacity: isDataLoaded ? 1 : 0.3, pointerEvents: isDataLoaded ? 'auto' : 'none' }}>
                <header className="invoice-ai-header">
                    <h1>Editing Template: {templateName}</h1>
                    <div className="header-actions">
                        <button onClick={handleOpenPDFModal} disabled={!spreadsheetApi || !isDataLoaded}>
                            Export PDF
                        </button>
                        <button onClick={() => setIsMappingModalOpen(true)} style={{ marginLeft: '10px', backgroundColor: '#5260ff', color: 'white' }} disabled={!isDataLoaded}>
                            Create Mapping
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
                    onSaveSettings={handleSavePDFSettings}
                    initialSettings={pdfSettings}
                    sheetData={spreadsheetApi?.getData() || null}
                    isGenerating={isGeneratingPDF}
                    getSheetHTML={spreadsheetApi?.getHTML}
                />

                <MappingGeneratorModal
                    isOpen={isMappingModalOpen}
                    onClose={() => setIsMappingModalOpen(false)}
                    initialData={currentMapping}
                    mscCode={spreadsheetApi?.getData() || undefined}
                />
            </div>
        </div>
    );
};

export default InvoiceAIPage;
