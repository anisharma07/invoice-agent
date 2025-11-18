import React, { useState, useRef, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonTextarea,
} from '@ionic/react';
import { sendOutline, closeCircleOutline, sparklesOutline, imageOutline, closeOutline } from 'ionicons/icons';
import './ChatSidebar.css';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    imageUrl?: string;
}

interface ChatSidebarProps {
    messages: ChatMessage[];
    onSendMessage: (message: string, imageData?: string) => void;
    isLoading: boolean;
    isVisible: boolean;
    onClose: () => void;
    tokenCount?: number;
    maxTokens?: number;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    messages,
    onSendMessage,
    isLoading,
    isVisible,
    onClose,
    tokenCount = 0,
    maxTokens = 200000,
}) => {
    const [inputMessage, setInputMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLIonTextareaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }

            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                return;
            }

            // Convert to base64
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target?.result as string;
                setSelectedImage(base64String);
                setImagePreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = () => {
        const trimmedMessage = inputMessage.trim();
        if ((trimmedMessage || selectedImage) && !isLoading) {
            onSendMessage(trimmedMessage || 'Analyze this invoice image', selectedImage || undefined);
            setInputMessage('');
            setSelectedImage(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const tokenPercentage = (tokenCount / maxTokens) * 100;
    const tokenWarning = tokenPercentage > 80;

    if (!isVisible) return null;

    return (
        <div className="chat-sidebar">
            <IonHeader className="chat-sidebar-header">
                <IonToolbar>
                    <IonTitle>
                        <IonIcon icon={sparklesOutline} className="chat-header-icon" />
                        AI Assistant
                    </IonTitle>
                    <IonButton slot="end" fill="clear" onClick={onClose}>
                        <IonIcon icon={closeCircleOutline} />
                    </IonButton>
                </IonToolbar>
                {tokenCount > 0 && (
                    <div className="token-counter">
                        <div className="token-bar">
                            <div
                                className={`token-progress ${tokenWarning ? 'token-warning' : ''}`}
                                style={{ width: `${tokenPercentage}%` }}
                            />
                        </div>
                        <IonText color={tokenWarning ? 'warning' : 'medium'}>
                            <small>
                                Tokens: {tokenCount.toLocaleString()} / {maxTokens.toLocaleString()}
                            </small>
                        </IonText>
                    </div>
                )}
            </IonHeader>

            <IonContent className="chat-sidebar-content">
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="chat-empty-state">
                            <IonIcon icon={sparklesOutline} className="empty-icon" />
                            <IonText color="medium">
                                <p>Start a conversation with the AI assistant</p>
                                <p className="empty-hint">
                                    Ask to generate an invoice, modify fields, or update values
                                </p>
                            </IonText>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id} className={`chat-message ${message.role}`}>
                                <div className="message-content">
                                    {message.imageUrl && (
                                        <div className="message-image">
                                            <img src={message.imageUrl} alt="Attached invoice" />
                                        </div>
                                    )}
                                    <div className="message-text">{message.content}</div>
                                    <div className="message-time">
                                        {message.timestamp.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="chat-message assistant">
                            <div className="message-content loading">
                                <IonSpinner name="dots" />
                                <IonText color="medium">
                                    <small>AI is thinking...</small>
                                </IonText>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </IonContent>

            <div className="chat-input-container">
                {imagePreview && (
                    <div className="image-preview-container">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                        <IonButton
                            fill="clear"
                            size="small"
                            className="remove-image-button"
                            onClick={handleRemoveImage}
                        >
                            <IonIcon icon={closeOutline} />
                        </IonButton>
                    </div>
                )}
                <div className="input-row">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                        id="image-upload-input"
                    />
                    <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="attach-button"
                        title="Attach invoice image"
                    >
                        <IonIcon icon={imageOutline} />
                    </IonButton>
                    <IonTextarea
                        ref={textareaRef}
                        value={inputMessage}
                        onIonInput={(e) => setInputMessage(e.detail.value || '')}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message... (Shift+Enter for new line)"
                        autoGrow={true}
                        rows={1}
                        disabled={isLoading}
                        className="chat-input"
                    />
                    <IonButton
                        onClick={handleSend}
                        disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                        className="send-button"
                        color="primary"
                    >
                        {isLoading ? <IonSpinner name="circular" /> : <IonIcon icon={sendOutline} />}
                    </IonButton>
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
