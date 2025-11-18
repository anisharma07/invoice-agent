# Template Testing Feature 🧪

## What's New

We've transformed the template generation workflow by adding a comprehensive testing system that allows users to **test generated templates as a real app** with editable cell mappings and live form preview.

## Key Features

### 1. 🎨 Live App Rendering
- See exactly how your template will look and behave
- Real spreadsheet rendering using SocialCalc engine
- Interactive preview with all template functionality

### 2. ✏️ Editable Cell Mappings
- Edit cell mappings in a user-friendly JSON editor
- Built-in validation prevents errors
- See changes reflected immediately
- Helpful examples and documentation inline

### 3. 📝 Dynamic Form Testing
- Test the invoice form with your template
- Fill out fields and see data populate in cells
- Verify mappings work correctly
- Iterate and refine until perfect

### 4. ✅ Real-time Validation
- Instant feedback on mapping errors
- Clear error messages
- Prevents saving invalid configurations
- Supports complex nested structures

## Components

### TemplateTesting
**Main testing interface** - Use this in your pages

```tsx
<TemplateTesting
    mscData={spreadsheetData}
    cellMappings={currentMappings}
    onMappingsUpdate={(newMappings) => setMappings(newMappings)}
    title="Test Your Template"
/>
```

### AppRenderer
**Internal component** - Renders the app preview with form

Used internally by TemplateTesting. Can be used standalone for advanced cases.

## Where It's Used

### InvoiceAIPage - Step 2: Edit Cell Mappings
- Users can edit the JSON mappings
- Preview updates automatically
- Test button opens the dynamic form
- Validation ensures correctness

### InvoiceAIPage - Step 3: Final Review
- Last chance to test before saving
- Full app experience
- Verify all mappings work
- Make final adjustments

## User Workflow

```
1. Generate Template (AI)
   ↓
2. View Raw Preview
   ↓
3. Edit Cell Mappings
   ├─→ Click edit icon
   ├─→ Modify JSON
   ├─→ Validate changes
   └─→ See updates live
   ↓
4. Test Dynamic Form
   ├─→ Click edit button
   ├─→ Fill form fields
   ├─→ Verify cell updates
   └─→ Iterate if needed
   ↓
5. Final Review
   ├─→ Test again
   ├─→ Verify metadata
   └─→ Confirm all works
   ↓
6. Save Template ✅
```

## Cell Mappings Structure

### Simple Field
```json
{
  "InvoiceNumber": "C18"
}
```
Maps "InvoiceNumber" form field to cell C18

### Nested Object
```json
{
  "Customer": {
    "Name": "C5",
    "Email": "C6",
    "Phone": "C7"
  }
}
```
Creates a "Customer" section with multiple fields

### Items Table
```json
{
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
      "Price": "E"
    }
  }
}
```
Creates a dynamic table with add/remove rows

## Validation Rules

### ✅ Valid
- `"A1"`, `"B2"`, `"AA10"` - Proper cell references
- `{ "start": 23, "end": 30 }` - Numeric row ranges
- `"Columns": { "Name": "B" }` - Column letters

### ❌ Invalid
- `"1A"` - Row before column
- `"a1"` - Lowercase
- `{ "start": "23" }` - String instead of number
- `"Columns": { "Name": "B1" }` - Cell ref instead of column

## Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid cell reference" | Wrong format | Use format: A1, B2, etc. |
| "JSON Parse Error" | Invalid JSON | Check syntax, quotes, commas |
| "Rows must have start and end as numbers" | String row numbers | Use numbers: 23, not "23" |
| "Invalid column reference" | Cell ref in column | Use letter only: "B", not "B1" |

## Benefits

### For Users
- **Visual Feedback**: See exactly how forms map to cells
- **Error Prevention**: Catch mistakes before saving
- **Confidence**: Test before committing
- **Flexibility**: Easy to adjust and retry

### For Developers
- **Reusable**: Components work in any context
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new validation rules
- **Type-Safe**: Full TypeScript support

## Files Created

```
src/components/
├── AppRenderer/
│   ├── AppRenderer.tsx       # 160 lines - Preview renderer
│   └── AppRenderer.css       # 27 lines - Styling
└── TemplateTesting/
    ├── TemplateTesting.tsx   # 330 lines - Testing interface
    └── TemplateTesting.css   # 95 lines - Styling

docs/
├── TEMPLATE_TESTING_IMPLEMENTATION.md  # Technical details
└── TEMPLATE_TESTING_USAGE.md          # Usage guide

src/pages/
└── InvoiceAIPage.tsx         # Updated to use new components
```

## Technical Architecture

```
┌─────────────────────────────────────┐
│      InvoiceAIPage (Step 2/3)      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│       TemplateTesting Component     │
│  ┌─────────────────────────────┐   │
│  │  Edit Mappings Modal        │   │
│  │  - JSON Editor              │   │
│  │  - Validation               │   │
│  │  - Error Display            │   │
│  └─────────────────────────────┘   │
│               ↓                      │
│  ┌─────────────────────────────┐   │
│  │  AppRenderer Component      │   │
│  │  ┌─────────────────────┐    │   │
│  │  │ InvoiceProvider     │    │   │
│  │  │  ┌──────────────┐   │    │   │
│  │  │  │ Spreadsheet  │   │    │   │
│  │  │  │ (SocialCalc) │   │    │   │
│  │  │  └──────────────┘   │    │   │
│  │  │  ┌──────────────┐   │    │   │
│  │  │  │ Dynamic Form │   │    │   │
│  │  │  │ (Modal)      │   │    │   │
│  │  │  └──────────────┘   │    │   │
│  │  └─────────────────────┘    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Context Integration

The components integrate seamlessly with the existing `InvoiceContext`:

```typescript
InvoiceContext provides:
- activeTemplateData: Current template configuration
- currentSheetId: Active sheet identifier
- updateActiveTemplateData(): Update template
- updateCurrentSheetId(): Switch sheets

AppRenderer uses context to:
- Initialize template data for DynamicInvoiceForm
- Track current sheet for form generation
- Update data when form is submitted
```

## Future Enhancements

### Possible Improvements
1. **Visual Cell Picker**: Click cells to assign mappings
2. **Mapping Templates**: Library of pre-built mappings
3. **AI Suggestions**: Auto-suggest mapping improvements
4. **Undo/Redo**: Track mapping changes history
5. **Export/Import**: Share mappings between templates
6. **Diff View**: Compare before/after mappings
7. **Auto-save**: Save valid mappings automatically
8. **Collaborative Editing**: Multiple users edit together

## Testing Checklist

Before saving a template, verify:
- [ ] All form fields appear correctly
- [ ] Data populates in correct cells
- [ ] Nested sections work properly
- [ ] Items table adds/removes rows
- [ ] Cell references are valid
- [ ] JSON passes validation
- [ ] Form behavior matches expectations
- [ ] No console errors

## Support & Documentation

- **Implementation Guide**: `TEMPLATE_TESTING_IMPLEMENTATION.md`
- **Usage Examples**: `TEMPLATE_TESTING_USAGE.md`
- **Component Docs**: See JSDoc comments in source files
- **Context Docs**: `src/contexts/InvoiceContext.tsx`

## Quick Links

- [DynamicFormManager](src/utils/dynamicFormManager.ts) - Form generation logic
- [InvoiceContext](src/contexts/InvoiceContext.tsx) - State management
- [Templates](src/templates.ts) - Template definitions
- [Home Page](src/pages/Home.tsx) - Reference implementation

---

**Built with ❤️ for better invoice template creation**
