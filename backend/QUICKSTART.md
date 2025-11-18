# Quick Start: Using the JavaScript MSC Validator

## Prerequisites

Ensure Node.js is installed:
```bash
node --version  # Should show v14+ or higher
```

If not installed:
```bash
# Ubuntu/Debian
sudo apt install nodejs

# macOS
brew install node

# Or download from https://nodejs.org/
```

## Verify Installation

Test the validator directly:
```bash
cd backend/msc_validator
node validate-cli.js --string "version:1.5\ncell:A1:v:100"
```

Expected output:
```
✅ VALID - File is valid and can be loaded.
```

## Use in Python Code

### Basic Validation

```python
from app.services.msc_validator import MSCValidator

validator = MSCValidator()

# Your MSC content
msc_content = """version:1.5
cell:A1:v:100
cell:A2:v:200
cell:A3:vtf:n:SUM(A1:A2)
sheet:c:3:r:3"""

# Validate
result = validator.validate(msc_content)

if result['valid']:
    print("✅ Valid MSC!")
else:
    print("❌ Invalid MSC")
    for error in result['errors']:
        print(f"  Line {error['line']}: {error['message']}")
```

### Validation with Auto-Correction

```python
from app.services.msc_validator import MSCValidator

validator = MSCValidator()

# MSC with potential issues
msc_content = """cell:A1:v:100
cell:A2:v:200"""

# Validate and attempt to fix
corrected, is_valid, messages = validator.validate_with_corrections(msc_content)

if is_valid:
    print(f"✅ Corrected successfully!")
    print(f"Changes: {messages}")
    print(f"Result:\n{corrected}")
else:
    print(f"❌ Could not fix: {messages}")
```

### Generate Invoice MSC

```python
from app.services.msc_validator import create_invoice_msc

invoice_data = {
    "invoice_number": "INV-001",
    "date": "2025-01-15",
    "due_date": "2025-02-15",
    "from": {
        "name": "Acme Corp",
        "company": "Acme Corporation",
        "address": "123 Business St"
    },
    "to": {
        "name": "Client Name",
        "company": "Client Co",
        "address": "456 Client Ave"
    },
    "items": [
        {
            "description": "Web Development",
            "quantity": 10,
            "unit_price": 150.00,
            "amount": 1500.00
        }
    ],
    "subtotal": 1500.00,
    "tax_rate": 10.0,
    "tax_amount": 150.00,
    "total": 1650.00,
    "notes": "Net 30"
}

msc_content = create_invoice_msc(invoice_data)
print(msc_content)
```

### Use in Invoice Agent

```python
from app.services.invoice_agent import InvoiceAgent

agent = InvoiceAgent()

# Generate invoice with automatic MSC validation
response_text, invoice_data, msc_content = agent.generate_invoice_with_msc(
    prompt="Create an invoice for web development services, $1500"
)

print(f"Response: {response_text}")
print(f"MSC validated: {'Yes' if msc_content else 'No'}")
```

## Run Tests

### Quick Test
```bash
cd backend
python3 test_validator_standalone.py
```

### Expected Output
```
================================================================================
MSC VALIDATOR INTEGRATION TEST
================================================================================

📝 Step 1: Generating MSC content from invoice data...
✅ MSC content generated
   Lines: 44

🔍 Step 2: Validating MSC with JavaScript validator...

✅ Validation Result: VALID
   Errors: 0
   Warnings: 0

📊 Statistics:
   Lines processed: 44
   Syntax checks: 44
   Semantic checks: 35
   Logic checks: 0

================================================================================
✅ TEST PASSED - MSC validation successful!
================================================================================
```

## Validation Levels

Choose the validation level based on your needs:

```python
# Level 1: Syntax only (fastest)
result = validator.validate(msc_content, level="1")

# Level 2: Syntax + Semantic
result = validator.validate(msc_content, level="2")

# Level 3: All levels (recommended)
result = validator.validate(msc_content, level="all")
```

## Understanding Results

```python
result = validator.validate(msc_content)

# Check validity
result['valid']  # bool: True if valid

# Error details
result['errors']  # list of errors
result['errorCount']  # int: number of errors

# Warning details
result['warnings']  # list of warnings
result['warningCount']  # int: number of warnings

# Statistics
result['stats']['linesProcessed']  # lines validated
result['stats']['syntaxChecks']  # syntax checks performed
result['stats']['semanticChecks']  # semantic checks performed
result['stats']['logicChecks']  # logic checks performed

# Cell information
result['cells']  # number of cells found
result['formulas']  # number of formulas found
```

## Common Error Messages

### "JavaScript validator not found"
**Solution:**
```bash
# Check if validator exists
ls backend/msc_validator/validate-cli.js
ls backend/msc_validator/validator.js

# All validator files should be in backend/msc_validator/
```

### "node: command not found"
**Solution:**
```bash
# Install Node.js
sudo apt install nodejs  # Ubuntu/Debian
brew install node        # macOS
```

### "Validation timeout"
**Solution:**
- Check if MSC content is too large (>1MB)
- Verify Node.js is working: `node --version`
- Increase timeout in `msc_validator.py` if needed

## Tips

1. **Always validate** - Use validation before saving MSC content
2. **Use auto-correction** - Let the validator fix common issues
3. **Check warnings** - Warnings indicate potential issues
4. **Test with real data** - Validate with actual invoice data
5. **Keep Node.js updated** - Use Node.js v14 or higher

## Next Steps

- Read `docs/MSC_VALIDATOR_MIGRATION.md` for complete API reference
- Check `docs/BEFORE_AFTER_COMPARISON.md` for feature comparison
- See `msc_validator/README.md` for validator details

## Support

For issues:
1. Check error message and line number
2. Verify MSC content format
3. Test with `validate-cli.js` directly
4. Review validator documentation

## Example: Complete Flow

```python
from app.services.msc_validator import MSCValidator, create_invoice_msc

# 1. Create invoice data
invoice_data = {
    "invoice_number": "INV-001",
    "date": "2025-01-15",
    "items": [{"description": "Service", "quantity": 1, "unit_price": 100, "amount": 100}],
    "subtotal": 100, "tax_rate": 10, "tax_amount": 10, "total": 110
}

# 2. Generate MSC
msc_content = create_invoice_msc(invoice_data)

# 3. Validate
validator = MSCValidator()
corrected, is_valid, messages = validator.validate_with_corrections(msc_content)

# 4. Use result
if is_valid:
    print("✅ Ready to save!")
    with open("invoice.msc", "w") as f:
        f.write(corrected)
else:
    print(f"❌ Errors: {messages}")
```

That's it! You're now using the comprehensive JavaScript validator for MSC validation. 🎉
