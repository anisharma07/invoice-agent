# Frontend Migration Guide - New Response Format

## 🔄 Response Format Changes

### Old Response (v1)
```typescript
interface OldInvoiceResponse {
  session_id: string;
  message: string;
  msc_content: string | null;
  token_count: number;
  timestamp: string;
}
```

### New Response (v2)
```typescript
interface AssistantResponse {
  text: string;
  savestr: string;
  cellMappings: CellMappings;
  templateMeta: TemplateMeta;
}

interface ValidationInfo {
  is_valid: boolean;
  attempts: number;
  final_errors: string[];
}

interface NewInvoiceResponse {
  session_id: string;
  assistantResponse: AssistantResponse;
  validation: ValidationInfo;
  token_count: number;
  timestamp: string;
}
```

---

## 📦 TypeScript Interfaces

Add these to your frontend types file:

```typescript
// Cell Mappings Structure
interface CellMappings {
  logo?: {
    sheet1: string;  // e.g., "F5"
  };
  signature?: {
    sheet1: string;  // e.g., "D38"
  };
  text: {
    sheet1: {
      Heading?: string;
      Date?: string;
      InvoiceNumber?: string;
      From?: {
        Name?: string;
        StreetAddress?: string;
        CityStateZip?: string;
        Phone?: string;
        Email?: string;
      };
      BillTo?: {
        Name?: string;
        StreetAddress?: string;
        CityStateZip?: string;
        Phone?: string;
        Email?: string;
      };
      Items?: {
        Name: string;
        Heading: string;
        Subheading: string;
        Rows: {
          start: number;
          end: number;
        };
        Columns: {
          Description?: string;
          Quantity?: string;
          UnitPrice?: string;
          Amount?: string;
        };
      };
      Subtotal?: string;
      Tax?: string;
      Total?: string;
      Notes?: string;
      PaymentTerms?: string;
      [key: string]: any;  // Allow additional fields
    };
  };
}

// Template Metadata
interface TemplateMeta {
  name: string;
  domain: string;
  category: 'tax_invoice' | 'simple_invoice' | 'professional_invoice';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  description?: string;
}

// Assistant Response
interface AssistantResponse {
  text: string;
  savestr: string;
  cellMappings: CellMappings;
  templateMeta: TemplateMeta;
}

// Validation Info
interface ValidationInfo {
  is_valid: boolean;
  attempts: number;
  final_errors: string[];
}

// Main Response
interface InvoiceGenerateResponse {
  session_id: string;
  assistantResponse: AssistantResponse;
  validation: ValidationInfo;
  token_count: number;
  timestamp: string;
}

// Same for chat response
type ChatResponse = InvoiceGenerateResponse;
```

---

## 🔧 Code Migration Examples

### Example 1: Display Response Text

**Old Code**:
```typescript
const response = await generateInvoice(prompt);
console.log(response.message);  // ❌ Old property
```

**New Code**:
```typescript
const response = await generateInvoice(prompt);
console.log(response.assistantResponse.text);  // ✅ New nested structure
```

### Example 2: Access MSC Content

**Old Code**:
```typescript
const mscContent = response.msc_content;  // ❌ Old property
if (mscContent) {
  loadMSC(mscContent);
}
```

**New Code**:
```typescript
const savestr = response.assistantResponse.savestr;  // ✅ New location
loadMSC(savestr);  // savestr is always present
```

### Example 3: Display Template Information

**Old Code**:
```typescript
// Template info not available in old format
```

**New Code**:
```typescript
const { templateMeta } = response.assistantResponse;
console.log(`Template: ${templateMeta.name}`);
console.log(`Category: ${templateMeta.category}`);
console.log(`Device: ${templateMeta.deviceType}`);
```

### Example 4: Show Validation Status

**Old Code**:
```typescript
// Validation info not available
```

**New Code**:
```typescript
const { validation } = response;
if (validation.is_valid) {
  showSuccess(`Template validated in ${validation.attempts} attempt(s)`);
} else {
  showWarning(
    `Template generated with ${validation.final_errors.length} warnings`,
    validation.final_errors
  );
}
```

### Example 5: Use Cell Mappings for UI

**New Feature**:
```typescript
const { cellMappings } = response.assistantResponse;

// Get logo position
const logoCell = cellMappings.logo?.sheet1;  // "F5"

// Get editable fields
const textMappings = cellMappings.text.sheet1;

// Show invoice number field location
if (textMappings.InvoiceNumber) {
  console.log(`Invoice # is in cell ${textMappings.InvoiceNumber}`);
}

// Get item table info
if (textMappings.Items) {
  const { Rows, Columns } = textMappings.Items;
  console.log(`Items: rows ${Rows.start}-${Rows.end}`);
  console.log(`Columns: ${Object.keys(Columns).join(', ')}`);
}
```

---

## 🎨 UI Component Examples

### Display Template Info Card

```tsx
interface TemplateInfoProps {
  meta: TemplateMeta;
  validation: ValidationInfo;
}

function TemplateInfoCard({ meta, validation }: TemplateInfoProps) {
  return (
    <div className="template-info-card">
      <h3>{meta.name}</h3>
      <div className="meta-details">
        <span className="badge">{meta.category}</span>
        <span className="badge">{meta.deviceType}</span>
      </div>
      {meta.description && <p>{meta.description}</p>}
      
      <div className="validation-status">
        {validation.is_valid ? (
          <span className="success">
            ✓ Validated ({validation.attempts} attempts)
          </span>
        ) : (
          <span className="warning">
            ⚠ {validation.final_errors.length} warnings
          </span>
        )}
      </div>
    </div>
  );
}
```

### Display Cell Mappings

```tsx
interface CellMappingViewProps {
  mappings: CellMappings;
}

function CellMappingView({ mappings }: CellMappingViewProps) {
  const textMappings = mappings.text.sheet1;
  
  return (
    <div className="cell-mappings">
      <h4>Editable Fields</h4>
      
      {/* Basic fields */}
      {textMappings.Heading && (
        <div className="field">
          <label>Heading:</label>
          <code>{textMappings.Heading}</code>
        </div>
      )}
      
      {textMappings.Date && (
        <div className="field">
          <label>Date:</label>
          <code>{textMappings.Date}</code>
        </div>
      )}
      
      {/* From section */}
      {textMappings.From && (
        <div className="section">
          <h5>From</h5>
          {Object.entries(textMappings.From).map(([key, cell]) => (
            <div key={key} className="field">
              <label>{key}:</label>
              <code>{cell}</code>
            </div>
          ))}
        </div>
      )}
      
      {/* Items section */}
      {textMappings.Items && (
        <div className="section">
          <h5>Items</h5>
          <div className="field">
            <label>Rows:</label>
            <code>
              {textMappings.Items.Rows.start} - {textMappings.Items.Rows.end}
            </code>
          </div>
          <div className="field">
            <label>Columns:</label>
            <div className="columns">
              {Object.entries(textMappings.Items.Columns).map(([name, col]) => (
                <span key={name} className="column-badge">
                  {name}: {col}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Validation Status Banner

```tsx
interface ValidationBannerProps {
  validation: ValidationInfo;
}

function ValidationBanner({ validation }: ValidationBannerProps) {
  if (validation.is_valid) {
    return (
      <div className="banner success">
        <span className="icon">✓</span>
        <div className="content">
          <strong>Template Validated</strong>
          <span>Successfully validated in {validation.attempts} attempt(s)</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="banner warning">
      <span className="icon">⚠</span>
      <div className="content">
        <strong>Template Generated with Warnings</strong>
        <span>
          {validation.final_errors.length} validation warning(s) after{' '}
          {validation.attempts} attempts
        </span>
        {validation.final_errors.length > 0 && (
          <details>
            <summary>View warnings</summary>
            <ul>
              {validation.final_errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
```

---

## 🔌 API Integration

### Generate Invoice

```typescript
async function generateInvoice(
  prompt: string,
  image?: string
): Promise<InvoiceGenerateResponse> {
  const response = await fetch('/api/generate-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      initial_prompt: prompt,
      invoice_image: image,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return await response.json();
}

// Usage
const result = await generateInvoice(
  "Create a professional tax invoice for tablet"
);

console.log(result.assistantResponse.text);
console.log(result.assistantResponse.templateMeta.name);
console.log(result.validation.is_valid);
```

### Continue Chat / Edit Template

```typescript
async function editTemplate(
  sessionId: string,
  message: string,
  image?: string
): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      invoice_image: image,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return await response.json();
}

// Usage
const result = await editTemplate(
  "session-uuid",
  "Add a discount field between subtotal and tax"
);

console.log(result.assistantResponse.text);
console.log(result.validation.attempts);
```

---

## 📝 Complete React Example

```tsx
import React, { useState } from 'react';

function InvoiceGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceGenerateResponse | null>(null);
  
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_prompt: prompt }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate template');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="invoice-generator">
      <h2>Generate Invoice Template</h2>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your invoice template..."
        rows={4}
      />
      
      <button onClick={handleGenerate} disabled={loading || !prompt}>
        {loading ? 'Generating...' : 'Generate Template'}
      </button>
      
      {result && (
        <div className="result">
          {/* Response Text */}
          <div className="response-text">
            <h3>Response</h3>
            <p>{result.assistantResponse.text}</p>
          </div>
          
          {/* Template Info */}
          <div className="template-info">
            <h3>Template Details</h3>
            <div className="details">
              <div>
                <strong>Name:</strong>{' '}
                {result.assistantResponse.templateMeta.name}
              </div>
              <div>
                <strong>Category:</strong>{' '}
                {result.assistantResponse.templateMeta.category}
              </div>
              <div>
                <strong>Device:</strong>{' '}
                {result.assistantResponse.templateMeta.deviceType}
              </div>
            </div>
          </div>
          
          {/* Validation Status */}
          <div className="validation">
            <h3>Validation</h3>
            {result.validation.is_valid ? (
              <div className="success">
                ✓ Validated in {result.validation.attempts} attempt(s)
              </div>
            ) : (
              <div className="warning">
                ⚠ {result.validation.final_errors.length} warnings
                <ul>
                  {result.validation.final_errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* SaveStr Preview */}
          <div className="savestr">
            <h3>SocialCalc Save String</h3>
            <pre>
              {result.assistantResponse.savestr.slice(0, 500)}...
            </pre>
            <button
              onClick={() => {
                // Load into SocialCalc editor
                loadMSC(result.assistantResponse.savestr);
              }}
            >
              Load in Editor
            </button>
          </div>
          
          {/* Cell Mappings */}
          <div className="mappings">
            <h3>Cell Mappings</h3>
            <pre>
              {JSON.stringify(
                result.assistantResponse.cellMappings,
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceGenerator;
```

---

## 🎨 CSS Suggestions

```css
.template-info-card {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.template-info-card h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
}

.meta-details {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.badge {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.validation-status {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #dee2e6;
}

.validation-status .success {
  color: #28a745;
}

.validation-status .warning {
  color: #ffc107;
}

.banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 0;
}

.banner.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.banner.warning {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
}

.banner .icon {
  font-size: 24px;
}

.banner .content {
  flex: 1;
}

.banner .content strong {
  display: block;
  margin-bottom: 4px;
}

.banner .content span {
  font-size: 14px;
}
```

---

## ✅ Migration Checklist

- [ ] Update TypeScript interfaces
- [ ] Change `response.message` to `response.assistantResponse.text`
- [ ] Change `response.msc_content` to `response.assistantResponse.savestr`
- [ ] Add template info display (`templateMeta`)
- [ ] Add validation status display (`validation`)
- [ ] Implement cell mappings visualization (optional)
- [ ] Test with both generate and chat endpoints
- [ ] Update error handling for new structure
- [ ] Add UI for validation warnings
- [ ] Test with image uploads

---

## 🚀 Testing Your Migration

1. **Generate a simple invoice**:
   - Use basic prompt
   - Verify all new fields are accessible
   - Check validation status

2. **Generate with image**:
   - Upload an invoice image
   - Verify image analysis works
   - Check cell mappings match image

3. **Edit template**:
   - Use chat endpoint
   - Verify edits work correctly
   - Check validation after edits

4. **Error handling**:
   - Test with invalid session
   - Test with missing fields
   - Verify error messages

---

## 📚 Additional Resources

- **Complete Architecture**: `backend/docs/TEMPLATE_GENERATION_ARCHITECTURE.md`
- **API Examples**: See QUICKSTART_NEW_SYSTEM.md
- **Cell Mapping Examples**: `backend/docs/prompt.ts`
- **SaveStr Examples**: `backend/docs/savestr.ts`

---

**Happy Migrating! 🎉**
