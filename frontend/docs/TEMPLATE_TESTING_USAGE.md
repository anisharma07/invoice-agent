# Template Testing Components - Usage Guide

## Quick Start

### Using TemplateTesting Component

```tsx
import TemplateTesting from '../components/TemplateTesting/TemplateTesting';

function MyComponent() {
    const [cellMappings, setCellMappings] = useState({
        Heading: "B2",
        Date: "D20",
        InvoiceNumber: "C18",
        From: {
            Name: "C12",
            Email: "C16"
        }
    });

    const mscData = {
        numsheets: 1,
        currentid: "sheet1",
        currentname: "Invoice",
        sheetArr: {
            sheet1: {
                name: "Invoice",
                hidden: "0",
                sheetstr: {
                    savestr: "cell:A1:t:Invoice\ncell:B2:t:My Invoice\n..."
                }
            }
        }
    };

    return (
        <TemplateTesting
            mscData={mscData}
            cellMappings={cellMappings}
            onMappingsUpdate={(newMappings) => {
                console.log('Mappings updated:', newMappings);
                setCellMappings(newMappings);
            }}
            title="Test Your Invoice Template"
        />
    );
}
```

## Cell Mappings Examples

### Example 1: Simple Invoice

```json
{
  "Heading": "B2",
  "Date": "D20",
  "InvoiceNumber": "C18",
  "From": {
    "Name": "C12",
    "StreetAddress": "C13",
    "CityStateZip": "C14",
    "Phone": "C15",
    "Email": "C16"
  },
  "BillTo": {
    "Name": "C5",
    "StreetAddress": "C6",
    "CityStateZip": "C7",
    "Phone": "C8",
    "Email": "C9"
  }
}
```

### Example 2: Invoice with Items Table

```json
{
  "InvoiceNumber": "C18",
  "Date": "D20",
  "CustomerName": "C5",
  "Items": {
    "Name": "Items",
    "Heading": "Items",
    "Subheading": "Item",
    "Rows": {
      "start": 23,
      "end": 30
    },
    "Columns": {
      "Description": "B",
      "Quantity": "D",
      "UnitPrice": "E",
      "Amount": "F"
    }
  },
  "SubTotal": "F31",
  "Tax": "F32",
  "Total": "F33"
}
```

### Example 3: Service Receipt

```json
{
  "ReceiptNumber": "B2",
  "Date": "B3",
  "Provider": {
    "Name": "B5",
    "Address": "B6",
    "Contact": "B7"
  },
  "Customer": {
    "Name": "B9",
    "Address": "B10"
  },
  "Services": {
    "Name": "Services",
    "Heading": "Services Provided",
    "Subheading": "Service",
    "Rows": {
      "start": 15,
      "end": 20
    },
    "Columns": {
      "ServiceName": "B",
      "Hours": "C",
      "Rate": "D",
      "Total": "E"
    }
  },
  "TotalAmount": "E21",
  "Notes": "B23"
}
```

## Validation Rules

### ✅ Valid Cell References
- `"A1"` - Column A, Row 1
- `"B10"` - Column B, Row 10
- `"AA5"` - Column AA, Row 5
- `"Z999"` - Column Z, Row 999

### ❌ Invalid Cell References
- `"1A"` - Row before column
- `"a1"` - Lowercase letters
- `"A"` - Missing row number
- `"1"` - Missing column letter
- `"A-1"` - Invalid character

### Items Structure Requirements

```typescript
{
  "Items": {
    "Name": string,        // Required: Identifier name
    "Heading": string,     // Required: Display heading
    "Subheading": string,  // Required: Single item name
    "Rows": {
      "start": number,     // Required: Starting row
      "end": number        // Required: Ending row
    },
    "Columns": {
      [key: string]: string  // Column name to letter mapping
    }
  }
}
```

## Common Validation Errors

### Error: "Invalid cell reference"
**Cause**: Cell reference doesn't match format `[A-Z]+\d+`

**Fix**: Ensure format is `ColumnRow` (e.g., `A1`, `B2`, `AA10`)

```json
// ❌ Wrong
{ "Date": "1A" }

// ✅ Correct
{ "Date": "A1" }
```

### Error: "Invalid Items config - Rows must have start and end as numbers"
**Cause**: Row numbers are strings or missing

**Fix**: Use numeric values for start and end

```json
// ❌ Wrong
"Rows": { "start": "23", "end": "30" }

// ✅ Correct
"Rows": { "start": 23, "end": 30 }
```

### Error: "Invalid column reference"
**Cause**: Column in Items.Columns is not a letter

**Fix**: Use only column letters (A, B, C, etc.)

```json
// ❌ Wrong
"Columns": { "Description": "B1" }

// ✅ Correct
"Columns": { "Description": "B" }
```

## Testing Workflow

1. **Load Template**: Provide `mscData` and initial `cellMappings`
2. **View Preview**: See the rendered spreadsheet
3. **Test Form**: Click edit button to open dynamic form
4. **Fill Form**: Enter test data in the form
5. **Verify Mapping**: Check if data appears in correct cells
6. **Edit Mappings**: Click edit icon to modify cell mappings
7. **Update**: Save changes and see form update automatically
8. **Re-test**: Fill form again to verify new mappings work
9. **Iterate**: Repeat until perfect

## Tips

### Tip 1: Start with Known Good Data
Begin with a working template's mappings and modify incrementally.

### Tip 2: Test One Section at a Time
Focus on one section (e.g., "From" address) before moving to the next.

### Tip 3: Use Consistent Naming
Keep field names consistent with your template's design.

### Tip 4: Document Complex Mappings
Add comments in your code explaining special mapping logic.

### Tip 5: Validate Early and Often
Test mappings immediately after creating/editing them.

## AppRenderer Component

For advanced use cases, you can use `AppRenderer` directly:

```tsx
import AppRenderer from '../components/AppRenderer/AppRenderer';

function CustomPreview() {
    const templateData = {
        msc: mscData,
        cellMappings: {
            sheet1: mappings
        },
        templateId: 'custom-1',
        template: 'Custom Template',
        category: 'Custom'
    };

    return (
        <AppRenderer
            mscData={mscData}
            templateData={templateData}
            onMappingsUpdate={() => {
                console.log('Form data updated');
            }}
        />
    );
}
```

## Troubleshooting

### Preview Not Showing
**Check**: Is `mscData` properly formatted with `sheetArr` and `savestr`?

### Form Fields Not Appearing
**Check**: Do `cellMappings` match the current sheet ID in `mscData.currentid`?

### Data Not Populating in Spreadsheet
**Check**: Are cell references valid and within the sheet bounds?

### Edit Button Not Working
**Check**: Is `templateData` provided with proper `cellMappings` structure?

## Advanced: Custom Validation

You can extend validation by modifying the `validateMappings` function in `TemplateTesting.tsx`:

```typescript
const validateMappings = (mappingsStr: string) => {
    // Your custom validation logic
    const parsed = JSON.parse(mappingsStr);
    
    // Add custom checks
    if (!parsed.InvoiceNumber) {
        return { 
            valid: false, 
            error: 'InvoiceNumber is required' 
        };
    }
    
    return { valid: true, data: parsed };
};
```

## Support

For issues or questions:
1. Check validation error messages
2. Review examples in this guide
3. Inspect browser console for detailed logs
4. Verify template structure matches expectations
