/**
 * Cell Value Extractor Utility
 * 
 * This utility extracts cell values from the active SocialCalc spreadsheet
 * and maps them to the template's cell mapping structure.
 */

import { CellMapping, ItemsConfig, NestedField } from "../templates";

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
 * Extract values for nested field mappings (e.g., From, BillTo)
 */
function extractNestedFieldValues(
    sheetObj: any,
    nestedMapping: NestedField
): { [key: string]: any } {
    const values: { [key: string]: any } = {};

    for (const key in nestedMapping) {
        const value = nestedMapping[key];

        if (typeof value === "string") {
            // Simple cell address
            values[key] = getCellContent(sheetObj, value);
        } else if (typeof value === "object") {
            // Nested object - recurse
            values[key] = extractNestedFieldValues(sheetObj, value as NestedField);
        }
    }

    return values;
}

/**
 * Extract values for Items (line items with rows and columns)
 */
function extractItemsValues(
    sheetObj: any,
    itemsConfig: ItemsConfig
): Array<{ [columnName: string]: string }> {
    const items: Array<{ [columnName: string]: string }> = [];

    const { Rows, Columns } = itemsConfig;
    const startRow = Rows.start;
    const endRow = Rows.end;

    for (let row = startRow; row <= endRow; row++) {
        const item: { [columnName: string]: string } = {};
        let hasContent = false;

        for (const columnName in Columns) {
            const columnLetter = Columns[columnName];
            const cellAddress = `${columnLetter}${row}`;
            const value = getCellContent(sheetObj, cellAddress);

            item[columnName] = value;

            if (value && value.trim() !== "") {
                hasContent = true;
            }
        }

        // Only include rows that have some content
        if (hasContent) {
            items.push(item);
        }
    }

    return items;
}

/**
 * Extract all cell values from the active spreadsheet based on cell mappings
 * 
 * @param cellMappings - The cell mapping structure from template
 * @returns Object mapping cell addresses to their values
 */
export function extractCellValues(
    cellMappings: { [sheetName: string]: CellMapping }
): { [cellAddress: string]: string } {
    const cellValues: { [cellAddress: string]: string } = {};
    const sheetObj = getCurrentSheetObject();

    if (!sheetObj) {
        console.error("Cannot extract cell values: sheet object not available");
        return cellValues;
    }

    // Process each sheet in the cell mappings
    for (const sheetName in cellMappings) {
        const sheetMapping = cellMappings[sheetName];

        // Process each field in the sheet mapping
        for (const fieldName in sheetMapping) {
            const fieldValue = sheetMapping[fieldName];

            if (typeof fieldValue === "string") {
                // Simple cell address mapping
                const cellAddress = fieldValue;
                cellValues[cellAddress] = getCellContent(sheetObj, cellAddress);
            } else if (typeof fieldValue === "object") {
                // Check if it's an Items config
                const potentialItems = fieldValue as any;
                if (
                    potentialItems.Rows &&
                    potentialItems.Columns &&
                    typeof potentialItems.Rows === "object" &&
                    typeof potentialItems.Columns === "object"
                ) {
                    // This is an Items configuration
                    const itemsConfig = fieldValue as ItemsConfig;
                    const { Rows, Columns } = itemsConfig;

                    // Extract all cells in the item range
                    for (let row = Rows.start; row <= Rows.end; row++) {
                        for (const columnName in Columns) {
                            const columnLetter = Columns[columnName];
                            const cellAddress = `${columnLetter}${row}`;
                            cellValues[cellAddress] = getCellContent(sheetObj, cellAddress);
                        }
                    }
                } else {
                    // This is a nested field (like From, BillTo)
                    const nestedValues = extractNestedFieldValues(
                        sheetObj,
                        fieldValue as NestedField
                    );

                    // Flatten nested values to cell addresses
                    const flattenNested = (obj: any, mapping: any): void => {
                        for (const key in obj) {
                            const value = obj[key];
                            const mappingValue = mapping[key];

                            if (typeof mappingValue === "string") {
                                cellValues[mappingValue] = value;
                            } else if (typeof mappingValue === "object") {
                                flattenNested(value, mappingValue);
                            }
                        }
                    };

                    flattenNested(nestedValues, fieldValue);
                }
            }
        }
    }

    return cellValues;
}

/**
 * Extract cell values in a structured format (preserving nesting)
 * 
 * @param cellMappings - The cell mapping structure from template
 * @returns Structured object with cell values
 */
export function extractStructuredCellValues(
    cellMappings: { [sheetName: string]: CellMapping }
): { [sheetName: string]: any } {
    const structuredValues: { [sheetName: string]: any } = {};
    const sheetObj = getCurrentSheetObject();

    if (!sheetObj) {
        console.error("Cannot extract cell values: sheet object not available");
        return structuredValues;
    }

    // Process each sheet in the cell mappings
    for (const sheetName in cellMappings) {
        structuredValues[sheetName] = {};
        const sheetMapping = cellMappings[sheetName];

        // Process each field in the sheet mapping
        for (const fieldName in sheetMapping) {
            const fieldValue = sheetMapping[fieldName];

            if (typeof fieldValue === "string") {
                // Simple cell address mapping
                structuredValues[sheetName][fieldName] = getCellContent(
                    sheetObj,
                    fieldValue
                );
            } else if (typeof fieldValue === "object") {
                // Check if it's an Items config
                const potentialItems = fieldValue as any;
                if (
                    potentialItems.Rows &&
                    potentialItems.Columns &&
                    typeof potentialItems.Rows === "object" &&
                    typeof potentialItems.Columns === "object"
                ) {
                    // This is an Items configuration
                    const itemsConfig = fieldValue as ItemsConfig;
                    structuredValues[sheetName][fieldName] = extractItemsValues(
                        sheetObj,
                        itemsConfig
                    );
                } else {
                    // This is a nested field (like From, BillTo)
                    structuredValues[sheetName][fieldName] = extractNestedFieldValues(
                        sheetObj,
                        fieldValue as NestedField
                    );
                }
            }
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
