# MSC Validator (JavaScript)

This directory contains the JavaScript SocialCalc validator files copied from the main `socialcalc-validator` directory for backend use.

## Files

- **`validator.js`** - Core validator class with 3-level validation
- **`validate-cli.js`** - Command-line interface for the validator

## Usage from Python

The Python wrapper (`app/services/msc_validator.py`) automatically uses these files:

```python
from app.services.msc_validator import MSCValidator

validator = MSCValidator()
result = validator.validate(msc_content)
```

## Direct CLI Usage

You can also use the validator directly from command line:

```bash
cd msc_validator
node validate-cli.js --string "version:1.5\ncell:A1:v:100"
```

## Validation Levels

1. **Level 1 (Syntax)**: Basic format and structure validation
2. **Level 2 (Semantic)**: Style references, cell attributes, formulas
3. **Level 3 (Logic)**: Cell dependencies, circular references, ranges

## Integration

This validator is integrated into the backend via the Python wrapper at:
- `app/services/msc_validator.py` - Python wrapper
- `app/services/invoice_agent.py` - Invoice generation with validation

## Maintenance

These files are copies from `../socialcalc-validator/`. If the validator is updated there, these copies should be updated as well.

## Requirements

- Node.js v14 or higher
