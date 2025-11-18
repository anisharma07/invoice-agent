# Spreadsheet Generation & Correction Agent

An AI-powered agent that generates and corrects spreadsheets in MSC (Multi-Sheet Calc) syntax using **Claude Sonnet 3.5** via **Amazon Bedrock**. The agent is trained on comprehensive examples from `training.jsonl` covering medical invoices, business documents, and complex calculations.

## Features

- 🤖 **AI-Powered Generation**: Generate spreadsheets from natural language descriptions
- 🔧 **Error Correction**: Automatically fix syntax errors in MSC code
- ✅ **Validation**: Built-in syntax validation with detailed error reporting
- 📚 **Training-Based**: Learns from extensive real-world examples
- 💾 **File Management**: Save and load MSC files
- 🎯 **Formula Support**: Handles complex formulas (SUM, AVERAGE, TODAY, etc.)

## MSC Syntax Overview

MSC (Multi-Sheet Calc) is a plain-text spreadsheet format with the following structure:

```msc
version:1.5
cell:A1:t:Hello World:f:1:cf:2
cell:A2:v:100
cell:A3:vtf:n:200:A2*2
sheet:c:3:r:3
font:1:normal bold 14pt Arial,Helvetica,sans-serif
cellformat:2:center
```

### Key Components:
- **Cells**: `cell:<ID>:<properties>`
- **Formulas**: `vtf:n:<value>:<formula>`
- **Styling**: Font, colors, borders, alignment
- **Merging**: `colspan` and `rowspan`
- **Functions**: SUM(), AVERAGE(), TODAY(), IF(), etc.

## Prerequisites

1. **AWS Account** with Amazon Bedrock access
2. **Claude Sonnet 3.5** model enabled in your AWS region
3. **Python 3.8+**
4. **AWS Credentials** configured

## Installation

### 1. Clone or navigate to the project directory

```bash
cd "/home/anirudh-sharma/Desktop/SocialCalc Stuff/Starknet/Langchain-Claude-Agent"
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure AWS credentials

Option A - Use AWS CLI:
```bash
aws configure
```

Option B - Set environment variables:
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
```

Option C - Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your credentials
```

## Usage

### Interactive Mode

Run the main agent with interactive menu:

```bash
python spreadsheet_agent.py
```

Options:
1. Generate new spreadsheet
2. Correct existing spreadsheet
3. Validate MSC syntax
4. Exit

### Demo Scripts

Run demonstration examples:

```bash
python demo.py
```

Available demos:
1. Simple Invoice
2. Monthly Budget
3. Correct Broken Code
4. Medical Invoice
5. Run All Demos

### Python API

```python
from spreadsheet_agent import SpreadsheetAgent

# Initialize agent
agent = SpreadsheetAgent()

# Generate spreadsheet
description = "Create an invoice with 3 items and calculate total"
msc_code = agent.generate_spreadsheet(description)

# Correct spreadsheet
broken_code = "cell:A1:t:Hello"  # Missing version and sheet
corrected = agent.correct_spreadsheet(broken_code)

# Validate syntax
validation = agent.validate_msc(msc_code)
if validation["valid"]:
    print("Valid!")
else:
    print("Issues:", validation["issues"])

# Save to file
agent.save_to_file(msc_code, "output.msc")
```

## Example Generations

### Simple Invoice

**Prompt:**
```
Create an invoice with company name, 3 items with prices, and calculate total
```

**Output:**
```msc
version:1.5
cell:A1:t:Tech Solutions:f:1:cf:2
cell:A3:t:Item:f:2:b:1:1:1:1
cell:B3:t:Quantity:f:2:b:1:1:1:1
cell:C3:t:Price:f:2:b:1:1:1:1
cell:D3:t:Total:f:2:b:1:1:1:1
cell:A4:t:Laptop
cell:B4:v:2
cell:C4:v:1200:ntvf:1
cell:D4:vtf:n:2400:B4*C4:ntvf:1
...
cell:D7:vtf:n:2700:SUM(D4\cD6):ntvf:1:f:3
sheet:c:4:r:7
font:1:normal bold 18pt Arial
font:2:normal bold 11pt Arial
font:3:normal bold 14pt Arial
cellformat:2:center
border:1:1px solid rgb(0,0,0)
valueformat:1:$#,##0.00
```

### Medical Invoice

**Prompt:**
```
Create a medical clinic invoice with patient details, services table with consultation, tests, and insurance calculations
```

The agent generates complete professional invoices with:
- Header with clinic name
- Patient information section
- Itemized services with CPT codes
- Formula-based calculations
- Insurance and co-pay breakdown
- Professional styling and borders

## Training Data

The agent is trained on **comprehensive examples** from `training.jsonl` including:

- **Medical Invoices**: Hospital, dental, pharmacy, radiology, orthopedic
- **Business Documents**: Invoices, budgets, reports
- **Complex Layouts**: Merged cells, multiple sections, conditional formatting
- **Advanced Formulas**: SUM, AVERAGE, IF, VLOOKUP, date functions
- **Styling**: Fonts, colors, borders, alignments

## Architecture

```
┌─────────────────────────────────────┐
│   User Input (Natural Language)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     SpreadsheetAgent                │
│  - Load training examples            │
│  - Create system prompt              │
│  - Initialize LangChain              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Amazon Bedrock (Claude Sonnet)    │
│  - Model: claude-3-5-sonnet          │
│  - Temperature: 0.3                  │
│  - Max tokens: 8000                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   MSC Syntax Generator               │
│  - Parse requirements                │
│  - Generate cells & formulas         │
│  - Apply styling                     │
│  - Validate output                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   MSC Code Output                    │
│  - version:1.5                       │
│  - cell definitions                  │
│  - sheet definition                  │
│  - style definitions                 │
└─────────────────────────────────────┘
```

## Configuration

### AWS Region
Default: `us-east-1`

Change in code:
```python
agent = SpreadsheetAgent(region_name="us-west-2")
```

### Model Parameters
- **Temperature**: 0.3 (deterministic, consistent output)
- **Max Tokens**: 8000 (handles complex spreadsheets)
- **Top P**: 0.9 (balanced creativity)

Modify in `_initialize_llm()`:
```python
model_kwargs={
    "temperature": 0.3,
    "max_tokens": 8000,
    "top_p": 0.9
}
```

## Troubleshooting

### Error: "Could not connect to Bedrock"
- Verify AWS credentials are configured
- Check Bedrock service is available in your region
- Ensure Claude Sonnet 3.5 model is enabled

### Error: "Undefined font/color IDs"
- The agent should auto-correct this
- Try running correction: `agent.correct_spreadsheet(code)`

### Validation Issues
- Use `agent.validate_msc(code)` to identify problems
- Check that version line is first
- Verify sheet definition is present

## File Structure

```
Langchain-Claude-Agent/
├── training.jsonl          # Training examples (MSC syntax)
├── spreadsheet_agent.py    # Main agent class
├── demo.py                 # Demonstration scripts
├── requirements.txt        # Python dependencies
├── .env.example           # AWS configuration template
└── README.md              # This file
```

## Contributing

To add more training examples to `training.jsonl`:

```jsonl
{"messages":[{"role":"user","content":"Your description"},{"role":"assistant","content":"MSC code"}]}
```

## License

MIT License

## Support

For issues or questions:
1. Check validation output: `agent.validate_msc(code)`
2. Try correction: `agent.correct_spreadsheet(code, "describe issue")`
3. Review training examples in `training.jsonl`

## Credits

- **Model**: Anthropic Claude Sonnet 3.5
- **Platform**: Amazon Bedrock
- **Framework**: LangChain
- **Syntax**: MSC (Multi-Sheet Calc)

---

**Built with ❤️ using Claude Sonnet 3.5 via Amazon Bedrock**
