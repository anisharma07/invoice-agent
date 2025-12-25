const fs = require('fs');
const path = require('path');

// Read templates.ts
const templatesPath = path.join(__dirname, '../../frontend/src/templates.ts');
let fileContent = fs.readFileSync(templatesPath, 'utf8');

// Helper to extract the DATA object text manually since we can't easily require TS
// We'll effectively find "export let DATA... = {" and the matching closing "};"
const startIndex = fileContent.indexOf('export let DATA');
const equalsSign = fileContent.indexOf('=', startIndex);
const openBrace = fileContent.indexOf('{', equalsSign);

// Simple brace counting to find the end of the object
let braceCount = 1;
let endIndex = openBrace + 1;
while (braceCount > 0 && endIndex < fileContent.length) {
    if (fileContent[endIndex] === '{') braceCount++;
    if (fileContent[endIndex] === '}') braceCount--;
    endIndex++;
}

const dataString = fileContent.substring(openBrace, endIndex);

// Evaluate the string to get the object (requires it to be valid JS syntax for the object part)
// We might need to quote keys if they aren't quoted, but templates.ts usually has clean object literals.
// Let's rely on Function or eval, ensuring we have a clean context.
const DATA = eval('(' + dataString + ')');

const transformData = (data) => {
    const newData = {};

    Object.keys(data).forEach(key => {
        const template = data[key];
        const newTemplate = {
            msc: template.msc,
            footers: template.footers,
            appMapping: {
                sheet1: {} // Assuming single sheet 'sheet1' based on context, or we scan
            }
        };

        // Determine sheet name (usually sheet1 based on logoCell structure)
        let sheetName = 'sheet1';
        if (typeof template.logoCell === 'object' && template.logoCell) {
            sheetName = Object.keys(template.logoCell)[0] || 'sheet1';
        }

        const sheetMapping = {};

        // 1. Logo
        let logoVal = "";
        if (typeof template.logoCell === 'string') logoVal = template.logoCell;
        else if (template.logoCell) logoVal = template.logoCell[sheetName];

        if (logoVal) {
            sheetMapping['Logo'] = {
                type: 'image',
                cell: logoVal,
                editable: true
            };
        }

        // 2. Signature
        let sigVal = "";
        if (typeof template.signatureCell === 'string') sigVal = template.signatureCell;
        else if (template.signatureCell) sigVal = template.signatureCell[sheetName];

        if (sigVal) {
            sheetMapping['Signature'] = {
                type: 'image',
                cell: sigVal,
                editable: true
            };
        }

        // 3. CellMappings
        if (template.cellMappings && template.cellMappings[sheetName]) {
            const mappings = template.cellMappings[sheetName];

            Object.keys(mappings).forEach(mapKey => {
                const mapVal = mappings[mapKey];

                // Helper recursive function for forms
                const processForm = (formObj) => {
                    const content = {};
                    Object.keys(formObj).forEach(fKey => {
                        const fVal = formObj[fKey];
                        if (typeof fVal === 'string') {
                            content[fKey] = {
                                type: 'text',
                                cell: fVal,
                                editable: true
                            };
                        } else if (typeof fVal === 'object') {
                            // Nested form
                            content[fKey] = {
                                type: 'form',
                                editable: true,
                                formContent: processForm(fVal)
                            };
                        }
                    });
                    return content;
                };

                if (typeof mapVal === 'string') {
                    // Simple text field
                    sheetMapping[mapKey] = {
                        type: 'text',
                        cell: mapVal,
                        editable: true
                    };
                } else if (mapVal.Rows && mapVal.Columns) {
                    // Table (Items)
                    sheetMapping[mapKey] = {
                        type: 'table',
                        unitname: mapVal.Subheading || 'Item',
                        rows: mapVal.Rows,
                        col: {},
                        editable: true
                    };

                    Object.keys(mapVal.Columns).forEach(colKey => {
                        sheetMapping[mapKey].col[colKey] = {
                            type: 'text',
                            name: colKey, // Used to be just key
                            editable: true
                        };
                        // Note: The template only stored column letter (e.g. "C"), 
                        // the new structure implies full definition? 
                        // Plan said: col?: { [columnKey: string]: AppMappingItem }
                        // Let's assume we store the column letter somewhere if needed, but the current UI might assume it from context?
                        // Wait, the new structure for table col items is AppMappingItem.
                        // Ideally we need to store the column mapping "C" or "F".
                        // Let's put it in a custom property or 'cell' if applicable, though table usually implies dynamic rows.
                        // Actually, looking at the user image, table cols have 'type', 'name', 'editable'. 
                        // It doesn't explicitly show where the column letter "C" goes.
                        // However, for a table, the 'cell' is usually row-relative.
                        // Let's preserve the column info in 'cell' for now to be safe, or just 'name'.
                        // User image: ColName: { type:..., name:..., editable:... }
                        // The original `Columns: { Description: "C" }` mapped key to column letter.
                        // New structure seems to define the columns configuration.
                        // I will put the letter in 'cell' just in case, or maybe 'column'?
                        // The user schema didn't specify 'column' property.
                        // I'll stick to the user's diagram attributes mainly but add 'cell' if it fits AppMappingItem
                        sheetMapping[mapKey].col[colKey] = {
                            type: 'text',
                            name: colKey,
                            editable: true,
                            cell: mapVal.Columns[colKey] // Storing "C" or "F" here seems most logical place to keep the data
                        };
                    });

                } else if (typeof mapVal === 'object') {
                    // Form (From, BillTo)
                    sheetMapping[mapKey] = {
                        type: 'form',
                        editable: true,
                        formContent: processForm(mapVal)
                    };
                }
            });
        }

        newTemplate.appMapping[sheetName] = sheetMapping;
        newData[key] = newTemplate;
    });

    return newData;
};

const newDATA = transformData(DATA);

// Output strictly the object string
console.log(JSON.stringify(newDATA, null, 2));
