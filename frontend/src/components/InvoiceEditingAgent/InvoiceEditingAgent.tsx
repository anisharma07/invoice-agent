import React, { useState, useEffect, useRef } from "react";
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonTextarea,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonToast,
    IonText,
    IonChip,
    IonLabel,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
} from "@ionic/react";
import {
    closeOutline,
    sendOutline,
    imageOutline,
    checkmarkCircle,
    alertCircle,
    trashOutline,
    documentTextOutline,
    cloudUploadOutline,
} from "ionicons/icons";
import { useInvoice } from "../../contexts/InvoiceContext";
import { extractCellValues, applyCellUpdates } from "../../utils/cellValueExtractor";
import {
    createEditingSession,
    continueEditing,
    imageToBase64,
    validateImageFile,
    EditResponse,
} from "../../services/invoiceEditingService";
import "./InvoiceEditingAgent.css";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    cellUpdates?: { [cellAddress: string]: string };
    timestamp: Date;
}

interface InvoiceEditingAgentProps {
    isOpen: boolean;
    onClose: () => void;
}

const InvoiceEditingAgent: React.FC<InvoiceEditingAgentProps> = ({
    isOpen,
    onClose,
}) => {
    const { activeTemplateData } = useInvoice();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

    const [appliedUpdatesCount, setAppliedUpdatesCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Add welcome message when modal opens
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    role: "system",
                    content:
                        "Welcome to the Invoice Editing Agent! 👋\n\n" +
                        "I can help you edit your invoice using natural language or by extracting data from invoice images.\n\n" +
                        "**Examples:**\n" +
                        "• 'Update the heading to Professional Services Invoice'\n" +
                        "• 'Set today's date in the date field'\n" +
                        "• 'Change invoice number to INV-2025-001'\n" +
                        "• Upload an invoice image to extract all data\n" +
                        "• 'Add item: Consulting Services - $2500'\n\n" +
                        "Upload an image or type your request to get started!",
                    timestamp: new Date(),
                },
            ]);
        }
    }, [isOpen]);

    // Handle image selection
    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            setToastMessage(validation.error || "Invalid image file");
            setToastColor("danger");
            setShowToast(true);
            return;
        }

        setSelectedImage(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Remove selected image
    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Send message to AI agent
    const handleSendMessage = async () => {
        if (!inputText.trim() && !selectedImage) {
            setToastMessage("Please enter a message or upload an image");
            setToastColor("warning");
            setShowToast(true);
            return;
        }

        if (!activeTemplateData) {
            setToastMessage("No active template found. Please open an invoice first.");
            setToastColor("danger");
            setShowToast(true);
            return;
        }

        setIsLoading(true);

        try {
            // Extract current cell values
            const cellMappings = activeTemplateData.cellMappings;
            const currentValues = extractCellValues(cellMappings);

            // Prepare image if selected
            let invoiceImage: string | undefined = undefined;
            if (selectedImage) {
                invoiceImage = await imageToBase64(selectedImage);
            }

            // Add user message to chat
            const userMessage: Message = {
                role: "user",
                content: inputText.trim() || "📷 Uploaded invoice image",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMessage]);

            let response: EditResponse;

            if (sessionId) {
                // Continue existing session
                response = await continueEditing({
                    session_id: sessionId,
                    prompt: inputText.trim() || "Extract all information from this invoice image",
                    cell_mappings: null, // Use stored mappings
                    current_values: currentValues,
                    invoice_image: invoiceImage,
                });
            } else {
                // Create new session
                response = await createEditingSession({
                    prompt: inputText.trim() || "Extract all information from this invoice image",
                    cell_mappings: cellMappings,
                    current_values: currentValues,
                    invoice_image: invoiceImage,
                });
                setSessionId(response.session_id);
            }

            // Add assistant response to chat
            const assistantMessage: Message = {
                role: "assistant",
                content: response.message,
                cellUpdates: response.cell_updates,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);

            // Clear input and image
            setInputText("");
            handleRemoveImage();

        } catch (error) {
            console.error("Error sending message:", error);

            const errorMessage: Message = {
                role: "system",
                content: `❌ Error: ${error instanceof Error ? error.message : "Failed to process request"}`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);

            setToastMessage("Failed to process request. Please try again.");
            setToastColor("danger");
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Apply cell updates to spreadsheet
    const handleApplyCellUpdates = (cellUpdates: { [cellAddress: string]: string }) => {
        try {
            const success = applyCellUpdates(cellUpdates);

            if (success) {
                const count = Object.keys(cellUpdates).length;
                setAppliedUpdatesCount(count);
                setToastMessage(`✅ Successfully applied ${count} cell updates!`);
                setToastColor("success");
                setShowToast(true);
            } else {
                setToastMessage("Failed to apply cell updates. Please try again.");
                setToastColor("danger");
                setShowToast(true);
            }
        } catch (error) {
            console.error("Error applying cell updates:", error);
            setToastMessage("Error applying cell updates. Please try again.");
            setToastColor("danger");
            setShowToast(true);
        }
    };

    // Reset session
    const handleReset = () => {
        setMessages([
            {
                role: "system",
                content: "Session reset. You can start a new conversation!",
                timestamp: new Date(),
            },
        ]);
        setSessionId(null);
        setInputText("");
        handleRemoveImage();
        setAppliedUpdatesCount(0);
    };

    // Render cell updates as a list
    const renderCellUpdates = (cellUpdates: { [cellAddress: string]: string }) => {
        return (
            <div className="cell-updates-container">
                <div className="cell-updates-header">
                    <IonText color="primary">
                        <strong>📊 Cell Updates ({Object.keys(cellUpdates).length})</strong>
                    </IonText>
                    <IonButton
                        size="small"
                        fill="solid"
                        color="success"
                        onClick={() => handleApplyCellUpdates(cellUpdates)}
                    >
                        <IonIcon slot="start" icon={checkmarkCircle} />
                        Apply Updates
                    </IonButton>
                </div>
                <div className="cell-updates-list">
                    {Object.entries(cellUpdates).map(([cell, value]) => (
                        <div key={cell} className="cell-update-item">
                            <IonChip color="primary" className="cell-address">
                                {cell}
                            </IonChip>
                            <IonText className="cell-value">
                                {value.startsWith("=") ? (
                                    <code className="formula">{value}</code>
                                ) : (
                                    <span>{value}</span>
                                )}
                            </IonText>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose} className="invoice-editing-modal">
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>🤖 AI Invoice Editor</IonTitle>
                        <IonButtons slot="end">
                            {sessionId && (
                                <IonButton onClick={handleReset} color="warning">
                                    <IonIcon slot="icon-only" icon={trashOutline} />
                                </IonButton>
                            )}
                            <IonButton onClick={onClose}>
                                <IonIcon slot="icon-only" icon={closeOutline} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                    {sessionId && (
                        <IonToolbar>
                            <IonGrid>
                                <IonRow className="ion-align-items-center">
                                    <IonCol size="auto">
                                        <IonChip color="success">
                                            <IonIcon icon={checkmarkCircle} />
                                            <IonLabel>Session Active</IonLabel>
                                        </IonChip>
                                    </IonCol>
                                    {appliedUpdatesCount > 0 && (
                                        <IonCol size="auto">
                                            <IonChip color="tertiary">
                                                <IonIcon icon={documentTextOutline} />
                                                <IonLabel>{appliedUpdatesCount} cells updated</IonLabel>
                                            </IonChip>
                                        </IonCol>
                                    )}
                                </IonRow>
                            </IonGrid>
                        </IonToolbar>
                    )}
                </IonHeader>

                <IonContent className="invoice-editing-content">
                    <div className="messages-container">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`message message-${message.role}`}
                            >
                                <div className="message-header">
                                    <IonBadge color={message.role === "user" ? "primary" : message.role === "assistant" ? "success" : "medium"}>
                                        {message.role === "user" ? "👤 You" : message.role === "assistant" ? "🤖 AI" : "ℹ️ System"}
                                    </IonBadge>
                                    <IonText color="medium" className="message-time">
                                        {message.timestamp.toLocaleTimeString()}
                                    </IonText>
                                </div>
                                <div className="message-content">
                                    <IonText>
                                        <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
                                    </IonText>
                                    {message.cellUpdates && Object.keys(message.cellUpdates).length > 0 && (
                                        renderCellUpdates(message.cellUpdates)
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message message-assistant">
                                <div className="message-header">
                                    <IonBadge color="success">🤖 AI</IonBadge>
                                </div>
                                <div className="message-content">
                                    <IonSpinner name="dots" />
                                    <IonText color="medium">
                                        <p>Processing your request...</p>
                                    </IonText>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </IonContent>

                <div className="input-container">
                    {imagePreview && (
                        <div className="image-preview-container">
                            <img src={imagePreview} alt="Selected invoice" className="image-preview" />
                            <IonButton
                                fill="clear"
                                color="danger"
                                size="small"
                                onClick={handleRemoveImage}
                                className="remove-image-btn"
                            >
                                <IonIcon slot="icon-only" icon={closeOutline} />
                            </IonButton>
                        </div>
                    )}
                    <div className="input-actions">
                        <IonButton
                            fill="clear"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            <IonIcon slot="icon-only" icon={imageOutline} />
                        </IonButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            style={{ display: "none" }}
                            onChange={handleImageSelect}
                        />
                        <IonTextarea
                            value={inputText}
                            onIonInput={(e) => setInputText(e.detail.value || "")}
                            placeholder="Type your editing request or upload an invoice image..."
                            rows={2}
                            disabled={isLoading}
                            className="input-textarea"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <IonButton
                            fill="solid"
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={isLoading || (!inputText.trim() && !selectedImage)}
                        >
                            {isLoading ? (
                                <IonSpinner name="crescent" />
                            ) : (
                                <IonIcon slot="icon-only" icon={sendOutline} />
                            )}
                        </IonButton>
                    </div>
                </div>
            </IonModal>

            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={3000}
                color={toastColor}
                position="bottom"
            />
        </>
    );
};

export default InvoiceEditingAgent;
