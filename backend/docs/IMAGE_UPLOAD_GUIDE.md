# Invoice Agent Image Upload Feature

## Overview

The Invoice Agent API now supports image upload as a reference for invoice generation and editing. This feature uses Claude's vision capabilities to analyze invoice images and extract relevant data.

## Features

- 📸 **Image Analysis**: Upload invoice images to extract data automatically
- 🔄 **Multi-modal Input**: Combine text prompts with images for better context
- ✏️ **Continuous Chat**: Use images in follow-up conversations
- 🎯 **Accurate Extraction**: Extract company details, line items, amounts, and more

## API Endpoints

### 1. Generate Invoice (`POST /api/generate-invoice`)

Generate a new invoice with optional image reference.

**Request Body:**
```json
{
  "session_id": "optional-session-id",
  "initial_prompt": "Create an invoice based on this image",
  "invoice_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Fields:**
- `session_id` (optional): Session identifier. If not provided, a new session is created.
- `initial_prompt` (required): Text description of what you want to do.
- `invoice_image` (optional): Base64 encoded image with data URL prefix.

**Response:**
```json
{
  "session_id": "uuid-here",
  "message": "I've analyzed the invoice image and extracted the following details...",
  "msc_content": "# MSC format content...",
  "token_count": 1234,
  "timestamp": "2025-01-15T10:30:00"
}
```

### 2. Chat/Edit Invoice (`POST /api/chat`)

Continue conversation or edit invoice with optional image reference.

**Request Body:**
```json
{
  "session_id": "existing-session-id",
  "message": "Update the amounts based on this new image",
  "invoice_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Fields:**
- `session_id` (required): Existing session identifier.
- `message` (required): Your editing request or question.
- `invoice_image` (optional): Base64 encoded image for reference.

**Response:**
```json
{
  "session_id": "uuid-here",
  "message": "I've updated the invoice based on the new image...",
  "msc_content": "# Updated MSC format content...",
  "token_count": 1456,
  "token_limit": 200000,
  "timestamp": "2025-01-15T10:35:00"
}
```

## Image Format

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Image Encoding

Images must be base64 encoded with the data URL prefix:

```
data:image/jpeg;base64,<base64-encoded-data>
```

**Example in Python:**
```python
import base64

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"

image_data = encode_image("invoice.jpg")
```

**Example in JavaScript:**
```javascript
async function encodeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const imageData = await encodeImage(fileInput.files[0]);
```

## Usage Examples

### Example 1: Extract Data from Invoice Image

```python
import requests
import base64

# Encode image
with open("sample_invoice.jpg", "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode('utf-8')
    image_data = f"data:image/jpeg;base64,{image_b64}"

# Generate invoice from image
response = requests.post(
    "http://localhost:8000/api/generate-invoice",
    json={
        "initial_prompt": "Extract all data from this invoice image and create a structured invoice",
        "invoice_image": image_data
    }
)

result = response.json()
print(result["message"])
```

### Example 2: Update Invoice Based on New Image

```python
# Continue conversation with new image
response = requests.post(
    "http://localhost:8000/api/chat",
    json={
        "session_id": "existing-session-id",
        "message": "Update the line items based on this revised invoice",
        "invoice_image": new_image_data
    }
)
```

### Example 3: Combine Text and Image

```python
response = requests.post(
    "http://localhost:8000/api/generate-invoice",
    json={
        "initial_prompt": "Create an invoice similar to the attached image, but change the company name to 'Acme Corp' and add 10% tax",
        "invoice_image": image_data
    }
)
```

### Example 4: Use Image as Reference Only

```python
response = requests.post(
    "http://localhost:8000/api/chat",
    json={
        "session_id": session_id,
        "message": "Using the style from this image, format the current invoice professionally",
        "invoice_image": template_image_data
    }
)
```

## What the AI Can Extract

When you provide an invoice image, the AI can extract:

- **Header Information**:
  - Invoice number
  - Invoice date and due date
  - Company logos (descriptions)

- **Sender Information**:
  - Company name
  - Address
  - Email and phone
  - Website

- **Recipient Information**:
  - Client/customer name
  - Billing address
  - Contact details

- **Line Items**:
  - Item descriptions
  - Quantities
  - Unit prices
  - Line totals

- **Financial Data**:
  - Subtotal
  - Tax rate and amount
  - Discounts
  - Total amount

- **Additional Information**:
  - Payment terms
  - Notes or comments
  - Bank details
  - Terms and conditions

## Best Practices

1. **Image Quality**: Use clear, high-resolution images for best results
2. **Lighting**: Ensure the invoice is well-lit and readable
3. **Orientation**: Keep images properly oriented (not rotated)
4. **Combine Context**: Use text prompts to clarify what you need from the image
5. **Iterative Refinement**: Use follow-up messages to correct or adjust extracted data

## Error Handling

### Invalid Image Format
```json
{
  "error": "Invalid image format",
  "detail": "Image must be base64 encoded with data URL prefix"
}
```

### Image Too Large
```json
{
  "error": "Image size exceeds limit",
  "detail": "Please reduce image size to under 5MB"
}
```

### Session Not Found
```json
{
  "error": "Session not found",
  "detail": "Session xyz123 not found or expired. Please create a new invoice."
}
```

## Testing

Use the provided test script to verify the functionality:

```bash
cd backend
python test_image_upload.py
```

You can modify the script to test with your own images:

```python
# In test_image_upload.py, uncomment and update:
sample_image_path = "/path/to/your/invoice.jpg"
session_id = test_generate_invoice_with_image(sample_image_path)
```

## Security Considerations

- Images are processed in memory and not stored permanently
- Base64 encoding increases payload size by ~33%
- Consider implementing file size limits on the client side
- Validate image formats before encoding
- Use HTTPS in production to encrypt image data in transit

## Limitations

- Maximum image size: ~5MB (base64 encoded)
- Supported formats: JPEG, PNG, GIF, WebP
- Images are not persisted after processing
- Handwritten invoices may have lower accuracy
- Complex layouts might require multiple refinement steps

## Integration Examples

### React/TypeScript Frontend

```typescript
import axios from 'axios';

async function uploadInvoiceWithImage(imageFile: File, prompt: string) {
  // Convert file to base64
  const base64Image = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(imageFile);
  });

  // Send to API
  const response = await axios.post('/api/generate-invoice', {
    initial_prompt: prompt,
    invoice_image: base64Image,
  });

  return response.data;
}
```

### cURL Example

```bash
# First, encode your image
IMAGE_B64=$(base64 -w 0 invoice.jpg)

# Send request
curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d "{
    \"initial_prompt\": \"Extract invoice data from this image\",
    \"invoice_image\": \"data:image/jpeg;base64,$IMAGE_B64\"
  }"
```

## Support

For issues or questions:
1. Check the logs in the backend container
2. Verify image encoding is correct
3. Test with the provided test script
4. Review the API error messages for details
