# Editable Cells Generator Utility

This utility provides functions to automatically generate `EditableCells` configuration from cell mappings, making it easier to manage editable cells in your spreadsheet templates.

## Purpose

When working with invoice templates and spreadsheets, you need to define which cells are editable. Instead of manually creating the `EditableCells` configuration, this utility automatically extracts all cell references from your `cellMappings` and generates the appropriate configuration.

## Important: SocialCalc Format

The generated `EditableCells` follows the SocialCalc format:
```typescript
{
  "allow": true,
  "cells": {
    "sheet1!A1": true,  // Format: "sheetName!CellRef": boolean
    "sheet1!B2": true,
    "sheet1!C3": true
  },
  "constraints": {}
}
```

**NOT** the object format:
```typescript
// ❌ INCORRECT FORMAT - DO NOT USE
{
  "cells": {
    "A1": { "allow": true, "type": "text" }
  }
}
```

## Features

- ✅ **Automatic Cell Reference Extraction**: Recursively extracts all cell references from nested objects
- ✅ **Items Table Support**: Handles dynamic item rows with start/end ranges and column mappings
- ✅ **Custom Constraints**: Add constraints like 'date', 'number', 'formula', etc.
- ✅ **Multiple Sheet Support**: Generate configurations for multiple sheets at once
- ✅ **Merge Configurations**: Combine multiple EditableCells configurations
- ✅ **Dynamic Management**: Add or remove cells from existing configurations

## Installation

The utility is located at:
```
src/utils/editableCellsGenerator.ts
```

Import the functions you need:
```typescript
import {
  generateEditableCells,
  generateEditableCellsForSheet,
  addEditableCells,
  removeEditableCells,
  getEditableCellRefs,
  mergeEditableCells,
} from '../utils/editableCellsGenerator';
```

## Usage Examples

### Example 1: Basic Usage with Cell Mappings

```typescript
const cellMappings = {
  sheet1: {
    Heading: 'B2',
    Date: 'D20',
    InvoiceNumber: 'C18',
    From: {
      Name: 'C12',
      Email: 'C16',
    },
    BillTo: {
      Name: 'C5',
      Email: 'C9',
    },
    Items: {
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
  },
};

// Generate editable cells for all sheets
const editableCells = generateEditableCells(cellMappings);

// Result format:
// {
//   "allow": true,
//   "cells": {
//     "sheet1!B2": true,
//     "sheet1!D20": true,
//     "sheet1!C18": true,
//     "sheet1!C12": true,
//     "sheet1!C16": true,
//     "sheet1!C5": true,
//     "sheet1!C9": true,
//     "sheet1!C23": true,
//     ... (all item rows)
//     "sheet1!F37": true
//   },
//   "constraints": {}
// }
```

### Example 2: Single Sheet Generation

```typescript
const editableCells = generateEditableCellsForSheet(
  cellMappings.sheet1,
  {
    allowByDefault: true,
    sheetName: 'sheet1',  // Sheet name for prefixing
  }
);

// Result format:
// {
//   "allow": true,
//   "cells": {
//     "sheet1!B2": true,
//     "sheet1!D20": true,
//     ...
//   },
//   "constraints": {}
// }
```

### Example 3: Integration with Testing Page

```typescript
// In InvoiceAITestingPage.tsx
const initializeApp = async () => {
  const testingData = loadTestingData();
  
  // Generate EditableCells from cellMappings
  let editableCells = generateEditableCellsForSheet(
    testingData.cellMappings,
    {
      allowByDefault: true,
      defaultType: 'text',
    }
  );

  const templateData = {
    template: "Generated Template",
    templateId: Date.now(),
    category: testingData.templateMeta?.category || "simple_invoice",
    msc: {
      numsheets: 1,
      currentid: 'sheet1',
      currentname: 'sheet1',
      sheetArr: rawMsc.sheetArr,
      EditableCells: editableCells, // Use generated editable cells
    },
    cellMappings: testingData.cellMappings,
  };
};
```

### Example 4: Add Logo and Signature Cells

```typescript
const baseEditableCells = generateEditableCellsForSheet(cellMappings.sheet1);

// Add logo and signature cells dynamically
const updatedEditableCells = addEditableCells(
  baseEditableCells,
  ['A1', 'A2', 'E40', 'E41'], // Logo at A1-A2, Signature at E40-E41
  {
    allow: true,
    sheetName: 'sheet1',
  }
);
// Result: Adds "sheet1!A1", "sheet1!A2", "sheet1!E40", "sheet1!E41"
```

### Example 5: Remove Formula Cells from Editable List

```typescript
const editableCells = generateEditableCellsForSheet(cellMappings.sheet1);

// Remove calculated fields that shouldn't be directly edited
const restrictedEditableCells = removeEditableCells(
  editableCells,
  ['F37', 'F38', 'F39'] // Remove totals and calculated fields
);
```

### Example 6: Merge Multiple Configurations

```typescript
const headerCells = generateEditableCellsForSheet({ 
  Heading: 'A1', 
  Date: 'B1' 
});

const bodyCells = generateEditableCellsForSheet({ 
  Items: { /* ... */ } 
});

const footerCells = generateEditableCellsForSheet({ 
  Total: 'F37',
  Notes: 'C40' 
});

const mergedConfig = mergeEditableCells(headerCells, bodyCells, footerCells);
```

## API Reference

### `generateEditableCells(cellMappings, options?)`

Generates EditableCells configuration for all sheets in the cell mappings.

**Parameters:**
- `cellMappings`: Object containing sheet-level mappings
- `options`: (Optional)
  - `allowByDefault`: boolean (default: true)
  - `sheetNamePrefix`: string (default: 'sheet1')

**Returns:** EditableCellsConfig for all sheets

**Cell Format:** Cells are stored as `"sheetName!A1": true`

### `generateEditableCellsForSheet(sheetMappings, options?)`

Generates EditableCells configuration for a single sheet.

**Parameters:**
- `sheetMappings`: Cell mappings for a single sheet
- `options`: (Optional)
  - `allowByDefault`: boolean (default: true)
  - `sheetName`: string (default: 'sheet1')

**Returns:** EditableCells configuration

**Cell Format:** Cells are stored as `"sheetName!A1": true`

### `addEditableCells(editableCells, cellRefs, options?)`

Adds specific cells to an existing configuration.

**Parameters:**
- `editableCells`: Existing EditableCells configuration
- `cellRefs`: Array of cell references to add (e.g., ['A1', 'B2'] or ['sheet1!A1', 'sheet1!B2'])
- `options`: (Optional)
  - `allow`: boolean (default: true)
  - `sheetName`: string (default: 'sheet1') - Used if cellRefs don't contain "!"

**Returns:** Updated EditableCells configuration

### `removeEditableCells(editableCells, cellRefs)`

Removes specific cells from a configuration.

**Parameters:**
- `editableCells`: Existing EditableCells configuration
- `cellRefs`: Array of cell references to remove

**Returns:** Updated EditableCells configuration

### `getEditableCellRefs(editableCells)`

Gets all editable cell references from a configuration.

**Parameters:**
- `editableCells`: EditableCells configuration

**Returns:** Array of cell references that are editable

### `mergeEditableCells(...configs)`

Merges multiple EditableCells configurations.

**Parameters:**
- `...configs`: Variable number of EditableCells configurations

**Returns:** Merged EditableCells configuration

### `isValidCellReference(cellRef)`

Validates if a cell reference is in the correct format.

**Parameters:**
- `cellRef`: Cell reference string (e.g., "A1", "B2")

**Returns:** boolean

## Cell Mappings Structure

The utility understands the following cell mappings structure:

```typescript
{
  // Simple cell reference
  Heading: 'B2',
  Date: 'D20',
  
  // Nested objects
  From: {
    Name: 'C12',
    Email: 'C16',
  },
  
  // Items table with dynamic rows
  Items: {
    Name: 'Items',         // Metadata (ignored)
    Heading: 'Items',      // Metadata (ignored)
    Subheading: 'Item',    // Metadata (ignored)
    Rows: {
      start: 23,           // First row
      end: 35,             // Last row
    },
    Columns: {
      Description: 'C',    // Column letter
      Amount: 'F',         // Column letter
    },
  },
}
```

## Cell Reference Format

### Input Format (Cell Mappings)
Valid cell references in your cell mappings:
- Single letter + number: `A1`, `B2`, `Z99`
- Double letter + number: `AA1`, `AB10`, `ZZ999`
- Triple letter + number: `AAA1`, `XYZ100`

The utility validates cell references using the regex: `/^[A-Z]{1,3}\d{1,5}$/`

### Output Format (EditableCells)
Generated EditableCells use the SocialCalc format with sheet prefix:
- Format: `"sheetName!CellRef": boolean`
- Example: `"sheet1!A1": true`, `"inv1!B2": true`
- The sheet name is prepended automatically with a `!` separator

## Notes

- The utility automatically handles nested structures and recursively extracts all cell references
- For Items tables, it generates cell references for all rows from `start` to `end` for each column
- Metadata keys like `Name`, `Heading`, `Subheading`, `Rows`, and `Columns` are skipped during extraction
- Duplicate cell references are automatically removed
- The generated EditableCells configuration is compatible with SocialCalc's EditableCells format

## Testing

See `editableCellsGenerator.example.ts` for comprehensive usage examples and test cases.
