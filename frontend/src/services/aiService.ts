/**
 * AI Service for Invoice Generation
 * Integrates with the dockerized backend API for AI-powered invoice generation
 */

// Backend API URL - adjust this based on your Docker configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface GenerateInvoiceRequest {
    session_id?: string;
    initial_prompt: string;
    invoice_image?: string;
}

export interface ChatRequest {
    session_id: string;
    message: string;
    invoice_image?: string;
}

// New response structure
export interface TemplateMeta {
    name: string;
    domain: string;
    category: 'tax_invoice' | 'simple_invoice' | 'professional_invoice';
    deviceType: 'mobile' | 'tablet' | 'desktop';
    description?: string;
}

export interface CellMappings {
    logo?: {
        sheet1: string;
    };
    signature?: {
        sheet1: string;
    };
    text: {
        sheet1: {
            Heading?: string;
            Date?: string;
            InvoiceNumber?: string;
            From?: Record<string, string>;
            BillTo?: Record<string, string>;
            Items?: {
                Name: string;
                Heading: string;
                Subheading: string;
                Rows: {
                    start: number;
                    end: number;
                };
                Columns: Record<string, string>;
            };
            Subtotal?: string;
            Tax?: string;
            Total?: string;
            Notes?: string;
            PaymentTerms?: string;
            [key: string]: any;
        };
    };
}

export interface AssistantResponse {
    text: string;
    savestr: string;
    cellMappings: CellMappings;
    templateMeta: TemplateMeta;
}

export interface ValidationInfo {
    is_valid: boolean;
    attempts: number;
    final_errors: string[];
}

export interface AIResponse {
    session_id: string;
    assistantResponse: AssistantResponse;
    validation: ValidationInfo;
    token_count: number;
    timestamp: string;
}

// Legacy support - for backward compatibility
export interface LegacyAIResponse {
    session_id: string;
    message: string;
    msc_content?: string;
    token_count: number;
    timestamp: string;
}

export interface SessionInfo {
    session_id: string;
    created_at: string;
    last_activity: string;
    token_count: number;
    message_count: number;
}

/**
 * Generate a new invoice using AI
 */
export async function generateInvoice(
    prompt: string,
    sessionId?: string,
    invoiceImage?: string
): Promise<AIResponse> {
    try {
        const requestBody: GenerateInvoiceRequest = {
            session_id: sessionId,
            initial_prompt: prompt,
        };

        if (invoiceImage) {
            requestBody.invoice_image = invoiceImage;
        }

        const response = await fetch(`${API_BASE_URL}/api/generate-invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail || `API error: ${response.status} ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error generating invoice:', error);
        throw error;
    }
}

/**
 * Continue conversation with the AI agent
 */
export async function sendChatMessage(
    sessionId: string,
    message: string,
    invoiceImage?: string
): Promise<AIResponse> {
    try {
        const requestBody: ChatRequest = {
            session_id: sessionId,
            message: message,
        };

        if (invoiceImage) {
            requestBody.invoice_image = invoiceImage;
        }

        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail || `API error: ${response.status} ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
}

/**
 * Get session information
 */
export async function getSessionInfo(sessionId: string): Promise<SessionInfo> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail || `API error: ${response.status} ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching session info:', error);
        throw error;
    }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail || `API error: ${response.status} ${response.statusText}`
            );
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        throw error;
    }
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking backend health:', error);
        throw error;
    }
}
