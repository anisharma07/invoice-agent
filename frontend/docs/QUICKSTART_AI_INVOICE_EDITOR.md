# Quick Start: Invoice Editing Agent 🚀

## 5-Minute Setup Guide

This guide will get you up and running with the Invoice Editing Agent in your existing application.

---

## Prerequisites ✅

Before you begin, ensure you have:

- ✅ Backend API running (FastAPI with invoice editing endpoints)
- ✅ Redis server running (for session management)
- ✅ AWS Bedrock credentials configured
- ✅ Frontend development environment set up (Node.js, npm)

---

## Step 1: Verify Backend Setup (2 minutes)

### Check Backend is Running

```bash
# Test the backend API
curl http://localhost:8000/api/edit-invoice/session/test-123

# Should return 404 or session not found (that's OK - means API is working)
```

### Verify Required Endpoints

Your backend should have these endpoints:
- `POST /api/edit-invoice/session` - Create session
- `POST /api/edit-invoice/chat` - Continue editing
- `GET /api/edit-invoice/session/{session_id}` - Get session info
- `DELETE /api/edit-invoice/session/{session_id}` - Delete session

---

## Step 2: Environment Configuration (1 minute)

### Create/Update `.env` File

```bash
# In your frontend root directory
echo "VITE_API_URL=http://localhost:8000" >> .env
```

Or for production:
```env
VITE_API_URL=https://your-production-api.com
```

---

## Step 3: Verify Files Created (30 seconds)

Check that these files exist in your project:

```bash
# Check utility
ls -la src/utils/cellValueExtractor.ts

# Check service
ls -la src/services/invoiceEditingService.ts

# Check component
ls -la src/components/InvoiceEditingAgent/InvoiceEditingAgent.tsx
ls -la src/components/InvoiceEditingAgent/InvoiceEditingAgent.css

# Check integration
grep -n "InvoiceEditingAgent" src/pages/Home.tsx
```

All should exist and Home.tsx should have import and usage.

---

## Step 4: Install Dependencies (if needed) (1 minute)

```bash
# The component uses only existing dependencies
# But verify you have these installed:
npm list @ionic/react ionicons react

# If missing, install:
# npm install @ionic/react ionicons react
```

---

## Step 5: Start the Application (30 seconds)

```bash
# Start frontend development server
npm run dev

# Should start on http://localhost:5173
```

---

## Step 6: Test the Agent (1 minute)

### Test Flow:

1. **Open Browser**
   ```
   http://localhost:5173
   ```

2. **Navigate to an Invoice**
   - Go to Files page
   - Open any existing invoice file
   - Or create a new invoice

3. **Open AI Editor**
   - Look for the **"AI Editor"** button in top toolbar (purple with sparkles icon)
   - Click it

4. **Test Basic Functionality**
   
   **Test 1: Text Request**
   ```
   Type: "Update the heading to Test Invoice"
   Click: Send
   Wait: For AI response
   Result: Should see cell update suggestion
   Click: "Apply Updates"
   Result: Should see success toast
   ```

   **Test 2: Date Formula**
   ```
   Type: "Set today's date"
   Click: Send
   Wait: For response
   Result: Should get formula =TODAY()
   Click: "Apply Updates"
   Result: Date cell updated
   ```

   **Test 3: Image Upload** (optional)
   ```
   Click: Image icon
   Select: Any invoice image
   Type: "Extract all data"
   Click: Send
   Wait: 5-10 seconds (image processing)
   Result: Should see multiple cell updates
   ```

---

## Troubleshooting Common Issues 🔧

### Issue: "No active template found"

**Solution:**
```bash
# Make sure you're on an invoice page, not files list
# URL should be: /app/home/:filename
# Not: /app/files
```

### Issue: "Failed to process request"

**Solution:**
```bash
# Check backend is running
curl http://localhost:8000/api/edit-invoice/session/test

# Check environment variable
cat .env | grep VITE_API_URL

# Check browser console for network errors
# Open DevTools > Console
```

### Issue: AI Editor button not visible

**Solution:**
```bash
# Verify import in Home.tsx
grep "sparklesOutline" src/pages/Home.tsx

# Should show import line
# If not, the integration step was incomplete
```

### Issue: Cell updates not applying

**Solution:**
```bash
# Check SocialCalc is initialized
# Open browser console and run:
window.SocialCalc.GetCurrentWorkBookControl()

# Should return an object, not undefined
# If undefined, wait a few seconds after opening invoice
```

### Issue: CORS errors in browser console

**Solution:**
```python
# In backend, add CORS middleware (FastAPI)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Testing Checklist ✓

Run through this checklist to verify everything works:

- [ ] Backend server running and accessible
- [ ] Redis server running
- [ ] Frontend dev server running
- [ ] Can open invoice file
- [ ] AI Editor button visible in toolbar
- [ ] Can open AI Editor modal
- [ ] Can send text request
- [ ] AI responds with cell updates
- [ ] Can apply cell updates to spreadsheet
- [ ] Updates appear in spreadsheet
- [ ] Can upload image (optional)
- [ ] Can close and reopen modal
- [ ] Session persists within modal session
- [ ] Reset button clears session

---

## Usage Examples 💡

### Example 1: Update Invoice Header
```
User: "Change heading to Professional Services Invoice"
AI: Returns { "B2": "Professional Services Invoice" }
User: Clicks "Apply Updates"
Result: Cell B2 updated
```

### Example 2: Set Date with Formula
```
User: "Set today's date in the date field"
AI: Returns { "D20": "=TODAY()" }
User: Clicks "Apply Updates"
Result: Cell D20 shows current date (auto-updates daily)
```

### Example 3: Update Client Information
```
User: "Update client name to Acme Corp and address to 123 Main St, NYC"
AI: Returns { "C5": "Acme Corp", "C6": "123 Main St, NYC" }
User: Clicks "Apply Updates"
Result: Both cells updated
```

### Example 4: Add Line Item
```
User: "Add item: Web Development Services - $2500"
AI: Returns { "C23": "Web Development Services", "F23": "2500.00" }
User: Clicks "Apply Updates"
Result: New line item added
```

### Example 5: Extract from Image
```
User: Uploads invoice PDF screenshot
User: Types "Extract all invoice data"
AI: Processes image, returns 15+ cell updates
User: Reviews updates in chat
User: Clicks "Apply Updates"
Result: Entire invoice populated from image
```

---

## API Testing with cURL 🧪

If you want to test the backend API directly:

### Create Session
```bash
curl -X POST http://localhost:8000/api/edit-invoice/session \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Update heading to Test Invoice",
    "cell_mappings": {
      "sheet1": {
        "Heading": "B2"
      }
    },
    "current_values": {
      "B2": "Invoice"
    }
  }'
```

### Continue Editing
```bash
curl -X POST http://localhost:8000/api/edit-invoice/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "YOUR_SESSION_ID",
    "prompt": "Set today'\''s date",
    "current_values": {}
  }'
```

---

## Performance Tips ⚡

### Optimize for Speed
```typescript
// In your usage:

// ✅ Good: Batch multiple edits
"Update heading to Invoice, set today's date, and change number to INV-001"

// ❌ Slow: Multiple separate requests
"Update heading to Invoice"
// wait for response
"Set today's date"
// wait for response
"Change number to INV-001"
```

### Image Upload Tips
```typescript
// ✅ Good: Compress images before upload
// ❌ Slow: Upload 10MB images directly

// Use image compression:
// - Resize to max 1024px width
// - Convert to WebP format
// - Compress quality to 80%
```

---

## Next Steps 🎯

Now that you have it working:

1. **Read Full Documentation**
   - [Integration Guide](./INVOICE_EDITING_INTEGRATION_GUIDE.md)
   - [Backend API Docs](./INVOICE_EDITING_AGENT_README.md)
   - [Architecture](./INVOICE_EDITING_ARCHITECTURE.md)

2. **Customize the UI**
   - Modify `InvoiceEditingAgent.css` for branding
   - Adjust colors to match your theme
   - Change button text/icons

3. **Add Features**
   - Implement undo/redo
   - Add more validation
   - Create custom prompts
   - Add voice input

4. **Deploy to Production**
   - Update `VITE_API_URL` to production API
   - Build frontend: `npm run build`
   - Deploy to your hosting platform
   - Configure HTTPS and security

---

## Help & Support 💬

### Documentation
- [Integration Guide](./INVOICE_EDITING_INTEGRATION_GUIDE.md)
- [Backend API Reference](./INVOICE_EDITING_AGENT_README.md)
- [Architecture Diagrams](./INVOICE_EDITING_ARCHITECTURE.md)

### Debugging
```bash
# Enable verbose logging in browser console
localStorage.setItem('DEBUG', 'invoice:*')

# Check all logs
# Open DevTools > Console
# Look for errors or warnings
```

### Common Questions

**Q: Can I use a different AI model?**  
A: Yes, modify `backend/app/services/invoice_editing_agent.py` to use a different model.

**Q: How do I add authentication?**  
A: Add auth headers in `src/services/invoiceEditingService.ts` in the fetch calls.

**Q: Can I customize the cell mappings?**  
A: Yes, edit your template's `cellMappings` structure in `src/templates.ts`.

**Q: How do I disable the AI Editor?**  
A: Remove the "AI Editor" button from `src/pages/Home.tsx` or add a feature flag.

---

## Success! 🎉

You should now have a fully functional AI Invoice Editing Agent integrated into your application.

**What you can do now:**
- ✅ Edit invoices with natural language
- ✅ Extract data from invoice images
- ✅ Apply AI-suggested updates instantly
- ✅ Maintain conversation context across edits
- ✅ Use formulas for dynamic calculations

**Happy editing!** 🚀

---

**Version**: 1.0.0  
**Date**: 2025-01-15  
**Status**: ✅ Ready to Use
