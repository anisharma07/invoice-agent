# Invoice Template Generation System - Architecture Documentation

## Overview

This system generates professional invoice templates in SocialCalc (MSC) format using a multi-agent architecture with built-in validation and error correction.

## Agent Architecture

### 1. **MetaAndCellMap Agent** (`meta_cellmap_agent.py`)
**Purpose**: Analyzes user requirements and generates structured cell mapping configurations.

**Input**:
- User prompt (text description)
- Optional invoice image (base64 encoded)

**Output**:
```json
{
  "templateMeta": {
    "name": "Professional-Invoice-Tablet",
    "domain": "invoice",
    "category": "tax_invoice",
    "deviceType": "tablet",
    "description": "Professional invoice template for tablets"
  },
  "cellMappings": {
    "logo": {"sheet1": "F5"},
    "signature": {"sheet1": "D38"},
    "text": {
      "sheet1": {
        "Heading": "B2",
        "Date": "D20",
        "InvoiceNumber": "C18",
        "From": {...},
        "BillTo": {...},
        "Items": {
          "Rows": {"start": 23, "end": 35},
          "Columns": {
            "Description": "C",
            "Amount": "F"
          }
        }
      }
    }
  }
}
```

**Key Features**:
- High creativity (temperature: 0.8)
- Vision support for image analysis
- Device-specific layouts (mobile/tablet/desktop)
- Regeneration with feedback capability

---

### 2. **SaveStr Agent** (`savestr_agent.py`)
**Purpose**: Converts cell mappings into valid SocialCalc save strings (MSC format).

**Input**:
- Template metadata
- Cell mappings
- Optional invoice data
- User prompt for context
- Optional invoice image

**Output**:
```
version:1.5
cell:B2:t:INVOICE:b:1:1:1:1:f:13:cf:1:colspan:6
cell:F36:vtf:n:150:SUM(F23\cF35)
...
font:1:normal bold 14pt Arial
color:1:rgb(0,0,0)
border:1:1px solid rgb(0,0,0)
...
```

**Key Features**:
- Low temperature (0.3) for format precision
- Complete MSC syntax knowledge
- Formula generation with proper escaping
- Style definition management
- Error correction capability

**Formula Examples**:
- Subtotal: `cell:F36:vtf:n:150:SUM(F23\cF35)`
- Total: `cell:F38:vtf:n:165:F36+F37`
- Item amount: `cell:F23:vtf:n:100:D23*E23`

---

### 3. **MSC Validator** (`msc_validator.py`)
**Purpose**: Validates MSC format using Node.js validator and corrects errors.

**Validation Rules**:
1. Version line must be first
2. All referenced styles must be defined
3. Cell coordinates must be valid (A1, B5, AA10, etc.)
4. Formulas must have proper colon escaping (`\c`)
5. Border format: `b:<top>:<right>:<bottom>:<left>`
6. Style numbers must match definitions

**Correction Capabilities**:
- Auto-adds missing style definitions
- Fixes formula escaping
- Corrects border references
- Validates cell coordinate formats

---

### 4. **Template Generation Agent** (`template_generation_agent.py`)
**Purpose**: Orchestrates the complete pipeline with validation loop.

**Pipeline Flow**:
```
User Prompt + Image (optional)
         ↓
[1] MetaAndCellMap Agent
         ↓
   Cell Mappings + Metadata
         ↓
[2] SaveStr Agent
         ↓
   Initial MSC SaveStr
         ↓
[3] Validation Loop (max 5 retries)
    ├─ MSC Validator
    ├─ If invalid → SaveStr Agent (fix errors)
    └─ Repeat until valid or max retries
         ↓
[4] Response Assembly
         ↓
   Final Response JSON
```

**Validation Loop**:
```python
for attempt in range(1, max_retries + 1):
    corrected_savestr, is_valid, errors = validator.validate(savestr)
    
    if is_valid:
        break
    
    if attempt < max_retries:
        savestr = savestr_agent.fix_errors(savestr, errors, metadata, mappings)
    else:
        # Use corrected version even if not perfect
        savestr = corrected_savestr
```

---

## API Response Format

### Generate/Chat Response Structure

```json
{
  "session_id": "uuid-string",
  "assistantResponse": {
    "text": "I have created a tax invoice template called 'Professional-Invoice-Tablet' optimized for tablet devices...",
    "savestr": "version:1.5\ncell:B2:t:INVOICE:b:1:1:1:1:f:13:cf:1:colspan:6\n...",
    "cellMappings": {
      "logo": {"sheet1": "F5"},
      "signature": {"sheet1": "D38"},
      "text": {...}
    },
    "templateMeta": {
      "name": "Professional-Invoice-Tablet",
      "domain": "invoice",
      "category": "tax_invoice",
      "deviceType": "tablet",
      "description": "..."
    }
  },
  "validation": {
    "is_valid": true,
    "attempts": 2,
    "final_errors": []
  },
  "token_count": 1234,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Response Components

**assistantResponse.text**: Human-readable explanation
- Template name and description
- Number of editable fields
- Item section capacity
- Formula information
- Validation status

**assistantResponse.savestr**: Complete MSC save string
- Ready to use with SocialCalc
- All formulas properly escaped
- All styles defined
- Validated format

**assistantResponse.cellMappings**: Cell mapping structure
- Maps logical fields to cell coordinates
- Defines item table structure (rows/columns)
- Logo and signature positions
- Organized by sheets

**assistantResponse.templateMeta**: Template metadata
- Name, category, device type
- Domain classification
- Description

**validation**: Validation information
- is_valid: true if validation passed
- attempts: number of validation iterations
- final_errors: remaining errors (if any)

---

## SocialCalc Format Quick Reference

### Line Types

```
version:1.5                              # Required first line

cell:<coord>:<attr>:<value>:...          # Cell data
  cell:A1:t:Hello                        # Text
  cell:A2:v:100                          # Number
  cell:A3:vtf:n:150:SUM(A1\cA2)         # Formula (note \c for colon)
  cell:A4:f:1:c:2:bg:3:cf:1             # With styling

font:<num>:<style> <weight> <size> <family>
  font:1:normal bold 14pt Arial

color:<num>:rgb(R,G,B)
  color:1:rgb(0,0,0)

border:<num>:<thickness> <style> <color>
  border:1:1px solid rgb(0,0,0)

cellformat:<num>:<alignment>
  cellformat:1:center                    # center, left, right

layout:<num>:padding:<values>;vertical-align:<value>;
  layout:1:padding:* * * *;vertical-align:bottom;

valueformat:<num>:<pattern>
  valueformat:1:#,##0.00                 # Number format
  valueformat:2:m/d/yy                   # Date format

col:<letter>:w:<width>
  col:A:w:100

row:<num>:h:<height>
  row:1:h:20

sheet:c:<cols>:r:<rows>:...
  sheet:c:7:r:42:h:12.75
```

### Cell Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `t:<text>` | Plain text | `cell:A1:t:Hello` |
| `v:<num>` | Numeric value | `cell:A1:v:123` |
| `vtf:<type>:<val>:<formula>` | Formula with result | `cell:A1:vtf:n:100:SUM(A1\cA10)` |
| `f:<num>` | Font style | `cell:A1:f:1` |
| `c:<num>` | Text color | `cell:A1:c:1` |
| `bg:<num>` | Background color | `cell:A1:bg:2` |
| `b:<t>:<r>:<b>:<l>` | Borders (top:right:bottom:left) | `cell:A1:b:1:1:1:1` |
| `cf:<num>` | Cell format (alignment) | `cell:A1:cf:1` |
| `l:<num>` | Layout (padding) | `cell:A1:l:1` |
| `ntvf:<num>` | Number format | `cell:A1:ntvf:1` |
| `colspan:<num>` | Merge columns | `cell:A1:colspan:2` |
| `rowspan:<num>` | Merge rows | `cell:A1:rowspan:2` |

### Formula Escaping

⚠️ **CRITICAL**: Colons in formulas must be escaped as `\c`

```
✅ Correct: cell:F36:vtf:n:150:SUM(F23\cF35)
❌ Wrong:   cell:F36:vtf:n:150:SUM(F23:F35)
```

---

## API Endpoints

### POST `/api/generate-invoice`
Generate new invoice template.

**Request**:
```json
{
  "session_id": "optional-uuid",
  "initial_prompt": "Create a professional tax invoice for a tablet",
  "invoice_image": "optional-base64-image"
}
```

**Response**: See "API Response Format" above

---

### POST `/api/chat`
Continue conversation or edit existing template.

**Request**:
```json
{
  "session_id": "existing-uuid",
  "message": "Add a discount field before the total",
  "invoice_image": "optional-base64-image"
}
```

**Response**: See "API Response Format" above

---

## Usage Examples

### Example 1: Generate Simple Invoice

**Request**:
```
POST /api/generate-invoice
{
  "initial_prompt": "Create a simple invoice template for mobile devices with 10 item rows"
}
```

**Response** (abbreviated):
```json
{
  "assistantResponse": {
    "text": "I have created a simple_invoice template called 'Mobile-Simple-Invoice' optimized for mobile devices. The template includes 15 editable fields for your invoice details. It has space for up to 10 line items with 4 columns (Description, Quantity, Unit Price, Amount)...",
    "savestr": "version:1.5\ncell:A1:t:INVOICE:...",
    "cellMappings": {...},
    "templateMeta": {
      "name": "Mobile-Simple-Invoice",
      "category": "simple_invoice",
      "deviceType": "mobile"
    }
  },
  "validation": {
    "is_valid": true,
    "attempts": 1
  }
}
```

---

### Example 2: Generate from Image

**Request**:
```
POST /api/generate-invoice
{
  "initial_prompt": "Create a template matching this invoice design",
  "invoice_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

The agent will:
1. Analyze image layout and structure
2. Extract company names, fields, styling
3. Generate matching cell mappings
4. Create MSC with similar visual appearance

---

### Example 3: Edit Existing Template

**Request**:
```
POST /api/chat
{
  "session_id": "existing-session-uuid",
  "message": "Add a 'Discount' row between Subtotal and Tax, and update the Total formula to be Subtotal - Discount + Tax"
}
```

The agent will:
1. Load current template from session
2. Update cell mappings for new field
3. Regenerate MSC with new formula
4. Validate and correct
5. Return updated template

---

## Error Handling

### Validation Errors

The system automatically retries validation failures up to 5 times:

```
Attempt 1: Initial generation → validation fails
Attempt 2: Fix errors → validation fails
Attempt 3: Fix errors → validation fails
...
Attempt 5: Fix errors → use best version available
```

**Common Auto-Fixes**:
- Missing style definitions
- Incorrect formula escaping
- Invalid border references
- Wrong cell coordinate formats

---

### Session Errors

**404 Session Not Found**:
```json
{
  "error": "Session xyz not found or expired",
  "detail": "Please create a new invoice"
}
```

**413 Token Limit Exceeded**:
```json
{
  "error": "Token limit exceeded",
  "detail": "Session has exceeded 200,000 tokens"
}
```

---

## Configuration

### Environment Variables

```bash
# AWS Bedrock Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Model Configuration
ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Agent Parameters

**MetaAndCellMap Agent**:
- Temperature: 0.8 (high creativity)
- Max tokens: 4096

**SaveStr Agent**:
- Temperature: 0.3 (low for precision)
- Max tokens: 8192 (larger for long savestr)

**Template Generation Agent**:
- Max validation retries: 5

---

## File Structure

```
backend/app/services/
├── meta_cellmap_agent.py          # Agent 1: Cell mapping generation
├── savestr_agent.py                # Agent 2: MSC format generation
├── template_generation_agent.py    # Agent 3: Pipeline orchestrator
└── msc_validator.py               # JavaScript validator integration

backend/app/api/
└── routes.py                      # API endpoints

backend/app/models/
└── schemas.py                     # Pydantic models

backend/docs/parser-docs/
├── SYNTAX.md                      # Complete MSC syntax reference
└── IMPLEMENTATION-GUIDE.md        # Validation implementation guide
```

---

## Testing

### Test Generation
```bash
curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "initial_prompt": "Create a professional invoice for desktop with 20 item rows"
  }'
```

### Test Editing
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "message": "Make the header blue and add a notes section"
  }'
```

### Test with Image
```bash
curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "initial_prompt": "Recreate this invoice",
    "invoice_image": "data:image/jpeg;base64,..."
  }'
```

---

## Debugging

Enable detailed pipeline logging by checking console output:

```
==============================================================
TEMPLATE GENERATION PIPELINE STARTED
==============================================================

[Step 1/4] Generating Cell Mappings and Metadata...
✓ Generated template: Professional-Invoice-Tablet
✓ Category: tax_invoice
✓ Device type: tablet

[Step 2/4] Generating SocialCalc Save String (MSC)...
✓ Generated savestr (5423 characters)

[Step 3/4] Validating MSC Format (max 5 retries)...
  Attempt 1/5...
  ✗ Validation FAILED with 3 errors
    Error 1: Font 5 referenced but not defined
    Error 2: Formula missing \c escape
    ...
  → Requesting fixes from SaveStr Agent...
  
  Attempt 2/5...
  ✓ Validation PASSED

[Step 4/4] Generating User Response...
✓ Response generated

==============================================================
TEMPLATE GENERATION COMPLETED
Status: SUCCESS
Validation attempts: 2/5
==============================================================
```

---

## Best Practices

### For Prompt Engineering

✅ **Good Prompts**:
- "Create a tax invoice for tablet with 15 item rows and a discount field"
- "Generate a professional invoice optimized for mobile devices"
- "Make an invoice template with logo in top-right and signature at bottom"

❌ **Avoid**:
- "Make invoice" (too vague)
- "Excel spreadsheet" (wrong format - this is SocialCalc)

### For Image Analysis

✅ **Good Images**:
- Clear, high-resolution invoice images
- Well-lit, straight scans
- Standard invoice layouts

❌ **Avoid**:
- Blurry or low-quality images
- Handwritten invoices
- Non-standard document formats

### For Cell Mappings

✅ **Good Structure**:
```json
{
  "Items": {
    "Rows": {"start": 10, "end": 25},
    "Columns": {
      "Description": "C",
      "Quantity": "D",
      "Price": "E",
      "Amount": "F"
    }
  }
}
```

❌ **Avoid**:
- Overlapping row ranges
- Missing column definitions
- Invalid cell coordinates (e.g., "1A" instead of "A1")

---

## Advanced Features

### Custom Device Layouts

The system automatically optimizes layouts based on device type:

**Mobile** (4-5 columns):
- Compact design
- Fewer item rows (5-10)
- Essential fields only

**Tablet** (6-7 columns):
- Balanced layout
- Medium item capacity (10-15)
- Standard invoice fields

**Desktop** (8-10 columns):
- Full-featured layout
- Large item capacity (20-30)
- All optional fields

### Formula Support

Automatic formula generation for:
- **Subtotal**: `SUM(ItemAmounts)`
- **Tax**: `Subtotal * TaxRate`
- **Total**: `Subtotal + Tax` or `Subtotal - Discount + Tax`
- **Line amounts**: `Quantity * UnitPrice`

---

## Troubleshooting

### Issue: Validation Always Fails

**Solution**: Check that:
1. Node.js validator is installed and accessible
2. All style numbers are sequential (1, 2, 3...)
3. Cell coordinates are valid Excel notation

### Issue: Formulas Not Working

**Solution**: Ensure colons are escaped:
```
❌ SUM(A1:A10)
✅ SUM(A1\cA10)
```

### Issue: Session Not Found

**Solution**: Sessions expire after inactivity. Create a new invoice.

### Issue: Image Not Analyzed

**Solution**: Ensure image is:
- Base64 encoded
- Valid JPEG/PNG format
- Under 5MB size

---

## Support & Documentation

- **SocialCalc Syntax**: See `backend/docs/parser-docs/SYNTAX.md`
- **Validator Guide**: See `backend/docs/parser-docs/IMPLEMENTATION-GUIDE.md`
- **API Docs**: Visit `/docs` endpoint when server is running
- **Examples**: See `backend/docs/savestr.ts` and `backend/docs/prompt.ts`

---

## Version History

### v2.0.0 (Current)
- Multi-agent architecture with pipeline orchestration
- Automated validation with retry loop
- Vision support for invoice image analysis
- Comprehensive MSC format support
- Cell mapping generation with device optimization

### v1.0.0 (Legacy)
- Basic invoice generation with single agent
- Manual validation
- Limited format support

---

**Last Updated**: 2025-01-15
