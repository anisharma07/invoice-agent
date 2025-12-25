import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonIcon,
    IonTextarea,
    IonSpinner,
    IonText,
    IonChip,
    IonLabel,
    IonBadge,
    IonToast,
    IonSegment,
    IonSegmentButton,
    IonItem,
    IonInput,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItemDivider,
    IonDatetime,
    IonPopover,
    IonGrid,
    IonAlert,
} from "@ionic/react";
import {
    closeCircleOutline,
    sendOutline,
    imageOutline,
    checkmarkCircle,
    trashOutline,
    sparklesOutline,
    closeOutline,
    createOutline,
    save,
    refresh,
    add,
    remove,
} from "ionicons/icons";
import { useInvoice } from "../../contexts/InvoiceContext";
import {
    extractCellValues,
    applyCellUpdates,
} from "../../utils/cellValueExtractor";
import {
    createEditingSession,
    continueEditing,
    imageToBase64,
    validateImageFile,
    EditResponse,
} from "../../services/invoiceEditingService";
import {
    addDynamicInvoiceData,
    getDynamicInvoiceData,
} from "../socialcalc/modules/invoice.js";
import {
    DynamicFormManager,
    DynamicFormSection,
    DynamicFormField,
    ProcessedFormData,
} from "../../utils/dynamicFormManager";
import "./InvoiceEditingSidebar.css";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    cellUpdates?: { [cellAddress: string]: string };
    timestamp: Date;
}

interface InvoiceEditingSidebarProps {
    isVisible: boolean;
    onClose: () => void;
    setAutosaveCount?: React.Dispatch<React.SetStateAction<number>>;
}

const InvoiceEditingSidebar: React.FC<InvoiceEditingSidebarProps> = ({
    isVisible,
    onClose,
    setAutosaveCount,
}) => {
    const { activeTemplateData, currentSheetId, selectedFile } = useInvoice();

    // Tab state
    const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");

    // ========== AI Tab State ==========
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [appliedUpdatesCount, setAppliedUpdatesCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ========== Manual Tab State ==========
    const [formData, setFormData] = useState<ProcessedFormData>({});
    const [showRefreshAlert, setShowRefreshAlert] = useState(false);

    // ========== Shared Toast State ==========
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

    // Get current template data
    const currentTemplate = useMemo(() => activeTemplateData, [activeTemplateData]);

    // Get current sheet ID
    const effectiveSheetId = useMemo(() => {
        return currentSheetId || currentTemplate?.msc?.currentid || "sheet1";
    }, [currentSheetId, currentTemplate]);

    // Generate form sections for manual tab
    const formSections = useMemo(() => {
        if (!currentTemplate) return [];
        return DynamicFormManager.getFormSectionsForSheet(currentTemplate, effectiveSheetId);
    }, [currentTemplate, effectiveSheetId]);

    // Load form data when sections change
    useEffect(() => {
        const loadFormData = async () => {
            try {
                if (formSections.length === 0) return;
                const cellReferences = DynamicFormManager.getAllCellReferences(formSections);
                if (cellReferences.length > 0) {
                    const existingCellData = await getDynamicInvoiceData(cellReferences);
                    const existingFormData = DynamicFormManager.convertFromSpreadsheetFormat(existingCellData, formSections);
                    setFormData(existingFormData);
                } else {
                    const initData = DynamicFormManager.initializeFormData(formSections);
                    setFormData(initData);
                }
            } catch (error) {
                const initData = DynamicFormManager.initializeFormData(formSections);
                setFormData(initData);
            }
        };
        loadFormData();
    }, [formSections]);

    // Auto-refresh form data when sidebar opens
    useEffect(() => {
        if (isVisible && formSections.length > 0) {
            const timeoutId = setTimeout(() => silentRefresh(), 200);
            return () => clearTimeout(timeoutId);
        }
    }, [isVisible, formSections]);

    // Scroll AI messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Add AI welcome message when sidebar opens
    useEffect(() => {
        if (isVisible && messages.length === 0) {
            setMessages([{
                role: "system",
                content: "Welcome to AI Invoice Editor! 👋\n\n" +
                    "I can help you edit cells using natural language or extract data from invoice images.\n\n" +
                    "**Quick Examples:**\n" +
                    "• 'Update heading to Professional Invoice'\n" +
                    "• 'Set today's date'\n" +
                    "• 'Change invoice number to INV-2025-001'\n" +
                    "• Upload an invoice image\n\n" +
                    "Type a request or upload an image!",
                timestamp: new Date(),
            }]);
        }
    }, [isVisible]);

    // ========== Shared Helpers ==========
    const showToastMsg = (message: string, color: "success" | "danger" | "warning" = "success") => {
        setToastMessage(message);
        setToastColor(color);
        setShowToast(true);
    };

    // ========== Manual Tab Handlers ==========
    const handleFieldChange = (sectionTitle: string, fieldLabel: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [sectionTitle]: { ...prev[sectionTitle], [fieldLabel]: value },
        }));
    };

    const handleItemChange = (sectionTitle: string, itemIndex: number, fieldName: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [sectionTitle]: prev[sectionTitle].map((item: any, index: number) =>
                index === itemIndex ? { ...item, [fieldName]: value } : item
            ),
        }));
    };

    const handleManualSave = async () => {
        try {
            const validation = DynamicFormManager.validateFormData(formData, formSections);
            if (!validation.isValid) {
                showToastMsg(`Validation errors: ${validation.errors.join(", ")}`, "warning");
                return;
            }
            const cellData = DynamicFormManager.convertToSpreadsheetFormat(formData, formSections, effectiveSheetId);
            await addDynamicInvoiceData(cellData, effectiveSheetId);
            showToastMsg("Invoice data saved successfully!", "success");
            if (setAutosaveCount) setAutosaveCount((prev) => prev + 1);
        } catch (error) {
            showToastMsg("Failed to save invoice data. Please try again.", "danger");
        }
    };

    const handleClear = () => {
        const initData = DynamicFormManager.initializeFormData(formSections);
        setFormData(initData);
        showToastMsg("Form fields cleared!", "success");
    };

    const silentRefresh = async () => {
        try {
            const cellReferences = DynamicFormManager.getAllCellReferences(formSections);
            if (cellReferences.length > 0) {
                const currentCellData = await getDynamicInvoiceData(cellReferences);
                const refreshedFormData = DynamicFormManager.convertFromSpreadsheetFormat(currentCellData, formSections);
                setFormData(refreshedFormData);
            }
        } catch (error) { }
    };

    const performRefresh = async () => {
        try {
            const cellReferences = DynamicFormManager.getAllCellReferences(formSections);
            if (cellReferences.length > 0) {
                const currentCellData = await getDynamicInvoiceData(cellReferences);
                const refreshedFormData = DynamicFormManager.convertFromSpreadsheetFormat(currentCellData, formSections);
                setFormData(refreshedFormData);
                showToastMsg("Form data refreshed from spreadsheet!", "success");
            } else {
                showToastMsg("No data to refresh", "warning");
            }
        } catch (error) {
            showToastMsg("Failed to refresh form data", "danger");
        }
    };

    const handleAddItem = (sectionTitle: string) => {
        const section = formSections.find((s) => s.title === sectionTitle);
        if (!section || !section.itemsConfig) return;
        setFormData((prev) => {
            const currentItems = prev[sectionTitle] as any[];
            const maxItems = section.itemsConfig!.range.end - section.itemsConfig!.range.start + 1;
            if (currentItems.length >= maxItems) {
                showToastMsg(`Maximum ${maxItems} items allowed`, "warning");
                return prev;
            }
            const newItem: any = {};
            Object.keys(section.itemsConfig!.content).forEach((contentKey) => {
                newItem[contentKey] = "";
            });
            return { ...prev, [sectionTitle]: [...currentItems, newItem] };
        });
    };

    const handleRemoveItem = (sectionTitle: string, itemIndex: number) => {
        const section = formSections.find((s) => s.title === sectionTitle);
        if (!section || !section.itemsConfig) return;
        setFormData((prev) => {
            const currentItems = prev[sectionTitle] as any[];
            if (currentItems.length <= 1) {
                showToastMsg("At least one item is required", "warning");
                return prev;
            }
            return { ...prev, [sectionTitle]: currentItems.filter((_, index) => index !== itemIndex) };
        });
    };

    // ========== AI Tab Handlers ==========
    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const validation = validateImageFile(file);
        if (!validation.valid) {
            showToastMsg(validation.error || "Invalid image file", "danger");
            return;
        }
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() && !selectedImage) {
            showToastMsg("Please enter a message or upload an image", "warning");
            return;
        }
        if (!activeTemplateData) {
            showToastMsg("No active template. Please open an invoice first.", "danger");
            return;
        }

        setIsLoading(true);
        try {
            const appMapping = activeTemplateData.appMapping;
            const currentValues = extractCellValues(appMapping);
            let invoiceImage: string | undefined = undefined;
            if (selectedImage) invoiceImage = await imageToBase64(selectedImage);

            const userMessage: Message = {
                role: "user",
                content: inputText.trim() || "📷 Uploaded invoice image",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMessage]);

            let response: EditResponse;
            if (sessionId) {
                response = await continueEditing({
                    session_id: sessionId,
                    prompt: inputText.trim() || "Extract all information from this invoice image",
                    cell_mappings: null,
                    current_values: currentValues,
                    invoice_image: invoiceImage,
                });
            } else {
                response = await createEditingSession({
                    prompt: inputText.trim() || "Extract all information from this invoice image",
                    cell_mappings: appMapping,
                    current_values: currentValues,
                    invoice_image: invoiceImage,
                });
                setSessionId(response.session_id);
            }

            const assistantMessage: Message = {
                role: "assistant",
                content: response.message,
                cellUpdates: response.cell_updates,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setInputText("");
            handleRemoveImage();
        } catch (error) {
            const errorMessage: Message = {
                role: "system",
                content: `❌ Error: ${error instanceof Error ? error.message : "Failed to process request"}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            showToastMsg("Failed to process request. Please try again.", "danger");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyCellUpdates = (cellUpdates: { [cellAddress: string]: string }) => {
        try {
            const success = applyCellUpdates(cellUpdates);
            if (success) {
                const count = Object.keys(cellUpdates).length;
                setAppliedUpdatesCount((prev) => prev + count);
                showToastMsg(`✅ Applied ${count} cell update${count > 1 ? "s" : ""}!`, "success");
                if (setAutosaveCount) setAutosaveCount((prev) => prev + 1);
            } else {
                showToastMsg("Failed to apply cell updates.", "danger");
            }
        } catch (error) {
            showToastMsg("Error applying cell updates.", "danger");
        }
    };

    const handleReset = () => {
        setMessages([{ role: "system", content: "Session reset. Start a new conversation!", timestamp: new Date() }]);
        setSessionId(null);
        setInputText("");
        handleRemoveImage();
        setAppliedUpdatesCount(0);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ========== Render Helpers ==========
    const renderField = (field: DynamicFormField, sectionTitle: string) => {
        const value = formData[sectionTitle]?.[field.label] || "";
        switch (field.type) {
            case "textarea":
                return (
                    <IonItem key={field.label}>
                        <IonLabel position="stacked">{field.label}</IonLabel>
                        <IonTextarea value={value} onIonInput={(e) => handleFieldChange(sectionTitle, field.label, e.detail.value!)} placeholder={`Enter ${field.label.toLowerCase()}`} rows={2} />
                    </IonItem>
                );
            case "date":
                return (
                    <IonItem key={field.label} button={true} id={`date-trigger-${field.label.replace(/\s+/g, "-")}`}>
                        <IonLabel position="stacked">{field.label}</IonLabel>
                        <IonInput value={value ? new Date(value).toLocaleDateString() : ""} readonly={true} placeholder="Select date" />
                        <IonPopover trigger={`date-trigger-${field.label.replace(/\s+/g, "-")}`} showBackdrop={false}>
                            <IonDatetime
                                value={value || new Date().toISOString()}
                                onIonChange={(e) => {
                                    const selectedDate = e.detail.value as string;
                                    if (selectedDate) handleFieldChange(sectionTitle, field.label, selectedDate.split("T")[0]);
                                }}
                                presentation="date"
                                preferWheel={true}
                            />
                        </IonPopover>
                    </IonItem>
                );
            case "number":
            case "decimal":
                return (
                    <IonItem key={field.label}>
                        <IonLabel position="stacked">{field.label}</IonLabel>
                        <IonInput type="number" step={field.type === "decimal" ? "0.01" : undefined} value={value} onIonInput={(e) => handleFieldChange(sectionTitle, field.label, e.detail.value!)} placeholder={`Enter ${field.label.toLowerCase()}`} />
                    </IonItem>
                );
            default:
                return (
                    <IonItem key={field.label}>
                        <IonLabel position="stacked">{field.label}</IonLabel>
                        <IonInput value={value} onIonInput={(e) => handleFieldChange(sectionTitle, field.label, e.detail.value!)} placeholder={`Enter ${field.label.toLowerCase()}`} />
                    </IonItem>
                );
        }
    };

    const renderItemsSection = (section: DynamicFormSection) => {
        if (!section.itemsConfig || !formData[section.title]) return null;
        const items = formData[section.title] as any[];
        const maxItems = section.itemsConfig.range.end - section.itemsConfig.range.start + 1;
        return (
            <IonCard key={section.title} className="sidebar-card">
                <IonCardHeader><IonCardTitle>{section.title}</IonCardTitle></IonCardHeader>
                <IonCardContent>
                    {items.map((item, index) => (
                        <div key={index} className="item-group">
                            <IonItemDivider>
                                <IonLabel>{section.itemsConfig!.name} {index + 1}</IonLabel>
                                {items.length > 1 && (
                                    <IonButton fill="clear" color="danger" size="small" onClick={() => handleRemoveItem(section.title, index)}>
                                        <IonIcon icon={remove} />
                                    </IonButton>
                                )}
                            </IonItemDivider>
                            {Object.entries(section.itemsConfig!.content).map(([fieldName]) => {
                                const fieldType = DynamicFormManager.getFieldType(fieldName);
                                const itemValue = item[fieldName] || "";
                                return (
                                    <IonItem key={`${index}-${fieldName}`}>
                                        <IonLabel position="stacked">{fieldName}</IonLabel>
                                        <IonInput
                                            type={fieldType === "decimal" ? "number" : "text"}
                                            step={fieldType === "decimal" ? "0.01" : undefined}
                                            value={itemValue}
                                            onIonInput={(e) => handleItemChange(section.title, index, fieldName, e.detail.value!)}
                                            placeholder={`Enter ${fieldName.toLowerCase()}`}
                                        />
                                    </IonItem>
                                );
                            })}
                        </div>
                    ))}
                    <div style={{ padding: "10px 0", textAlign: "center" }}>
                        <IonButton fill="outline" size="small" onClick={() => handleAddItem(section.title)} disabled={items.length >= maxItems}>
                            <IonIcon icon={add} slot="start" />
                            Add ({items.length}/{maxItems})
                        </IonButton>
                    </div>
                </IonCardContent>
            </IonCard>
        );
    };

    const renderSection = (section: DynamicFormSection) => {
        if (section.isItems) return renderItemsSection(section);
        return (
            <IonCard key={section.title} className="sidebar-card">
                <IonCardHeader><IonCardTitle>{section.title}</IonCardTitle></IonCardHeader>
                <IonCardContent>
                    <IonList>{section.fields.map((field) => renderField(field, section.title))}</IonList>
                </IonCardContent>
            </IonCard>
        );
    };

    if (!isVisible) return null;

    return (
        <>
            <div className="invoice-editing-sidebar">
                <IonHeader className="sidebar-header">
                    <IonToolbar>
                        <IonTitle>Edit Invoice</IonTitle>
                    </IonToolbar>
                    {/* Custom Tabs */}
                    <div className="custom-tabs">
                        <div
                            className={`tab-button ${activeTab === "manual" ? "active" : ""}`}
                            onClick={() => setActiveTab("manual")}
                        >
                            <IonIcon icon={createOutline} />
                            <span>Manual</span>
                        </div>
                        <div
                            className={`tab-button ${activeTab === "ai" ? "active" : ""}`}
                            onClick={() => setActiveTab("ai")}
                        >
                            <IonIcon icon={sparklesOutline} />
                            <span>AI Edit</span>
                        </div>
                        <div className="tab-close-button" onClick={onClose} title="Close Sidebar">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                </IonHeader>

                {/* Manual Tab Content */}
                {activeTab === "manual" && (
                    <>
                        <IonContent className="sidebar-content">
                            {formSections.length === 0 ? (
                                <div style={{ padding: "24px", textAlign: "center", color: "var(--ion-color-medium)" }}>
                                    <p>No editable fields available for this template.</p>
                                </div>
                            ) : (
                                <div className="manual-form-container">
                                    {formSections.map((section) => renderSection(section))}
                                </div>
                            )}
                        </IonContent>
                        <div className="manual-actions">
                            <IonButton expand="block" onClick={handleManualSave} disabled={formSections.length === 0}>
                                <IonIcon icon={save} slot="start" />
                                Save Changes
                            </IonButton>
                            <div className="manual-secondary-actions">
                                <IonButton fill="outline" size="small" onClick={() => setShowRefreshAlert(true)}>
                                    <IonIcon icon={refresh} slot="start" />
                                    Sync
                                </IonButton>
                                <IonButton fill="outline" size="small" color="danger" onClick={handleClear}>
                                    <IonIcon icon={trashOutline} slot="start" />
                                    Clear
                                </IonButton>
                            </div>
                        </div>
                    </>
                )}

                {/* AI Tab Content */}
                {activeTab === "ai" && (
                    <>
                        {(sessionId || appliedUpdatesCount > 0) && (
                            <div className="status-bar">
                                {sessionId && (
                                    <IonChip color="success">
                                        <IonIcon icon={checkmarkCircle} />
                                        <IonLabel>Session Active</IonLabel>
                                    </IonChip>
                                )}
                                {appliedUpdatesCount > 0 && (
                                    <IonChip color="tertiary">
                                        <IonLabel>{appliedUpdatesCount} cells updated</IonLabel>
                                    </IonChip>
                                )}
                                {sessionId && (
                                    <IonButton onClick={handleReset} fill="clear" size="small">
                                        <IonIcon slot="icon-only" icon={trashOutline} />
                                    </IonButton>
                                )}
                            </div>
                        )}
                        <IonContent className="sidebar-content">
                            <div className="messages-container">
                                {messages.map((message, index) => (
                                    <div key={index} className={`message message-${message.role}`}>
                                        <div className="message-header">
                                            <IonBadge color={message.role === "user" ? "primary" : message.role === "assistant" ? "success" : "medium"}>
                                                {message.role === "user" ? "You" : message.role === "assistant" ? "AI" : "System"}
                                            </IonBadge>
                                            <IonText color="medium" className="message-time">
                                                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </IonText>
                                        </div>
                                        <div className="message-content">
                                            <IonText><p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p></IonText>
                                            {message.cellUpdates && Object.keys(message.cellUpdates).length > 0 && (
                                                <div className="cell-updates">
                                                    <div className="cell-updates-header">
                                                        <IonText color="primary"><strong>📊 {Object.keys(message.cellUpdates).length} Cell Updates</strong></IonText>
                                                        <IonButton size="small" fill="solid" color="success" onClick={() => handleApplyCellUpdates(message.cellUpdates!)}>
                                                            <IonIcon slot="start" icon={checkmarkCircle} />Apply
                                                        </IonButton>
                                                    </div>
                                                    <div className="cell-updates-list">
                                                        {Object.entries(message.cellUpdates).map(([cell, value]) => (
                                                            <div key={cell} className="cell-update-item">
                                                                <IonChip color="primary" className="cell-chip">{cell}</IonChip>
                                                                <IonText className="cell-value">{value.startsWith("=") ? <code className="formula">{value}</code> : <span>{value}</span>}</IonText>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="message message-assistant">
                                        <div className="message-content loading">
                                            <IonSpinner name="dots" />
                                            <IonText color="medium"><small>AI is processing...</small></IonText>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </IonContent>
                        <div className="input-container">
                            {imagePreview && (
                                <div className="image-preview-wrapper">
                                    <img src={imagePreview} alt="Invoice preview" className="image-preview" />
                                    <IonButton fill="clear" color="danger" size="small" onClick={handleRemoveImage} className="remove-image-btn">
                                        <IonIcon slot="icon-only" icon={closeOutline} />
                                    </IonButton>
                                </div>
                            )}
                            <div className="input-actions">
                                <IonButton fill="clear" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="image-btn">
                                    <IonIcon slot="icon-only" icon={imageOutline} />
                                </IonButton>
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: "none" }} onChange={handleImageSelect} />
                                <IonTextarea
                                    value={inputText}
                                    onIonInput={(e) => setInputText(e.detail.value || "")}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Type your request..."
                                    rows={2}
                                    autoGrow={true}
                                    disabled={isLoading}
                                    className="input-textarea"
                                />
                                <IonButton onClick={handleSendMessage} disabled={isLoading || (!inputText.trim() && !selectedImage)} className="send-btn" color="primary">
                                    {isLoading ? <IonSpinner name="crescent" /> : <IonIcon slot="icon-only" icon={sendOutline} />}
                                </IonButton>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} color={toastColor} position="bottom" />

            <IonAlert
                isOpen={showRefreshAlert}
                onDidDismiss={() => setShowRefreshAlert(false)}
                header="Sync Sheet Data"
                message="Do you want to sync sheet data to the form? This will discard any changes."
                buttons={[
                    { text: "Cancel", role: "cancel", handler: () => setShowRefreshAlert(false) },
                    { text: "Sync Data", role: "confirm", handler: () => { setShowRefreshAlert(false); performRefresh(); } },
                ]}
            />
        </>
    );
};

export default InvoiceEditingSidebar;
