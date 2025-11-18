# Running Tests

This document explains how to run the validation tests for the SocialCalc Validator.

## Test Files Location

- **Test Files**: `tests/` directory
  - `test-validator.js` - Unit tests for validator functionality
  - `test-training-data.js` - Validation tests for all training examples
  
- **Training Data**: `data/` directory
  - `training.jsonl` - Training examples in JSONL format

- **Example Files**: `tests/` directory
  - `example-valid.msc` - Valid MSC file example
  - `example-invalid.msc` - Invalid MSC file example
  - `example-circular.msc` - Circular reference example
  - `test-invalid-range.msc` - Invalid range example

## Running Tests

### Test the Validator Core Functionality

```bash
node tests/test-validator.js
```

This runs 65 unit tests covering:
- Syntax validation (25 tests)
- Semantic validation (20 tests)
- Logic validation (10 tests)
- Integrated tests (10 tests)

### Test Training Data Validity

```bash
node tests/test-training-data.js
```

This validates all 54 training examples in `data/training.jsonl` to ensure:
- All examples are syntactically correct
- All references are properly defined
- No circular dependencies exist
- All formatting is valid

### Test CLI Validator

```bash
# Validate a specific file
node validate-cli.js tests/example-valid.msc

# Validate with verbose output
node validate-cli.js -v tests/example-valid.msc

# Validate with strict mode
node validate-cli.js -s tests/example-valid.msc

# Validate and output JSON
node validate-cli.js -j tests/example-valid.msc

# Test an invalid file
node validate-cli.js tests/example-invalid.msc
```

## Expected Results

### Validator Tests
- **Total tests**: 65
- **Expected**: All tests should pass (100% success rate)

### Training Data Tests
- **Total examples**: 54
- **Expected**: All examples should pass (100% success rate)

## Current Test Results

✅ **test-validator.js**: 65/65 tests passing (100%)  
✅ **test-training-data.js**: 54/54 examples valid (100%)

## Troubleshooting

If tests fail:

1. **Module not found errors**: Ensure you're running from the project root
2. **File path errors**: Check that paths in test files point to correct locations
3. **Syntax errors in training.jsonl**: Run the training data test to identify which example is invalid
4. **Validator logic errors**: Run the validator test suite to identify which validation level has issues

## Adding New Tests

### Adding Validator Unit Tests

Edit `tests/test-validator.js` and add new test cases to the appropriate section:
- `testSyntaxLevel()` - For syntax validation
- `testSemanticLevel()` - For reference validation
- `testLogicLevel()` - For formula and dependency validation
- `testIntegrated()` - For complete file validation

### Adding Training Examples

Add new examples to `data/training.jsonl` in JSONL format:

```json
{"messages":[{"role":"user","content":"Create..."},{"role":"assistant","content":"version:1.5\ncell:A1:t:Hello\n..."}]}
```

Then run `node tests/test-training-data.js` to validate the new example.
