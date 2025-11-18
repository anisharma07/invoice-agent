#!/usr/bin/env python3
"""
Test script for MSC Validator integration
"""

from app.services.msc_validator import MSCValidator, create_invoice_msc
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


def test_create_invoice():
    """Test invoice MSC generation"""
    print("=" * 80)
    print("TEST: Creating Invoice MSC")
    print("=" * 80)

    invoice_data = {
        "invoice_number": "INV-2025-001",
        "date": "2025-01-15",
        "due_date": "2025-02-15",
        "from": {
            "name": "John Doe",
            "company": "Acme Corp",
            "address": "123 Main St"
        },
        "to": {
            "name": "Jane Smith",
            "company": "Tech Inc",
            "address": "456 Oak Ave"
        },
        "items": [
            {
                "description": "Web Development Services",
                "quantity": 10,
                "unit_price": 150.00,
                "amount": 1500.00
            },
            {
                "description": "Design Services",
                "quantity": 5,
                "unit_price": 100.00,
                "amount": 500.00
            }
        ],
        "subtotal": 2000.00,
        "tax_rate": 10.0,
        "tax_amount": 200.00,
        "total": 2200.00,
        "notes": "Payment due within 30 days"
    }

    msc_content = create_invoice_msc(invoice_data)
    print("\nGenerated MSC Content:")
    print("-" * 80)
    print(msc_content)
    print("-" * 80)

    return msc_content


def test_validator(msc_content):
    """Test MSC validation"""
    print("\n" + "=" * 80)
    print("TEST: Validating MSC with JavaScript Validator")
    print("=" * 80)

    validator = MSCValidator()

    # Test validation
    result = validator.validate(msc_content, level="all")

    print(
        f"\nValidation Result: {'✅ VALID' if result['valid'] else '❌ INVALID'}")
    print(f"Errors: {result['errorCount']}")
    print(f"Warnings: {result['warningCount']}")

    if result.get('errors'):
        print("\nErrors found:")
        for error in result['errors']:
            print(
                f"  Line {error.get('line', 0)}: [{error.get('level', 'UNKNOWN')}] {error.get('message', '')}")

    if result.get('warnings'):
        print("\nWarnings found:")
        for warning in result['warnings']:
            print(
                f"  Line {warning.get('line', 0)}: [{warning.get('level', 'UNKNOWN')}] {warning.get('message', '')}")

    print("\nStatistics:")
    stats = result.get('stats', {})
    print(f"  Lines processed: {stats.get('linesProcessed', 0)}")
    print(f"  Syntax checks: {stats.get('syntaxChecks', 0)}")
    print(f"  Semantic checks: {stats.get('semanticChecks', 0)}")
    print(f"  Logic checks: {stats.get('logicChecks', 0)}")

    return result


def test_validation_with_corrections(msc_content):
    """Test validation with auto-corrections"""
    print("\n" + "=" * 80)
    print("TEST: Validation with Auto-Corrections")
    print("=" * 80)

    validator = MSCValidator()

    # Remove version to test correction
    invalid_content = "\n".join(msc_content.split("\n")[1:])
    print("\nTesting with missing version line...")

    corrected, is_valid, messages = validator.validate_with_corrections(
        invalid_content)

    print(f"\nResult: {'✅ CORRECTED' if is_valid else '❌ FAILED TO CORRECT'}")

    if messages:
        print("\nMessages:")
        for msg in messages:
            print(f"  {msg}")


def main():
    """Run all tests"""
    try:
        # Test 1: Generate invoice MSC
        msc_content = test_create_invoice()

        # Test 2: Validate with JavaScript validator
        result = test_validator(msc_content)

        # Test 3: Test auto-corrections
        test_validation_with_corrections(msc_content)

        print("\n" + "=" * 80)
        print("✅ ALL TESTS COMPLETED")
        print("=" * 80)

        # Exit with appropriate code
        sys.exit(0 if result['valid'] else 1)

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
