# Frontend Integration Testing Guide

## 🧪 Testing the New Response Format

This guide will help you verify that the frontend correctly handles the new multi-agent response format.

---

## ✅ Pre-Test Checklist

### Backend Status
- [ ] Backend server is running (`uvicorn app.main:app --reload`)
- [ ] Backend tests pass (`python -m app.services.test_template_agent`)
- [ ] Redis is running (`redis-cli ping` returns PONG)
- [ ] Node.js validator is accessible

### Frontend Status
- [ ] Frontend dev server is running (`npm run dev`)
- [ ] No TypeScript compilation errors
- [ ] Browser console is open for debugging

---

## 📋 Test Cases

### Test 1: Basic Template Generation ✨

**Steps:**
1. Open the Invoice AI page
2. Enter prompt: `"Create a professional tax invoice for tablet"`
3. Send message
4. Wait for response

**Expected Results:**
✅ User message appears in chat  
✅ Assistant response appears with validation info  
✅ Template info card displays with:
   - Template name (e.g., "Professional-Tax-Invoice-Tablet")
   - Category badge (e.g., "tax invoice")
   - Device badge (e.g., "tablet")
   - Validation status (e.g., "Validated in 2 attempt(s)")  
✅ MSC Preview renders the spreadsheet  
✅ JSON output shows complete structure with:
   - `templateMeta` object
   - `cellMappings` object
   - `validation` object  
✅ Token count updates  
✅ Invoice tab appears in history  

**Console Logs to Check:**
```
📨 Received AI response: {
  session_id: "...",
  template_name: "Professional-Tax-Invoice-Tablet",
  has_savestr: true,
  is_valid: true,
  validation_attempts: 2,
  token_count: 1234
}
✓ Session ID updated: ...
✓ Token count updated: 1234
✓ Messages updated, count: 2
📊 SaveStr present, updating display...
✅ SaveStr content updated and added to history
📋 Template Meta: { name: "...", category: "...", ... }
🗺️ Cell Mappings: { text: { sheet1: { ... } } }
✓ Validation: { is_valid: true, attempts: 2, final_errors: [] }
```

---

### Test 2: Mobile vs Tablet vs Desktop 📱💻

**Steps:**
1. Test mobile: `"Create a simple invoice for mobile with 5 items"`
2. Test tablet: `"Create a professional invoice for tablet with 15 items"`
3. Test desktop: `"Create a comprehensive invoice for desktop with 30 items"`

**Expected Results:**
✅ Each generates with different device badge:
   - Mobile → compact layout
   - Tablet → balanced layout
   - Desktop → full layout  
✅ Item row counts differ based on device  
✅ Template names reflect device type  
✅ All validate successfully  

---

### Test 3: Image Upload Analysis 🖼️

**Steps:**
1. Click image upload button in chat
2. Upload an invoice image
3. Add prompt: `"Recreate this invoice template"`
4. Send message

**Expected Results:**
✅ Image preview appears in chat input  
✅ Response analyzes the image  
✅ Generated template matches image layout  
✅ Cell mappings reflect image structure  
✅ Validation passes  

---

### Test 4: Template Editing 🔧

**Steps:**
1. Generate initial template (any prompt)
2. Send follow-up: `"Add a discount field between subtotal and tax"`
3. Wait for response

**Expected Results:**
✅ New template generated with modifications  
✅ New tab appears in invoice history  
✅ Session ID remains the same  
✅ Template includes discount field  
✅ Formulas updated (Total = Subtotal - Discount + Tax)  
✅ Validation runs again  

---

### Test 5: Validation Status Display ⚠️

**Purpose:** Test how validation warnings are displayed

**Steps:**
1. Generate a template (any prompt)
2. Check validation status in UI

**Expected Results:**

**If validation passes (is_valid: true):**
✅ Green checkmark icon  
✅ Text: "Validated in N attempt(s)"  
✅ Assistant message includes: "Template validated successfully"  

**If validation has warnings (is_valid: false):**
✅ Warning icon  
✅ Yellow/orange color  
✅ Text: "Generated with N warning(s)"  
✅ Assistant message includes validation warning  
✅ `validation.final_errors` array shows errors in JSON  

---

### Test 6: Multiple Invoice Tabs 📑

**Steps:**
1. Generate first invoice: `"Create invoice for mobile"`
2. Start new session (click "New" button)
3. Generate second invoice: `"Create invoice for tablet"`
4. Start new session again
5. Generate third invoice: `"Create invoice for desktop"`

**Expected Results:**
✅ Three tabs appear at top of JSON display  
✅ Each tab shows template name and timestamp  
✅ Clicking tabs switches between invoices  
✅ MSC Preview updates when switching tabs  
✅ JSON output updates when switching tabs  
✅ Template info card updates for each invoice  

---

### Test 7: Copy MSC JSON 📋

**Steps:**
1. Generate any template
2. Click "Copy" button in JSON header
3. Paste into text editor

**Expected Results:**
✅ Button shows "Copied!" temporarily  
✅ Clipboard contains complete JSON structure  
✅ JSON includes:
   - `templateMeta` object
   - `cellMappings` object
   - `validation` object
   - `sheetArr` with savestr  
✅ JSON is properly formatted (indented)  

---

### Test 8: Session Management 🔄

**Steps:**
1. Generate template and note session ID
2. Send follow-up message
3. Click "New" button
4. Generate new template

**Expected Results:**
✅ Session ID persists across messages  
✅ Token count accumulates in same session  
✅ "New" button creates new session ID  
✅ Token count resets to 0  
✅ Message history clears  
✅ Invoice history retains all templates  

---

### Test 9: Error Handling ❌

**Purpose:** Test error scenarios

**Test 9.1: Backend Offline**
1. Stop backend server
2. Try to send message

**Expected:**
✅ Error toast appears  
✅ Message: "Failed to send message"  
✅ Backend status indicator shows offline  

**Test 9.2: Invalid Session**
1. Manually corrupt session ID in browser dev tools
2. Send message

**Expected:**
✅ Error toast with clear message  
✅ Suggests creating new session  

**Test 9.3: Network Error**
1. Disable network in browser dev tools
2. Try to send message

**Expected:**
✅ Error toast appears  
✅ Loading state clears  

---

### Test 10: Template Metadata Display 📊

**Steps:**
1. Generate template: `"Create a professional tax invoice for tablet with company logo and signature"`

**Expected Results:**
✅ Template info card shows:
   - Template name (descriptive)
   - Category badge: "tax invoice"
   - Device badge: "tablet"
   - Description text (if provided by AI)  
✅ Validation status with icon  
✅ Card has gradient background  
✅ All text is readable (white on blue)  

---

### Test 11: Cell Mappings Inspection 🗺️

**Steps:**
1. Generate any template
2. Expand JSON output
3. Find `cellMappings` object

**Expected Structure:**
```json
{
  "cellMappings": {
    "logo": {
      "sheet1": "F5"
    },
    "signature": {
      "sheet1": "D38"
    },
    "text": {
      "sheet1": {
        "Heading": "B2",
        "Date": "D20",
        "InvoiceNumber": "C18",
        "From": {
          "Name": "C12",
          "StreetAddress": "C13",
          // ...
        },
        "BillTo": {
          "Name": "C5",
          // ...
        },
        "Items": {
          "Rows": {
            "start": 23,
            "end": 35
          },
          "Columns": {
            "Description": "C",
            "Amount": "F"
          }
        },
        "Subtotal": "F36",
        "Tax": "F37",
        "Total": "F38"
      }
    }
  }
}
```

✅ All cell references are valid (A1, B2, etc.)  
✅ Items section has start/end rows  
✅ Items section has column mappings  
✅ All essential fields present  

---

### Test 12: Formula Verification 🧮

**Steps:**
1. Generate template with calculations
2. Inspect JSON for savestr
3. Search for formula cells (vtf: lines)

**Expected in SaveStr:**
```
cell:F36:vtf:n:150:SUM(F23\cF35)
cell:F37:vtf:n:15:F36*0.1
cell:F38:vtf:n:165:F36+F37
```

✅ Formulas use `vtf:` format  
✅ Colons are escaped as `\c`  
✅ SUM formulas for subtotal  
✅ Calculation formulas for tax  
✅ Total formula combines values  

---

## 🐛 Debugging Tips

### Console is Your Friend
Open browser console (F12) and watch for:
- 📨 "Received AI response" logs
- ✓ Success indicators
- ❌ Error messages
- ⚠ Warnings

### Check Network Tab
- Look for `/api/generate-invoice` requests
- Verify response status: 200 OK
- Check response body structure
- Look for proper headers

### React DevTools
- Inspect component state
- Check `generatedMscJson` value
- Verify `messages` array
- Check `sessionId` value

### Backend Logs
Watch backend console for:
```
==============================================================
TEMPLATE GENERATION PIPELINE STARTED
==============================================================
[Step 1/4] Generating Cell Mappings...
[Step 2/4] Generating SaveStr...
[Step 3/4] Validating...
[Step 4/4] Response Assembly...
TEMPLATE GENERATION COMPLETED
==============================================================
```

---

## 📊 Success Criteria

### ✅ All tests pass if:
- [ ] Templates generate successfully
- [ ] Response structure matches new format
- [ ] Template info card displays correctly
- [ ] Validation status shows properly
- [ ] Cell mappings are present and valid
- [ ] MSC Preview renders spreadsheet
- [ ] JSON output is complete
- [ ] Image upload works
- [ ] Session management works
- [ ] Error handling is graceful
- [ ] Multiple invoices can be managed
- [ ] Copy function works
- [ ] Tab switching works
- [ ] Console shows no critical errors

### ⚠️ Known Issues to Ignore:
- Development mode warnings (React Strict Mode)
- Hot reload messages
- Source map warnings

---

## 🚨 Common Issues & Solutions

### Issue: "Import ... could not be resolved"
**Solution:** Restart TypeScript server in VS Code

### Issue: Response shows old format
**Solution:** 
1. Clear browser cache
2. Restart backend server
3. Hard refresh (Ctrl+Shift+R)

### Issue: Template info card not showing
**Solution:**
1. Check if `generatedMscJson.templateMeta` exists
2. Verify response structure in Network tab
3. Check for TypeScript errors

### Issue: Validation status always shows "valid"
**Solution:**
1. Check backend logs for actual validation
2. Verify `validation` object in response
3. Test with intentionally complex prompts

### Issue: MSC Preview not rendering
**Solution:**
1. Check if `savestr` exists in response
2. Verify savestr format (starts with `version:1.5`)
3. Check console for SocialCalc errors

---

## 🎉 Test Completion Checklist

Once all tests pass:
- [ ] Screenshot template info card for documentation
- [ ] Note any performance observations
- [ ] Document any unexpected behaviors
- [ ] Clear browser storage for fresh start
- [ ] Test in different browsers (Chrome, Firefox, Safari)
- [ ] Test in mobile responsive mode
- [ ] Verify all console logs are informative
- [ ] Ensure no memory leaks (check DevTools Memory tab)

---

## 📚 Next Steps After Testing

1. **Production Build**: `npm run build`
2. **Test Build**: Serve production build locally
3. **Performance**: Check bundle size and load times
4. **Accessibility**: Test keyboard navigation
5. **Mobile**: Test on actual mobile devices
6. **Documentation**: Update user guide with new features

---

**Testing Date:** _____________  
**Tester:** _____________  
**Status:** ⬜ Pass | ⬜ Fail | ⬜ Needs Review  
**Notes:** _____________________________________________

---

Good luck with testing! 🚀
