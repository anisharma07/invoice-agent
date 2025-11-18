/**
 * Example usage of editableCellsGenerator utility functions
 */

import {
    generateEditableCells,
    generateEditableCellsForSheet,
    addEditableCells,
    removeEditableCells,
    getEditableCellRefs,
    mergeEditableCells,
} from './editableCellsGenerator';

// Example cell mappings structure (like from your templates)
const exampleCellMappings = {
    sheet1: {
        Heading: 'B2',
        Date: 'D20',
        InvoiceNumber: 'C18',
        From: {
            Name: 'C12',
            StreetAddress: 'C13',
            CityStateZip: 'C14',
            Phone: 'C15',
            Email: 'C16',
        },
        BillTo: {
            Name: 'C5',
            StreetAddress: 'C6',
            CityStateZip: 'C7',
            Phone: 'C8',
            Email: 'C9',
        },
        Items: {
            Name: 'Items',
            Heading: 'Items',
            Subheading: 'Item',
            Rows: {
                start: 23,
                end: 35,
            },
            Columns: {
                Description: 'C',
                Amount: 'F',
            },
        },
        Total: 'F37',
        Notes: 'C40',
    },
};

// ============================================
// Example 1: Generate EditableCells for all sheets
// ============================================
console.log('Example 1: Generate EditableCells for all sheets');
const editableCellsConfig = generateEditableCells(exampleCellMappings);
console.log(JSON.stringify(editableCellsConfig, null, 2));

/*
Output:
{
  "sheet1": {
    "allow": true,
    "cells": {
      "sheet1!B2": true,
      "sheet1!D20": true,
      "sheet1!C18": true,
      "sheet1!C12": true,
      "sheet1!C13": true,
      "sheet1!C14": true,
      "sheet1!C15": true,
      "sheet1!C16": true,
      "sheet1!C5": true,
      "sheet1!C6": true,
      "sheet1!C7": true,
      "sheet1!C8": true,
      "sheet1!C9": true,
      "sheet1!C23": true,
      "sheet1!F23": true,
      "sheet1!C24": true,
      "sheet1!F24": true,
      ... (all rows from 23 to 35)
      "sheet1!F37": true,
      "sheet1!C40": true
    },
    "constraints": {}
  }
}
*/

// ============================================
// Example 2: Generate EditableCells for a single sheet
// ============================================
console.log('\nExample 2: Generate EditableCells for a single sheet');
const singleSheetEditableCells = generateEditableCellsForSheet(
    exampleCellMappings.sheet1,
    {
        allowByDefault: true,
        sheetName: 'sheet1',
    }
);
console.log(JSON.stringify(singleSheetEditableCells, null, 2));

/*
Output:
{
  "allow": true,
  "cells": {
    "sheet1!B2": true,
    "sheet1!D20": true,
    "sheet1!C18": true,
    ... (other cells)
    "sheet1!F37": true
  },
  "constraints": {}
}
*/

// ============================================
// Example 3: Add additional editable cells dynamically
// ============================================
console.log('\nExample 3: Add additional editable cells');
const baseEditableCells = generateEditableCellsForSheet(exampleCellMappings.sheet1);

// Add logo and signature cells
const updatedEditableCells = addEditableCells(
    baseEditableCells,
    ['A1', 'A2', 'E40', 'E41'], // Logo at A1-A2, Signature at E40-E41
    {
        allow: true,
        sheetName: 'sheet1',
    }
);
console.log('Added cells:', getEditableCellRefs(updatedEditableCells));

// ============================================
// Example 4: Remove specific cells from being editable
// ============================================
console.log('\nExample 4: Remove specific cells');
const restrictedEditableCells = removeEditableCells(
    updatedEditableCells,
    ['F37'] // Remove Total from editable cells (it's a formula)
);
console.log('Remaining editable cells:', getEditableCellRefs(restrictedEditableCells).length);

// ============================================
// Example 5: Merge multiple EditableCells configurations
// ============================================
console.log('\nExample 5: Merge EditableCells configurations');
const config1 = generateEditableCellsForSheet({ Heading: 'A1', Date: 'B1' });
const config2 = generateEditableCellsForSheet({ From: { Name: 'C1' } });
const mergedConfig = mergeEditableCells(config1, config2);
console.log('Merged cells:', getEditableCellRefs(mergedConfig));

// ============================================
// Example 6: Use with template data (integration example)
// ============================================
console.log('\nExample 6: Integration with template data');

interface TemplateData {
    template: string;
    templateId: number;
    category: string;
    msc: {
        numsheets: number;
        currentid: string;
        currentname: string;
        sheetArr: any;
        EditableCells?: any;
    };
    footers: any[];
    cellMappings: any;
}

const createTemplateWithEditableCells = (
    cellMappings: any,
    mscData: any
): TemplateData => {
    // Generate editable cells from cell mappings
    const editableCellsConfig = generateEditableCells({ sheet1: cellMappings });

    return {
        template: 'Generated Template',
        templateId: Date.now(),
        category: 'simple_invoice',
        msc: {
            numsheets: 1,
            currentid: 'sheet1',
            currentname: 'sheet1',
            sheetArr: mscData.sheetArr,
            EditableCells: editableCellsConfig.sheet1, // Use generated editable cells
        },
        footers: [
            {
                index: 1,
                name: 'Default',
                isActive: true,
            },
        ],
        cellMappings: cellMappings,
    };
};

// Example usage
const templateData = createTemplateWithEditableCells(
    exampleCellMappings.sheet1,
    {
        sheetArr: {
            sheet1: {
                sheetstr: { savestr: 'version:1.5...' },
                name: 'sheet1',
                hidden: 'no',
            },
        },
    }
);

console.log('Template with auto-generated EditableCells created');
console.log('Number of editable cells:', Object.keys(templateData.msc.EditableCells.cells).length);
