"""
MSC (Multi-Sheet Spreadsheet) Parser and Validator

This module provides functionality to parse, validate, and correct MSC format
based on the training data patterns.
"""

import re
from typing import Dict, List, Tuple, Optional


class MSCParser:
    """Parser for MSC (Multi-Sheet Spreadsheet) format"""

    def __init__(self):
        self.version = "1.5"
        self.cells = {}
        self.sheet_info = {}
        self.formats = {
            'border': {},
            'cellformat': {},
            'font': {},
            'layout': {},
            'color': {},
            'valueformat': {}
        }
        self.cols = {}
        self.rows = {}

    def parse(self, msc_content: str) -> Dict:
        """Parse MSC content into structured data"""
        lines = msc_content.strip().split('\n')

        for line in lines:
            if not line.strip():
                continue

            parts = line.split(':')
            if len(parts) < 2:
                continue

            line_type = parts[0]

            if line_type == 'version':
                self.version = parts[1]
            elif line_type == 'cell':
                self._parse_cell(parts)
            elif line_type == 'sheet':
                self._parse_sheet(parts)
            elif line_type == 'col':
                self._parse_col(parts)
            elif line_type == 'row':
                self._parse_row(parts)
            elif line_type in ['border', 'cellformat', 'font', 'layout', 'color', 'valueformat']:
                self._parse_format(line_type, parts)

        return self.to_dict()

    def _parse_cell(self, parts: List[str]):
        """Parse cell definition"""
        cell_ref = parts[1]
        cell_data = {}

        i = 2
        while i < len(parts):
            if i + 1 < len(parts):
                key = parts[i]
                value = parts[i + 1]
                cell_data[key] = value
            i += 2

        self.cells[cell_ref] = cell_data

    def _parse_sheet(self, parts: List[str]):
        """Parse sheet definition"""
        for i in range(1, len(parts), 2):
            if i + 1 < len(parts):
                key = parts[i]
                value = parts[i + 1]
                self.sheet_info[key] = int(value) if value.isdigit() else value

    def _parse_col(self, parts: List[str]):
        """Parse column definition"""
        if len(parts) >= 4:
            col_id = parts[1]
            self.cols[col_id] = {parts[2]: parts[3]}

    def _parse_row(self, parts: List[str]):
        """Parse row definition"""
        if len(parts) >= 4:
            row_id = parts[1]
            self.rows[row_id] = {parts[2]: parts[3]}

    def _parse_format(self, format_type: str, parts: List[str]):
        """Parse format definition"""
        if len(parts) >= 3:
            format_id = parts[1]
            format_value = ':'.join(parts[2:])
            self.formats[format_type][format_id] = format_value

    def to_dict(self) -> Dict:
        """Convert parsed data to dictionary"""
        return {
            'version': self.version,
            'cells': self.cells,
            'sheet': self.sheet_info,
            'cols': self.cols,
            'rows': self.rows,
            'formats': self.formats
        }

    def to_msc(self) -> str:
        """Convert structured data back to MSC format"""
        lines = [f"version:{self.version}"]

        # Add cells
        for cell_ref, cell_data in sorted(self.cells.items()):
            cell_line = f"cell:{cell_ref}"
            for key, value in cell_data.items():
                cell_line += f":{key}:{value}"
            lines.append(cell_line)

        # Add sheet info
        if self.sheet_info:
            sheet_line = "sheet"
            for key, value in self.sheet_info.items():
                sheet_line += f":{key}:{value}"
            lines.append(sheet_line)

        # Add columns
        for col_id, col_data in sorted(self.cols.items()):
            for key, value in col_data.items():
                lines.append(f"col:{col_id}:{key}:{value}")

        # Add rows
        for row_id, row_data in sorted(self.rows.items(), key=lambda x: int(x[0])):
            for key, value in row_data.items():
                lines.append(f"row:{row_id}:{key}:{value}")

        # Add formats
        for format_type, format_dict in self.formats.items():
            for format_id, format_value in sorted(format_dict.items(), key=lambda x: int(x[0]) if x[0].isdigit() else x[0]):
                lines.append(f"{format_type}:{format_id}:{format_value}")

        return '\n'.join(lines)

    def validate(self) -> Tuple[bool, List[str]]:
        """Validate MSC format and return errors"""
        errors = []

        # Check version
        if not self.version:
            errors.append("Missing version declaration")

        # Check sheet info
        if not self.sheet_info:
            errors.append("Missing sheet declaration")

        # Validate cell references
        for cell_ref in self.cells.keys():
            if not re.match(r'^[A-Z]+\d+$', cell_ref):
                errors.append(f"Invalid cell reference: {cell_ref}")

        return len(errors) == 0, errors


class MSCCorrector:
    """Corrects MSC syntax based on training patterns"""

    def __init__(self):
        self.parser = MSCParser()

    def correct(self, msc_content: str, max_iterations: int = 3) -> Tuple[str, List[str]]:
        """
        Iteratively correct MSC syntax

        Args:
            msc_content: Raw MSC content
            max_iterations: Maximum correction iterations

        Returns:
            Tuple of (corrected_content, list_of_corrections_made)
        """
        corrections = []
        current_content = msc_content

        for iteration in range(max_iterations):
            # Parse current content
            try:
                self.parser.parse(current_content)
                is_valid, errors = self.parser.validate()

                if is_valid:
                    break

                # Apply corrections
                for error in errors:
                    correction = self._apply_correction(current_content, error)
                    if correction:
                        current_content = correction
                        corrections.append(
                            f"Iteration {iteration + 1}: {error}")
            except Exception as e:
                corrections.append(f"Parse error: {str(e)}")
                current_content = self._fix_parse_errors(current_content)

        return current_content, corrections

    def _apply_correction(self, content: str, error: str) -> Optional[str]:
        """Apply specific correction based on error"""
        if "Missing version" in error:
            return f"version:1.5\n{content}"

        if "Missing sheet" in error:
            # Add basic sheet declaration
            lines = content.split('\n')
            # Find max col and row from cells
            max_col = 1
            max_row = 1
            for line in lines:
                if line.startswith('cell:'):
                    parts = line.split(':')
                    if len(parts) > 1:
                        cell_ref = parts[1]
                        match = re.match(r'^([A-Z]+)(\d+)$', cell_ref)
                        if match:
                            col_letters, row_num = match.groups()
                            col_num = sum((ord(c) - 64) * (26 ** i)
                                          for i, c in enumerate(reversed(col_letters)))
                            max_col = max(max_col, col_num)
                            max_row = max(max_row, int(row_num))

            return f"{content}\nsheet:c:{max_col}:r:{max_row}"

        return None

    def _fix_parse_errors(self, content: str) -> str:
        """Fix common parsing errors"""
        # Fix escaped colons in URLs
        content = re.sub(r'https://([^:]+)', r'https\\c//\1', content)
        content = re.sub(r'http://([^:]+)', r'http\\c//\1', content)

        # Ensure proper line endings
        content = content.replace('\r\n', '\n').replace('\r', '\n')

        # Remove empty lines
        lines = [line for line in content.split('\n') if line.strip()]

        return '\n'.join(lines)


def create_invoice_msc(invoice_data: Dict) -> str:
    """
    Create MSC format invoice from invoice data

    Args:
        invoice_data: Invoice data dictionary

    Returns:
        MSC format string
    """
    parser = MSCParser()
    parser.version = "1.5"

    # Build invoice in MSC format
    row = 1

    # Header
    parser.cells['B2'] = {'t': 'INVOICE', 'f': '1', 'cf': '1', 'colspan': '6'}
    parser.formats['font']['1'] = 'normal bold 20pt Arial,Helvetica,sans-serif'
    parser.formats['cellformat']['1'] = 'center'
    row = 4

    # Bill To section
    parser.cells[f'B{row}'] = {'t': 'BILL TO', 'f': '2'}
    parser.formats['font']['2'] = 'normal bold 12pt *'
    row += 1

    if invoice_data.get('to'):
        to_info = invoice_data['to']
        if to_info.get('name'):
            parser.cells[f'B{row}'] = {'t': to_info['name']}
            row += 1
        if to_info.get('company'):
            parser.cells[f'B{row}'] = {'t': to_info['company']}
            row += 1
        if to_info.get('address'):
            parser.cells[f'B{row}'] = {'t': to_info['address']}
            row += 1

    row += 2

    # From section
    parser.cells[f'B{row}'] = {'t': 'FROM', 'f': '2'}
    row += 1

    if invoice_data.get('from'):
        from_info = invoice_data['from']
        if from_info.get('name'):
            parser.cells[f'B{row}'] = {'t': from_info['name']}
            row += 1
        if from_info.get('company'):
            parser.cells[f'B{row}'] = {'t': from_info['company']}
            row += 1

    row += 2

    # Invoice details
    parser.cells[f'B{row}'] = {'t': 'Invoice Number', 'f': '2'}
    parser.cells[f'D{row}'] = {'t': invoice_data.get('invoice_number', '')}
    row += 1

    parser.cells[f'B{row}'] = {'t': 'Date', 'f': '2'}
    parser.cells[f'D{row}'] = {'t': invoice_data.get('date', '')}
    row += 1

    parser.cells[f'B{row}'] = {'t': 'Due Date', 'f': '2'}
    parser.cells[f'D{row}'] = {'t': invoice_data.get('due_date', '')}
    row += 2

    # Items header
    parser.cells[f'B{row}'] = {
        't': 'Description', 'f': '2', 'cf': '1', 'bg': '1'}
    parser.cells[f'D{row}'] = {'t': 'Quantity', 'f': '2', 'cf': '1', 'bg': '1'}
    parser.cells[f'E{row}'] = {
        't': 'Unit Price', 'f': '2', 'cf': '1', 'bg': '1'}
    parser.cells[f'F{row}'] = {'t': 'Amount', 'f': '2', 'cf': '1', 'bg': '1'}
    parser.formats['color']['1'] = 'rgb(240,240,240)'
    row += 1

    # Items
    for item in invoice_data.get('items', []):
        parser.cells[f'B{row}'] = {'t': item.get('description', '')}
        parser.cells[f'D{row}'] = {'v': str(item.get('quantity', 1))}
        parser.cells[f'E{row}'] = {
            'v': str(item.get('unit_price', 0)), 'ntvf': '1'}
        parser.cells[f'F{row}'] = {
            'v': str(item.get('amount', 0)), 'ntvf': '1'}
        row += 1

    row += 1

    # Totals
    parser.cells[f'E{row}'] = {'t': 'Subtotal', 'f': '2', 'cf': '2'}
    parser.cells[f'F{row}'] = {
        'v': str(invoice_data.get('subtotal', 0)), 'ntvf': '1'}
    parser.formats['cellformat']['2'] = 'right'
    row += 1

    parser.cells[f'E{row}'] = {
        't': f"Tax ({invoice_data.get('tax_rate', 0)}%)", 'f': '2', 'cf': '2'}
    parser.cells[f'F{row}'] = {
        'v': str(invoice_data.get('tax_amount', 0)), 'ntvf': '1'}
    row += 1

    parser.cells[f'E{row}'] = {'t': 'TOTAL', 'f': '3', 'cf': '2', 'bg': '2'}
    parser.cells[f'F{row}'] = {
        'v': str(invoice_data.get('total', 0)), 'ntvf': '1', 'bg': '2'}
    parser.formats['font']['3'] = 'normal bold 14pt *'
    parser.formats['color']['2'] = 'rgb(220,220,220)'
    row += 2

    # Notes
    if invoice_data.get('notes'):
        parser.cells[f'B{row}'] = {'t': 'Notes', 'f': '2'}
        row += 1
        parser.cells[f'B{row}'] = {'t': invoice_data['notes'], 'colspan': '5'}

    # Set sheet dimensions
    parser.sheet_info = {'c': 6, 'r': row}

    # Set value format for currency
    parser.formats['valueformat']['1'] = '$#,##0.00'

    return parser.to_msc()
