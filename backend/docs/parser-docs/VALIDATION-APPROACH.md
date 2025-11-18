# SocialCalc Validator: Line-by-Line vs Full Structure

## ✅ Recommended Approach: **Hybrid Validation**

Based on your training data analysis, the validator uses **both** approaches:

### 1️⃣ **Line-by-Line Validation (Primary)**
Each line is validated independently as it's processed.

**Why this works:**
- ✅ Each line has a clear type: `version:`, `cell:`, `sheet:`, etc.
- ✅ Lines are independent and don't depend on order (except version must be first)
- ✅ Supports streaming for large files
- ✅ Can report errors immediately per line

**What it checks:**
- ✅ Line format and syntax
- ✅ Data types (numbers, coordinates, colors)
- ✅ Attribute patterns
- ✅ Value ranges

### 2️⃣ **Cross-Reference Validation (Secondary)**
After all lines are processed, check relationships.

**Why this is needed:**
- ✅ Font references: `cell:A1:f:1` → must have `font:1:...`
- ✅ Color references: `cell:A1:c:1` → must have `color:1:...`
- ✅ Border references: `cell:A1:b:1:1:1:1` → must have `border:1:...`
- ✅ Format references: `cell:A1:cf:1` → must have `cellformat:1:...`

## 📋 Validation Phases

```
┌─────────────────────────────────────────┐
│  Phase 1: Line-by-Line Validation      │
│  • Syntax errors                        │
│  • Invalid coordinates                  │
│  • Type mismatches                      │
│  • Malformed attributes                 │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Phase 2: Structural Validation         │
│  • Missing version line                 │
│  • Undefined font references            │
│  • Undefined color references           │
│  • Undefined border references          │
│  • Undefined format references          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Phase 3: Semantic Validation           │
│  • Cells without sheet definition       │
│  • Logical inconsistencies              │
│  • Best practice warnings               │
└─────────────────────────────────────────┘
```

## 🎯 Two Usage Modes

### **Mode A: Full Validation**
```javascript
const validator = new SocialCalcValidator();
const result = validator.validate(fullSaveString);

if (!result.valid) {
    result.errors.forEach(err => {
        console.log(`Line ${err.line}: ${err.message}`);
    });
}
```

**Use when:**
- Validating complete files
- You have the entire save string
- You want comprehensive analysis

### **Mode B: Streaming Validation**
```javascript
const validator = new SocialCalcValidator();
const stream = validator.createStream();

// Process line by line
lines.forEach(line => {
    const lineResult = stream.processLine(line);
    if (!lineResult.valid) {
        console.log(`Error in line: ${line}`);
    }
});

// Finalize and check cross-references
const finalResult = stream.finalize();
```

**Use when:**
- Processing large files
- Reading from file stream
- Real-time validation as user types
- Memory constraints

## 📊 Validation Results

The validator returns:

```javascript
{
    valid: true/false,           // Overall validity
    errors: [                     // Critical errors
        {
            line: 3,
            type: 'error',
            message: 'Invalid cell coordinate: 1A',
            content: 'cell:1A:t:hello'
        }
    ],
    warnings: [                   // Non-critical warnings
        {
            line: 5,
            type: 'warning',
            message: 'Unknown cell attribute: xyz'
        }
    ],
    details: {
        lineValidation: [...],     // Per-line results
        structureValidation: [...], // Cross-reference issues
        semanticValidation: [...]   // Logical issues
    }
}
```

## 🔍 What Gets Validated

### ✅ Line-Level Checks

| Line Type | Validation |
|-----------|------------|
| `version:` | Must be first line, valid version number (1.0-1.5) |
| `cell:` | Valid coordinate (A1, B2), proper attributes |
| `sheet:` | Valid column/row numbers |
| `font:` | Valid font number, font definition syntax |
| `color:` | Valid color number, RGB format |
| `border:` | Valid border number, CSS border syntax |
| `cellformat:` | Valid alignment (left, center, right) |
| `valueformat:` | Valid format pattern |
| `col:` | Valid column reference (A, B, AA) |
| `row:` | Valid row number |

### ✅ Structure-Level Checks

- Referenced fonts are defined
- Referenced colors are defined
- Referenced borders are defined
- Referenced layouts are defined
- Referenced cell formats are defined
- Referenced value formats are defined
- Version line exists
- Cross-references are consistent

### ✅ Semantic-Level Checks

- Cells exist but no sheet definition (warning)
- Logical inconsistencies
- Best practices

## 🎨 Error Messages

**Clear and specific:**
```
❌ Line 2: Invalid cell coordinate: 1A
❌ Line 5: Referenced font #99 is not defined
❌ Line 7: Invalid alignment: middle. Must be one of: left, center, right
❌ Line 0: Missing required version line
```

## 🚀 Performance

- **Line-by-line**: O(n) - each line validated once
- **Cross-reference**: O(m) - where m is number of references
- **Memory**: Minimal - only stores reference sets
- **Streaming**: Can handle files of any size

## 💡 Advantages of This Approach

1. **Flexible**: Works for both complete files and streaming
2. **Fast**: Only one pass through the data
3. **Accurate**: Catches both syntax and semantic errors
4. **Memory Efficient**: Doesn't store entire file in memory
5. **Clear Errors**: Pinpoints exact line and issue
6. **Extensible**: Easy to add new validation rules

## 📝 Example Training Data Pattern

```
version:1.5
cell:A1:t:hello:cf:1:rowspan:2
sheet:c:1:r:2
cellformat:1:center
```

**Validation flow:**
1. ✅ Line 1: `version:1.5` - Valid version
2. ✅ Line 2: `cell:A1:t:hello:cf:1:rowspan:2` - Valid cell, references cf:1
3. ✅ Line 3: `sheet:c:1:r:2` - Valid sheet
4. ✅ Line 4: `cellformat:1:center` - Defines cf:1
5. ✅ Cross-check: cf:1 is defined ✓

## 🎯 Answer to Your Question

**"Can we validate it line by line or full structure?"**

**Answer: BOTH!** 

- **Syntax validation**: Line-by-line ✅
- **Cross-references**: Full structure ✅
- **Implementation**: Hybrid approach that does both efficiently

The validator processes each line independently (streaming-capable) but also maintains reference tracking to validate the complete structure at the end.
