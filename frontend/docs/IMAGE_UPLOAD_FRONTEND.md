# Frontend Image Upload Feature - User Guide

## Overview

The Invoice AI Generator now supports image uploads directly in the chat interface. You can upload invoice images to:
- Extract data automatically from existing invoices
- Use invoice templates as reference
- Update invoices based on scanned documents
- Analyze invoice layouts and formats

## Features

✅ **Drag & Drop Support** - Upload images by clicking the image icon  
✅ **Live Preview** - See your image before sending  
✅ **Multiple Formats** - Supports JPEG, PNG, GIF, WebP  
✅ **Size Validation** - Automatic validation (max 5MB)  
✅ **Visual Feedback** - Images appear in chat history  
✅ **Seamless Integration** - Works with text prompts  

## How to Use

### 1. Upload an Image

1. Click the **image icon** (📷) next to the message input
2. Select an invoice image from your device
3. The image will appear as a preview above the input
4. Optionally, add a text message to guide the AI
5. Click **Send** to process the image

### 2. Image Preview

Once selected, you'll see:
- A thumbnail preview of your image
- An **X button** to remove the image if you change your mind
- The image remains attached until you send or remove it

### 3. Sending Messages with Images

You can send:
- **Image only**: The AI will automatically analyze it
- **Image + Text**: Provide specific instructions like:
  - "Extract all line items from this invoice"
  - "Create a similar invoice but change the company name"
  - "Update prices based on this image"

### 4. Chat History

After sending, you'll see:
- Your message with the attached image thumbnail
- The AI's response with extracted/generated invoice data
- Both messages timestamped for reference

## Usage Examples

### Example 1: Extract Data from Invoice
```
1. Click image icon
2. Select invoice.jpg
3. Type: "Extract all data from this invoice"
4. Click Send
```

### Example 2: Use as Template
```
1. Click image icon
2. Select template.png
3. Type: "Create an invoice with this layout but for Acme Corp"
4. Click Send
```

### Example 3: Update Existing Invoice
```
1. Have an active invoice session
2. Click image icon
3. Select updated_invoice.jpg
4. Type: "Update the amounts based on this new image"
5. Click Send
```

### Example 4: Compare Invoices
```
1. Upload first invoice
2. Get AI response
3. Upload second invoice
4. Type: "Show me the differences between these invoices"
5. Click Send
```

## Supported File Formats

| Format | Extension | Recommended |
|--------|-----------|-------------|
| JPEG   | .jpg, .jpeg | ✅ Yes |
| PNG    | .png | ✅ Yes |
| WebP   | .webp | ✅ Yes |
| GIF    | .gif | ⚠️ Static only |

## File Size Limits

- **Maximum Size**: 5MB per image
- **Recommended**: Keep images under 2MB for faster processing
- **Tip**: Compress large images before uploading

## Best Practices

### Image Quality
- ✅ Use clear, well-lit photos
- ✅ Ensure text is readable
- ✅ Keep images properly oriented
- ❌ Avoid blurry or low-resolution images

### File Size
- ✅ Compress images if over 2MB
- ✅ Use JPEG for photographs
- ✅ Use PNG for documents with text
- ❌ Don't upload unnecessarily large files

### Prompts
- ✅ Be specific about what you want extracted
- ✅ Mention if you want certain fields emphasized
- ✅ Clarify any ambiguous data
- ❌ Don't rely solely on image without context

## Troubleshooting

### Image Won't Upload
**Problem**: Nothing happens when clicking the image icon  
**Solution**: 
- Check browser console for errors
- Ensure file is under 5MB
- Verify file format is supported
- Try a different image

### Image Too Large Error
**Problem**: "Image size must be less than 5MB"  
**Solution**:
- Use an image compression tool
- Reduce image resolution
- Convert to JPEG format
- Crop unnecessary parts

### Poor Extraction Results
**Problem**: AI doesn't extract data accurately  
**Solution**:
- Use higher resolution images
- Ensure proper lighting
- Provide clearer text prompts
- Try rotating/straightening the image

### Image Not Showing in Chat
**Problem**: Image doesn't appear in message  
**Solution**:
- Wait for upload to complete
- Check network connection
- Refresh the page
- Check browser console

## Technical Details

### Image Encoding
Images are automatically converted to Base64 format with data URL prefix:
```
data:image/jpeg;base64,/9j/4AAQSkZJRg...
```

### Request Format
The image is sent as part of the JSON payload:
```json
{
  "session_id": "uuid-here",
  "message": "Your message",
  "invoice_image": "data:image/jpeg;base64,..."
}
```

### Response Format
The AI returns structured MSC data along with analysis:
```json
{
  "session_id": "uuid-here",
  "message": "I've analyzed the invoice...",
  "msc_content": "# MSC format data",
  "token_count": 1234
}
```

## Security & Privacy

- 🔒 Images are processed in memory only
- 🔒 Not stored permanently on servers
- 🔒 Transmitted over HTTPS (in production)
- 🔒 Base64 encoding for secure transport
- 🔒 Automatic cleanup after processing

## Performance Tips

1. **Optimize Images**
   - Resize to reasonable dimensions (max 1920px width)
   - Compress before uploading
   - Use JPEG for photos, PNG for text documents

2. **Network**
   - Upload on stable connection
   - Larger images take longer to process
   - Consider image size vs. quality tradeoff

3. **Processing**
   - First message with image may take 5-10 seconds
   - Complex invoices take longer to analyze
   - Multiple line items increase processing time

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Send message | Enter |
| New line | Shift + Enter |
| Upload image | (Click icon) |
| Remove image | (Click X on preview) |

## UI Components

### Image Icon Button
- Located left of the text input
- Blue color when enabled
- Grayed out when loading
- Opens file picker on click

### Image Preview
- Appears above input when image selected
- Max height: 150px
- Shows thumbnail with overlay
- X button in top-right corner

### Message Bubbles
- User messages on right (blue)
- AI messages on left (gray)
- Images appear above message text
- Timestamp at bottom

## What the AI Can Extract

### Header Information
- Invoice number and date
- Due date
- Company logos (described)

### Company Details
- Sender company name
- Address and contact info
- Email, phone, website

### Client Information
- Customer/client name
- Billing address
- Contact details

### Line Items
- Item descriptions
- Quantities and units
- Unit prices
- Line totals

### Financial Data
- Subtotal amounts
- Tax rates and amounts
- Discounts applied
- Final total

### Additional Info
- Payment terms
- Bank details
- Notes and comments
- Terms and conditions

## Common Use Cases

### 1. Digitizing Paper Invoices
Upload scanned invoices to convert them into editable digital format.

### 2. Template Replication
Use existing invoice layouts as templates for new invoices.

### 3. Data Verification
Compare uploaded images with generated invoices for accuracy.

### 4. Batch Processing
Upload multiple invoices in sequence for consistent formatting.

### 5. Invoice Updates
Modify existing invoices based on revised paper copies.

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Mobile Safari | 14+ | ✅ Full |
| Chrome Mobile | 90+ | ✅ Full |

## Mobile Support

The image upload feature works on mobile devices:
- ✅ Tap image icon to open camera/gallery
- ✅ Take photo directly or select from gallery
- ✅ Same size and format restrictions apply
- ✅ Touch-optimized preview removal
- ⚠️ Consider data usage with large images

## Future Enhancements

Planned features:
- 📋 Drag & drop file upload
- 📸 Direct camera capture
- 🗂️ Multiple image uploads at once
- 📊 Image quality analysis
- 🔍 OCR confidence scores
- 💾 Image history/gallery

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running (Docker)
3. Test with different images
4. Review API error messages
5. Check network tab for failed requests

## API Integration

The frontend integrates with these backend endpoints:

### Generate Invoice
```typescript
POST /api/generate-invoice
{
  "initial_prompt": "string",
  "invoice_image": "data:image/jpeg;base64,..."
}
```

### Continue Chat
```typescript
POST /api/chat
{
  "session_id": "uuid",
  "message": "string",
  "invoice_image": "data:image/jpeg;base64,..."
}
```

## Development

### Component Structure
```
InvoiceAIPage.tsx          → Main page component
├─ ChatSidebar.tsx         → Chat interface with image upload
├─ ChatSidebar.css         → Styling for chat and images
└─ aiService.ts            → API integration with image support
```

### Key Functions
- `handleImageSelect()` - Processes file upload
- `handleRemoveImage()` - Clears selected image
- `handleSendMessage()` - Sends text + image to API
- `generateInvoice()` - API call with image support
- `sendChatMessage()` - API call with image support

## Testing

Test the image upload feature:
1. Start the backend (Docker container)
2. Navigate to Invoice AI page
3. Click image icon
4. Select test invoice image
5. Verify preview appears
6. Send message
7. Check AI response and MSC output

## Changelog

### v1.0.0 (Current)
- ✅ Image upload button in chat
- ✅ Image preview with removal
- ✅ Base64 encoding
- ✅ Size validation (5MB limit)
- ✅ Format validation
- ✅ Image display in chat history
- ✅ API integration with backend
- ✅ Error handling
- ✅ Loading states
- ✅ Mobile support
