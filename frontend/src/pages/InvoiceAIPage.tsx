import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonToast,
    IonButtons,
    IonBackButton,
    IonInput,
    IonSpinner,
    IonTextarea,
    IonItem,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonSelect,
    IonSelectOption,
    IonLabel,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import {
    chatbubbleEllipsesOutline,
    sparklesOutline,
    refreshOutline,
    copyOutline,
    checkmarkOutline,
    flaskOutline,
    chevronForwardOutline,
    chevronBackOutline,
    saveOutline,
    eyeOutline,
    documentTextOutline,
    gridOutline,
    informationCircleOutline,
    createOutline,
    imageOutline,
    phonePortraitOutline,
    tabletPortraitOutline,
    desktopOutline,
    expandOutline,
} from 'ionicons/icons';
import ChatSidebar, { ChatMessage } from '../components/ChatSidebar/ChatSidebar';
import MSCPreview from '../components/MSCPreview/MSCPreview';
import {
    generateInvoice,
    sendChatMessage,
    AIResponse,
    checkHealth,
    TemplateMeta,
    CellMappings,
} from '../services/aiService';
import './InvoiceAIPage.css';
import { saveTestingData, loadTestingData } from '../utils/testingStorage';
import { useHistory } from 'react-router-dom';
import { generateEditableCellsForSheet } from '../utils/editableCellsGenerator';

// Extend Window interface for SocialCalc
declare global {
    interface Window {
        SocialCalc: any;
    }
}

const InvoiceAIPage: React.FC = () => {
    const history = useHistory();

    // Step management
    const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0);
    // Chat visibility state
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Original states
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tokenCount, setTokenCount] = useState(0);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [mscContent, setMscContent] = useState<string>('');
    const [generatedMscJson, setGeneratedMscJson] = useState<any>(null);
    const [rawMsc, setRawMsc] = useState<any>(null);
    const [isCopied, setIsCopied] = useState(false);

    // Editable states for steps 2 and 3
    const [editableCellMappings, setEditableCellMappings] = useState<CellMappings | null>(null);
    const [editableTemplateMeta, setEditableTemplateMeta] = useState<TemplateMeta | null>(null);
    const [originalSavestr, setOriginalSavestr] = useState<string>('');
    const [showEditMappingsModal, setShowEditMappingsModal] = useState(false);

    // Template image state
    const [templateImage, setTemplateImage] = useState<string | null>(null);

    // Check backend health on mount
    useEffect(() => {
        checkBackendHealth();
    }, []);

    // Debug effect to track rawMsc and generatedMscJson changes
    useEffect(() => {
        console.log('🔄 State Update - rawMsc:', {
            isNull: rawMsc === null,
            isUndefined: rawMsc === undefined,
            type: typeof rawMsc,
            value: rawMsc,
        });
    }, [rawMsc]);

    useEffect(() => {
        console.log('🔄 State Update - generatedMscJson:', {
            isNull: generatedMscJson === null,
            isUndefined: generatedMscJson === undefined,
            type: typeof generatedMscJson,
            value: generatedMscJson,
        });
    }, [generatedMscJson]);



    const checkBackendHealth = async () => {
        try {
            await checkHealth();
            setBackendStatus('online');
        } catch (error) {
            setBackendStatus('offline');
            showToastMessage('Backend is offline. Please ensure Docker container is running.');
        }
    };



    const handleAIResponse = (response: AIResponse, userMessage: string, imageData?: string) => {
        console.log('📨 Received AI response:', {
            session_id: response.session_id,
            template_name: response.assistantResponse.templateMeta.name,
            has_savestr: !!response.assistantResponse.savestr,
            is_valid: response.validation.is_valid,
            validation_attempts: response.validation.attempts,
            token_count: response.token_count,
        });

        // Update session ID
        if (response.session_id) {
            setSessionId(response.session_id);
            console.log('✓ Session ID updated:', response.session_id);
        }

        // Update token count
        if (response.token_count) {
            setTokenCount(response.token_count);
            console.log('✓ Token count updated:', response.token_count);
        }

        // Add user message
        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
            imageUrl: imageData,
        };

        // Build assistant message with validation info
        let assistantContent = response.assistantResponse.text;

        // Add validation status to message
        if (!response.validation.is_valid && response.validation.final_errors.length > 0) {
            assistantContent += `\n\n⚠️ Note: Template generated with ${response.validation.final_errors.length} validation warning(s) after ${response.validation.attempts} attempts.`;
        } else if (response.validation.attempts > 1) {
            assistantContent += `\n\n✓ Template validated successfully after ${response.validation.attempts} attempts.`;
        }

        // Add assistant message
        const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date(),
        };

        setMessages((prev) => {
            console.log('✓ Messages updated, count:', prev.length + 2);
            return [...prev, userMsg, assistantMsg];
        });

        // Update MSC content and JSON - always present in new format
        const savestr = response.assistantResponse.savestr;
        console.log('📊 SaveStr present, updating display...');
        setMscContent(savestr);
        setOriginalSavestr(savestr);

        // Generate EditableCells from cellMappings.text using the generator function
        console.log('🔧 Generating editable cells from cellMappings.text');
        const generatedEditableCells = generateEditableCellsForSheet(
            response.assistantResponse.cellMappings.text,
            {
                allowByDefault: true,
                sheetName: 'sheet1',
            }
        );
        console.log('✅ Editable cells generated:', {
            cellCount: Object.keys(generatedEditableCells.cells).length,
            cells: generatedEditableCells.cells,
        });

        // Create clean Raw MSC structure (without metadata/cellMappings/validation)
        const cleanRawMsc = {
            numsheets: 1,
            currentid: 'sheet1',
            currentname: 'sheet1',
            sheetArr: {
                sheet1: {
                    sheetstr: {
                        savestr: savestr,
                    },
                    name: 'sheet1',
                    hidden: 'no',
                },
            },
            EditableCells: generatedEditableCells
        };

        console.log('🔧 Setting rawMsc state with clean data:', {
            numsheets: cleanRawMsc.numsheets,
            currentid: cleanRawMsc.currentid,
            currentname: cleanRawMsc.currentname,
            sheetArrKeys: Object.keys(cleanRawMsc.sheetArr),
            savestrLength: savestr.length,
            savestrPreview: savestr.substring(0, 200),
        });

        // Store clean Raw MSC (for display and testing)
        setRawMsc(cleanRawMsc);

        // Store full MSC data with metadata (for internal use)
        const fullMscData = {
            ...cleanRawMsc,
            templateMeta: response.assistantResponse.templateMeta,
            cellMappings: response.assistantResponse.cellMappings,
            validation: response.validation,
        };
        setGeneratedMscJson(fullMscData);

        // Store Cell Mappings and Template Meta separately
        setEditableCellMappings(response.assistantResponse.cellMappings);
        setEditableTemplateMeta(response.assistantResponse.templateMeta);

        console.log('✅ SaveStr content updated');
        console.log('📋 Template Meta:', response.assistantResponse.templateMeta);
        console.log('🗺️ Cell Mappings:', response.assistantResponse.cellMappings);
        console.log('✓ Validation:', response.validation);
    };

    const handleSendMessage = async (message: string, imageData?: string) => {
        console.log('💬 Sending message:', message, imageData ? '(with image)' : '');
        setIsLoading(true);

        try {
            if (!sessionId) {
                // First message - generate invoice
                console.log('📡 First message - calling generateInvoice API');
                const response = await generateInvoice(message, undefined, imageData);
                console.log('✅ Invoice generated successfully');
                handleAIResponse(response, message, imageData);
            } else {
                // Subsequent messages - continue conversation
                console.log('📡 Calling sendChatMessage API with session:', sessionId);
                const response = await sendChatMessage(sessionId, message, imageData);
                console.log('✅ Chat message sent successfully');
                handleAIResponse(response, message, imageData);
            }
        } catch (error: any) {
            console.error('❌ Error sending message:', error);
            showToastMessage(error.message || 'Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewConversation = () => {
        setCurrentStep(0);
        setSessionId(null);
        setMessages([]);
        setTokenCount(0);
        setMscContent('');
        setGeneratedMscJson(null);
        setRawMsc(null);
        setEditableCellMappings(null);
        setEditableTemplateMeta(null);
        setOriginalSavestr('');
        setTemplateImage(null);
        showToastMessage('New lab session started');
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToastMessage('Image size should be less than 5MB');
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                showToastMessage('Please upload an image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setTemplateImage(e.target?.result as string);
                showToastMessage('Template image uploaded successfully!');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNextStep = () => {
        // Validate before moving to next step
        if (currentStep === 1 && !generatedMscJson) {
            showToastMessage('Please generate an invoice template first');
            return;
        }
        if (currentStep === 2 && (!generatedMscJson || !editableCellMappings)) {
            showToastMessage('Please complete template generation and testing first');
            return;
        }
        if (currentStep === 3 && (!editableTemplateMeta || !editableTemplateMeta.name.trim())) {
            showToastMessage('Please add template name and metadata');
            return;
        }

        if (currentStep < 3) {
            setCurrentStep((prev) => (prev + 1) as 0 | 1 | 2 | 3);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => (prev - 1) as 0 | 1 | 2 | 3);
        }
    };

    const handleSaveFinalInvoice = () => {
        if (generatedMscJson && editableTemplateMeta && editableCellMappings) {
            // Update the final MSC data with edited values
            const finalMscData = {
                ...generatedMscJson,
                currentname: editableTemplateMeta.name,
                sheetArr: {
                    sheet1: {
                        ...generatedMscJson.sheetArr.sheet1,
                        name: editableTemplateMeta.name,
                    },
                },
                templateMeta: editableTemplateMeta,
                cellMappings: editableCellMappings,
            };

            setGeneratedMscJson(finalMscData);
            showToastMessage('Invoice template saved successfully!');

            // TODO: Add actual save logic here (e.g., save to backend or local storage)
            console.log('💾 Final Invoice Data:', finalMscData);
        }
    };



    const handleCopyMSC = async () => {
        if (generatedMscJson) {
            try {
                await navigator.clipboard.writeText(JSON.stringify(generatedMscJson, null, 2));
                setIsCopied(true);
                showToastMessage('MSC JSON copied to clipboard!');

                // Reset copy state after 2 seconds
                setTimeout(() => {
                    setIsCopied(false);
                }, 2000);
            } catch (error) {
                console.error('Failed to copy:', error);
                showToastMessage('Failed to copy to clipboard');
            }
        }
    }; const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
    };

    const handleOpenFullTestingLab = () => {
        if (!generatedMscJson || !editableCellMappings) {
            showToastMessage('Please generate a template and mappings before opening the testing lab');
            return;
        }

        if (!rawMsc) {
            showToastMessage('Template data not ready. Please wait a moment and try again.');
            console.error('rawMsc is null or undefined');
            return;
        }

        try {
            const payload = {
                mscData: generatedMscJson,
                rawMsc,
                cellMappings: editableCellMappings,
                templateMeta: editableTemplateMeta,
                logoMapping: editableCellMappings?.logo || null,
                signatureMapping: editableCellMappings?.signature || null,
            };

            console.log("💾 Saving testing data:", {
                hasRawMsc: !!payload.rawMsc,
                hasCellMappings: !!payload.cellMappings,
                hasTemplateMeta: !!payload.templateMeta,
                rawMscKeys: payload.rawMsc ? Object.keys(payload.rawMsc) : [],
            });

            saveTestingData(payload);
            console.log("✅ Testing data saved to localStorage");

            // Verify it was saved
            const savedData = loadTestingData();
            console.log("✅ Verification - data retrieved:", !!savedData);

            // Navigate to testing page in the same window
            console.log("🚀 Navigating to testing lab...");
            history.push('/app/invoice-ai/testing');
        } catch (error) {
            console.error('Failed to launch testing lab', error);
            showToastMessage('Unable to launch testing lab. Please try again.');
        }
    };

    const renderStepIndicator = () => {
        const steps = [
            { label: 'Welcome', icon: informationCircleOutline },
            { label: 'Generate', icon: sparklesOutline },
            { label: 'Testing', icon: gridOutline },
            { label: 'Add Metadata', icon: documentTextOutline },
        ];

        const canNavigateToStep = (stepIndex: number): boolean => {
            if (stepIndex === 0) return true; // Can always go to welcome
            if (stepIndex === 1) return true; // Can always go to generate
            if (stepIndex === 2) return !!generatedMscJson; // Need generated invoice for testing
            if (stepIndex === 3) return !!generatedMscJson && !!editableCellMappings; // Need generated invoice and mappings for metadata
            return false;
        };

        const handleStepClick = (stepIndex: number) => {
            if (canNavigateToStep(stepIndex)) {
                setCurrentStep(stepIndex as 0 | 1 | 2 | 3);
            } else {
                let errorMessage = 'Please complete the previous steps first';
                if (stepIndex === 2 && !generatedMscJson) {
                    errorMessage = 'Please generate an invoice template first';
                } else if (stepIndex === 3 && !generatedMscJson) {
                    errorMessage = 'Please generate an invoice template first';
                }
                showToastMessage(errorMessage);
            }
        };

        return (
            <div className="step-indicator">
                {steps.map((step, index) => {
                    const showConnector = index < steps.length - 1 && index < 3 && canNavigateToStep(index + 1);
                    return (
                        <div
                            key={index}
                            className={`step-item ${currentStep === index ? 'active' : ''} ${currentStep > index ? 'completed' : ''} ${canNavigateToStep(index) ? 'clickable' : 'disabled'}`}
                            onClick={() => handleStepClick(index)}
                            style={{ cursor: canNavigateToStep(index) ? 'pointer' : 'not-allowed' }}
                        >
                            <div className="step-circle">
                                <IonIcon icon={currentStep > index ? checkmarkOutline : step.icon} />
                            </div>
                            <div className="step-label">{step.label}</div>
                            {showConnector && <div className="step-connector" />}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderNavigation = () => {
        // Step 0: Welcome - show "Start Creating" button
        if (currentStep === 0) {
            return (
                <div className="step-navigation">
                    <IonButton
                        expand="block"
                        size="large"
                        onClick={handleNextStep}
                        color="primary"
                    >
                        Start Creating
                        <IonIcon icon={chevronForwardOutline} slot="end" />
                    </IonButton>
                </div>
            );
        }

        // Step 1: Generate - show Back and Continue
        if (currentStep === 1) {
            return (
                <div className="step-navigation">
                    <IonButton fill="outline" onClick={handlePreviousStep}>
                        <IonIcon icon={chevronBackOutline} slot="start" />
                        Back
                    </IonButton>
                    <IonButton
                        onClick={handleNextStep}
                        disabled={!generatedMscJson}
                    >
                        Continue to Testing
                        <IonIcon icon={chevronForwardOutline} slot="end" />
                    </IonButton>
                </div>
            );
        }

        // Step 2: Testing - show Back and Continue
        if (currentStep === 2) {
            return (
                <div className="step-navigation">
                    <IonButton fill="outline" onClick={handlePreviousStep}>
                        <IonIcon icon={chevronBackOutline} slot="start" />
                        Back
                    </IonButton>
                    <IonButton onClick={handleNextStep}>
                        Continue to Add Metadata
                        <IonIcon icon={chevronForwardOutline} slot="end" />
                    </IonButton>
                </div>
            );
        }

        // Step 3: Add Metadata - show Back and Save
        if (currentStep === 3) {
            return (
                <div className="step-navigation">
                    <IonButton fill="outline" onClick={handlePreviousStep}>
                        <IonIcon icon={chevronBackOutline} slot="start" />
                        Back
                    </IonButton>
                    <IonButton color="success" onClick={handleSaveFinalInvoice}>
                        <IonIcon icon={saveOutline} slot="start" />
                        Save Template
                    </IonButton>
                </div>
            );
        }

        return null;
    };

    return (
        <IonPage className='padding-zero'>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/app/files" />
                    </IonButtons>
                    <IonTitle>
                        <IonIcon icon={flaskOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Invoice Lab
                    </IonTitle>
                    <IonButtons slot="end">
                        {backendStatus === 'checking' && <IonSpinner name="circular" />}
                        {backendStatus === 'offline' && (
                            <IonButton onClick={checkBackendHealth}>
                                <IonIcon icon={refreshOutline} slot="icon-only" />
                            </IonButton>
                        )}
                        <IonButton onClick={handleNewConversation} title="New Lab Session">
                            <IonIcon icon={refreshOutline} slot="icon-only" />
                            <span style={{ marginLeft: '4px', fontSize: '12px' }}>Reset</span>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="invoice-ai-content">
                <div className="page-layout">
                    {/* Step Indicator */}
                    {renderStepIndicator()}

                    <div className="content-area">
                        {/* Step 0: Welcome Screen */}
                        {currentStep === 0 && (
                            <div className="step-content welcome-step">
                                <IonCard className="welcome-card">
                                    <IonCardHeader>
                                        <IonIcon icon={flaskOutline} className="welcome-icon" />
                                        <IonCardTitle>Welcome to Invoice Lab</IonCardTitle>
                                    </IonCardHeader>
                                    <IonCardContent>
                                        <p className="welcome-description">
                                            Create, customize, and perfect your invoice templates through a guided 3-step process.
                                        </p>

                                        <div className="steps-preview">
                                            <div className="preview-step">
                                                <IonIcon icon={sparklesOutline} color="primary" />
                                                <h4>Step 1: Generate</h4>
                                                <p>Use AI to create an invoice template from your description or image</p>
                                            </div>
                                            <div className="preview-step">
                                                <IonIcon icon={gridOutline} color="success" />
                                                <h4>Step 2: Testing</h4>
                                                <p>Test your template with dynamic forms and customize cell mappings</p>
                                            </div>
                                            <div className="preview-step">
                                                <IonIcon icon={documentTextOutline} color="warning" />
                                                <h4>Step 3: Save</h4>
                                                <p>Add template name, category, description and save your template</p>
                                            </div>
                                        </div>
                                    </IonCardContent>
                                </IonCard>
                            </div>
                        )}

                        {/* Step 1: Generate Invoice */}
                        {currentStep === 1 && (
                            <div className="step-content generate-step">
                                <div className="step-main-area">
                                    <IonCard className="step-card">
                                        <IonCardHeader>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                                                    <IonIcon icon={sparklesOutline} />
                                                    Generate Invoice Template
                                                </IonCardTitle>
                                                <IonButton
                                                    fill="clear"
                                                    onClick={() => setIsChatOpen(!isChatOpen)}
                                                    title="Toggle AI Assistant"
                                                    style={{ marginRight: '-12px' }}
                                                >
                                                    <IonIcon icon={chatbubbleEllipsesOutline} slot="icon-only" />
                                                </IonButton>
                                            </div>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            {/* Show instruction based on state - only when no invoice generated */}
                                            {!generatedMscJson && (
                                                <p className="step-instruction">
                                                    Describe your invoice requirements or upload an image. The AI will generate a template with cell mappings and metadata.
                                                </p>
                                            )}

                                            {/* Show loading indicator when generating */}
                                            {isLoading && !generatedMscJson && (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '48px 0' }}>
                                                    <IonSpinner name="crescent" style={{ width: '64px', height: '64px', color: 'var(--ion-color-primary)' }} />
                                                    <p style={{ marginTop: '24px', fontSize: '16px', fontWeight: 600, color: 'var(--ion-color-primary)' }}>
                                                        Generating Invoice Template...
                                                    </p>
                                                    <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                                                        This may take a few moments
                                                    </p>
                                                </div>
                                            )}

                                            {/* Show Start Generating button if nothing is generated yet and not loading */}
                                            {!generatedMscJson && !isLoading && (
                                                <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
                                                    <IonButton
                                                        size="large"
                                                        onClick={() => setIsChatOpen(true)}
                                                        color="primary"
                                                    >
                                                        <IonIcon icon={sparklesOutline} slot="start" />
                                                        Start Generating
                                                    </IonButton>
                                                </div>
                                            )}

                                            {/* Show generated preview */}
                                            {rawMsc && (() => {
                                                console.log('🖼️ Rendering MSCPreview in Step 1, rawMsc:', {
                                                    isNull: rawMsc === null,
                                                    isUndefined: rawMsc === undefined,
                                                    type: typeof rawMsc,
                                                    keys: rawMsc ? Object.keys(rawMsc) : [],
                                                    numsheets: rawMsc?.numsheets,
                                                    currentid: rawMsc?.currentid,
                                                    sheetArrKeys: rawMsc?.sheetArr ? Object.keys(rawMsc.sheetArr) : [],
                                                });
                                                return (
                                                    <div>
                                                        <MSCPreview
                                                            mscData={rawMsc}
                                                        />
                                                    </div>
                                                );
                                            })()}
                                        </IonCardContent>
                                    </IonCard>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Testing */}
                        {currentStep === 2 && editableCellMappings && (
                            <div className="step-content testing-step">
                                <div className="step-main-area">
                                    <IonCard className="step-card">
                                        <IonCardHeader style={{ '--background': 'transparent' }}>
                                            <IonToolbar color="transparent" style={{ '--background': 'transparent' }}>
                                                <IonCardTitle slot="start">
                                                    <IonIcon icon={gridOutline} />
                                                    Template Testing
                                                </IonCardTitle>
                                                <IonButtons slot="end">
                                                    <IonButton
                                                        color="secondary"
                                                        onClick={handleOpenFullTestingLab}
                                                        disabled={!generatedMscJson || !editableCellMappings}
                                                    >
                                                        <IonIcon slot="start" icon={expandOutline} />
                                                        Open Testing Lab
                                                    </IonButton>
                                                </IonButtons>
                                            </IonToolbar>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <p className="step-instruction">
                                                Test and customize your generated template. Click Testing Lab button above and Use Export Config after any manual customization and import or edit the files below.
                                            </p>

                                            {/* Cell Mappings Display */}
                                            <div style={{ marginTop: '24px' }}>
                                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                    <IonIcon icon={gridOutline} />
                                                    Cell Mappings
                                                </h3>
                                                <div style={{
                                                    background: 'var(--ion-color-light)',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    maxHeight: '300px',
                                                    overflowY: 'auto',
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px'
                                                }}>
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                        {JSON.stringify(editableCellMappings, null, 2)}
                                                    </pre>
                                                </div>
                                                <IonButton
                                                    size="small"
                                                    fill="outline"
                                                    style={{ marginTop: '8px' }}
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(JSON.stringify(editableCellMappings, null, 2));
                                                            showToastMessage('Cell Mappings copied to clipboard!');
                                                        } catch (error) {
                                                            console.error('Failed to copy:', error);
                                                            showToastMessage('Failed to copy to clipboard');
                                                        }
                                                    }}
                                                >
                                                    <IonIcon slot="start" icon={copyOutline} />
                                                    Copy Cell Mappings
                                                </IonButton>
                                            </div>

                                            {/* Raw MSC Display */}
                                            <div style={{ marginTop: '24px' }}>
                                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                    <IonIcon icon={documentTextOutline} />
                                                    Raw MSC
                                                </h3>
                                                <div style={{
                                                    background: 'var(--ion-color-light)',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    maxHeight: '300px',
                                                    overflowY: 'auto',
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px'
                                                }}>
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                        {JSON.stringify(rawMsc, null, 2)}
                                                    </pre>
                                                </div>
                                                <IonButton
                                                    size="small"
                                                    fill="outline"
                                                    style={{ marginTop: '8px' }}
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(JSON.stringify(rawMsc, null, 2));
                                                            showToastMessage('Raw MSC copied to clipboard!');
                                                        } catch (error) {
                                                            console.error('Failed to copy:', error);
                                                            showToastMessage('Failed to copy to clipboard');
                                                        }
                                                    }}
                                                >
                                                    <IonIcon slot="start" icon={copyOutline} />
                                                    Copy Raw MSC
                                                </IonButton>
                                            </div>

                                            {/* Template Metadata Display */}
                                            <div style={{ marginTop: '24px' }}>
                                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                    <IonIcon icon={documentTextOutline} />
                                                    Template Metadata
                                                </h3>
                                                <div style={{
                                                    background: 'var(--ion-color-light)',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    maxHeight: '300px',
                                                    overflowY: 'auto',
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px'
                                                }}>
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                        {JSON.stringify(editableTemplateMeta, null, 2)}
                                                    </pre>
                                                </div>
                                                <IonButton
                                                    size="small"
                                                    fill="outline"
                                                    style={{ marginTop: '8px' }}
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(JSON.stringify(editableTemplateMeta, null, 2));
                                                            showToastMessage('Metadata copied to clipboard!');
                                                        } catch (error) {
                                                            console.error('Failed to copy:', error);
                                                            showToastMessage('Failed to copy to clipboard');
                                                        }
                                                    }}
                                                >
                                                    <IonIcon slot="start" icon={copyOutline} />
                                                    Copy Metadata
                                                </IonButton>
                                            </div>

                                        </IonCardContent>
                                    </IonCard>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Add Template Metadata */}
                        {currentStep === 3 && editableTemplateMeta && (
                            <div className="step-content edit-metadata-step">
                                <div className="step-main-area">
                                    <IonCard className="step-card">
                                        <IonCardHeader>
                                            <IonCardTitle>
                                                <IonIcon icon={documentTextOutline} />
                                                Add Template Metadata
                                            </IonCardTitle>
                                        </IonCardHeader>
                                        <IonCardContent>
                                            <p className="step-instruction">
                                                Complete your template by adding metadata and uploading a preview image.
                                            </p>

                                            <div className="metadata-form-container">
                                                {/* Left Side - Form */}
                                                <div className="metadata-form">
                                                    <IonList>
                                                        <IonItem>
                                                            <IonInput
                                                                label="Template Name"
                                                                labelPlacement="stacked"
                                                                value={editableTemplateMeta.name}
                                                                onIonInput={(e) => setEditableTemplateMeta({
                                                                    ...editableTemplateMeta,
                                                                    name: e.detail.value || ''
                                                                })}
                                                                placeholder="e.g., Professional Business Invoice"
                                                            />
                                                        </IonItem>

                                                        <IonItem>
                                                            <IonSelect
                                                                label="Category"
                                                                labelPlacement="stacked"
                                                                value={editableTemplateMeta.category}
                                                                onIonChange={(e) => setEditableTemplateMeta({
                                                                    ...editableTemplateMeta,
                                                                    category: e.detail.value
                                                                })}
                                                            >
                                                                <IonSelectOption value="tax_invoice">Tax Invoice</IonSelectOption>
                                                                <IonSelectOption value="service_receipt">Service Receipt</IonSelectOption>
                                                                <IonSelectOption value="quotation">Quotation</IonSelectOption>
                                                                <IonSelectOption value="purchase_order">Purchase Order</IonSelectOption>
                                                                <IonSelectOption value="proforma_invoice">Proforma Invoice</IonSelectOption>
                                                                <IonSelectOption value="credit_note">Credit Note</IonSelectOption>
                                                            </IonSelect>
                                                        </IonItem>

                                                        <IonItem>
                                                            <IonSelect
                                                                label="Device Type"
                                                                labelPlacement="stacked"
                                                                value={editableTemplateMeta.deviceType}
                                                                onIonChange={(e) => setEditableTemplateMeta({
                                                                    ...editableTemplateMeta,
                                                                    deviceType: e.detail.value
                                                                })}
                                                            >
                                                                <IonSelectOption value="mobile">Mobile</IonSelectOption>
                                                                <IonSelectOption value="tablet">Tablet</IonSelectOption>
                                                                <IonSelectOption value="desktop">Desktop</IonSelectOption>
                                                            </IonSelect>
                                                        </IonItem>

                                                        <IonItem>
                                                            <IonTextarea
                                                                label="Description"
                                                                labelPlacement="stacked"
                                                                value={editableTemplateMeta.description}
                                                                onIonInput={(e) => setEditableTemplateMeta({
                                                                    ...editableTemplateMeta,
                                                                    description: e.detail.value || ''
                                                                })}
                                                                rows={3}
                                                                placeholder="Describe your template..."
                                                            />
                                                        </IonItem>

                                                        <IonItem lines="none">
                                                            <div className="image-upload-section">
                                                                <IonLabel>
                                                                    <h3>Template Preview Image</h3>
                                                                    <p>Take a screenshot of your generated invoice and upload it here</p>
                                                                </IonLabel>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={handleImageUpload}
                                                                    style={{ display: 'none' }}
                                                                    id="template-image-upload"
                                                                />
                                                                <IonButton
                                                                    fill="outline"
                                                                    onClick={() => document.getElementById('template-image-upload')?.click()}
                                                                    className="upload-image-button"
                                                                >
                                                                    <IonIcon icon={imageOutline} slot="start" />
                                                                    {templateImage ? 'Change Image' : 'Upload Image'}
                                                                </IonButton>
                                                            </div>
                                                        </IonItem>
                                                    </IonList>
                                                </div>

                                                {/* Right Side - Preview Card */}
                                                <div className="metadata-preview">
                                                    <h4>
                                                        <IonIcon icon={eyeOutline} />
                                                        Preview
                                                    </h4>
                                                    <p className="preview-description">How your template will appear in saved invoices</p>

                                                    <div className="template-preview-card">
                                                        <div className="template-card-image">
                                                            {templateImage ? (
                                                                <img src={templateImage} alt="Template preview" />
                                                            ) : (
                                                                <div className="template-card-placeholder">
                                                                    <IonIcon icon={imageOutline} />
                                                                    <p>Upload a screenshot</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="template-card-content">
                                                            <h3>{editableTemplateMeta.name || 'Template Name'}</h3>
                                                            <div className="template-card-meta">
                                                                <span className="template-badge">
                                                                    <IonIcon icon={documentTextOutline} />
                                                                    {editableTemplateMeta.category.replace('_', ' ')}
                                                                </span>
                                                                <span className="template-device">
                                                                    <IonIcon icon={editableTemplateMeta.deviceType === 'mobile' ? phonePortraitOutline : editableTemplateMeta.deviceType === 'tablet' ? tabletPortraitOutline : desktopOutline} />
                                                                    {editableTemplateMeta.deviceType}
                                                                </span>
                                                            </div>
                                                            <p className="template-card-description">
                                                                {editableTemplateMeta.description || 'No description provided'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </IonCardContent>
                                    </IonCard>
                                </div>
                            </div>
                        )}
                    </div>
                </div>                {/* Toast for notifications */}
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={3000}
                    position="bottom"
                />
            </IonContent>

            {/* Fixed Navigation at Bottom */}
            {renderNavigation()}

            {/* Chat Overlay */}
            {currentStep === 1 && isChatOpen && (
                <>
                    <div className="chat-overlay-backdrop" onClick={() => setIsChatOpen(false)} />
                    <div className="chat-overlay open">
                        <ChatSidebar
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading}
                            isVisible={true}
                            onClose={() => setIsChatOpen(false)}
                            tokenCount={tokenCount}
                            maxTokens={200000}
                        />
                    </div>
                </>
            )}
        </IonPage>
    );
};

export default InvoiceAIPage;
