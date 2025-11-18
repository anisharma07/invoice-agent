# Quick Start Guide - Invoice Cell Editing Agent

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.8+
- Node.js 16+
- Redis server running
- AWS account with Bedrock access

### Step 1: Environment Setup

Create `.env` file in the project root:

```bash
# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Session Configuration
SESSION_EXPIRY_SECONDS=3600
MAX_TOKEN_LIMIT=200000
```

### Step 2: Start Redis

```bash
# Using Docker (recommended)
docker run -d -p 6379:6379 redis:latest

# OR using local Redis
redis-server
```

### Step 3: Start Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

### Step 4: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:5173

### Step 5: Access the Application

1. Open http://localhost:5173 in your browser
2. Click **"📊 Switch to Cell Editor"** button in the header
3. You're now in the Invoice Cell Editing Agent!

## 📝 First Time Usage

### Scenario 1: Extract Data from Invoice Image

1. **Click the 📎 (paperclip) button** to upload an invoice image
2. **Select your invoice** (JPG, PNG, or WebP format)
3. **Type a message**: "Extract all information from this invoice"
4. **Click Send** 📤
5. **View the results** in the right panel with cell addresses and values

### Scenario 2: Update Specific Cells

1. **Type a message** without an image:
   ```
   Update the heading to "Professional Services Invoice" 
   and set invoice number to INV-2025-001
   ```
2. **Click Send** 📤
3. **See the cell updates** instantly:
   ```json
   {
     "B2": "Professional Services Invoice",
     "C18": "INV-2025-001"
   }
   ```

### Scenario 3: Add Line Items

1. **Type a message**:
   ```
   Add three items:
   - Web Development: $1500
   - Consulting: $2000  
   - Testing: $800
   ```
2. **Click Send** 📤
3. **Get cell updates** for all items with correct row numbers

## 🎯 Understanding Cell Mappings

The default cell mapping structure is:

```javascript
{
  sheet1: {
    Heading: "B2",              // Invoice title
    Date: "D20",                // Invoice date
    InvoiceNumber: "C18",       // Invoice number
    
    From: {                     // Sender information
      Name: "C12",
      StreetAddress: "C13",
      CityStateZip: "C14",
      Phone: "C15",
      Email: "C16"
    },
    
    BillTo: {                   // Recipient information
      Name: "C5",
      StreetAddress: "C6",
      CityStateZip: "C7",
      Phone: "C8",
      Email: "C9"
    },
    
    Items: {                    // Line items
      Rows: {
        start: 23,              // First row for items
        end: 35                 // Last row for items
      },
      Columns: {
        Description: "C",       // Column for descriptions
        Amount: "F"             // Column for amounts
      }
    }
  }
}
```

**To view current mappings**: Click "📋 View Cell Mappings" at the bottom right

## 💡 Example Prompts

### Basic Updates
```
Set the heading to "Tax Invoice"
Update invoice number to INV-2025-123
Set today's date
Change company name to "Acme Corporation"
```

### Adding Data
```
Add sender: John Doe, 123 Main St, New York NY 10001
Add recipient: Jane Smith, jane@email.com, 555-1234
Add item: Consulting Services - $2500
```

### Formulas
```
Set the date to today's date (use formula)
Calculate total in cell F35 (sum of F23 to F34)
Add 10% tax calculation
```

### Image Processing
```
Extract all data from this invoice
Read the invoice and fill all fields
Process this invoice image
```

## 📤 Exporting Results

### Copy to Clipboard
1. Click the **"📋 Copy"** button in the top right of the updates panel
2. Paste the JSON into your application

### Download as JSON
1. Click the **"💾 Export"** button
2. File will download as `cell-updates-[timestamp].json`

### Apply to Your Spreadsheet

**For Google Sheets (Apps Script)**:
```javascript
function applyCellUpdates() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var updates = {
    "B2": "Professional Services Invoice",
    "C18": "INV-2025-001"
    // ... more updates
  };
  
  for (var cell in updates) {
    var value = updates[cell];
    if (value.startsWith('=')) {
      sheet.getRange(cell).setFormula(value);
    } else {
      sheet.getRange(cell).setValue(value);
    }
  }
}
```

**For Excel (VBA)**:
```vba
Sub ApplyCellUpdates()
    Range("B2").Value = "Professional Services Invoice"
    Range("C18").Value = "INV-2025-001"
    Range("D20").Formula = "=TODAY()"
End Sub
```

## 🔄 Session Management

### Starting a New Session
- Click **"New Session"** button in the top right
- This clears all conversation history and starts fresh
- Previous cell updates are cleared

### Session Persistence
- Sessions are saved in browser local storage
- Refresh the page to continue where you left off
- Sessions expire after 1 hour of inactivity

### Managing Multiple Sessions
- Each browser tab has its own session
- Use different browsers for multiple simultaneous sessions

## 🐛 Troubleshooting

### "Session expired" Error
**Solution**: Click "New Session" to start fresh

### "Token limit exceeded" Error
**Solution**: You've used too many messages. Start a new session.

### Image Upload Not Working
**Checks**:
- File size < 5MB
- File format is JPG, PNG, or WebP
- Image is a valid invoice document

### No Cell Updates Generated
**Checks**:
- Prompt is clear and specific
- Cell mappings are correct
- Check console for errors (F12)

### Backend Connection Error
**Checks**:
```bash
# Check backend is running
curl http://localhost:8000/api/health

# Check Redis is running
redis-cli ping
```

## 🎨 Customizing Cell Mappings

To use your own cell mapping structure:

1. **Open**: `frontend/src/components/InvoiceEditor.jsx`
2. **Find**: `const [cellMappings, setCellMappings] = useState({...})`
3. **Modify**: Change the mapping to match your spreadsheet structure
4. **Save**: The changes will be reflected immediately

Example custom mapping:
```javascript
const [cellMappings, setCellMappings] = useState({
  mySheet: {
    Title: "A1",
    CustomerName: "B5",
    TotalAmount: "E10",
    LineItems: {
      Rows: { start: 15, end: 25 },
      Columns: {
        Description: "B",
        Quantity: "D",
        Price: "E",
        Total: "F"
      }
    }
  }
});
```

## 📊 API Testing with curl

### Create Session
```bash
curl -X POST http://localhost:8000/api/edit-invoice/session \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Set heading to Test Invoice",
    "cell_mappings": {
      "sheet1": {"Heading": "B2"}
    }
  }'
```

### Continue Editing
```bash
curl -X POST http://localhost:8000/api/edit-invoice/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "prompt": "Update invoice number to INV-001"
  }'
```

### Get Session Info
```bash
curl http://localhost:8000/api/edit-invoice/session/your-session-id
```

## 🔗 Navigation

### Switch Between Views
- **From Generator to Editor**: Click "📊 Switch to Cell Editor"
- **From Editor to Generator**: Click "← Back to Invoice Generator"

### Both agents are independent
- They use separate Redis session managers
- They maintain separate conversation histories
- They don't share session data

## 📚 Next Steps

1. **Read the full documentation**: [INVOICE_EDITING_AGENT_README.md](./INVOICE_EDITING_AGENT_README.md)
2. **Explore API endpoints**: [FRONTEND_API_DOCUMENTATION.md](./FRONTEND_API_DOCUMENTATION.md)
3. **Check the implementation details**: [INVOICE_EDITING_IMPLEMENTATION_SUMMARY.md](./INVOICE_EDITING_IMPLEMENTATION_SUMMARY.md)

## 🎓 Learning Path

1. ✅ **Setup** (You are here!)
2. 📖 **Basic Usage** - Try example prompts
3. 🖼️ **Image Processing** - Upload invoice images
4. 🔧 **Customization** - Modify cell mappings
5. 🚀 **Integration** - Connect to your spreadsheet app

## 🆘 Getting Help

- Check error messages in browser console (F12)
- Review backend logs in terminal
- Verify Redis connection: `redis-cli ping`
- Check AWS credentials are correct
- Ensure model has Bedrock access

## ✅ Quick Checklist

Before starting, ensure:
- [ ] Redis is running
- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 5173
- [ ] AWS credentials are configured
- [ ] .env file is properly set up
- [ ] Browser can access localhost:5173

---

**You're all set! Start editing invoices with AI! 🎉**

Need help? Check the [full documentation](./INVOICE_EDITING_AGENT_README.md) or [troubleshooting guide](./TESTING_GUIDE.md).
