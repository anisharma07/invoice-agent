# Example: Adding New Template with Updated Structure

## Template Metadata Example

Here's an example of adding a new template following the updated structure:

```typescript
// In templates-meta.ts

export let tempMeta: TemplateMeta[] = [
  // ... existing templates ...
  
  // New Template Example
  {
    name: "Professional-Business-Invoice",
    domain: "invoice",
    category: "professional_invoice",
    deviceType: "desktop",
    description: "Clean professional invoice template with comprehensive billing details",
    template_id: 234,
    ImageUri: "iVBORw0KGgoAAAANSUhEUgAAAV..." // base64 image string
  },
  
  // Mobile Template Example
  {
    name: "Mobile-Quick-Receipt",
    domain: "receipt",
    category: "basic_receipt",
    deviceType: "mobile",
    description: "Simple mobile receipt for quick transactions",
    template_id: 235,
    ImageUri: "iVBORw0KGgoAAAANSUhEUgAAAV..."
  },
  
  // Tablet Template Example
  {
    name: "Tablet-Purchase-Order",
    domain: "purchase_order",
    category: "business_po",
    deviceType: "tablet",
    description: "Tablet-optimized purchase order template",
    template_id: 236,
    ImageUri: "iVBORw0KGgoAAAANSUhEUgAAAV..."
  },
  
  // Online Template Example (fetched from server)
  {
    name: "Premium-Invoice-Pro",
    domain: "invoice",
    category: "premium_invoice",
    deviceType: "desktop",
    description: "Premium invoice with advanced features",
    template_id: 237,
    ImageUri: "iVBORw0KGgoAAAANSUhEUgAAAV...",
    online: true  // Marks this as an online template
  }
];
```

## Field Descriptions

### Required Fields:

- **name**: Display name for the template (user-friendly)
- **domain**: Type of document - one of:
  - `"invoice"` - Invoice documents
  - `"receipt"` - Receipt documents
  - `"purchase_order"` - Purchase orders
  - `"quotation"` - Quotation/estimate documents
  - `"other"` - Other document types

- **category**: Subcategory identifier (used for filtering)
  - Examples: `"basic_invoice"`, `"professional_invoice"`, `"tax_invoice"`, `"basic_receipt"`, etc.
  - Use snake_case format
  - Will be displayed with spaces: "basic invoice", "professional invoice"

- **deviceType**: Target device - one of:
  - `"mobile"` - Optimized for mobile screens
  - `"tablet"` - Optimized for tablet screens
  - `"desktop"` - Optimized for desktop/web

- **description**: Brief description of the template purpose
- **template_id**: Unique numeric identifier (must match DATA array)

### Optional Fields:

- **ImageUri**: Base64 encoded PNG preview image (recommended)
- **online**: Boolean flag indicating if template is from online source (default: false)

## Filter Behavior

### Device Type Filter:
Templates will be grouped and filterable by `deviceType`:
- Mobile templates
- Tablet templates
- Desktop templates

### Category Filter:
Dynamic filter based on unique categories in metadata:
- All categories are automatically detected
- Displayed with readable formatting (underscores → spaces)
- Multiple categories can be selected

### Domain Filter:
Filter by document type:
- Invoice
- Receipt
- Purchase Order
- Quotation
- Other

## Usage in Code

### Saving Online Template Metadata:
```typescript
// When fetching from API
const onlineTemplate = {
  name: "Premium-Invoice-Pro",
  domain: "invoice" as const,
  category: "premium_invoice",
  deviceType: "desktop" as const,
  description: "Premium invoice template with advanced features",
  template_id: 237,
  ImageUri: "iVBORw0KGgoAAAANSUhEUgAAAV...",
  online: true
};

// Save to local storage for offline access
await store._saveOnlineTemplateMetadata(onlineTemplate);
```

### Filtering Templates:
```typescript
// Get all templates (local + online)
const allTemplates = [...tempMeta, ...onlineTemplates];

// Filter by device type
const mobileTemplates = allTemplates.filter(t => t.deviceType === "mobile");

// Filter by domain
const invoiceTemplates = allTemplates.filter(t => t.domain === "invoice");

// Filter by category
const professionalTemplates = allTemplates.filter(t => 
  t.category === "professional_invoice"
);

// Multi-filter (device + category + domain)
const filtered = allTemplates.filter(t =>
  selectedDevices.includes(t.deviceType) &&
  (selectedCategories.length === 0 || selectedCategories.includes(t.category)) &&
  (selectedDomains.length === 0 || selectedDomains.includes(t.domain))
);
```

## Template Data Structure (DATA array)

Don't forget to add the corresponding template data in `templates.ts`:

```typescript
export const DATA: Record<number, any> = {
  // ... existing templates ...
  
  234: {
    template: "Professional-Business-Invoice",
    msc: {
      // SocialCalc sheet data
      sheet: {
        cells: {
          // Cell data
        },
        // ... other sheet properties
      }
    },
    footers: [
      {
        index: 1,
        name: "Standard Footer",
        isActive: true
      },
      {
        index: 2,
        name: "Detailed Footer",
        isActive: false
      }
    ]
  }
};
```

## Category Naming Conventions

Use descriptive, consistent category names:

### Invoice Categories:
- `basic_invoice`
- `professional_invoice`
- `tax_invoice`
- `commercial_invoice`
- `service_invoice`
- `product_invoice`
- `recurring_invoice`

### Receipt Categories:
- `basic_receipt`
- `payment_receipt`
- `cash_receipt`
- `sales_receipt`

### Purchase Order Categories:
- `standard_po`
- `business_po`
- `bulk_order`

### Quotation Categories:
- `service_quote`
- `product_quote`
- `project_estimate`

## Image Guidelines

### ImageUri (Preview Thumbnail):
- Format: PNG (Base64 encoded)
- Recommended size: 280x400 pixels
- Aspect ratio: Portrait (fits invoice layout)
- File size: Keep under 50KB for performance
- Content: Show key invoice elements (header, items, footer)

### Generating ImageUri:
```typescript
// Example: Convert image to base64
const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result?.toString().split(',')[1];
      resolve(base64 || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Usage
const imageFile = // ... get file
const base64String = await imageToBase64(imageFile);

// Add to template metadata
const template = {
  // ... other fields
  ImageUri: base64String
};
```

## Testing New Templates

After adding a new template:

1. **Verify Metadata:**
   ```typescript
   const template = tempMeta.find(t => t.template_id === 234);
   console.log(template);
   ```

2. **Test Filtering:**
   - Open Template Modal
   - Go to "Default" tab
   - Apply filter for the new template's device type
   - Verify it appears in the list

3. **Test Creation:**
   - Select the template
   - Enter a filename
   - Verify file is created
   - Check it appears in "Your Invoices"
   - Check it appears in "Recent" after opening

4. **Test Online Template:**
   ```typescript
   // Save online template
   await store._saveOnlineTemplateMetadata(newTemplate);
   
   // Verify it's saved
   const online = await store._getOnlineTemplates();
   console.log(online);
   
   // Verify it appears in modal with "Online" badge
   ```

## Checklist for New Template

- [ ] Added to `tempMeta` array with all required fields
- [ ] `template_id` is unique
- [ ] `domain` is one of the valid options
- [ ] `deviceType` is one of mobile/tablet/desktop
- [ ] `category` uses snake_case format
- [ ] `ImageUri` is provided and properly formatted
- [ ] Corresponding entry added to `DATA` object
- [ ] Template data includes `msc` and `footers`
- [ ] Tested in Template Modal
- [ ] Verified filtering works
- [ ] Tested file creation
- [ ] Checked appearance in recent/yours tabs
