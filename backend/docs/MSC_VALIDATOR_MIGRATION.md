# MSC Validator Integration - Migration Guide

## Overview

The backend invoice generation system has been migrated from using the Python `msc_parser` module to using the JavaScript SocialCalc validator for MSC format validation. This provides more comprehensive validation with three levels: Syntax, Semantic, and Logic validation.

## What Changed

### Files Modified

1. **`backend/app/services/invoice_agent.py`**
   - Replaced `from .msc_parser import MSCParser, MSCCorrector, create_invoice_msc`
   - With `from .msc_validator import MSCValidator, create_invoice_msc`
   - Updated `__init__()` to use `MSCValidator()` instead of `MSCParser()` and `MSCCorrector()`
   - Updated validation calls in `generate_invoice_with_msc()` and `edit_invoice_with_msc()`

### Files Created

1. **`backend/app/services/msc_validator.py`**
   - New Python wrapper for the JavaScript validator
   - Provides `MSCValidator` class for validation
   - Maintains backward compatibility with `create_invoice_msc()` function
   - Implements `validate_with_corrections()` for iterative validation

### Files Deprecated

1. **`backend/app/services/msc_parser.py`**
   - Still available but no longer used
   - Can be removed in future cleanup

## New Architecture

```
┌─────────────────────────────────────┐
│   Invoice Agent (Python)            │
│                                     │
│  - generate_invoice_with_msc()     │
│  - edit_invoice_with_msc()         │
└──────────────┬──────────────────────┘
               │
               │ Uses
               ▼
┌─────────────────────────────────────┐
│   MSC Validator (Python Wrapper)   │
│                                     │
│  - validate()                       │
│  - validate_with_corrections()     │
│  - create_invoice_msc()            │
└──────────────┬──────────────────────┘
               │
               │ Calls via subprocess
               ▼
┌─────────────────────────────────────┐
│  JavaScript Validator (Node.js)     │
│                                     │
│  Location:                          │
│  backend/msc_validator/             │
│  - validate-cli.js                  │
│  - validator.js                     │
└─────────────────────────────────────┘
```

## API Reference

### MSCValidator Class

#### `__init__()`
Initialize the validator. Automatically finds the JavaScript validator in the project structure.

```python
from app.services.msc_validator import MSCValidator

validator = MSCValidator()
```

#### `validate(msc_content, level='all', strict=False) -> Dict`
Validate MSC content and return detailed results.

**Parameters:**
- `msc_content` (str): MSC format string to validate
- `level` (str): Validation level - '1' (Syntax), '2' (Syntax+Semantic), '3' or 'all' (All levels)
- `strict` (bool): Treat warnings as errors

**Returns:**
Dictionary with:
- `valid` (bool): Whether validation passed
- `errors` (list): List of error objects
- `warnings` (list): List of warning objects
- `errorCount` (int): Number of errors
- `warningCount` (int): Number of warnings
- `stats` (dict): Validation statistics
- `cells` (int): Number of cells found
- `formulas` (int): Number of formulas found

**Example:**
```python
result = validator.validate(msc_content, level="all")
if result['valid']:
    print("✅ Valid MSC!")
else:
    for error in result['errors']:
        print(f"Line {error['line']}: {error['message']}")
```

#### `validate_with_corrections(msc_content, max_iterations=3) -> Tuple[str, bool, List[str]]`
Validate and attempt to auto-correct common issues.

**Parameters:**
- `msc_content` (str): MSC format string
- `max_iterations` (int): Maximum correction attempts

**Returns:**
Tuple of:
- `corrected_content` (str): Potentially corrected MSC content
- `is_valid` (bool): Whether validation succeeded
- `messages` (list): Correction messages or error messages

**Example:**
```python
corrected_msc, is_valid, messages = validator.validate_with_corrections(msc_content)
if is_valid:
    print(f"✅ Corrected! Applied: {messages}")
else:
    print(f"❌ Failed: {messages}")
```

### create_invoice_msc Function

Create MSC format from invoice data dictionary.

```python
from app.services.msc_validator import create_invoice_msc

invoice_data = {
    "invoice_number": "INV-001",
    "date": "2025-01-15",
    # ... other fields
}

msc_content = create_invoice_msc(invoice_data)
```

## Usage in Invoice Agent

The invoice agent methods now automatically use the JavaScript validator:

```python
from app.services.invoice_agent import InvoiceAgent

agent = InvoiceAgent()

# Generate invoice with MSC validation
response_text, invoice_data, msc_content = agent.generate_invoice_with_msc(
    prompt="Create an invoice for web development services",
    conversation_history=[]
)

# The msc_content is automatically validated and corrected
```

## Validation Levels

The JavaScript validator provides three levels of validation:

### Level 1: Syntax Validation
- Basic format checking
- Line structure validation
- Cell reference format
- Style definition syntax

### Level 2: Semantic Validation (includes Level 1)
- Style reference validation
- Cell attribute validation
- Formula syntax checking
- Range validation

### Level 3: Logic Validation (includes Levels 1 & 2)
- Cell reference existence
- Circular reference detection
- Range boundary validation
- Formula dependency checking

## Benefits of JavaScript Validator

1. **Comprehensive Validation**: Three-level validation catches more issues
2. **Better Error Messages**: Detailed line-by-line error reporting
3. **Standards Compliance**: Based on official SocialCalc save format specification
4. **Proven Reliability**: Extensively tested with training data
5. **Future-Proof**: Maintained alongside the SocialCalc renderer

## Testing

### Run Standalone Test
```bash
cd backend
python3 test_validator_standalone.py
```

Expected output:
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

## Requirements

1. **Node.js**: Must be installed and available in PATH
2. **JavaScript Validator**: Located at `socialcalc-validator/validate-cli.js`
3. **Python 3.7+**: For subprocess support

## Error Handling

The validator gracefully handles errors:

```python
try:
    result = validator.validate(msc_content)
except Exception as e:
    print(f"Validation error: {e}")
    # System-level error (e.g., Node.js not found)
```

## Migration Notes

### For Developers

If you were using `MSCParser` or `MSCCorrector` directly:

**Before:**
```python
from app.services.msc_parser import MSCParser, MSCCorrector

parser = MSCParser()
corrector = MSCCorrector()

# Parse
parsed = parser.parse(msc_content)

# Validate and correct
corrected, corrections = corrector.correct(msc_content)
```

**After:**
```python
from app.services.msc_validator import MSCValidator

validator = MSCValidator()

# Validate
result = validator.validate(msc_content)

# Validate with corrections
corrected, is_valid, messages = validator.validate_with_corrections(msc_content)
```

### API Compatibility

The `create_invoice_msc()` function maintains the exact same signature and behavior, so no changes are needed for code that only uses this function.

## Troubleshooting

### "JavaScript validator not found"
- Ensure the `backend/msc_validator` directory exists
- Check that `validate-cli.js` and `validator.js` are present
- Verify the path structure: `backend/msc_validator/validate-cli.js`

### "node: command not found"
- Install Node.js: `sudo apt install nodejs` (Ubuntu/Debian)
- Or download from: https://nodejs.org/

### "Validation timeout"
- Check if Node.js is working: `node --version`
- Verify validator script is executable
- Check for very large MSC content (>10MB)

### Subprocess errors
- Ensure proper file permissions
- Check Python subprocess module is available
- Verify working directory is correct

## Future Enhancements

Potential improvements:

1. **Caching**: Cache validation results for unchanged content
2. **Async Validation**: Use async subprocess for better performance
3. **Batch Validation**: Validate multiple files in one call
4. **Custom Rules**: Add project-specific validation rules
5. **Performance Metrics**: Track validation performance

## Support

For issues related to:
- **Validator Integration**: Check `backend/app/services/msc_validator.py`
- **JavaScript Validator**: Check `socialcalc-validator/README-VALIDATOR.md`
- **Invoice Generation**: Check `backend/app/services/invoice_agent.py`

## Version History

- **v1.0** (2025-01-15): Initial migration from Python parser to JavaScript validator
