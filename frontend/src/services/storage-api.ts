
const API_BASE_URL = 'http://localhost:5000/api';

// Client-side cache for template lists
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const templateCache: Map<string, CacheEntry<any>> = new Map();
const CACHE_TTL = {
    global: 10 * 60 * 1000,  // 10 minutes for global templates (rarely change)
    user: 2 * 60 * 1000      // 2 minutes for user templates
};

function getCached<T>(key: string, ttl: number): T | null {
    const entry = templateCache.get(key);
    if (entry && Date.now() - entry.timestamp < ttl) {
        return entry.data as T;
    }
    templateCache.delete(key);
    return null;
}

function setCache<T>(key: string, data: T): void {
    templateCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateTemplateCache(userId?: string): void {
    if (userId) {
        templateCache.delete(`user_${userId}`);
    } else {
        templateCache.clear();
    }
}

export interface Template {
    id: number | string;
    filename: string;
    name: string;
    description: string;
    type: "invoice" | "receipt" | "purchase_order" | "quotation" | "other";
    device: "mobile" | "tablet" | "desktop";
    isPremium: boolean;
    price: { [key: string]: number };
    image: string;
    hashtag?: string[];
    last_modified: string;
}

export interface Invoice {
    filename: string;
    last_modified: string;
    size: number;
    template_id?: string | number;
    invoice_id?: string;
    total?: number | null;
    created_at?: string;
    modified_at?: string;
    bill_type?: number | string;
    invoice_name?: string;
    status?: string;
    invoice_number?: string;
}

export const storageApi = {
    async fetchTemplates(page: number = 1, limit: number = 10, userId: string = 'default_user'): Promise<{ items: Template[], pagination: any }> {
        // Check cache first for user templates
        const cacheKey = `user_${userId}`;
        const cached = getCached<{ items: Template[], pagination: any }>(cacheKey, CACHE_TTL.user);
        if (cached && page === 1) {
            return cached;
        }

        const response = await fetch(`${API_BASE_URL}/templates?type=user&page=${page}&limit=${limit}&userId=${userId}`);
        if (response.ok) {
            const json = await response.json();
            const result = { items: json.data || [], pagination: json.pagination };
            if (page === 1) {
                setCache(cacheKey, result);
            }
            return result;
        }
        return { items: [], pagination: {} };
    },

    async fetchGlobalTemplates(page: number = 1, limit: number = 10): Promise<{ items: Template[], pagination: any }> {
        // Check cache first for global templates
        const cacheKey = 'global_templates';
        const cached = getCached<{ items: Template[], pagination: any }>(cacheKey, CACHE_TTL.global);
        if (cached && page === 1) {
            return cached;
        }

        const response = await fetch(`${API_BASE_URL}/templates?type=app&page=${page}&limit=${limit}`);
        if (response.ok) {
            const json = await response.json();
            const result = { items: json.data || [], pagination: json.pagination };
            if (page === 1) {
                setCache(cacheKey, result);
            }
            return result;
        }
        return { items: [], pagination: {} };
    },



    async fetchTemplate(filename: string, isGlobal: boolean = false, userId: string = 'default_user'): Promise<any> {
        const type = isGlobal ? 'global' : 'user';
        const response = await fetch(`${API_BASE_URL}/templates/${filename}?type=${type}&userId=${userId}`);
        if (response.ok) {
            const json = await response.json();
            return json.data || null;
        }
        return null;
    },

    async importTemplate(filename: string | number, targetFilename?: string, userId: string = 'default_user'): Promise<boolean> {
        const fname = String(filename);
        const response = await fetch(`${API_BASE_URL}/templates/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: fname, targetFilename, userId }),
        });
        if (response.ok) {
            const json = await response.json();
            if (json.success) {
                // Invalidate cache to ensure fresh data on next fetch
                invalidateTemplateCache(userId);
            }
            return json.success;
        }
        return false;
    },

    async deleteTemplate(filename: string, userId: string = 'default_user'): Promise<boolean> {
        const response = await fetch(`${API_BASE_URL}/templates/${filename}?userId=${userId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            const json = await response.json();
            if (json.success) {
                // Invalidate cache to ensure fresh data on next fetch
                invalidateTemplateCache(userId);
            }
            return json.success;
        }
        return false;
    },

    async fetchInvoices(userId: string = 'default_user'): Promise<Invoice[]> {
        const response = await fetch(`${API_BASE_URL}/invoices?userId=${userId}`);
        if (response.ok) {
            return await response.json();
        }
        return [];
    },

    async fetchInvoice(filename: string, userId: string = 'default_user'): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/invoices/${filename}?userId=${userId}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    },

    async saveInvoice(
        filename: string,
        content: any,
        templateId: string | number,
        billType: number = 1,
        userId: string = 'default_user',
        invoiceId?: string,
        total?: number | null,
        invoiceName?: string,
        status?: string,
        invoiceNumber?: string,
        appMapping?: any,
        footer?: any
    ): Promise<boolean> {
        const response = await fetch(`${API_BASE_URL}/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename,
                content,
                templateId,
                billType,
                userId,
                invoiceId,
                total,
                invoiceName,
                status,
                invoiceNumber,
                appMapping,
                footer
            }),
        });
        return response.ok;
    },

    async deleteInvoice(filename: string, userId: string = 'default_user'): Promise<boolean> {
        const response = await fetch(`${API_BASE_URL}/invoices/${filename}?userId=${userId}`, {
            method: 'DELETE',
        });
        return response.ok;
    },

    async generateMapping(mscCode: string): Promise<{ success: boolean; data?: { mapping: Record<string, any>; fieldCount: number }; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/generate-mapping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mscCode }),
            });
            const json = await response.json();
            return json;
        } catch (error) {
            console.error('Error generating mapping:', error);
            return { success: false, error: 'Network error while generating mapping' };
        }
    },

    async updateTemplateMeta(filename: string, updates: Record<string, any>, userId: string = 'default_user'): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/templates/${filename}/meta`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, updates }),
            });
            if (response.ok) {
                const json = await response.json();
                return json.success;
            }
            return false;
        } catch (error) {
            console.error('Error updating template meta:', error);
            return false;
        }
    }
};
