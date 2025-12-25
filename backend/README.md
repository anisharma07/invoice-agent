# SocialCalc AI Agent

Flask backend with Claude AI integration via Amazon Bedrock for intelligent spreadsheet generation and editing.

## Setup

### Backend Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables (already in root `.env`):
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0
```

4. Run the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment (already in `.env.local`):
```env
VITE_API_URL=http://localhost:5000
```

3. Run the development server:
```bash
npm run dev
```

## Usage

### AI Assistant

1. Click the AI Assistant button (🤖) in the bottom-right corner
2. Type your request in natural language:
   - **Generate new**: "Create an invoice with teal theme"
   - **Edit existing**: "Change colors to orange and add borders"
3. The AI will:
   - Understand your intent (generate vs edit)
   - Retrieve relevant templates from the dataset
   - Make intelligent modifications
   - Return only the necessary code changes
4. Review and confirm the changes
5. Changes are applied to your current sheet

### How It Works

1. **Intent Analysis**: Claude analyzes your prompt to determine if you want to generate new content or edit existing content
2. **Keyword Extraction**: Extracts relevant keywords (themes, colors, fonts, document types)
3. **Template Retrieval**: Searches the dataset (`invoice_mapping_full.json`) for the most relevant template
4. **Intelligent Generation**:
   - **Generate Mode**: Uses the best matching template and modifies it
   - **Edit Mode**: Makes minimal changes to your current code
5. **Conversion**: Converts SocialCalc format to JSON format
6. **Application**: Applies changes to the spreadsheet with user confirmation

## API Endpoints

### POST `/api/generate`
Generate or edit SocialCalc code

Request:
```json
{
  "prompt": "Create an invoice with teal theme",
  "current_code": "optional - for editing",
  "mode": "optional - 'generate' or 'edit'"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "savestr": "version:1.5\n...",
    "mode": "generate",
    "reasoning": "Generated from template: invoice, teal theme"
  }
}
```

### POST `/api/convert-to-json`
Convert SocialCalc format to JSON

Request:
```json
{
  "savestr": "version:1.5\n...",
  "sheet_name": "sheet1"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "numsheets": 1,
    "currentid": "sheet1",
    "sheetArr": {...}
  }
}
```

### GET `/api/health`
Health check endpoint

## Architecture

```
Frontend (React + Vite)
    ↓ HTTP Request
Flask Backend
    ↓
Agent (agent.py)
    ↓
Claude via Amazon Bedrock
    ↓
DataStore (datastore.py)
    ↓
Template Database (invoice_mapping_full.json)
```

## Features

- ✅ Natural language understanding
- ✅ Automatic mode detection (generate vs edit)
- ✅ Template-based generation
- ✅ Intelligent code editing
- ✅ Keyword matching
- ✅ User confirmation before applying changes
- ✅ Auto-save after changes
- ✅ Error handling and validation

## Development

### Adding New Templates

Add new templates to `invoice_mapping_full.json`:
```json
{
  "description with keywords": "version:1.5\ncell:A1:t:Hello\n..."
}
```

### Customizing the Agent

Edit `backend/agent.py` to customize:
- Intent analysis prompts
- Generation/editing logic
- Temperature and token limits
- Syntax reference

## Troubleshooting

**Backend won't start:**
- Check AWS credentials in `.env`
- Ensure boto3 is installed
- Verify Python version (3.8+)

**Frontend can't connect:**
- Check `VITE_API_URL` in `.env.local`
- Ensure Flask backend is running
- Check CORS settings in `app.py`

**AI generates incorrect code:**
- Check `SYNTAX-COMPILED.txt` reference
- Adjust temperature in `agent.py`
- Improve template matching in `datastore.py`
