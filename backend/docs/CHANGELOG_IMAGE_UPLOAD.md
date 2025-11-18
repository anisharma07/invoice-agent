# Changelog - Invoice Agent Image Upload Feature

## [1.1.0] - 2025-11-15

### Added
- **Image Upload Support**: Invoice agent API now accepts base64 encoded images as reference for invoice generation and editing
- **Vision Capabilities**: Integrated Claude's vision API to analyze and extract data from invoice images
- **Multimodal Input**: Support for combining text prompts with images in a single request
- **Conversation Context**: Images can be included in follow-up chat messages for iterative refinement

### Changed
- **API Schema**: Added optional `invoice_image` field to `InvoiceGenerateRequest` and `ChatRequest` models
- **Agent Methods**: Updated `generate_invoice()` and `edit_invoice()` methods to accept optional image parameter
- **System Prompt**: Enhanced with instructions for image analysis and data extraction
- **Message Handling**: Implemented multimodal message structure for Claude API

### Files Modified
- `app/models/schemas.py` - Added image fields to request schemas
- `app/services/invoice_agent.py` - Added image processing capabilities
- `app/api/routes.py` - Updated endpoints to pass image data to agent

### Files Created
- `docs/IMAGE_UPLOAD_GUIDE.md` - Comprehensive user documentation
- `docs/IMAGE_UPLOAD_IMPLEMENTATION.md` - Technical implementation details
- `IMAGE_UPLOAD_README.md` - Quick start guide
- `test_image_upload.py` - Automated test suite
- `example_image_upload.py` - Practical usage examples
- `CHANGELOG_IMAGE_UPLOAD.md` - This file

### Technical Details

#### Request Format
```json
{
  "initial_prompt": "Extract data from invoice",
  "invoice_image": "data:image/jpeg;base64,<base64-data>"
}
```

#### Response Format
Unchanged - same structure as before, but with data extracted from images

#### Image Processing Flow
1. Client encodes image to base64 with data URL prefix
2. API receives request with optional image field
3. Agent extracts base64 data from data URL
4. Creates multimodal message for Claude API
5. Claude analyzes image and text prompt together
6. Returns structured invoice data

### Supported Image Formats
- JPEG/JPG
- PNG
- GIF
- WebP

### Backward Compatibility
✅ All existing API calls work without modification
✅ Image parameter is optional on all endpoints
✅ No breaking changes to existing functionality

### Testing
- Added automated test suite: `test_image_upload.py`
- Added usage examples: `example_image_upload.py`
- Verified with/without image scenarios
- Tested follow-up conversations with images

### Documentation
- Comprehensive usage guide with examples
- API reference with request/response formats
- Integration examples for various platforms
- Best practices and security considerations

### Dependencies
No new dependencies required. Uses existing:
- `langchain-aws` for Claude API access
- `base64` (Python stdlib) for image encoding
- AWS Bedrock with Anthropic Claude Sonnet 4 model

### Performance Considerations
- Base64 encoding increases payload size by ~33%
- Recommended maximum image size: 5MB
- Images processed in memory (not persisted)
- Token usage increases with image complexity

### Security
- Images transmitted as base64 in JSON
- No server-side storage of uploaded images
- Images processed in memory only
- Recommend HTTPS in production

### Future Enhancements (Roadmap)
- [ ] File size validation middleware
- [ ] Support for multiple images per request
- [ ] Image preprocessing (auto-resize, optimize)
- [ ] Image URL support (in addition to base64)
- [ ] OCR confidence scores in response
- [ ] Batch processing for multiple invoices

### Known Limitations
- Maximum recommended image size: 5MB (base64)
- Handwritten text may have lower accuracy
- Complex layouts may require manual refinement
- Images not persisted after processing

### Migration Guide
No migration needed! The feature is additive and backward compatible.

To start using image upload:
1. Update your client code to encode images as base64
2. Add `invoice_image` field to your API requests
3. That's it! No server changes needed if using latest version

### Example Migration

**Before (Text only):**
```python
response = requests.post(
    "/api/generate-invoice",
    json={"initial_prompt": "Create invoice for $1000"}
)
```

**After (With image):**
```python
with open("invoice.jpg", "rb") as f:
    img_b64 = f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode()}"

response = requests.post(
    "/api/generate-invoice",
    json={
        "initial_prompt": "Extract data from this invoice",
        "invoice_image": img_b64
    }
)
```

### Support
For questions or issues:
1. Check `docs/IMAGE_UPLOAD_GUIDE.md`
2. Review example files
3. Test with provided test scripts
4. Check API error messages

---

**Contributors**: Implementation by AI Assistant
**Review Status**: Ready for testing
**Version**: 1.1.0
**Release Date**: 2025-11-15
