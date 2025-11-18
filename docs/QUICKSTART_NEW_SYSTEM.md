# Quick Start Guide - New Invoice Template Generation System

## 🚀 Getting Started in 5 Minutes

### Prerequisites Check

```bash
# 1. Check Python environment
python --version  # Should be 3.8+

# 2. Check Node.js (for validator)
node --version  # Should be 14+

# 3. Check Redis
redis-cli ping  # Should return PONG
```

### Environment Setup

Create/update `.env` file:

```bash
# AWS Bedrock Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### Installation

```bash
cd backend

# Install Python dependencies (if not already installed)
pip install -r requirements.txt

# Verify Node.js validator is accessible
cd msc_validator
node validator.js  # Should show usage info
cd ..
```

### Run Tests

```bash
# Run the test suite to verify everything works
python -m app.services.test_template_agent
```

Expected output:
```
🎉 All tests passed!
```

### Start the Server

```bash
# From backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server should start at: `http://localhost:8000`

---

## 📝 API Usage Examples

### Example 1: Generate Simple Invoice

```bash
curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "initial_prompt": "Create a professional tax invoice for tablet with 15 item rows"
  }'
```

**Response**:
```json
{
  "session_id": "uuid-here",
  "assistantResponse": {
    "text": "I have created a tax invoice template called '...'",
    "savestr": "version:1.5\ncell:B2:t:INVOICE:...",
    "cellMappings": {
      "logo": {"sheet1": "F5"},
      "text": {...}
    },
    "templateMeta": {
      "name": "Professional-Tax-Invoice-Tablet",
      "category": "tax_invoice",
      "deviceType": "tablet"
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

### Example 2: Generate from Image

```bash
# First, convert image to base64
IMAGE_B64=$(base64 -w 0 invoice.jpg)

curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d "{
    \"initial_prompt\": \"Create a template matching this invoice design\",
    \"invoice_image\": \"data:image/jpeg;base64,$IMAGE_B64\"
  }"
```

### Example 3: Edit Template

```bash
# Save session_id from previous request
SESSION_ID="uuid-from-generate"

curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"Add a discount field between subtotal and tax\"
  }"
```

---

## 🧪 Testing Individual Components

### Test Cell Mapping Agent

```python
from app.services.meta_cellmap_agent import MetaAndCellMapAgent

agent = MetaAndCellMapAgent()
meta, mappings = agent.generate_cell_mappings(
    "Create a simple invoice for mobile"
)

print(f"Template: {meta['name']}")
print(f"Device: {meta['deviceType']}")
```

### Test SaveStr Agent

```python
from app.services.savestr_agent import SaveStrAgent

agent = SaveStrAgent()
savestr = agent.generate_savestr(
    template_meta={"name": "Test", "deviceType": "tablet"},
    cell_mappings={"text": {"sheet1": {"Heading": "A1"}}},
    user_prompt="Simple test"
)

print(f"SaveStr length: {len(savestr)}")
print(f"First line: {savestr.split(chr(10))[0]}")
```

### Test Full Pipeline

```python
from app.services.template_generation_agent import TemplateGenerationAgent

agent = TemplateGenerationAgent()
result = agent.generate_template(
    user_prompt="Create a professional invoice for desktop"
)

print(f"Valid: {result['validation']['is_valid']}")
print(f"Attempts: {result['validation']['attempts']}")
print(f"Template: {result['assistantResponse']['templateMeta']['name']}")
```

---

## 🎨 Common Prompts

### Device-Specific Templates

```bash
# Mobile (compact)
"Create a simple invoice for mobile devices with 5 item rows"

# Tablet (balanced)
"Create a professional tax invoice for tablet with 15 item rows"

# Desktop (full-featured)
"Create a comprehensive invoice for desktop with 30 item rows and all fields"
```

### Category-Specific Templates

```bash
# Simple invoice
"Create a simple invoice with basic fields"

# Tax invoice
"Create a tax invoice with tax calculation and invoice number"

# Professional invoice
"Create a professional invoice with logo, signature, and payment terms"
```

### Feature-Specific Templates

```bash
# With discount
"Create an invoice with subtotal, discount, tax, and total"

# With quantity and unit price
"Create an invoice with quantity, unit price, and amount columns"

# With notes section
"Create an invoice with a large notes section at the bottom"
```

---

## 🐛 Troubleshooting

### Issue: Tests Fail with AWS Error

**Solution**:
```bash
# Verify AWS credentials
aws configure list

# Or set environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-1
```

### Issue: Validation Always Fails

**Solution**:
```bash
# Check Node.js validator
cd backend/msc_validator
node validator.js

# Should show usage info, not errors
```

### Issue: Import Errors

**Solution**:
```bash
# Reinstall dependencies
cd backend
pip install -r requirements.txt

# Or install specific packages
pip install langchain langchain-aws pydantic fastapi
```

### Issue: Redis Connection Error

**Solution**:
```bash
# Start Redis
redis-server

# Or check if running
redis-cli ping  # Should return PONG
```

---

## 📊 Monitoring

### Check Validation Success Rate

Look for this in console logs:
```
[Step 3/4] Validating MSC Format (max 5 retries)...
  Attempt 1/5...
  ✓ Validation PASSED
```

Good: Most templates validate in 1-2 attempts
Needs attention: Consistent 4-5 attempts

### Check Response Structure

Verify all components are present:
- ✅ assistantResponse.text
- ✅ assistantResponse.savestr
- ✅ assistantResponse.cellMappings
- ✅ assistantResponse.templateMeta
- ✅ validation.is_valid
- ✅ validation.attempts
- ✅ validation.final_errors

---

## 📚 Documentation Links

- **Architecture**: See `backend/docs/TEMPLATE_GENERATION_ARCHITECTURE.md`
- **MSC Syntax**: See `backend/docs/parser-docs/SYNTAX.md`
- **Implementation Guide**: See `backend/docs/parser-docs/IMPLEMENTATION-GUIDE.md`
- **Summary**: See `IMPLEMENTATION_SUMMARY.md`

---

## 🎯 Next Steps

1. ✅ **Run tests** to verify everything works
2. ✅ **Start server** and test API endpoints
3. ✅ **Try different prompts** to see variety
4. ✅ **Test with images** for vision capabilities
5. ✅ **Monitor validation** success rates
6. ✅ **Integrate with frontend** using new response format

---

## 💡 Pro Tips

### Prompt Engineering

**Good**:
- "Create a professional tax invoice for tablet with 15 item rows, discount field, and signature"
- "Generate a mobile-optimized invoice with company logo in header"

**Avoid**:
- "Make invoice" (too vague)
- "Excel spreadsheet" (wrong format)

### Image Analysis

**Best Results**:
- Clear, high-resolution scans
- Standard invoice layouts
- Good lighting and contrast

**Avoid**:
- Handwritten invoices
- Blurry photos
- Non-invoice documents

### Performance

- First request is slower (model initialization)
- Subsequent requests are faster (cached)
- Image requests take longer (vision processing)
- Validation retries add time (but improve quality)

---

## 🎉 Success Indicators

You're ready when:
- ✅ All tests pass
- ✅ Server starts without errors
- ✅ API returns complete response structure
- ✅ Validation passes in 1-3 attempts
- ✅ SaveStr starts with `version:1.5`
- ✅ Cell mappings match your prompt
- ✅ Template meta includes name/category/device

---

## 📞 Need Help?

1. Check logs in console (detailed pipeline info)
2. Review test output for specific errors
3. Verify environment variables are set
4. Ensure all dependencies are installed
5. Check Redis and Node.js are running

---

**Happy Template Generating! 🚀**
