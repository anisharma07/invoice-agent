# Invoice Agent Documentation

## Overview

The Invoice Agent is an AI-powered system that generates, edits, and processes invoices using Claude AI (via AWS Bedrock) with vision capabilities and MSC (Mermaid-Style Chart) format support.

**Location**: `backend/app/services/invoice_agent.py`

---

## Class: InvoiceAgent

Main class that handles all invoice-related operations using Claude AI with multimodal capabilities (text + vision).

### Initialization

#### `__init__(self)`

**Purpose**: Initializes the Invoice Agent with necessary components

**What it does**:
- Creates a connection to Claude AI via AWS Bedrock
- Loads the default invoice template structure
- Initializes the MSC validator for invoice format validation

**Components initialized**:
- `self.llm`: ChatBedrock instance for AI interactions
- `self.invoice_template`: Default invoice JSON structure
- `self.msc_validator`: Validator for MSC format conversion

---

## Core Setup Functions

### `_initialize_llm(self)`

**Purpose**: Sets up the Claude AI model connection through AWS Bedrock

**Returns**: `ChatBedrock` instance

**Configuration**:
- Model: Claude Sonnet 4 (configurable via `ANTHROPIC_MODEL` env var)
- Max tokens: 4096
- Temperature: 0.7 (balanced creativity)
- Region: us-east-1 (configurable via `AWS_REGION` env var)
- Uses AWS credentials from environment variables

**Usage**: Called automatically during initialization

---

### `_get_invoice_template(self)`

**Purpose**: Provides the default JSON structure for invoices

**Returns**: `Dict[str, Any]` - Complete invoice template

**Template Structure**:
```json
{
  "invoice_number": "",
  "date": "YYYY-MM-DD",
  "due_date": "",
  "from": {
    "name": "", "company": "", "address": "", "email": "", "phone": ""
  },
  "to": {
    "name": "", "company": "", "address": "", "email": "", "phone": ""
  },
  "items": [
    {"description": "", "quantity": 1, "unit_price": 100.0, "amount": 100.0}
  ],
  "subtotal": 0.0,
  "tax_rate": 0.0,
  "tax_amount": 0.0,
  "total": 0.0,
  "notes": "",
  "payment_terms": ""
}
```

---

### `_build_system_prompt(self)`

**Purpose**: Creates the system instructions that define Claude's behavior as an invoice assistant

**Returns**: `str` - System prompt text

**Key Instructions for Claude**:
1. Generate professional invoices from user requirements
2. Analyze uploaded invoice images and extract data
3. Edit existing invoices using natural language
4. Auto-calculate totals, taxes, and subtotals
5. Maintain professional formatting
6. Respond in plain text without markdown formatting

**Why it matters**: This prompt is crucial - it tells Claude exactly how to behave as an invoice agent

---

## Invoice Processing Functions

### `generate_invoice(self, prompt, conversation_history, invoice_image)`

**Purpose**: Main function to generate or process invoices with multimodal support

**Parameters**:
- `prompt` (str): User's request (e.g., "Create an invoice for consulting services")
- `conversation_history` (Optional[List[Dict]]): Previous chat messages for context
- `invoice_image` (Optional[str]): Base64-encoded image of an invoice to analyze

**Returns**: `Tuple[str, Optional[Dict]]`
- Response text (explanation of what was done)
- Invoice data as JSON dictionary

**How it works**:
1. Builds message list starting with system prompt
2. Adds conversation history (previous user/assistant messages)
3. If image provided, includes it in multimodal format
4. Sends everything to Claude for processing
5. Cleans markdown formatting from response
6. Extracts JSON invoice data from response
7. Returns both explanation and structured data

**Multimodal Support**:
- Handles base64 image data with or without data URL prefix
- Supports invoice image analysis (OCR-like capabilities)
- Claude can "see" the invoice and extract information

---

### `edit_invoice(self, current_invoice, edit_prompt, conversation_history, invoice_image)`

**Purpose**: Modifies existing invoices based on natural language requests

**Parameters**:
- `current_invoice` (Dict): Existing invoice data to be modified
- `edit_prompt` (str): User's edit request (e.g., "Add a 10% discount")
- `conversation_history` (Optional[List[Dict]]): Chat context
- `invoice_image` (Optional[str]): Optional invoice image

**Returns**: `Tuple[str, Optional[Dict]]`
- Response text explaining changes
- Updated invoice data

**How it works**:
1. Creates enhanced prompt with current invoice embedded
2. Combines with user's edit request
3. Calls `generate_invoice()` with the enhanced prompt
4. Claude understands both the current state and desired changes
5. Returns updated invoice with recalculated totals

**Example Edit Requests**:
- "Change the tax rate to 15%"
- "Add another item: 5 hours of design work at $80/hour"
- "Update the client address"

---

## MSC Format Functions

### `generate_invoice_with_msc(self, prompt, conversation_history, invoice_image)`

**Purpose**: Generate invoice in both JSON and MSC (Mermaid-Style Chart) formats

**Parameters**: Same as `generate_invoice()`

**Returns**: `Tuple[str, Optional[Dict], Optional[str]]`
- Response text
- Invoice JSON data
- MSC format string (for visualization/blockchain)

**How it works**:
1. Generates invoice using standard `generate_invoice()`
2. Converts JSON data to MSC format
3. Validates MSC using JavaScript validator
4. Auto-corrects MSC formatting issues
5. Returns all three outputs

**Why MSC?**: MSC format is used for:
- Visual representation of invoices
- Blockchain integration (Starknet)
- Standardized invoice format validation

---

### `edit_invoice_with_msc(self, current_invoice, edit_prompt, conversation_history, invoice_image)`

**Purpose**: Edit invoice and return both JSON and MSC formats

**Parameters**: Same as `edit_invoice()`

**Returns**: `Tuple[str, Optional[Dict], Optional[str]]`
- Response text
- Updated invoice JSON
- Updated MSC format

**How it works**:
1. Edits invoice using `edit_invoice()`
2. Converts updated data to MSC format
3. Validates and corrects MSC
4. Returns all formats

---

## Utility Functions

### `_parse_invoice_from_response(self, response)`

**Purpose**: Extracts JSON invoice data from Claude's text response

**Parameters**:
- `response` (str): Claude's full text response

**Returns**: `Optional[Dict[str, Any]]` - Parsed invoice data or None

**How it works**:
1. Looks for JSON code blocks marked with \`\`\`json
2. If not found, looks for generic \`\`\` code blocks
3. Extracts the JSON string
4. Parses it into a Python dictionary
5. Returns None if parsing fails

**Why needed**: Claude returns text with explanations + JSON code blocks. This extracts just the structured data.

---

### `_clean_markdown(self, text)`

**Purpose**: Removes markdown formatting from Claude's response text

**Parameters**:
- `text` (str): Response text with potential markdown

**Returns**: `str` - Plain text without markdown

**What it removes**:
- Bold text (`**text**` or `__text__`)
- Italic text (`*text*` or `_text_`)
- Headers (`# ## ###`)
- Strikethrough (`~~text~~`)
- Inline code (\`text\`)
- List markers (`- * +`)
- Numbered lists (`1. 2. 3.`)
- Code blocks (stops before \`\`\`json)

**Why needed**: Frontend displays clean text without markdown artifacts

---

## Complete Workflow Example

### Scenario 1: Generate New Invoice from Scratch

```
User Input: "Create an invoice for web development services, 40 hours at $100/hour"

Flow:
1. generate_invoice_with_msc() called
2. System prompt tells Claude to be an invoice agent
3. Claude receives user's request
4. Claude generates complete invoice JSON with:
   - Auto-generated invoice number
   - Current date
   - Calculated amounts (40 × $100 = $4000)
   - Professional structure
5. Response parsed into JSON
6. JSON converted to MSC format
7. MSC validated and corrected
8. Returns: explanation + JSON + MSC
```

### Scenario 2: Edit Existing Invoice

```
User Input: "Add tax of 8%"
Current Invoice: {subtotal: 4000, tax_rate: 0, total: 4000}

Flow:
1. edit_invoice_with_msc() called
2. Current invoice embedded in prompt
3. Claude receives edit request + current data
4. Claude updates:
   - tax_rate: 8.0
   - tax_amount: 320.0 (calculated)
   - total: 4320.0 (recalculated)
5. Returns updated invoice in all formats
```

### Scenario 3: Analyze Invoice Image

```
User Input: "Extract data from this invoice"
Invoice Image: (base64 encoded JPG/PNG)

Flow:
1. generate_invoice_with_msc() called with image
2. Image included as multimodal content
3. Claude's vision model analyzes the image
4. Extracts:
   - Company names and addresses
   - Invoice number and dates
   - All line items with amounts
   - Totals and taxes
5. Returns structured JSON of extracted data
6. Converts to MSC format
```

---

## Integration Points

### With API Endpoints
- `/api/generate-invoice`: Calls `generate_invoice_with_msc()`
- `/api/edit-invoice`: Calls `edit_invoice_with_msc()`
- Image upload handled via multipart form data → converted to base64

### With MSC Validator
- `MSCValidator` class validates invoice MSC format
- JavaScript-based validation ensures correctness
- Auto-corrections applied for minor syntax issues

### With AWS Bedrock
- Credentials from environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
- Region configurable via AWS_REGION
- Model selection via ANTHROPIC_MODEL environment variable

---

## Key Features

### 1. **Conversational Context**
- Maintains conversation history
- Claude remembers previous requests
- Enables multi-turn editing sessions

### 2. **Multimodal Capabilities**
- Vision support for invoice image analysis
- OCR-like extraction from photos/scans
- Combines text and image understanding

### 3. **Automatic Calculations**
- Subtotals from line items
- Tax calculations based on rate
- Total amount computation
- Maintains mathematical accuracy

### 4. **Format Flexibility**
- JSON for API integration
- MSC for visualization and blockchain
- Plain text responses for user display

### 5. **Validation & Correction**
- MSC format validation via JavaScript
- Auto-correction of minor syntax issues
- Error reporting for debugging

---

## Environment Variables Required

```bash
ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

---

## Error Handling

- **JSON Parsing Errors**: Returns None, allows graceful degradation
- **MSC Validation Errors**: Logs errors, returns corrected version
- **Image Processing**: Handles various base64 formats
- **AWS Connection**: Uses environment credentials, fails if missing

---

## Future Enhancements

Potential improvements:
- Multi-currency support
- Template customization
- Batch invoice processing
- PDF generation integration
- Email sending capabilities
- Payment integration

---

## Summary

The Invoice Agent is a sophisticated AI system that:
- **Generates** invoices from natural language
- **Edits** invoices conversationally
- **Analyzes** invoice images with vision AI
- **Validates** data in multiple formats
- **Maintains** context across conversations
- **Calculates** amounts automatically

It serves as the core intelligence layer for the invoice management system, bridging user intent with structured data output.
