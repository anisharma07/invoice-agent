# How to Import Online Invoices from Invoice Store

When a user clicks the "Import" button in the Invoice Store, use the `addToOnlineInvoices` function to save the invoice metadata.

## Example Usage

```typescript
import { addToOnlineInvoices } from '../utils/templateHistory';

// When user clicks Import button on an online invoice
const handleImportInvoice = async (invoiceData: any) => {
  try {
    // Save the invoice to LocalStorage (using your existing save method)
    const fileName = invoiceData.name || `Invoice-${Date.now()}`;
    await store._saveFile(newFile);
    
    // Add to online invoices collection for "Yours" tab
    await addToOnlineInvoices(
      invoiceData.templateId,
      fileName,
      {
        // Optional metadata to store with the invoice
        name: invoiceData.name,
        description: invoiceData.description,
        category: invoiceData.category,
        domain: invoiceData.domain,
        // Any other relevant metadata
      }
    );
    
    // Show success message
    console.log('Invoice imported successfully!');
  } catch (error) {
    console.error('Failed to import invoice:', error);
  }
};
```

## Function Signature

```typescript
addToOnlineInvoices(
  templateId: number,      // The template ID of the invoice
  fileName: string,        // The filename used to save in LocalStorage
  metadata?: any          // Optional: Any additional metadata to store
): Promise<void>
```

## Storage Structure

The online invoices are stored in Preferences under the key `"online_invoices"` with the following structure:

```typescript
interface OnlineInvoiceItem {
  templateId: number;
  fileName: string;
  timestamp: string;        // When it was imported
  lastUsed: string;         // Last time it was accessed
  source: "online";         // Always "online" to differentiate
  metadata?: any;           // Your custom metadata
}
```

## Key Points

1. **FIFO Management**: Maximum 100 online invoices. When exceeded, oldest is removed.
2. **Duplicate Handling**: If same templateId + fileName exists, it updates lastUsed time.
3. **Automatic Display**: Once added, it will appear in the "Yours" tab in Template Modal.
4. **Separate from Recent**: Online invoices are separate from the "Recent" tab (which tracks recently used templates).

## Related Functions

```typescript
// Get all online invoices
const invoices = await getOnlineInvoices();

// Remove a specific online invoice
await removeFromOnlineInvoices(templateId, fileName);

// Clear all online invoices
await clearOnlineInvoices();
```
