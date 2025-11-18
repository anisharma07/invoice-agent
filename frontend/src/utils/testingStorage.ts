import { CellMappings, TemplateMeta } from '../services/aiService';

export const TESTING_DATA_KEY = 'invoice-lab-testing-data';

export interface TestingDataPayload {
    mscData: any;
    cellMappings: CellMappings;
    templateMeta?: TemplateMeta | null;
    rawMsc?: any;
    logoMapping?: CellMappings['logo'];
    signatureMapping?: CellMappings['signature'];
    savedAt: number;
}

export const saveTestingData = (payload: Omit<TestingDataPayload, 'savedAt'>) => {
    const record: TestingDataPayload = {
        ...payload,
        savedAt: Date.now(),
    };

    try {
        localStorage.setItem(TESTING_DATA_KEY, JSON.stringify(record));
    } catch (error) {
        console.error('Failed to persist testing data', error);
        throw error;
    }
};

export const loadTestingData = (): TestingDataPayload | null => {
    try {
        const raw = localStorage.getItem(TESTING_DATA_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.error('Failed to read testing data', error);
        return null;
    }
};

export const clearTestingData = () => {
    try {
        localStorage.removeItem(TESTING_DATA_KEY);
    } catch (error) {
        console.warn('Unable to clear testing data', error);
    }
};
