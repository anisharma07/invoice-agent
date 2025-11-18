# 🚀 QUICK REFERENCE CARD

## ⚡ 30-Second Start

```bash
# Terminal 1: Backend
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend  
cd frontend && npm run dev

# Browser: http://localhost:5173/ → Click "AI Invoice Editor"
```

---

## 📋 Essential Commands

### Testing
```bash
# Backend tests
cd backend && python -m app.services.test_template_agent

# Frontend tests
# Follow: FRONTEND_TESTING_GUIDE.md
```

### Debugging
```bash
# Check backend
curl http://localhost:8000/health

# Check Redis
redis-cli ping

# View logs
tail -f backend/logs/app.log
```

---

## 📁 Critical Files

### Backend Core
```
backend/app/services/
├── meta_cellmap_agent.py         # Cell mapping generation
├── savestr_agent.py               # MSC format conversion
└── template_generation_agent.py   # Main orchestrator
```

### Frontend Core
```
frontend/src/
├── services/aiService.ts          # API + TypeScript interfaces
├── pages/InvoiceAIPage.tsx        # Main UI component
└── pages/InvoiceAIPage.css        # Styling
```

---

## 🎯 Quick Test (1 Min)

1. **Prompt:** `Create professional tax invoice for tablet`
2. **Expect:**
   - ✅ Blue gradient template card
   - ✅ Two badges: [tax_invoice] [tablet]
   - ✅ Validation: "✓ Template validated successfully"
   - ✅ MSC preview showing invoice
   - ✅ JSON with templateMeta, cellMappings, validation

---

## 📊 Response Structure

```json
{
  "session_id": "...",
  "assistantResponse": {
    "text": "User-friendly message",
    "savestr": "version:1.5\ncell:...",
    "cellMappings": { "text": { "sheet1": {...} } },
    "templateMeta": { "name": "...", "category": "...", "deviceType": "..." }
  },
  "validation": { "is_valid": true, "attempts": 2, "final_errors": [] },
  "token_count": 1234
}
```

---

## 🔄 System Flow

```
Prompt → MetaAndCellMap → SaveStr → Validation Loop → Response
         (temp 0.8)       (temp 0.3)  (max 5 retries)
```

---

## 🛠️ Common Issues

| Issue | Solution |
|-------|----------|
| Port 8000 in use | `lsof -i :8000` then `kill -9 <PID>` |
| AWS credentials | `export AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..."` |
| Redis error | `redis-server` or `redis-cli ping` |
| Template card missing | Check console, verify `templateMeta` in response |
| Validation fails | Check `final_errors` in response |

---

## 📚 Documentation Map

```
START_HERE.md                          ← Main entry point
├── FRONTEND_TESTING_GUIDE.md          ← 12 test cases
├── SYSTEM_ARCHITECTURE_VISUAL.md      ← Visual diagrams
├── FINAL_IMPLEMENTATION_SUMMARY.md    ← Complete summary
└── backend/docs/
    └── TEMPLATE_GENERATION_ARCHITECTURE.md  ← Full architecture
```

---

## ✅ Success Checklist

```
□ Backend starts on :8000
□ Frontend starts on :5173
□ Can enter prompt and send
□ Template info card appears
□ MSC preview renders
□ JSON shows complete structure
□ Can edit template
□ Can generate multiple invoices
□ Validation status displays
```

---

## 🎯 Test Priorities

1. **Critical:** Basic generation works
2. **High:** Image upload works
3. **Medium:** Device optimization works
4. **Low:** Edge cases handled

---

## 📞 Help Resources

- **Testing:** `FRONTEND_TESTING_GUIDE.md`
- **Architecture:** `backend/docs/TEMPLATE_GENERATION_ARCHITECTURE.md`
- **Visual:** `SYSTEM_ARCHITECTURE_VISUAL.md`
- **Summary:** `FINAL_IMPLEMENTATION_SUMMARY.md`

---

## 🎓 Key Concepts

- **MetaAndCellMap:** High creativity (0.8) for template design
- **SaveStr:** Low temp (0.3) for format precision
- **Validation Loop:** Max 5 retries with error correction
- **Cell Mappings:** Structured coordinates for direct editing
- **Template Meta:** Rich metadata for organization

---

## 💡 Pro Tips

1. Check browser DevTools Console for detailed logs
2. Use `📨`, `✓`, `❌` emojis to find log entries
3. Validation errors show in `final_errors` array
4. Formula escaping: use `\c` for colons (e.g., `SUM(A1\cA10)`)
5. Template names are creative, not generic

---

**Status:** 🟢 READY FOR TESTING

**Next:** Run tests from [`START_HERE.md`](./START_HERE.md)
