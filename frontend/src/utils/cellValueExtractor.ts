/**
 * Cell Value Extractor Utility
 * 
 * This utility extracts cell values from the active SocialCalc spreadsheet
 * and maps them to the template's AppMapping structure.
 */

import { AppMappingItem } from "../types/template";

/**
 * Get cell content from SocialCalc spreadsheet
 */
function getCellContent(sheetObj: any, cellAddress: string): string {
    try {
        const SocialCalc = (window as any).SocialCalc;
        if (!SocialCalc || !SocialCalc.GetCellContents) {
            console.error("SocialCalc not available");
            return "";
        }

        const content = SocialCalc.GetCellContents(sheetObj, cellAddress);
        return content || "";
    } catch (error) {
        console.error(`Error getting cell content for ${cellAddress}:`, error);
        return "";
    }
}

/**
 * Get the current sheet object from SocialCalc
 */
function getCurrentSheetObject(): any {
    try {
        const SocialCalc = (window as any).SocialCalc;
        if (!SocialCalc || !SocialCalc.GetCurrentWorkBookControl) {
            console.error("SocialCalc not available");
            return null;
        }

        const control = SocialCalc.GetCurrentWorkBookControl();
        if (!control || !control.workbook || !control.workbook.spreadsheet) {
            console.error("SocialCalc control not properly initialized");
            return null;
        }

        return control.workbook.spreadsheet.sheet;
    } catch (error) {
        console.error("Error getting current sheet object:", error);
        return null;
    }
}

/**
 * Extract values for nested form mappings
 */
function extractFormValues(
    sheetObj: any,
    formContent: { [key: string]: AppMappingItem }
): { [key: string]: any } {
    const values: { [key: string]: any } = {};

    for (const key in formContent) {
        const item = formContent[key];

        if (item.type === 'text' && item.cell) {
            values[key] = getCellContent(sheetObj, item.cell);
        } else if (item.type === 'form' && item.formContent) {
            values[key] = extractFormValues(sheetObj, item.formContent);
        }
    }

    return values;
}


/**
 * Extract values for Table items
 */
function extractTableValues(
    sheetObj: any,
    item: AppMappingItem
): Array<{ [columnName: string]: string }> {
    const items: Array<{ [columnName: string]: string }> = [];

    if (!item.rows || !item.col) return items;

    const startRow = item.rows.start;
    const endRow = item.rows.end;

    for (let row = startRow; row <= endRow; row++) {
        const tableRow: { [columnName: string]: string } = {};
        let hasContent = false;

        for (const colKey in item.col) {
            const colItem = item.col[colKey];
            // Table columns usually 'text' type with 'cell' indicating column letter
            if (colItem.cell) {
                const columnLetter = colItem.cell;
                const cellAddress = `${columnLetter}${row}`;
                const value = getCellContent(sheetObj, cellAddress);

                tableRow[colKey] = value;

                if (value && value.trim() !== "") {
                    hasContent = true;
                }
            }
        }

        // Only include rows that have some content
        if (hasContent) {
            items.push(tableRow);
        }
    }

    return items;
}

/**
 * Extract all cell values from the active spreadsheet based on app mapping
 * Returns flattened map of cell address -> value
 */
export function extractCellValues(
    appMapping: { [sheetName: string]: { [key: string]: AppMappingItem } }
): { [cellAddress: string]: string } {
    const cellValues: { [cellAddress: string]: string } = {};
    const sheetObj = getCurrentSheetObject();

    if (!sheetObj) {
        console.error("Cannot extract cell values: sheet object not available");
        return cellValues;
    }

    // Process each sheet
    for (const sheetName in appMapping) {
        const sheetMapping = appMapping[sheetName];

        // Recursive helper to flatten values
        const processItem = (item: AppMappingItem) => {
            if (item.type === 'text' && item.cell) {
                cellValues[item.cell] = getCellContent(sheetObj, item.cell);
            } else if (item.type === 'form' && item.formContent) {
                Object.values(item.formContent).forEach(subItem => processItem(subItem));
            } else if (item.type === 'table' && item.rows && item.col) {
                for (let row = item.rows.start; row <= item.rows.end; row++) {
                    Object.values(item.col).forEach(colItem => {
                        if (colItem.cell) {
                            const cellAddr = `${colItem.cell}${row}`;
                            cellValues[cellAddr] = getCellContent(sheetObj, cellAddr);
                        }
                    });
                }
            }
        };

        Object.values(sheetMapping).forEach(item => processItem(item));
    }

    return cellValues;
}

/**
 * Extract cell values in a structured format (preserving nesting)
 */
export function extractStructuredCellValues(
    appMapping: { [sheetName: string]: { [key: string]: AppMappingItem } }
): { [sheetName: string]: any } {
    const structuredValues: { [sheetName: string]: any } = {};
    const sheetObj = getCurrentSheetObject();

    if (!sheetObj) {
        console.error("Cannot extract cell values: sheet object not available");
        return structuredValues;
    }

    for (const sheetName in appMapping) {
        structuredValues[sheetName] = {};
        const sheetMapping = appMapping[sheetName];

        for (const key in sheetMapping) {
            const item = sheetMapping[key];

            if (item.type === 'text' && item.cell) {
                structuredValues[sheetName][key] = getCellContent(sheetObj, item.cell);
            } else if (item.type === 'form' && item.formContent) {
                structuredValues[sheetName][key] = extractFormValues(sheetObj, item.formContent);
            } else if (item.type === 'table') {
                structuredValues[sheetName][key] = extractTableValues(sheetObj, item);
            }
            // Images usually don't have extractable content relevant here
        }
    }

    return structuredValues;
}

/**
 * Apply cell updates to the active spreadsheet
 * 
 * @param cellUpdates - Object mapping cell addresses to new values
 * @returns Success status
 */
export function applyCellUpdates(cellUpdates: {
    [cellAddress: string]: string;
}): boolean {
    try {
        const SocialCalc = (window as any).SocialCalc;
        if (!SocialCalc || !SocialCalc.GetCurrentWorkBookControl) {
            console.error("SocialCalc not available");
            return false;
        }

        const control = SocialCalc.GetCurrentWorkBookControl();
        if (!control) {
            console.error("No workbook control available");
            return false;
        }

        if (!control.currentSheetButton) {
            console.error("No current sheet button available");
            return false;
        }

        const currsheet = control.currentSheetButton.id;

        // Build commands to set all values from cellUpdates
        const commands: string[] = [];

        // Iterate through cellUpdates and create set commands
        Object.entries(cellUpdates).forEach(([cellRef, value]) => {
            if (value !== undefined && value !== null) {
                if (value === "") {
                    // Clear the cell completely if value is empty string
                    commands.push(`erase ${cellRef} formulas`);
                } else if (value.toString().startsWith("=")) {
                    // It's a formula - set it as formula
                    const formula = value.toString();
                    commands.push(`set ${cellRef} formula ${formula}`);
                } else {
                    // Determine if the value is numeric or text
                    const stringValue = value.toString().trim();
                    const numericValue = parseFloat(stringValue);

                    if (
                        !isNaN(numericValue) &&
                        isFinite(numericValue) &&
                        stringValue === numericValue.toString()
                    ) {
                        // It's a valid number
                        commands.push(`set ${cellRef} value n ${numericValue}`);
                    } else {
                        // It's text - encode it properly for SocialCalc
                        const encodedValue = SocialCalc.encodeForSave
                            ? SocialCalc.encodeForSave(stringValue)
                            : stringValue;
                        commands.push(`set ${cellRef} text t ${encodedValue}`);
                    }
                }
            }
        });

        if (commands.length === 0) {
            console.log("No cell updates to apply");
            return true;
        }

        const cmd = commands.join("\n") + "\n";

        const commandObj = {
            cmdtype: "scmd",
            id: currsheet,
            cmdstr: cmd,
            saveundo: false,
        };

        // Execute the command using WorkBook control
        control.ExecuteWorkBookControlCommand(commandObj, false);

        console.log("✅ Successfully applied cell updates:", Object.keys(cellUpdates).length, "cells updated");
        return true;
    } catch (error) {
        console.error("❌ Error applying cell updates:", error);
        return false;
    }
}
