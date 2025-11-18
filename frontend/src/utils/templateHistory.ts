import { Preferences } from "@capacitor/preferences";

const RECENT_TEMPLATES_KEY = "recent_templates";
const ONLINE_INVOICES_KEY = "online_invoices";
const MAX_RECENT = 7;
const MAX_ONLINE = 100;

export interface TemplateHistoryItem {
    templateId: number;
    fileName: string;
    timestamp: string;
    lastUsed: string;
}

export interface OnlineInvoiceItem {
    templateId: number;
    fileName: string;
    timestamp: string;
    lastUsed: string;
    source: "online"; // To differentiate from locally created templates
    metadata?: any; // Additional metadata from online template
}

/**
 * Add a template to recent history (max 7 items)
 * Most recent items appear first
 */
export const addToRecentTemplates = async (
    templateId: number,
    fileName: string
): Promise<void> => {
    try {
        const recent = await getRecentTemplates();

        // Remove existing entry if it exists
        const filtered = recent.filter(
            (item) => !(item.templateId === templateId && item.fileName === fileName)
        );

        // Add new item at the beginning
        const newItem: TemplateHistoryItem = {
            templateId,
            fileName,
            timestamp: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
        };

        const updated = [newItem, ...filtered].slice(0, MAX_RECENT);

        await Preferences.set({
            key: RECENT_TEMPLATES_KEY,
            value: JSON.stringify(updated),
        });
    } catch (error) {
        console.error("Error adding to recent templates:", error);
    }
};

/**
 * Get recent templates (max 7)
 */
export const getRecentTemplates = async (): Promise<TemplateHistoryItem[]> => {
    try {
        const result = await Preferences.get({ key: RECENT_TEMPLATES_KEY });
        if (result.value) {
            return JSON.parse(result.value);
        }
        return [];
    } catch (error) {
        console.error("Error getting recent templates:", error);
        return [];
    }
};

/**
 * Add an online invoice to the collection (max 100, FIFO deletion)
 */
export const addToOnlineInvoices = async (
    templateId: number,
    fileName: string,
    metadata?: any
): Promise<void> => {
    try {
        const onlineInvoices = await getOnlineInvoices();

        // Check if already exists
        const existingIndex = onlineInvoices.findIndex(
            (item) => item.templateId === templateId && item.fileName === fileName
        );

        if (existingIndex !== -1) {
            // Update lastUsed timestamp and metadata
            onlineInvoices[existingIndex].lastUsed = new Date().toISOString();
            if (metadata) {
                onlineInvoices[existingIndex].metadata = metadata;
            }
        } else {
            // Add new item
            const newItem: OnlineInvoiceItem = {
                templateId,
                fileName,
                timestamp: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
                source: "online",
                metadata,
            };

            onlineInvoices.push(newItem);

            // If exceeds max, remove oldest (FIFO)
            if (onlineInvoices.length > MAX_ONLINE) {
                onlineInvoices.shift(); // Remove first (oldest) item
            }
        }

        await Preferences.set({
            key: ONLINE_INVOICES_KEY,
            value: JSON.stringify(onlineInvoices),
        });
    } catch (error) {
        console.error("Error adding to online invoices:", error);
    }
};

/**
 * Get online invoices (max 100)
 */
export const getOnlineInvoices = async (): Promise<OnlineInvoiceItem[]> => {
    try {
        const result = await Preferences.get({ key: ONLINE_INVOICES_KEY });
        if (result.value) {
            return JSON.parse(result.value);
        }
        return [];
    } catch (error) {
        console.error("Error getting online invoices:", error);
        return [];
    }
};

/**
 * Remove a template from recent history
 */
export const removeFromRecentTemplates = async (
    templateId: number,
    fileName: string
): Promise<void> => {
    try {
        const recent = await getRecentTemplates();
        const filtered = recent.filter(
            (item) => !(item.templateId === templateId && item.fileName === fileName)
        );

        await Preferences.set({
            key: RECENT_TEMPLATES_KEY,
            value: JSON.stringify(filtered),
        });
    } catch (error) {
        console.error("Error removing from recent templates:", error);
    }
};

/**
 * Remove an online invoice from the collection
 */
export const removeFromOnlineInvoices = async (
    templateId: number,
    fileName: string
): Promise<void> => {
    try {
        const onlineInvoices = await getOnlineInvoices();
        const filtered = onlineInvoices.filter(
            (item) => !(item.templateId === templateId && item.fileName === fileName)
        );

        await Preferences.set({
            key: ONLINE_INVOICES_KEY,
            value: JSON.stringify(filtered),
        });
    } catch (error) {
        console.error("Error removing from online invoices:", error);
    }
};

/**
 * Clear all recent templates
 */
export const clearRecentTemplates = async (): Promise<void> => {
    try {
        await Preferences.remove({ key: RECENT_TEMPLATES_KEY });
    } catch (error) {
        console.error("Error clearing recent templates:", error);
    }
};

/**
 * Clear all online invoices
 */
export const clearOnlineInvoices = async (): Promise<void> => {
    try {
        await Preferences.remove({ key: ONLINE_INVOICES_KEY });
    } catch (error) {
        console.error("Error clearing online invoices:", error);
    }
};
