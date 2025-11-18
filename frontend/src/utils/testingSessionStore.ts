export const TESTING_INVOICE_STORAGE_KEY = 'invoice-testing-data';

export interface TestingInvoicePayload<T = unknown> {
    payload: T;
    updatedAt: number;
}

export const setTestingInvoicePayload = <T>(payload: T) => {
    try {
        const record: TestingInvoicePayload<T> = {
            payload,
            updatedAt: Date.now(),
        };
    localStorage.setItem(TESTING_INVOICE_STORAGE_KEY, JSON.stringify(record));
    } catch (error) {
        console.error('Failed to persist testing invoice data', error);
        throw error;
    }
};

export const getTestingInvoicePayload = <T>(): T | null => {
    try {
    const raw = localStorage.getItem(TESTING_INVOICE_STORAGE_KEY);
        if (!raw) return null;
        const record: TestingInvoicePayload<T> = JSON.parse(raw);
        return record.payload;
    } catch (error) {
        console.error('Failed to read testing invoice data', error);
    localStorage.removeItem(TESTING_INVOICE_STORAGE_KEY);
        return null;
    }
};

export const clearTestingInvoicePayload = () => {
    localStorage.removeItem(TESTING_INVOICE_STORAGE_KEY);
};
