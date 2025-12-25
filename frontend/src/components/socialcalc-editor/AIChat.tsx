import { useState, useCallback } from 'react';
import './AIChat.css';

interface AIChatProps {
    onGenerate: (prompt: string) => Promise<void>;
    isLoading: boolean;
}

const SparklesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ai-icon">
        <path d="M12 2L14.1 8.9L21 11L14.1 13.1L12 20L9.9 13.1L3 11L9.9 8.9L12 2Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 15L20 18L23 19L20 20L19 23L18 20L15 19L18 18L19 15Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 16L6 19L9 20L6 21L5 24L4 21L1 20L4 19L5 16Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="close-icon">
        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const AIChat: React.FC<AIChatProps> = ({ onGenerate, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!prompt.trim() || isLoading) return;

            await onGenerate(prompt);
            setPrompt('');
        },
        [prompt, isLoading, onGenerate]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            e.stopPropagation();
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        },
        [handleSubmit]
    );

    const stopPropagation = useCallback((e: React.SyntheticEvent) => {
        e.stopPropagation();
    }, []);

    const toggleChat = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    return (
        <div className={`ai-chat-container ${isOpen ? 'open' : 'closed'}`} onKeyDown={stopPropagation} onKeyUp={stopPropagation}>
            <button className={`ai-chat-toggle ${isOpen ? 'active' : ''}`} onClick={toggleChat} title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}>
                {isOpen ? <CloseIcon /> : <SparklesIcon />}
            </button>

            {isOpen && (
                <div className="ai-chat-panel" onClick={stopPropagation} onMouseDown={stopPropagation}>
                    <div className="ai-chat-header">
                        <div className="ai-chat-header-icon">
                            <SparklesIcon />
                        </div>
                        <div className="ai-chat-header-text">
                            <h3>AI Assistant</h3>
                            <p>Ask me to create or modify your spreadsheet</p>
                        </div>
                    </div>

                    <div className="ai-chat-examples">
                        <p>Try asking:</p>
                        <ul>
                            <li>"Create an invoice with teal theme"</li>
                            <li>"Change colors to orange"</li>
                            <li>"Add a header row with bold text"</li>
                        </ul>
                    </div>

                    <form onSubmit={handleSubmit} className="ai-chat-form">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onKeyUp={stopPropagation}
                            onKeyPress={stopPropagation}
                            placeholder="Describe what you want to create or change..."
                            rows={3}
                            disabled={isLoading}
                            className="ai-chat-input"
                        />
                        <button
                            type="submit"
                            disabled={!prompt.trim() || isLoading}
                            className="ai-chat-submit"
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner" />
                                    Generating...
                                </>
                            ) : (
                                'Generate'
                            )}
                        </button>
                    </form>

                    <div className="ai-chat-footer">
                        <small>Created with love by Invoice Calc</small>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChat;
