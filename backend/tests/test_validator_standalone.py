#!/usr/bin/env python3
"""
Standalone test for MSC Validator - no dependencies
"""

import sys
import os
import json
import subprocess
from pathlib import Path


def create_invoice_msc(invoice_data):
    """Create MSC format invoice from invoice data"""
    lines = ["version:1.5"]

    # Build invoice in MSC format
    row = 1

    # Header
    lines.append(f"cell:B2:t:INVOICE:f:1:cf:1:colspan:6")
    lines.append("font:1:normal bold 20pt Arial,Helvetica,sans-serif")
    lines.append("cellformat:1:center")
    row = 4

    # Bill To section
    lines.append(f"cell:B{row}:t:BILL TO:f:2")
    lines.append("font:2:normal bold 12pt *")
    row += 1

    if invoice_data.get('to'):
        to_info = invoice_data['to']
        if to_info.get('name'):
            lines.append(f"cell:B{row}:t:{to_info['name']}")
            row += 1
        if to_info.get('company'):
            lines.append(f"cell:B{row}:t:{to_info['company']}")
            row += 1
        if to_info.get('address'):
            lines.append(f"cell:B{row}:t:{to_info['address']}")
            row += 1

    row += 2

    # From section
    lines.append(f"cell:B{row}:t:FROM:f:2")
    row += 1

    if invoice_data.get('from'):
        from_info = invoice_data['from']
        if from_info.get('name'):
            lines.append(f"cell:B{row}:t:{from_info['name']}")
            row += 1
        if from_info.get('company'):
            lines.append(f"cell:B{row}:t:{from_info['company']}")
            row += 1

    row += 2

    # Invoice details
    lines.append(f"cell:B{row}:t:Invoice Number:f:2")
    lines.append(f"cell:D{row}:t:{invoice_data.get('invoice_number', '')}")
    row += 1

    lines.append(f"cell:B{row}:t:Date:f:2")
    lines.append(f"cell:D{row}:t:{invoice_data.get('date', '')}")
    row += 1

    lines.append(f"cell:B{row}:t:Due Date:f:2")
    lines.append(f"cell:D{row}:t:{invoice_data.get('due_date', '')}")
    row += 2

    # Items header
    lines.append(f"cell:B{row}:t:Description:f:2:cf:1:bg:1")
    lines.append(f"cell:D{row}:t:Quantity:f:2:cf:1:bg:1")
    lines.append(f"cell:E{row}:t:Unit Price:f:2:cf:1:bg:1")
    lines.append(f"cell:F{row}:t:Amount:f:2:cf:1:bg:1")
    lines.append("color:1:rgb(240,240,240)")
    row += 1

    # Items
    for item in invoice_data.get('items', []):
        lines.append(f"cell:B{row}:t:{item.get('description', '')}")
        lines.append(f"cell:D{row}:v:{item.get('quantity', 1)}")
        lines.append(f"cell:E{row}:v:{item.get('unit_price', 0)}:ntvf:1")
        lines.append(f"cell:F{row}:v:{item.get('amount', 0)}:ntvf:1")
        row += 1

    row += 1

    # Totals
    lines.append(f"cell:E{row}:t:Subtotal:f:2:cf:2")
    lines.append(f"cell:F{row}:v:{invoice_data.get('subtotal', 0)}:ntvf:1")
    lines.append("cellformat:2:right")
    row += 1

    tax_rate = invoice_data.get('tax_rate', 0)
    lines.append(f"cell:E{row}:t:Tax ({tax_rate}%):f:2:cf:2")
    lines.append(f"cell:F{row}:v:{invoice_data.get('tax_amount', 0)}:ntvf:1")
    row += 1

    lines.append(f"cell:E{row}:t:TOTAL:f:3:cf:2:bg:2")
    lines.append(f"cell:F{row}:v:{invoice_data.get('total', 0)}:ntvf:1:bg:2")
    lines.append("font:3:normal bold 14pt *")
    lines.append("color:2:rgb(220,220,220)")
    row += 2

    # Notes
    if invoice_data.get('notes'):
        lines.append(f"cell:B{row}:t:Notes:f:2")
        row += 1
        lines.append(f"cell:B{row}:t:{invoice_data['notes']}:colspan:5")

    # Set sheet dimensions
    lines.append(f"sheet:c:6:r:{row}")

    # Set value format for currency
    lines.append("valueformat:1:$#,##0.00")

    return '\n'.join(lines)


def validate_msc(msc_content):
    """Validate MSC using JavaScript validator"""
    validator_dir = Path(__file__).parent / "msc_validator"
    validator_cli = validator_dir / "validate-cli.js"

    if not validator_cli.exists():
        print(f"❌ ERROR: Validator not found at {validator_cli}")
        return None

    cmd = [
        "node",
        str(validator_cli),
        "--string", msc_content,
        "--level", "all",
        "--json"
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=str(validator_dir),
            timeout=10
        )

        if result.stdout:
            return json.loads(result.stdout)
        else:
            return {
                "valid": False,
                "errors": [{"line": 0, "level": "SYSTEM", "message": result.stderr or "Unknown error"}],
                "errorCount": 1
            }
    except Exception as e:
        return {
            "valid": False,
            "errors": [{"line": 0, "level": "SYSTEM", "message": str(e)}],
            "errorCount": 1
        }


def main():
    print("=" * 80)
    print("MSC VALIDATOR INTEGRATION TEST")
    print("=" * 80)

    # Create test invoice
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

    print("\n📝 Step 1: Generating MSC content from invoice data...")
    msc_content = create_invoice_msc(invoice_data)
    print("✅ MSC content generated")
    print(f"   Lines: {len(msc_content.split(chr(10)))}")

    print("\n🔍 Step 2: Validating MSC with JavaScript validator...")
    result = validate_msc(msc_content)

    if result is None:
        print("❌ Validation failed - validator not available")
        return 1

    print(
        f"\n{'✅' if result['valid'] else '❌'} Validation Result: {'VALID' if result['valid'] else 'INVALID'}")
    print(f"   Errors: {result.get('errorCount', 0)}")
    print(f"   Warnings: {result.get('warningCount', 0)}")

    if result.get('errors'):
        print("\n   Errors found:")
        for error in result['errors'][:5]:  # Show first 5
            print(
                f"     Line {error.get('line', 0)}: [{error.get('level', 'UNKNOWN')}] {error.get('message', '')}")

    stats = result.get('stats', {})
    if stats:
        print(f"\n📊 Statistics:")
        print(f"   Lines processed: {stats.get('linesProcessed', 0)}")
        print(f"   Syntax checks: {stats.get('syntaxChecks', 0)}")
        print(f"   Semantic checks: {stats.get('semanticChecks', 0)}")
        print(f"   Logic checks: {stats.get('logicChecks', 0)}")

    print("\n" + "=" * 80)
    if result['valid']:
        print("✅ TEST PASSED - MSC validation successful!")
        print("=" * 80)
        return 0
    else:
        print("❌ TEST FAILED - MSC validation found errors")
        print("=" * 80)
        return 1


if __name__ == "__main__":
    sys.exit(main())
