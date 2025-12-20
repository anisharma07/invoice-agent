const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface GenerateRequest {
    prompt: string;
    current_code?: string;
    mode?: 'generate' | 'edit';
}

export interface GenerateResponse {
    success: boolean;
    data?: {
        savestr: string;
        mode: 'generate' | 'edit';
        reasoning: string;
    };
    error?: string;
}

export interface ConvertToJsonRequest {
    savestr: string;
    sheet_name?: string;
}

export interface ConvertToJsonResponse {
    success: boolean;
    data?: {
        numsheets: number;
        currentid: string;
        currentname: string;
        sheetArr: Record<string, any>;
    };
    error?: string;
}

class AgentService {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Generate or edit SocialCalc code using the AI agent
     */
    async generate(request: GenerateRequest): Promise<GenerateResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error calling generate API:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Convert SocialCalc format to JSON format
     */
    async convertToJson(request: ConvertToJsonRequest): Promise<ConvertToJsonResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/convert-to-json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error calling convert-to-json API:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`);
            const data = await response.json();
            return data.status === 'healthy';
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}

export const agentService = new AgentService();
