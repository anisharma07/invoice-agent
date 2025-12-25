/**
 * Utility functions to generate EditableCells configuration from AppMapping
 */

import { AppMappingItem } from '../types/template';

interface EditableCells {
    allow: boolean;
    cells: {
        [cellRef: string]: boolean; // Format: "sheetName!A1": true
    };
    constraints: {
        [key: string]: any;
    };
}

interface EditableCellsConfig {
    [sheetId: string]: EditableCells;
}

/**
 * Recursively extracts all cell references from AppMapping structure
 */
const extractCellReferences = (
    obj: any,
    cellRefs: string[] = []
): string[] => {
    if (!obj || typeof obj !== 'object') return cellRefs;

    // Check if current object looks like an AppMappingItem with a cell
    if (obj.cell && typeof obj.cell === 'string' && /^[A-Z]{1,3}\d{1,5}$/.test(obj.cell)) {
        cellRefs.push(obj.cell);
    }

    // Handle Table type (rows & col)
    if (obj.type === 'table' && obj.rows && obj.col) {
        const { start, end } = obj.rows;
        const columns = obj.col; // Map of key -> AppMappingItem

        for (let row = start; row <= end; row++) {
            Object.values(columns).forEach((colItem: any) => {
                // colItem is AppMappingItem, should have 'cell' for column letter
                if (colItem.cell && typeof colItem.cell === 'string') {
                    const columnLetter = colItem.cell;
                    // Validate column letter (A-ZZZ)
                    if (/^[A-Z]{1,3}$/.test(columnLetter)) {
                        cellRefs.push(`${columnLetter}${row}`);
                    }
                }
            });
        }
    }

    // Recurse into nested objects (formContent, or values of the object)
    // We iterate keys to find nested AppMappingItems
    Object.values(obj).forEach(val => {
        if (typeof val === 'object' && val !== null) {
            extractCellReferences(val, cellRefs);
        }
    });

    return cellRefs;
};

/**
 * Generates EditableCells configuration from app mapping
 */
export const generateEditableCells = (
    appMapping: { [sheetId: string]: any }, // AppMapping
    options: {
        allowByDefault?: boolean;
        sheetNamePrefix?: string;
    } = {}
): EditableCellsConfig => {
    const {
        allowByDefault = true,
    } = options;

    const editableCellsConfig: EditableCellsConfig = {};

    // Process each sheet
    for (const [sheetId, sheetMapping] of Object.entries(appMapping)) {
        // Extract all cell references from the sheet mappings
        const cellRefs = extractCellReferences(sheetMapping);

        // Remove duplicates
        const uniqueCellRefs = [...new Set(cellRefs)];

        // Build the cells configuration with sheet prefix
        const cells: EditableCells['cells'] = {};

        uniqueCellRefs.forEach((cellRef) => {
            // Format: "sheetName!A1": true
            const prefixedCellRef = `${sheetId}!${cellRef}`;
            cells[prefixedCellRef] = allowByDefault;
        });

        // Create the EditableCells configuration for this sheet
        editableCellsConfig[sheetId] = {
            allow: allowByDefault,
            cells,
            constraints: {},
        };
    }

    return editableCellsConfig;
};

/**
 * Generates EditableCells configuration for a single sheet
 */
export const generateEditableCellsForSheet = (
    sheetMapping: any,
    options: {
        allowByDefault?: boolean;
        sheetName?: string;
    } = {}
): EditableCells => {
    const {
        allowByDefault = true,
        sheetName = 'sheet1',
    } = options;

    const cellRefs = extractCellReferences(sheetMapping);
    const uniqueCellRefs = [...new Set(cellRefs)];

    const cells: EditableCells['cells'] = {};

    uniqueCellRefs.forEach((cellRef) => {
        const prefixedCellRef = `${sheetName}!${cellRef}`;
        cells[prefixedCellRef] = allowByDefault;
    });

    return {
        allow: allowByDefault,
        cells,
        constraints: {},
    };
};

/**
 * Merges multiple EditableCells configurations
 */
export const mergeEditableCells = (...configs: EditableCells[]): EditableCells => {
    const merged: EditableCells = {
        allow: true,
        cells: {},
        constraints: {},
    };

    configs.forEach((config) => {
        Object.assign(merged.cells, config.cells);
        Object.assign(merged.constraints, config.constraints);
        if (!config.allow) {
            merged.allow = false;
        }
    });

    return merged;
};

/**
 * Adds specific cells to an existing EditableCells configuration
 */
export const addEditableCells = (
    editableCells: EditableCells,
    cellRefs: string[],
    options: {
        allow?: boolean;
        sheetName?: string;
    } = {}
): EditableCells => {
    const { allow = true, sheetName = 'sheet1' } = options;

    cellRefs.forEach((cellRef) => {
        const prefixedCellRef = cellRef.includes('!') ? cellRef : `${sheetName}!${cellRef}`;
        editableCells.cells[prefixedCellRef] = allow;
    });

    return editableCells;
};

/**
 * Removes specific cells from an EditableCells configuration
 */
export const removeEditableCells = (
    editableCells: EditableCells,
    cellRefs: string[]
): EditableCells => {
    cellRefs.forEach((cellRef) => {
        delete editableCells.cells[cellRef];
    });

    return editableCells;
};

/**
 * Gets all editable cell references from an EditableCells configuration
 */
export const getEditableCellRefs = (editableCells: EditableCells): string[] => {
    return Object.entries(editableCells.cells)
        .filter(([_, isEditable]) => isEditable === true)
        .map(([cellRef, _]) => cellRef);
};

/**
 * Validates if a cell reference is in the correct format
 */
export const isValidCellReference = (cellRef: string): boolean => {
    return /^[A-Z]{1,3}\d{1,5}$/.test(cellRef);
};
