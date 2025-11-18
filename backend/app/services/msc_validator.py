"""
MSC Validator Service - Python wrapper for JavaScript SocialCalc Validator

This module provides a Python interface to the JavaScript validator
for MSC (SocialCalc) format validation and correction.
"""

import os
import json
import subprocess
from typing import Dict, List, Tuple, Optional
from pathlib import Path


class MSCValidator:
    """Python wrapper for JavaScript SocialCalc validator"""

    def __init__(self):
        # Path to the JavaScript validator (in backend/msc_validator/)
        self.validator_dir = Path(
            __file__).parent.parent.parent / "msc_validator"
        self.validator_cli = self.validator_dir / "validate-cli.js"

        if not self.validator_cli.exists():
            raise FileNotFoundError(
                f"JavaScript validator not found at {self.validator_cli}"
            )

    def validate(self, msc_content: str, level: str = "all", strict: bool = False) -> Dict:
        """
        Validate MSC content using JavaScript validator

        Args:
            msc_content: MSC format string to validate
            level: Validation level ('1', '2', '3', or 'all')
            strict: Treat warnings as errors

        Returns:
            Dictionary with validation results
        """
        try:
            # Build command
            cmd = [
                "node",
                str(self.validator_cli),
                "--string", msc_content,
                "--level", level,
                "--json"
            ]

            if strict:
                cmd.append("--strict")

            # Run validator
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=str(self.validator_dir),
                timeout=10
            )

            # Parse JSON output
            if result.stdout:
                return json.loads(result.stdout)
            else:
                return {
                    "valid": False,
                    "errors": [{"line": 0, "level": "SYSTEM", "message": result.stderr or "Unknown error"}],
                    "warnings": [],
                    "errorCount": 1,
                    "warningCount": 0
                }

        except subprocess.TimeoutExpired:
            return {
                "valid": False,
                "errors": [{"line": 0, "level": "SYSTEM", "message": "Validation timeout"}],
                "warnings": [],
                "errorCount": 1,
                "warningCount": 0
            }
        except Exception as e:
            return {
                "valid": False,
                "errors": [{"line": 0, "level": "SYSTEM", "message": str(e)}],
                "warnings": [],
                "errorCount": 1,
                "warningCount": 0
            }

    def validate_with_corrections(self, msc_content: str, max_iterations: int = 3) -> Tuple[str, bool, List[str]]:
        """
        Validate MSC content and provide correction suggestions

        Args:
            msc_content: MSC format string to validate
            max_iterations: Maximum correction attempts

        Returns:
            Tuple of (original_content, is_valid, list_of_errors)
        """
        corrections_made = []
        current_content = msc_content

        for iteration in range(max_iterations):
            result = self.validate(current_content, level="all")

            if result["valid"]:
                return current_content, True, corrections_made

            # Collect error messages
            errors = result.get("errors", [])
            if not errors:
                break

            # Apply basic corrections (can be extended)
            corrected = False
            for error in errors:
                message = error.get("message", "")

                # Add version if missing
                if "version" in message.lower() and "missing" in message.lower():
                    if not current_content.startswith("version:"):
                        current_content = "version:1.5\n" + current_content
                        corrections_made.append(
                            f"Iteration {iteration + 1}: Added version declaration")
                        corrected = True
                        break

                # Add sheet declaration if missing
                if "sheet" in message.lower() and "missing" in message.lower():
                    if "\nsheet:" not in current_content:
                        # Estimate sheet size from cells
                        max_col = 10
                        max_row = 100
                        current_content += f"\nsheet:c:{max_col}:r:{max_row}"
                        corrections_made.append(
                            f"Iteration {iteration + 1}: Added sheet declaration")
                        corrected = True
                        break

            if not corrected:
                # Cannot auto-correct, return errors
                error_messages = [
                    f"Line {e.get('line', 0)}: {e.get('message', 'Unknown error')}" for e in errors]
                return current_content, False, error_messages

        # Max iterations reached
        result = self.validate(current_content, level="all")
        if result["valid"]:
            return current_content, True, corrections_made
        else:
            error_messages = [
                f"Line {e.get('line', 0)}: {e.get('message', 'Unknown error')}" for e in result.get("errors", [])]
            return current_content, False, error_messages


def create_invoice_msc(invoice_data: Dict) -> str:
    """
    Create MSC format invoice from invoice data

    This function maintains the same interface as the old msc_parser
    for backward compatibility.

    Args:
        invoice_data: Invoice data dictionary

    Returns:
        MSC format string
    """
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
