# Image Upload Support for Invoice Agent API 📸

## What's New?

The Invoice Agent API now supports **image upload** as a reference for invoice generation and editing! This feature leverages Claude's vision capabilities to analyze invoice images and automatically extract data.

## Quick Start

### 1. Basic Text-Only Request (Still Works!)
```bash
curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "initial_prompt": "Create an invoice for consulting services"
  }'
```

### 2. Request with Image
```bash
# Encode your image
IMAGE_B64=$(base64 -w 0 invoice.jpg)

# Send request with image
curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d "{
    \"initial_prompt\": \"Extract data from this invoice\",
    \"invoice_image\": \"data:image/jpeg;base64,$IMAGE_B64\"
  }"
```

### 3. Python Example
```python
import requests
import base64

# Encode image
with open("invoice.jpg", "rb") as f:
    img_data = base64.b64encode(f.read()).decode('utf-8')
    img_b64 = f"data:image/jpeg;base64,{img_data}"

# Send request
response = requests.post(
    "http://localhost:8000/api/generate-invoice",
    json={
        "initial_prompt": "Extract all data from this invoice",
        "invoice_image": img_b64
    }
)

print(response.json())
```

## Use Cases

✅ **Extract Data from Scanned Invoices**: Upload a photo/scan of an invoice to automatically extract all information

✅ **Reference Existing Invoices**: Use an existing invoice as a template for creating new ones

✅ **Multi-Step Editing**: Upload images in follow-up conversations to refine or update invoice data

✅ **Visual Context**: Combine text instructions with images for better accuracy

## API Endpoints Modified

### `/api/generate-invoice` (POST)
**New Parameter**: `invoice_image` (optional)
- Type: `string`
- Format: Base64 encoded with data URL prefix
- Example: `"data:image/jpeg;base64,/9j/4AAQSkZJRg..."`

### `/api/chat` (POST)
**New Parameter**: `invoice_image` (optional)
- Type: `string`
- Format: Base64 encoded with data URL prefix
- Use in follow-up conversations to provide new image context

## What Can Be Extracted?

The AI can extract from invoice images:
- 📋 Invoice numbers and dates
- 🏢 Company names and addresses (both sender and recipient)
- 📞 Contact information (email, phone)
- 📝 Line item descriptions
- 💰 Quantities, prices, and amounts
- 🧮 Subtotals, taxes, and totals
- 📄 Payment terms and notes

## Examples

See the example files:
- **`example_image_upload.py`** - Practical usage examples
- **`test_image_upload.py`** - Automated test suite

Run them:
```bash
python example_image_upload.py
python test_image_upload.py
```

## Documentation

📚 **Comprehensive Guide**: See `docs/IMAGE_UPLOAD_GUIDE.md`
- Detailed API reference
- Image encoding instructions
- Best practices
- Integration examples
- Error handling

🔧 **Implementation Details**: See `docs/IMAGE_UPLOAD_IMPLEMENTATION.md`
- Technical changes made
- Architecture decisions
- Testing approach

## Image Format Requirements

**Encoding**: Base64 with data URL prefix
```
data:image/{type};base64,{base64-encoded-data}
```

**Supported Formats**: 
- JPEG/JPG (`data:image/jpeg;base64,...`)
- PNG (`data:image/png;base64,...`)
- GIF (`data:image/gif;base64,...`)
- WebP (`data:image/webp;base64,...`)

**Size**: Recommended under 5MB (base64 encoded)

## Integration Tips

### Frontend (React/JavaScript)
```javascript
async function uploadInvoiceImage(file, prompt) {
  const reader = new FileReader();
  
  const base64Image = await new Promise((resolve) => {
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

  const response = await fetch('/api/generate-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      initial_prompt: prompt,
      invoice_image: base64Image
    })
  });

  return await response.json();
}
```

### Mobile (React Native)
```javascript
import * as ImagePicker from 'expo-image-picker';

async function selectAndUploadImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    base64: true,
  });

  if (!result.canceled) {
    const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
    // Send to API...
  }
}
```

## Backward Compatibility

✅ **No Breaking Changes**: The `invoice_image` parameter is optional
✅ **Existing Code Works**: All existing API calls continue to work without modification
✅ **Progressive Enhancement**: Add image support when needed

## Testing

Start the backend:
```bash
cd backend/docker
docker compose up
```

Run tests:
```bash
python test_image_upload.py
```

## Need Help?

- 📖 Read the full guide: `docs/IMAGE_UPLOAD_GUIDE.md`
- 💡 Check examples: `example_image_upload.py`
- 🔧 See implementation: `docs/IMAGE_UPLOAD_IMPLEMENTATION.md`

## Next Steps

Try it out:
1. Start your backend server
2. Run the example script: `python example_image_upload.py`
3. Modify it with your own invoice images
4. Integrate into your frontend application

---

**Note**: This feature uses Claude's vision API via AWS Bedrock. Make sure your AWS credentials have the necessary permissions for the Anthropic Claude model.
