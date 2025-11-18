# SocialCalc Save Format Validator

A comprehensive, multi-level validator for SocialCalc (MSC) save format files with proper error messages and detailed logging.

## Features

✅ **Three Validation Levels**
- **Level 1: Syntax** - Line format, coordinate validation, attribute syntax
- **Level 2: Semantic** - Style cross-references, formula syntax, value types
- **Level 3: Logic** - Circular references, cell dependencies, range validity

✅ **Comprehensive Error Reporting**
- Clear error messages with line numbers
- Warnings for non-critical issues
- Validation statistics and summary

✅ **Flexible Testing**
- Test individual levels or all together
- Verbose logging option
- Strict mode (warnings → errors)

## Installation

No installation needed! Just ensure you have Node.js installed.

```bash
# Check Node.js version (requires Node.js 12+)
node --version
```

## Quick Start

### 1. Run the Test Suite

```bash
# Run all tests with detailed output
node test-validator.js
```

This will run 70+ tests across all validation levels and show you which pass/fail.

### 2. Validate a File

```bash
# Validate with all levels
node validate-cli.js example-valid.msc

# Validate with verbose output
node validate-cli.js --verbose example-valid.msc

# Validate syntax only (Level 1)
node validate-cli.js --level 1 example-valid.msc

# Validate syntax + semantic (Level 2)
node validate-cli.js --level 2 example-valid.msc

# Validate all levels (Level 3)
node validate-cli.js --level 3 example-valid.msc
```

### 3. Validate a String

```bash
# Validate string content
node validate-cli.js --string "version:1.5\ncell:A1:v:10"
```

### 4. Use in Your Code

```javascript
const SocialCalcValidator = require('./validator.js');

// Create validator with options
const validator = new SocialCalcValidator({
    enableSyntaxLevel: true,    // Level 1
    enableSemanticLevel: true,  // Level 2
    enableLogicLevel: true,     // Level 3
    verbose: true,              // Show detailed logs
    strictMode: false,          // Warnings as errors?
    maxErrors: 100              // Stop after N errors
});

// Validate MSC content
const mscContent = `version:1.5
cell:A1:v:10
cell:A2:v:20
cell:A3:vtf:n:30:A1+A2
`;

const result = validator.validate(mscContent);

console.log('Valid:', result.valid);
console.log('Errors:', result.errorCount);
console.log('Warnings:', result.warningCount);

// Access detailed results
result.errors.forEach(err => {
    console.log(`Line ${err.line} [${err.level}]: ${err.message}`);
});
```

## Validation Levels Explained

### Level 1: Syntax Validation (MUST DO)

**What it checks:**
- Version line format and position
- Cell coordinate format (A1, B5, AA10, etc.)
- Attribute syntax (key:value pairs)
- Value types (numeric, text, formula)
- Style definition formats (font, color, border, etc.)
- Required vs optional fields

**Example errors:**
```
Line 1: First line must be version declaration
Line 5: Invalid cell coordinate '1A'. Expected format: A1, B5, AA10
Line 8: Cell A1: attribute 'v' must be numeric, got 'abc'
Line 12: Font style must be 'normal', 'italic', or '*', got 'oblique'
```

**Test syntax level only:**
```bash
node validate-cli.js --level 1 myfile.msc
```

### Level 2: Semantic Validation (SHOULD DO)

**What it checks:**
- Style references exist (font:1 → font definition exists)
- Cross-references between cells and styles
- Formula basic syntax (parentheses balance, known functions)
- Value type correctness

**Example errors:**
```
Line 10: Cell A1: font 5 not defined. Add 'font:5:...' line
Line 15: Cell B2: color 99 not defined. Add 'color:99:...' line
Line 20: Cell C3: unbalanced parentheses in formula
```

**Example warnings:**
```
Line 25: Cell D4: unknown function 'CUSTOMFUNC' in formula
```

**Test syntax + semantic:**
```bash
node validate-cli.js --level 2 myfile.msc
```

### Level 3: Logic Validation (NICE TO HAVE)

**What it checks:**
- Circular reference detection (A1→A2→A3→A1)
- Cell reference validation (formula references existing cells)
- Range validity (A1:B10 has valid coordinates)
- Formula dependency chains

**Example errors:**
```
Line 30: Circular reference detected: A1 → A2 → A3 → A1
Line 35: Cell A5: invalid range 1A:A3
```

**Example warnings:**
```
Line 40: Cell B5: formula references undefined cell C10
```

**Test all levels:**
```bash
node validate-cli.js --level 3 myfile.msc
# or
node validate-cli.js myfile.msc
```

## CLI Options

```
node validate-cli.js [OPTIONS] <file>

OPTIONS:
  --level <1|2|3|all>       Validation level (default: all)
  --verbose, -v             Enable verbose logging
  --strict                  Treat warnings as errors
  --max-errors <n>          Stop after n errors (default: 100)
  --string <content>        Validate string instead of file
  --json                    Output results as JSON
  --help, -h                Show help message
```

## Testing Individual Levels

### Test Only Syntax Level

```javascript
const validator = new SocialCalcValidator({
    enableSemanticLevel: false,
    enableLogicLevel: false,
    verbose: true
});

const result = validator.validate(mscContent);
// Only syntax errors will be reported
```

### Test Only Semantic Level

```javascript
const validator = new SocialCalcValidator({
    enableSyntaxLevel: true,
    enableSemanticLevel: true,
    enableLogicLevel: false,
    verbose: true
});

const result = validator.validate(mscContent);
// Syntax + semantic errors will be reported
```

### Test All Levels

```javascript
const validator = new SocialCalcValidator({
    enableSyntaxLevel: true,
    enableSemanticLevel: true,
    enableLogicLevel: true,
    verbose: true
});

const result = validator.validate(mscContent);
// All errors will be reported
```

## Example Files

### Valid MSC File (`example-valid.msc`)

```
version:1.5
cell:A1:t:Hello World:f:1:cf:1
cell:A2:v:100:f:2
cell:A3:v:200:f:2
cell:A4:vtf:n:300:A2+A3:f:3:c:1
font:1:normal bold 14pt Arial
font:2:normal normal 11pt Arial
font:3:normal bold 12pt Arial
color:1:rgb(0,128,0)
cellformat:1:center
sheet:c:1:r:4
```

### Invalid MSC File (`example-invalid.msc`)

```
version:1.5
cell:A1:t:Bad Syntax:f:99          ← Font 99 not defined (semantic error)
cell:1A:v:100                       ← Invalid coordinate (syntax error)
cell:A3:vtf:n:broken                ← Missing formula part (syntax error)
cell:A4:colspan:abc                 ← Invalid colspan value (syntax error)
sheet:c:bad:r:10                    ← Invalid column count (syntax error)
```

### Circular Reference (`example-circular.msc`)

```
version:1.5
cell:A1:vtf:n:10:A1+1               ← Direct circular reference
cell:A2:vtf:n:20:A3+1               ↓
cell:A3:vtf:n:30:A2+1               ← Indirect circular reference
sheet:c:1:r:3
```

## Result Object Structure

```javascript
{
    valid: boolean,              // Overall pass/fail
    errors: [                    // Critical issues
        {
            line: number,
            level: 'SYNTAX' | 'SEMANTIC' | 'LOGIC',
            type: 'ERROR',
            message: string
        }
    ],
    warnings: [                  // Non-critical issues
        {
            line: number,
            level: 'SYNTAX' | 'SEMANTIC' | 'LOGIC',
            type: 'WARNING',
            message: string
        }
    ],
    errorCount: number,
    warningCount: number,
    stats: {
        syntaxChecks: number,
        semanticChecks: number,
        logicChecks: number,
        linesProcessed: number
    },
    styleDefinitions: {
        fonts: number,
        colors: number,
        borders: number,
        layouts: number,
        cellformats: number,
        valueformats: number
    },
    cells: number,
    formulas: number
}
```

## Running Tests

The test suite includes:
- 25 Syntax level tests
- 20 Semantic level tests
- 10 Logic level tests
- 10 Integrated tests

```bash
# Run all tests
node test-validator.js

# Expected output:
# ═══════════════════════════════════════════════════════════
# SOCIALCALC VALIDATOR TEST SUITE
# ═══════════════════════════════════════════════════════════
# 
# ─────────────────────────────────────────────────────────
# LEVEL 1: SYNTAX VALIDATION TESTS
# ─────────────────────────────────────────────────────────
#   ✅ Syntax: Valid version line
#   ✅ Syntax: Missing version line
#   ...
# 
# TEST SUMMARY
# Total tests:  65+
# Passed:       65+ ✅
# Failed:       0 ❌
# Success rate: 100.0%
# 
# 🎉 ALL TESTS PASSED! 🎉
```

## Common Use Cases

### 1. Pre-flight Check Before Loading

```javascript
const validator = new SocialCalcValidator();
const result = validator.validate(mscContent);

if (result.valid) {
    // Safe to load
    loadSocialCalcSheet(mscContent);
} else {
    console.error('Cannot load: validation failed');
    result.errors.forEach(err => console.error(err.message));
}
```

### 2. Validate User Input

```javascript
app.post('/upload-sheet', (req, res) => {
    const validator = new SocialCalcValidator({ strictMode: true });
    const result = validator.validate(req.body.content);
    
    if (result.valid) {
        res.json({ success: true });
    } else {
        res.status(400).json({
            success: false,
            errors: result.errors
        });
    }
});
```

### 3. Debug Issues in Existing Files

```bash
# Find all issues with verbose output
node validate-cli.js --verbose --level 3 problematic-sheet.msc

# Get JSON output for processing
node validate-cli.js --json mysheet.msc > validation-report.json
```

### 4. CI/CD Integration

```bash
#!/bin/bash
# validate-sheets.sh

for file in *.msc; do
    echo "Validating $file..."
    node validate-cli.js "$file"
    if [ $? -ne 0 ]; then
        echo "❌ Validation failed for $file"
        exit 1
    fi
done

echo "✅ All sheets validated successfully"
```

## Advanced Options

### Strict Mode

Treat all warnings as errors:

```javascript
const validator = new SocialCalcValidator({ strictMode: true });
```

### Max Errors

Stop validation after N errors to improve performance:

```javascript
const validator = new SocialCalcValidator({ maxErrors: 10 });
```

### JSON Output

Get machine-readable output:

```bash
node validate-cli.js --json myfile.msc | jq '.errors'
```

## Supported Features

### Cell Attributes
- `v` - Numeric value
- `t` - Text value
- `vtf` - Value, type, formula
- `f` - Font reference
- `c` - Text color reference
- `bg` - Background color reference
- `cf` - Cell format reference
- `l` - Layout reference
- `ntvf` / `tvf` - Value format reference
- `b` - Borders (4 values)
- `colspan` / `rowspan` - Cell merging

### Style Definitions
- `font:NUM:style weight size family`
- `color:NUM:rgb(R,G,B)` or `color:NUM:#RRGGBB`
- `border:NUM:thickness style color`
- `layout:NUM:padding/vertical-align`
- `cellformat:NUM:alignment`
- `valueformat:NUM:format-string`

### Known Functions
ABS, ACOS, AND, ASIN, ATAN, ATAN2, AVERAGE, CHOOSE, COS, COUNT, COUNTA, COUNTBLANK, COUNTIF, DATE, DAY, DDB, DEGREES, EVEN, EXACT, EXP, FACT, FALSE, FIND, FV, HLOOKUP, HOUR, IF, INDEX, INT, IRR, ISBLANK, ISERR, ISERROR, ISLOGICAL, ISNA, ISNONTEXT, ISTEXT, LEFT, LEN, LN, LOG, LOG10, LOWER, MATCH, MAX, MID, MIN, MINUTE, MOD, MONTH, N, NA, NPER, NPV, NOW, ODD, OR, PI, PMT, POWER, PRODUCT, PROPER, PV, RADIANS, RATE, REPLACE, REPT, RIGHT, ROUND, ROWS, COLUMNS, SECOND, SIN, SLN, SQRT, STDEV, STDEVP, SUBSTITUTE, SUM, SUMIF, SYD, T, TAN, TIME, TODAY, TRUE, TRUNC, UPPER, VALUE, VAR, VARP, VLOOKUP, WEEKDAY, YEAR

## Troubleshooting

### "Module not found" Error

Make sure you're running commands from the validator directory:

```bash
cd /path/to/socialcalc-validator
node test-validator.js
```

### Test Failures

If tests fail, check:
1. Node.js version (requires 12+)
2. File permissions
3. File encoding (should be UTF-8)

### Performance Issues

For very large files, use `--max-errors` to stop early:

```bash
node validate-cli.js --max-errors 50 large-file.msc
```

## Contributing

To add new validation rules:

1. Add the check in the appropriate method in `validator.js`
2. Add corresponding tests in `test-validator.js`
3. Update this README with the new feature

## License

MIT License - See LICENSE file for details

## Author

Built following the SocialCalc specification from socialcalc-3.js
