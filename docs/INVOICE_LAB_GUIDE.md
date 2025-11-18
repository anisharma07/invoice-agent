# 🧪 Invoice Lab - Complete User Guide

## Overview

**Invoice Lab** is a guided, step-by-step interface for creating, customizing, and perfecting invoice templates using AI. It replaces the previous single-screen generator with a structured 4-step process.

---

## 🎯 Purpose

The Invoice Lab provides a systematic approach to:
1. **Generate** invoice templates using AI
2. **Edit** cell mappings to customize field locations
3. **Refine** template metadata (name, category, device type)
4. **Review** and save the final template

---

## 📋 Step-by-Step Flow

### Step 0: Welcome Screen

**Purpose:** Introduction and overview

**Features:**
- Welcome message explaining the Invoice Lab
- Visual preview of all 3 steps
- "Start Creating" button to begin

**UI Elements:**
- Large flask icon (🧪)
- Three preview cards showing each step:
  - Step 1: Generate (with sparkles icon)
  - Step 2: Edit Mappings (with grid icon)
  - Step 3: Edit Metadata (with document icon)

**User Actions:**
- Click "Start Creating" → Proceed to Step 1

---

### Step 1: Generate Invoice Template

**Purpose:** Create initial template using AI

**Features:**
- Integrated chat interface
- Support for text prompts and image uploads
- Real-time AI generation
- Success preview after generation

**UI Elements:**
- Chat sidebar with message history
- Token counter
- Image upload button
- Generation preview card showing:
  - Template name
  - Category
  - Device type
  - Validation status

**User Actions:**
1. Enter prompt describing invoice requirements
2. (Optional) Upload invoice image
3. Click Send
4. Wait for AI to generate template
5. Review generation preview
6. Click "Continue to Edit Mappings"

**Example Prompts:**
```
"Create a professional tax invoice template for tablet with 15 line items"
"Generate a service receipt for mobile devices"
"Make a quotation template optimized for desktop"
```

**What Happens:**
- MetaAndCellMap Agent analyzes requirements
- SaveStr Agent generates MSC format
- Validation loop ensures format correctness
- Response includes:
  - User-friendly text
  - MSC savestr code
  - Cell mappings JSON
  - Template metadata
  - Validation info

---

### Step 2: Edit Cell Mappings

**Purpose:** Customize field locations and coordinates

**Features:**
- JSON editor for cell mappings
- Live preview of template
- Real-time validation
- Edit hints and guidance

**UI Elements:**
- Large JSON textarea with syntax highlighting
- Editor hint explaining cell coordinates
- Live preview section showing rendered template
- Navigation buttons (Back, Continue)

**Cell Mappings Structure:**
```json
{
  "logo": {
    "cell": "A1"
  },
  "signature": {
    "cell": "F40"
  },
  "text": {
    "sheet1": {
      "Heading": "B2",
      "Date": "H4",
      "InvoiceNumber": "B4",
      "BillTo": "B6",
      "From": "F6",
      "Items": {
        "Rows": {
          "start": 23,
          "end": 35
        },
        "Columns": {
          "Description": "C",
          "Quantity": "E",
          "Amount": "F"
        }
      },
      "Subtotal": "F36",
      "Tax": "F37",
      "Total": "F38"
    }
  }
}
```

**Editable Fields:**
- Cell coordinates (e.g., "B2", "F36")
- Row ranges for item tables
- Column letters for table fields
- Logo and signature positions

**User Actions:**
1. Review current cell mappings
2. Edit coordinates as needed
3. Check live preview for changes
4. Click "Continue to Edit Metadata"

**Tips:**
- Cell format: Column Letter + Row Number (e.g., "A1", "B2")
- Use row ranges for repeating items
- Ensure no overlapping cells
- Preview updates in real-time

---

### Step 3: Edit Metadata & Final Review

**Purpose:** Refine template details and review complete output

**Features:**
- Metadata editor with form fields
- Complete output summary
- All sections preview
- Final validation display

**UI Elements:**

1. **Metadata Editor:**
   - Template Name (text input)
   - Category (dropdown select)
   - Device Type (dropdown select)
   - Description (textarea)

2. **Final Output Summary:**
   - Template Metadata card
   - Cell Mappings JSON
   - Rendered Template preview
   - Validation Status
   - Complete JSON Output with Copy button

**Category Options:**
- Tax Invoice
- Service Receipt
- Quotation
- Purchase Order
- Proforma Invoice
- Credit Note

**Device Type Options:**
- Mobile (optimized for small screens)
- Tablet (balanced layout)
- Desktop (full width)

**User Actions:**
1. Edit template name
2. Select appropriate category
3. Choose target device type
4. Update description
5. Review all sections:
   - Metadata summary
   - Cell mappings
   - Rendered template
   - Validation status
   - Complete JSON
6. Click "Save Invoice Template"

**Final Output Includes:**
```json
{
  "numsheets": 1,
  "currentid": "sheet1",
  "currentname": "Professional-Tax-Invoice-Tablet",
  "sheetArr": {
    "sheet1": {
      "sheetstr": {
        "savestr": "version:1.5\ncell:B2:t:INVOICE..."
      },
      "name": "Professional-Tax-Invoice-Tablet",
      "hidden": "no"
    }
  },
  "EditableCells": {
    "allow": true,
    "cells": {},
    "constraints": {}
  },
  "templateMeta": {
    "name": "Professional-Tax-Invoice-Tablet",
    "category": "tax_invoice",
    "deviceType": "tablet",
    "description": "Professional invoice template..."
  },
  "cellMappings": { ... },
  "validation": {
    "is_valid": true,
    "attempts": 2,
    "final_errors": []
  }
}
```

---

## 🎨 Visual Design

### Step Indicator

**Location:** Top of page below header

**Design:**
- 4 circles connected by lines
- Active step: Blue circle with icon
- Completed steps: Green circle with checkmark
- Future steps: Gray circle with icon
- Labels below each circle

**States:**
- Default: Gray outline
- Active: Blue filled with pulse effect
- Completed: Green filled with checkmark

### Card Styles

**Welcome Card:**
- Large centered card
- Maximum width: 800px
- Box shadow: Elevated
- Icon: 64px flask
- Button: Full width, large

**Step Cards:**
- Full width with padding
- Box shadow: Medium
- Icon in title: 28px
- Rounded corners: 12px

**Summary Cards:**
- Light background
- 1px border
- 16px padding
- Rounded corners: 8px

### Color Scheme

**Primary Colors:**
- Primary Blue: #3880ff
- Success Green: #2dd36f
- Warning Yellow: #ffc409
- Medium Gray: #92949c

**Backgrounds:**
- Light: #f4f5f8
- Card: white
- Code: #f5f5f5

**Borders:**
- Standard: #ddd
- Active: primary blue
- Success: success green

---

## 🔄 Navigation Flow

```
Step 0 (Welcome)
    ↓ [Start Creating]
Step 1 (Generate)
    ↓ [Continue to Edit Mappings] (disabled until template generated)
Step 2 (Edit Mappings)
    ← [Back]
    ↓ [Continue to Edit Metadata]
Step 3 (Edit Metadata & Review)
    ← [Back]
    ↓ [Save Invoice Template]
```

**Reset Button:**
- Available in header at all steps
- Resets to Step 0
- Clears all data
- Starts new session

---

## 💾 Data Management

### State Management

**Session Data:**
- Session ID (persists through steps)
- Messages (chat history)
- Token count
- Backend status

**Template Data:**
- Generated MSC JSON
- Editable cell mappings
- Editable template metadata
- Original savestr

**Step State:**
- Current step (0-3)
- Loading status
- Toast messages

### Save Functionality

**On "Save Invoice Template" Click:**
1. Combine edited metadata and mappings
2. Update MSC JSON structure
3. Log final data to console
4. Show success toast
5. Ready for backend save (TODO)

**Future Enhancements:**
- Save to backend database
- Save to local storage
- Export as file
- Share template

---

## 🎯 Use Cases

### Use Case 1: Quick Tax Invoice
```
1. Start → Step 1
2. Prompt: "Create tax invoice for tablet"
3. Generate → Review preview
4. Continue → Skip Step 2 (no edits)
5. Continue → Quick review in Step 3
6. Save
```

### Use Case 2: Custom Service Receipt
```
1. Start → Step 1
2. Upload image of existing receipt
3. Generate from image
4. Edit mappings → Adjust cell coordinates
5. Edit metadata → Change name and description
6. Review all sections
7. Save
```

### Use Case 3: Complex Quotation
```
1. Start → Step 1
2. Prompt: "Create quotation with 20 line items for desktop"
3. Generate → Review
4. Edit mappings → Customize item table range
5. Edit mappings → Add custom fields
6. Edit metadata → Update category and description
7. Review complete output
8. Save
```

---

## 🧪 Testing Guide

### Test Step 0 (Welcome)
- ✓ Welcome card displays
- ✓ Flask icon visible
- ✓ Three preview steps shown
- ✓ Start button works
- ✓ Transitions to Step 1

### Test Step 1 (Generate)
- ✓ Chat interface loads
- ✓ Can enter text prompt
- ✓ Can upload image
- ✓ Send button works
- ✓ Loading spinner shows
- ✓ Generation preview appears
- ✓ Template info displays correctly
- ✓ Continue button enabled after generation
- ✓ Back button returns to Step 0

### Test Step 2 (Edit Mappings)
- ✓ Cell mappings JSON displays
- ✓ Can edit JSON text
- ✓ Live preview updates
- ✓ Editor hint shows
- ✓ Back button works
- ✓ Continue button works
- ✓ Invalid JSON shows error (future)

### Test Step 3 (Edit Metadata)
- ✓ All form fields populate
- ✓ Can edit template name
- ✓ Can select category
- ✓ Can select device type
- ✓ Can edit description
- ✓ Metadata summary displays
- ✓ Cell mappings summary displays
- ✓ Rendered template preview shows
- ✓ Validation status displays
- ✓ Complete JSON output shows
- ✓ Copy button works
- ✓ Back button works
- ✓ Save button works
- ✓ Success toast shows

### Test Navigation
- ✓ Step indicator updates correctly
- ✓ Completed steps show checkmark
- ✓ Active step highlights
- ✓ Reset button clears all data
- ✓ Can navigate back and forth

### Test Responsive Design
- ✓ Mobile view (< 768px)
- ✓ Tablet view (768-1024px)
- ✓ Desktop view (> 1024px)
- ✓ Step indicator adapts
- ✓ Navigation buttons stack on mobile

---

## 🚀 Future Enhancements

### Phase 1 (Near-term)
- [ ] Real-time JSON validation in Step 2
- [ ] Auto-save draft templates
- [ ] Template history/versioning
- [ ] Undo/redo for edits

### Phase 2 (Medium-term)
- [ ] Visual cell editor (drag-and-drop)
- [ ] Template preview with zoom
- [ ] Export to PDF
- [ ] Share template via link

### Phase 3 (Long-term)
- [ ] Template marketplace
- [ ] Collaborative editing
- [ ] Custom field types
- [ ] Formula builder UI
- [ ] Style editor (colors, fonts)

---

## 📊 Comparison: Old vs New

### Old System (Invoice AI Generator)
- Single page with chat sidebar
- Generate and display only
- No structured editing
- No step-by-step guidance
- Invoice history tabs

### New System (Invoice Lab)
- 4-step guided process
- Welcome/introduction screen
- Dedicated editing steps
- Clear progression
- Final review before save
- No history (single template focus)

**Advantages of Invoice Lab:**
1. **Guided Experience:** Clear steps prevent confusion
2. **Focused Editing:** Each step has single purpose
3. **Review Stage:** Final check before saving
4. **Better UX:** Visual progress indicator
5. **Organized Output:** Structured final summary

---

## 🎓 Tips & Best Practices

### For Users

**Step 1 Tips:**
- Be specific in prompts (include device type, item count)
- Upload clear images for better analysis
- Review preview before continuing

**Step 2 Tips:**
- Test small changes first
- Use live preview to verify
- Keep cell coordinates organized
- Avoid overlapping cells

**Step 3 Tips:**
- Choose descriptive template names
- Select accurate category
- Write clear descriptions
- Review all sections carefully

### For Developers

**Adding New Steps:**
1. Add step to `currentStep` type
2. Create step content JSX
3. Add to step indicator
4. Update navigation logic
5. Add CSS styles

**Customizing UI:**
- Colors: Update CSS variables
- Icons: Change in step definitions
- Layout: Modify grid/flex
- Animations: Adjust keyframes

**State Management:**
- Keep editable states separate
- Update original data last
- Preserve session across steps
- Clear on reset

---

## 📝 Summary

**Invoice Lab** transforms invoice creation into a guided, multi-step process that:
- Makes complex template creation accessible
- Provides clear structure and progression
- Enables precise customization
- Ensures quality through review stage
- Delivers professional results

**Perfect for:**
- First-time users needing guidance
- Power users wanting control
- Teams standardizing templates
- Anyone creating custom invoices

---

**Status:** ✅ IMPLEMENTED

**Version:** 1.0.0

**Last Updated:** November 15, 2025
