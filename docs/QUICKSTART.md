# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `boto3` - AWS SDK
- `langchain` - LLM framework
- `langchain-aws` - Bedrock integration

### Step 2: Configure AWS

Choose one method:

**Method A: AWS CLI (Recommended)**
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (us-east-1)

**Method B: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION="us-east-1"
```

### Step 3: Enable Claude in Bedrock

1. Go to AWS Bedrock Console
2. Navigate to "Model access"
3. Click "Edit" and enable "Claude 3.5 Sonnet"
4. Wait for approval (usually instant)

### Step 4: Test Setup

```bash
python test_setup.py
```

You should see all tests pass ✓

### Step 5: Run Your First Generation

**Option A: Interactive Mode**
```bash
python spreadsheet_agent.py
```
Then choose option 1 and describe your spreadsheet.

**Option B: Demo Mode**
```bash
python demo.py
```
Select a demo (1-5) to see examples.

**Option C: Python Code**
```python
from spreadsheet_agent import SpreadsheetAgent

agent = SpreadsheetAgent()

# Generate invoice
msc = agent.generate_spreadsheet("Create a simple invoice with 3 items")
print(msc)

# Save to file
agent.save_to_file(msc, "my_invoice.msc")
```

## 📝 Example Usage

### Simple Invoice
```python
agent = SpreadsheetAgent()

description = """
Create an invoice for "ABC Company" with:
- Invoice number INV-001
- Date with TODAY() function
- 3 line items with product, qty, price
- Calculate totals with formulas
"""

msc_code = agent.generate_spreadsheet(description)
agent.save_to_file(msc_code, "invoice.msc")
```

### Monthly Budget
```python
description = """
Create a monthly budget with:
- Income section (salary $5000)
- Expenses (rent, food, utilities)
- Calculate total expenses
- Show remaining balance
- Use green for positive, red for negative
"""

msc_code = agent.generate_spreadsheet(description)
```

### Medical Invoice
```python
description = """
Create a medical invoice with:
- Clinic header
- Patient details
- Services table (consultation, tests, procedures)
- Insurance calculation (80% coverage)
- Patient copay (20%)
"""

msc_code = agent.generate_spreadsheet(description)
```

## 🔧 Correction Example

```python
# Broken code (missing version, undefined references)
broken = """
cell:A1:t:Hello:f:1
cell:A2:v:100
sheet:c:2:r:2
"""

# Correct it
corrected = agent.correct_spreadsheet(broken)
print(corrected)
```

## ✅ Validation Example

```python
validation = agent.validate_msc(msc_code)

if validation["valid"]:
    print("✓ Valid MSC syntax")
else:
    print("Issues found:")
    for issue in validation["issues"]:
        print(f"  - {issue}")
```

## 🎯 Tips for Better Results

1. **Be Specific**: Include details like column names, formulas, styling
2. **Use Examples**: Reference training examples in your description
3. **Mention Formulas**: Explicitly request SUM, AVERAGE, TODAY, etc.
4. **Request Styling**: Ask for colors, borders, fonts for professional look
5. **Specify Layout**: Mention merged cells, sections, headers

## 📊 MSC Syntax Cheat Sheet

### Basic Cell
```msc
cell:A1:t:Hello World
```

### Cell with Number
```msc
cell:A2:v:100
```

### Cell with Formula
```msc
cell:A3:vtf:n:200:A1+A2
```

### Cell with Styling
```msc
cell:A1:t:Title:f:1:cf:2:bg:1
font:1:normal bold 16pt Arial
cellformat:2:center
color:1:rgb(255,0,0)
```

### Merged Cell
```msc
cell:A1:t:Header:colspan:3:rowspan:2
```

### Sheet Definition
```msc
sheet:c:5:r:10
```

## 🆘 Common Issues

**Error: "Could not connect to Bedrock"**
- Run `aws configure` to set credentials
- Check region is us-east-1
- Verify Bedrock is enabled

**Error: "Import langchain failed"**
- Run `pip install -r requirements.txt`

**Validation Error: "Undefined font ID"**
- Use `agent.correct_spreadsheet()` to fix
- Agent should auto-correct this

**Empty Output**
- Make description more specific
- Check AWS credentials are valid
- Verify Bedrock model access

## 📚 Resources

- Training Examples: See `training.jsonl`
- Full Documentation: See `README.md`
- AWS Bedrock: https://aws.amazon.com/bedrock/
- LangChain Docs: https://python.langchain.com/

## 🎉 Success Checklist

- [ ] Dependencies installed
- [ ] AWS configured
- [ ] Claude enabled in Bedrock
- [ ] Test script passes
- [ ] First spreadsheet generated
- [ ] Output saved to file

**Ready to build amazing spreadsheets! 🚀**
