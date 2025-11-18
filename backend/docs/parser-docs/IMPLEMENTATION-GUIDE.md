# Step-by-Step Approach to Building a SocialCalc Save String Validator

## Overview

This document provides a comprehensive, step-by-step approach to creating a validator for SocialCalc (MSC) save format files.

## Phase 1: Understanding the Format (Research)

### Step 1.1: Study the Specification
**Goal:** Understand the complete MSC file format

**Actions:**
1. Read `socialcalc-3.js` lines 333-402 (format specification in comments)
2. Review all line types:
   - `version:` - Version identifier (required, must be first)
   - `cell:` - Cell definitions with attributes
   - `sheet:` - Sheet-level properties
   - `col:` - Column properties
   - `row:` - Row properties
   - `font:` - Font style definitions
   - `color:` - Color definitions
   - `border:` - Border style definitions
   - `layout:` - Cell layout (padding, alignment)
   - `cellformat:` - Cell format (horizontal alignment)
   - `valueformat:` - Value formatting rules
   - `name:` - Named range definitions

3. Understand encoding rules:
   - `:` is encoded as `\c` in formulas and text
   - Newline is encoded as `\n`
   - Backslash is encoded as `\b`

### Step 1.2: Analyze Training Examples
**Goal:** See real-world valid examples

**Actions:**
1. Read `training.jsonl` - contains correct examples
2. Create a spreadsheet documenting:
   - Common patterns
   - Cell attribute combinations
   - Style definition formats
   - Formula encoding examples

### Step 1.3: Study Parsing Code
**Goal:** Understand how SocialCalc itself parses the format

**Actions:**
1. Review `SocialCalc.ParseSheetSave()` function (line ~410)
2. Review `SocialCalc.CellFromStringParts()` function (line ~588)
3. Understand the parsing state machine
4. Note error handling approaches

## Phase 2: Design the Validator Architecture

### Step 2.1: Define Validation Scope
**Goal:** Decide what to validate

**Validation Levels:**
1. **Syntax Level** (MUST DO)
   - Line format correctness
   - Coordinate format validation
   - Attribute syntax validation
   - Required vs optional fields

2. **Semantic Level** (SHOULD DO)
   - Cross-references (styles exist)
   - Value type correctness
   - Formula basic syntax
   - Coordinate existence

3. **Logic Level** (NICE TO HAVE)
   - Formula evaluation
   - Circular reference detection
   - Range validity
   - Deep formula validation

### Step 2.2: Design Class Structure
**Goal:** Create maintainable, extensible architecture

```
SocialCalcValidator
├── Constructor
│   ├── errors: []
│   ├── warnings: []
│   ├── styleDefinitions: {}
│   └── lineNumber: 0
│
├── Main Method
│   └── validate(saveStr) → result
│
├── Pass 1: Collection Phase
│   └── collectStyleDefinitions(line)
│       ├── Collect font numbers
│       ├── Collect color numbers
│       ├── Collect border numbers
│       ├── Collect layout numbers
│       ├── Collect cellformat numbers
│       └── Collect valueformat numbers
│
├── Pass 2: Validation Phase
│   └── validateLine(line)
│       ├── validateVersionLine(parts)
│       ├── validateCellLine(parts)
│       ├── validateSheetLine(parts)
│       ├── validateColLine(parts)
│       ├── validateRowLine(parts)
│       ├── validateFontLine(parts)
│       ├── validateColorLine(parts)
│       ├── validateBorderLine(parts)
│       ├── validateLayoutLine(parts)
│       ├── validateCellFormatLine(parts)
│       ├── validateValueFormatLine(parts)
│       └── validateNameLine(parts)
│
├── Helper Methods
│   ├── isValidCoord(coord)
│   ├── validateFormula(formula)
│   ├── addError(lineNum, message)
│   ├── addWarning(lineNum, message)
│   └── getResult()
│
└── Utility Methods
    ├── decodeFormula(encoded)
    ├── parseCoordinate(coord)
    └── checkParentheses(formula)
```

## Phase 3: Implementation

### Step 3.1: Create Base Structure
**Goal:** Set up the validator class

**Implementation:**
```javascript
class SocialCalcValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.styleDefinitions = {
            fonts: new Set(),
            colors: new Set(),
            borders: new Set(),
            layouts: new Set(),
            cellformats: new Set(),
            valueformats: new Set()
        };
        this.lineNumber = 0;
    }
    
    validate(saveStr) {
        // Reset state
        // Parse lines
        // Validate version
        // Pass 1: Collect styles
        // Pass 2: Validate all
        // Return result
    }
}
```

### Step 3.2: Implement Version Validation
**Goal:** Ensure first line is valid version

**Rules:**
- Must be first line
- Format: `version:X.X`
- Known versions: 1.0, 1.1, 1.2, 1.3, 1.4, 1.5
- Error if missing or malformed
- Warning if unknown version

**Implementation Priority:** HIGH (blocks everything else)

### Step 3.3: Implement Style Collection (Pass 1)
**Goal:** Build registry of defined styles

**For each line type:**
- `font:NUM:...` → add NUM to fonts set
- `color:NUM:...` → add NUM to colors set
- `border:NUM:...` → add NUM to borders set
- `layout:NUM:...` → add NUM to layouts set
- `cellformat:NUM:...` → add NUM to cellformats set
- `valueformat:NUM:...` → add NUM to valueformats set

**Why needed:** Cells reference styles by number; must ensure they exist

### Step 3.4: Implement Cell Line Validation
**Goal:** Validate most complex line type

**Cell Line Format:**
```
cell:COORD:attr:value:attr:value...
```

**Validation Steps:**
1. Check coordinate format (A1, B5, AA10, etc.)
2. Parse attribute pairs
3. For each attribute type:

**Attribute `v` (numeric value):**
- Expects: numeric value
- Validate: isNaN() check
- Error if: non-numeric

**Attribute `t` (text):**
- Expects: any text (can be empty)
- Validate: encoding
- Warning if: very long

**Attribute `vtf` (value+type+formula):**
- Expects: type, value, formula (3 parts)
- Validate: formula syntax
- Error if: missing parts

**Attribute `f` (font):**
- Expects: font number
- Validate: exists in styleDefinitions.fonts
- Error if: not defined

**Attribute `c` (text color):**
- Expects: color number
- Validate: exists in styleDefinitions.colors
- Error if: not defined

**Attribute `bg` (background color):**
- Expects: color number
- Validate: exists in styleDefinitions.colors
- Error if: not defined

**Attribute `cf` (cell format):**
- Expects: cellformat number
- Validate: exists in styleDefinitions.cellformats
- Error if: not defined

**Attribute `l` (layout):**
- Expects: layout number
- Validate: exists in styleDefinitions.layouts
- Error if: not defined

**Attribute `b` (borders):**
- Expects: 4 border numbers (top, right, bottom, left)
- Validate: each exists in styleDefinitions.borders (except 0)
- Error if: any not defined

**Attribute `colspan` / `rowspan`:**
- Expects: positive integer
- Validate: > 0
- Error if: not positive integer

### Step 3.5: Implement Sheet Line Validation
**Goal:** Validate sheet properties

**Format:**
```
sheet:attr:value:attr:value...
```

**Common Attributes:**
- `c:NUM` - Last column (must be positive integer)
- `r:NUM` - Last row (must be positive integer)
- `w:VALUE` - Default width (number, "auto", or "NUM%")
- `h:VALUE` - Default height (number)
- `recalc:on/off` - Recalc setting
- `needsrecalc:yes/no` - Needs recalc flag

### Step 3.6: Implement Style Definition Validation
**Goal:** Validate style definitions themselves

**Font Line:** `font:NUM:style weight size family`
- NUM must be positive integer
- Style: normal, italic, or *
- Weight: normal, bold, or *
- Size: XYpt, XYpx, or named (small, medium, large, x-large)
- Family: font names

**Color Line:** `color:NUM:rgb(R,G,B)` or `color:NUM:#RRGGBB`
- NUM must be positive integer
- RGB format: rgb(0-255,0-255,0-255)
- Hex format: #RRGGBB

**Border Line:** `border:NUM:thickness style color`
- NUM must be positive integer
- Thickness: XYpx
- Style: solid, dashed, dotted, double, none
- Color: rgb() or #

**Cell Format Line:** `cellformat:NUM:alignment`
- NUM must be positive integer
- Alignment: left, center, or right

### Step 3.7: Implement Formula Validation (Basic)
**Goal:** Check formula syntax

**Basic Checks:**
1. Decode formula (`\c` → `:`, `\n` → newline, `\b` → `\`)
2. Check parentheses balance
3. Check for known function names
4. Warning for unknown functions

**Known Functions List:**
ABS, ACOS, AND, ASIN, ATAN, ATAN2, AVERAGE, CHOOSE, COS, COUNT,
COUNTA, COUNTBLANK, COUNTIF, DATE, DAY, DDB, DEGREES, EVEN, EXACT,
EXP, FACT, FALSE, FIND, FV, HLOOKUP, HOUR, IF, INDEX, INT, IRR,
ISBLANK, ISERR, ISERROR, ISLOGICAL, ISNA, ISNONTEXT, ISTEXT, LEFT,
LEN, LN, LOG, LOG10, LOWER, MATCH, MAX, MID, MIN, MINUTE, MOD,
MONTH, N, NA, NPER, NPV, NOW, ODD, OR, PI, PMT, POWER, PRODUCT,
PROPER, PV, RADIANS, RATE, REPLACE, REPT, RIGHT, ROUND, ROWS,
COLUMNS, SECOND, SIN, SLN, SQRT, STDEV, STDEVP, SUBSTITUTE, SUM,
SUMIF, SYD, T, TAN, TIME, TODAY, TRUE, TRUNC, UPPER, VALUE, VAR,
VARP, VLOOKUP, WEEKDAY, YEAR

### Step 3.8: Implement Result Reporting
**Goal:** Provide clear, actionable feedback

**Result Object:**
```javascript
{
    valid: boolean,              // Overall pass/fail
    errors: [                    // Critical issues
        {
            line: number,
            type: 'ERROR',
            message: string
        }
    ],
    warnings: [                  // Non-critical issues
        {
            line: number,
            type: 'WARNING',
            message: string
        }
    ],
    errorCount: number,
    warningCount: number
}
```

**Error Message Guidelines:**
- Be specific about what's wrong
- Include line number
- Show what was expected
- Show what was received
- Suggest fix if possible

**Examples:**
- ❌ "Invalid cell"
- ✅ "Line 5: Invalid cell coordinate 'A' (expected format: A1, B5, AA10)"

- ❌ "Font not found"
- ✅ "Line 10: Font 3 referenced but not defined (add 'font:3:...' line)"

## Phase 4: Testing

### Step 4.1: Create Test Suite
**Goal:** Ensure validator works correctly

**Test Categories:**

1. **Positive Tests** (should pass)
   - Simple valid sheet
   - Complex valid sheet
   - All attribute types
   - All line types
   - Edge cases (empty text, zero values)

2. **Negative Tests** (should fail)
   - Missing version
   - Invalid version format
   - Invalid coordinates
   - Missing style references
   - Malformed attributes
   - Invalid values

3. **Warning Tests** (should warn but pass)
   - Unknown version number
   - Unknown attributes
   - Unusual formats

### Step 4.2: Test Against Training Data
**Goal:** Validate all training examples

**Process:**
1. Load `training.jsonl`
2. Extract MSC content from each example
3. Validate with validator
4. All should pass (if not, fix validator or training data)

### Step 4.3: Create Edge Case Tests
**Goal:** Handle unusual but valid inputs

**Edge Cases:**
- Empty cells
- Very large coordinates (AAA999)
- Many merged cells
- Complex formulas
- Special characters in text
- Long text values
- Many style definitions

## Phase 5: Integration

### Step 5.1: Create CLI Tool
**Goal:** Make validator easy to use

```bash
node validate-msc.js file.msc
```

**Output:**
```
Validating file.msc...

✅ Valid MSC file!

Warnings:
  Line 12: Unknown function 'CUSTOM'
  Line 45: Unusual font size '13.5pt'

Summary:
  0 errors, 2 warnings
  File is valid and can be loaded
```

### Step 5.2: Create API
**Goal:** Allow programmatic usage

```javascript
const { validateMSC, validateMSCFile } = require('./validator-api');

// From string
const result = validateMSC(mscString);

// From file
const result = await validateMSCFile('file.msc');

// With options
const result = validateMSC(mscString, {
    strictMode: true,        // Warnings become errors
    maxErrors: 10,           // Stop after N errors
    validateFormulas: true,  // Deep formula validation
    checkReferences: true    // Validate cell references exist
});
```

### Step 5.3: Create Web Interface (Optional)
**Goal:** Browser-based validation

**Features:**
- Paste MSC content
- Upload MSC file
- See errors highlighted
- Download validation report
- Fix suggestions

## Phase 6: Advanced Features

### Step 6.1: Deep Formula Validation
**Goal:** Use formula1.js for full validation

**Integration:**
```javascript
const { ParseFormulaIntoTokens } = require('./formula1.js');

validateFormula(formula) {
    try {
        const tokens = ParseFormulaIntoTokens(formula);
        // Validate tokens
        // Check function arguments
        // Validate cell references
    } catch (e) {
        this.addError(this.lineNumber, `Formula error: ${e.message}`);
    }
}
```

### Step 6.2: Cell Reference Validation
**Goal:** Check if referenced cells exist

**Example:**
```
cell:A1:v:10
cell:A2:vtf:n:20:A3+5
```
→ Error: Cell A3 referenced in A2 but not defined

### Step 6.3: Auto-Fix Suggestions
**Goal:** Suggest how to fix errors

**Examples:**
- Missing style → Suggest adding definition
- Invalid format → Show correct format
- Typo in attribute → Suggest correct attribute

### Step 6.4: Schema Generation
**Goal:** Generate JSON schema for MSC format

**Use cases:**
- IDE autocomplete
- Documentation
- Alternative validators

## Phase 7: Documentation & Distribution

### Step 7.1: Create Documentation
- README with usage examples
- API documentation
- Format specification
- FAQ
- Troubleshooting guide

### Step 7.2: Create Package
- npm package
- Browser bundle (UMD)
- TypeScript definitions
- Example projects

### Step 7.3: Write Tests
- Unit tests (Jest/Mocha)
- Integration tests
- Performance benchmarks
- Regression tests

## Summary: Implementation Checklist

### Must Have (MVP)
- [ ] Version line validation
- [ ] Cell line validation
- [ ] Sheet line validation
- [ ] Style definition validation
- [ ] Cross-reference validation (styles)
- [ ] Basic formula syntax check
- [ ] Error and warning reporting
- [ ] Test suite
- [ ] Documentation

### Should Have
- [ ] Column/row line validation
- [ ] Name line validation
- [ ] Coordinate format validation
- [ ] Value type validation
- [ ] CLI tool
- [ ] API wrapper

### Nice to Have
- [ ] Deep formula validation with formula1.js
- [ ] Cell reference existence check
- [ ] Auto-fix suggestions
- [ ] Web interface
- [ ] Performance optimization
- [ ] Schema generation

## Files Created

1. **validator.js** - Main validator class
2. **test-validator.js** - Test suite
3. **README-VALIDATOR.md** - User documentation
4. **IMPLEMENTATION-GUIDE.md** - This file

## Next Steps

1. Run tests: `node test-validator.js`
2. Test with training data
3. Fix any issues found
4. Add more test cases
5. Implement advanced features
6. Create CLI tool
7. Package for distribution
