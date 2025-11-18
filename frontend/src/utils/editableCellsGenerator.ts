/**
 * Utility functions to generate EditableCells configuration from cell mappings
 */

interface CellMappings {
    [sheetId: string]: {
        [key: string]: any;
    };
}

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
 * Recursively extracts all cell references from a nested object structure
 * @param obj - The object to extract cell references from (e.g., cellMappings for a sheet)
 * @param cellRefs - Accumulator array for cell references
 * @param path - Current path in the object (for debugging/context)
 */
const extractCellReferences = (
    obj: any,
    cellRefs: string[] = [],
    path: string = ''
): string[] => {
    if (typeof obj === 'string') {
        // Check if it's a valid cell reference (e.g., "A1", "B2", "C12")
        // Cell references are typically 1-3 letters followed by 1-5 digits
        if (/^[A-Z]{1,3}\d{1,5}$/.test(obj)) {
            cellRefs.push(obj);
        }
    } else if (typeof obj === 'object' && obj !== null) {
        // Handle special case: Items with Rows and Columns
        if (obj.Rows && obj.Columns) {
            const { start, end } = obj.Rows;
            const columns = obj.Columns;

            // Generate cell references for each row and column combination
            for (let row = start; row <= end; row++) {
                for (const [columnKey, columnLetter] of Object.entries(columns)) {
                    if (typeof columnLetter === 'string' && /^[A-Z]{1,3}$/.test(columnLetter)) {
                        cellRefs.push(`${columnLetter}${row}`);
                    }
                }
            }
        } else {
            // Recursively process nested objects
            for (const [key, value] of Object.entries(obj)) {
                // Skip metadata keys that aren't cell references
                if (!['Name', 'Heading', 'Subheading', 'Rows', 'Columns'].includes(key)) {
                    extractCellReferences(value, cellRefs, path ? `${path}.${key}` : key);
                } else if (key === 'Rows' || key === 'Columns') {
                    // Skip these as they're handled above
                    continue;
                } else {
                    // For Name, Heading, Subheading, check if they contain cell refs
                    extractCellReferences(value, cellRefs, path ? `${path}.${key}` : key);
                }
            }
        }
    }

    return cellRefs;
};

/**
 * Generates EditableCells configuration from cell mappings
 * @param cellMappings - The cell mappings object containing sheet-level mappings
 * @param options - Optional configuration
 * @returns EditableCells configuration for all sheets
 */
export const generateEditableCells = (
    cellMappings: CellMappings,
    options: {
        allowByDefault?: boolean;
        sheetNamePrefix?: string;
    } = {}
): EditableCellsConfig => {
    const {
        allowByDefault = true,
        sheetNamePrefix = 'sheet1',
    } = options;

    const editableCellsConfig: EditableCellsConfig = {};

    // Process each sheet
    for (const [sheetId, sheetMappings] of Object.entries(cellMappings)) {
        // Extract all cell references from the sheet mappings
        const cellRefs = extractCellReferences(sheetMappings);

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
 * @param sheetMappings - The cell mappings for a single sheet
 * @param options - Optional configuration
 * @returns EditableCells configuration
 */
export const generateEditableCellsForSheet = (
    sheetMappings: any,
    options: {
        allowByDefault?: boolean;
        sheetName?: string;
    } = {}
): EditableCells => {
    const {
        allowByDefault = true,
        sheetName = 'sheet1',
    } = options;

    // Extract all cell references from the sheet mappings
    const cellRefs = extractCellReferences(sheetMappings);

    // Remove duplicates
    const uniqueCellRefs = [...new Set(cellRefs)];

    // Build the cells configuration with sheet prefix
    const cells: EditableCells['cells'] = {};

    uniqueCellRefs.forEach((cellRef) => {
        // Format: "sheetName!A1": true
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
 * @param configs - Array of EditableCells configurations to merge
 * @returns Merged EditableCells configuration
 */
export const mergeEditableCells = (...configs: EditableCells[]): EditableCells => {
    const merged: EditableCells = {
        allow: true,
        cells: {},
        constraints: {},
    };

    configs.forEach((config) => {
        // Merge cells
        Object.assign(merged.cells, config.cells);

        // Merge constraints
        Object.assign(merged.constraints, config.constraints);

        // If any config disallows editing, set allow to false
        if (!config.allow) {
            merged.allow = false;
        }
    });

    return merged;
};

/**
 * Adds specific cells to an existing EditableCells configuration
 * @param editableCells - Existing EditableCells configuration
 * @param cellRefs - Array of cell references to add (can be prefixed with sheet name or not)
 * @param options - Optional cell configuration
 * @returns Updated EditableCells configuration
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
        // If cellRef doesn't contain "!", add sheet prefix
        const prefixedCellRef = cellRef.includes('!') ? cellRef : `${sheetName}!${cellRef}`;
        editableCells.cells[prefixedCellRef] = allow;
    });

    return editableCells;
};

/**
 * Removes specific cells from an EditableCells configuration
 * @param editableCells - Existing EditableCells configuration
 * @param cellRefs - Array of cell references to remove
 * @returns Updated EditableCells configuration
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
 * @param editableCells - EditableCells configuration
 * @returns Array of cell references that are editable (with sheet prefix)
 */
export const getEditableCellRefs = (editableCells: EditableCells): string[] => {
    return Object.entries(editableCells.cells)
        .filter(([_, isEditable]) => isEditable === true)
        .map(([cellRef, _]) => cellRef);
};

/**
 * Validates if a cell reference is in the correct format
 * @param cellRef - Cell reference to validate (e.g., "A1", "B2")
 * @returns True if valid, false otherwise
 */
export const isValidCellReference = (cellRef: string): boolean => {
    return /^[A-Z]{1,3}\d{1,5}$/.test(cellRef);
};
