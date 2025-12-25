"""
PDF Generator for SocialCalc Spreadsheets
Converts SocialCalc MSC format to PDF with customizable settings
"""

from reportlab.lib.pagesizes import A4, LETTER, LEGAL, landscape, portrait
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from io import BytesIO
import base64
import re
from typing import Dict, Any, List, Tuple, Optional


class SocialCalcPDFGenerator:
    """Generate PDF from SocialCalc spreadsheet data"""

    # Paper size mappings (width, height in points)
    PAPER_SIZES = {
        'a4': A4,
        'letter': LETTER,
        'legal': LEGAL
    }

    def __init__(self):
        self.styles = getSampleStyleSheet()

    def parse_msc_data(self, msc_data: str) -> Dict[str, Any]:
        """
        Parse MSC format data into structured format

        Format:
        version:1.5
        cell:A1:t:Hello:f:1
        cell:B2:v:100
        sheet:c:5:r:10
        """
        cells = {}
        max_col = 0
        max_row = 0

        lines = msc_data.strip().split('\n')

        for line in lines:
            line = line.strip()
            if line.startswith('cell:'):
                # Parse cell definition
                parts = line.split(':')
                if len(parts) >= 4:
                    cell_ref = parts[1]  # e.g., A1
                    cell_type = parts[2]  # t=text, v=value, etc.
                    cell_value = parts[3] if len(parts) > 3 else ''

                    # Parse formatting if present
                    format_info = {}
                    for i in range(4, len(parts), 2):
                        if i + 1 < len(parts):
                            format_key = parts[i]
                            format_val = parts[i + 1]
                            format_info[format_key] = format_val

                    # Convert cell reference to row/col
                    col, row = self._cell_ref_to_coords(cell_ref)

                    cells[cell_ref] = {
                        'value': cell_value,
                        'type': cell_type,
                        'format': format_info,
                        'row': row,
                        'col': col
                    }

                    max_col = max(max_col, col)
                    max_row = max(max_row, row)

            elif line.startswith('sheet:'):
                # Parse sheet dimensions
                match = re.search(r'c:(\d+):r:(\d+)', line)
                if match:
                    max_col = max(max_col, int(match.group(1)))
                    max_row = max(max_row, int(match.group(2)))

        return {
            'cells': cells,
            'max_col': max_col,
            'max_row': max_row
        }

    def _cell_ref_to_coords(self, cell_ref: str) -> Tuple[int, int]:
        """Convert cell reference like 'A1' to (col, row) coordinates (0-indexed)"""
        match = re.match(r'([A-Z]+)(\d+)', cell_ref)
        if not match:
            return (0, 0)

        col_str, row_str = match.groups()

        # Convert column letters to number (A=0, B=1, ..., Z=25, AA=26, etc.)
        col = 0
        for char in col_str:
            col = col * 26 + (ord(char) - ord('A'))

        row = int(row_str) - 1  # Convert to 0-indexed

        return (col, row)

    def _coords_to_cell_ref(self, col: int, row: int) -> str:
        """Convert (col, row) coordinates to cell reference like 'A1'"""
        col_str = ''
        col_num = col
        while col_num >= 0:
            col_str = chr(ord('A') + (col_num % 26)) + col_str
            col_num = col_num // 26 - 1
            if col_num < 0:
                break

        return f"{col_str}{row + 1}"

    def create_table_data(self, parsed_data: Dict[str, Any]) -> List[List[str]]:
        """Create 2D table data from parsed cells"""
        cells = parsed_data['cells']
        max_col = parsed_data['max_col']
        max_row = parsed_data['max_row']

        # Initialize empty table
        table_data = [['' for _ in range(max_col + 1)] for _ in range(max_row + 1)]

        # Fill in cell values
        for cell_ref, cell_info in cells.items():
            col = cell_info['col']
            row = cell_info['row']
            value = cell_info['value']

            # Handle different cell types
            if cell_info['type'] == 't':  # text
                table_data[row][col] = str(value)
            elif cell_info['type'] == 'v':  # value/number
                table_data[row][col] = str(value)
            elif cell_info['type'] == 'vt':  # value with text
                table_data[row][col] = str(value)
            else:
                table_data[row][col] = str(value)

        return table_data

    def apply_table_style(self, table: Table, parsed_data: Dict[str, Any],
                          settings: Dict[str, Any]) -> None:
        """Apply styling to the table based on cell formatting and settings"""
        style_commands = [
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]

        # Add gridlines if enabled
        if settings.get('includeGridlines', True):
            style_commands.append(('GRID', (0, 0), (-1, -1), 0.5, colors.grey))

        # Apply cell-specific formatting
        cells = parsed_data.get('cells', {})
        for cell_ref, cell_info in cells.items():
            col = cell_info['col']
            row = cell_info['row']
            format_info = cell_info.get('format', {})

            # Apply bold formatting
            if format_info.get('f') == '1':
                style_commands.append(('FONTNAME', (col, row), (col, row), 'Helvetica-Bold'))

            # Apply background color if specified
            if 'bg' in format_info:
                # Parse color (format: "rgb(r,g,b)")
                color_match = re.match(r'rgb\((\d+),(\d+),(\d+)\)', format_info['bg'])
                if color_match:
                    r, g, b = map(int, color_match.groups())
                    style_commands.append(
                        ('BACKGROUND', (col, row), (col, row), colors.Color(r/255, g/255, b/255))
                    )

        table.setStyle(TableStyle(style_commands))

    def generate_pdf(self, msc_data: str, settings: Dict[str, Any]) -> bytes:
        """
        Generate PDF from MSC data with given settings

        Args:
            msc_data: SocialCalc MSC format string
            settings: PDF generation settings
                - orientation: 'portrait' or 'landscape'
                - paperSize: 'a4', 'letter', or 'legal'
                - margins: {'top': mm, 'right': mm, 'bottom': mm, 'left': mm}
                - scale: percentage (50-200)
                - fitToPage: boolean
                - includeGridlines: boolean

        Returns:
            PDF file as bytes
        """
        # Parse MSC data
        parsed_data = self.parse_msc_data(msc_data)

        # Get paper size
        paper_size = self.PAPER_SIZES.get(settings.get('paperSize', 'a4'), A4)

        # Apply orientation
        if settings.get('orientation', 'portrait') == 'landscape':
            paper_size = landscape(paper_size)
        else:
            paper_size = portrait(paper_size)

        # Get margins (convert mm to points)
        margins = settings.get('margins', {'top': 20, 'right': 20, 'bottom': 20, 'left': 20})
        top_margin = margins.get('top', 20) * mm
        right_margin = margins.get('right', 20) * mm
        bottom_margin = margins.get('bottom', 20) * mm
        left_margin = margins.get('left', 20) * mm

        # Create PDF buffer
        buffer = BytesIO()

        # Create document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=paper_size,
            topMargin=top_margin,
            rightMargin=right_margin,
            bottomMargin=bottom_margin,
            leftMargin=left_margin
        )

        # Create table data
        table_data = self.create_table_data(parsed_data)

        if not table_data or not any(any(cell for cell in row) for row in table_data):
            # Empty sheet - create placeholder
            table_data = [['No data to display']]

        # Calculate available width
        available_width = paper_size[0] - left_margin - right_margin
        available_height = paper_size[1] - top_margin - bottom_margin

        # Calculate column widths
        num_cols = len(table_data[0]) if table_data else 1

        # Apply scale factor
        scale = settings.get('scale', 100) / 100.0
        if settings.get('fitToPage', False):
            scale = 1.0

        # Calculate column widths (distribute evenly or fit to page)
        if settings.get('fitToPage', False):
            col_widths = [available_width / num_cols] * num_cols
        else:
            # Default column width with scale
            default_col_width = 100 * scale
            col_widths = [min(default_col_width, available_width / num_cols)] * num_cols

        # Create table
        table = Table(table_data, colWidths=col_widths, repeatRows=1)

        # Apply styling
        self.apply_table_style(table, parsed_data, settings)

        # Build PDF
        elements = [table]
        doc.build(elements)

        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()

        return pdf_bytes

    def generate_pdf_base64(self, msc_data: str, settings: Dict[str, Any]) -> str:
        """Generate PDF and return as base64 string"""
        pdf_bytes = self.generate_pdf(msc_data, settings)
        return base64.b64encode(pdf_bytes).decode('utf-8')


def generate_pdf_from_socialcalc(sheet_data: str, settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to generate PDF from SocialCalc data

    Args:
        sheet_data: MSC format string or JSON workbook format
        settings: PDF generation settings

    Returns:
        Dictionary with success status and PDF data
    """
    try:
        # Check if data is JSON format (workbook)
        import json
        try:
            workbook_data = json.loads(sheet_data)
            # Extract first sheet's savestr
            if 'sheetArr' in workbook_data:
                first_sheet_id = workbook_data.get('currentid', 'sheet1')
                sheet_arr = workbook_data['sheetArr']
                if first_sheet_id in sheet_arr:
                    msc_data = sheet_arr[first_sheet_id]['sheetstr']['savestr']
                else:
                    # Get first available sheet
                    first_sheet = list(sheet_arr.values())[0]
                    msc_data = first_sheet['sheetstr']['savestr']
            else:
                raise ValueError('Invalid workbook format')
        except (json.JSONDecodeError, KeyError, ValueError):
            # Assume it's raw MSC format
            msc_data = sheet_data

        # Generate PDF
        generator = SocialCalcPDFGenerator()
        pdf_base64 = generator.generate_pdf_base64(msc_data, settings)

        # Generate filename
        filename = f"spreadsheet_{settings.get('paperSize', 'a4')}_{settings.get('orientation', 'portrait')}.pdf"

        return {
            'success': True,
            'data': {
                'pdf': pdf_base64,
                'filename': filename
            }
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to generate PDF: {str(e)}'
        }


def generate_preview_image(sheet_data: str, settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a preview image (PNG) from SocialCalc data
    
    Args:
        sheet_data: MSC format string or JSON workbook format
        settings: Preview generation settings
        
    Returns:
        Dictionary with success status and preview image data
    """
    try:
        from reportlab.graphics import renderPM
        from reportlab.graphics.shapes import Drawing, Rect, String, Group
        from reportlab.lib.pagesizes import A4, LETTER, LEGAL, landscape, portrait
        from reportlab.lib import colors as rl_colors
        from io import BytesIO
        
        # Check if data is JSON format (workbook)
        import json
        try:
            workbook_data = json.loads(sheet_data)
            # Extract first sheet's savestr
            if 'sheetArr' in workbook_data:
                first_sheet_id = workbook_data.get('currentid', 'sheet1')
                sheet_arr = workbook_data['sheetArr']
                if first_sheet_id in sheet_arr:
                    msc_data = sheet_arr[first_sheet_id]['sheetstr']['savestr']
                else:
                    # Get first available sheet
                    first_sheet = list(sheet_arr.values())[0]
                    msc_data = first_sheet['sheetstr']['savestr']
            else:
                raise ValueError('Invalid workbook format')
        except (json.JSONDecodeError, KeyError, ValueError):
            # Assume it's raw MSC format
            msc_data = sheet_data
        
        # Parse MSC data
        generator = SocialCalcPDFGenerator()
        parsed_data = generator.parse_msc_data(msc_data)
        
        # Get paper size
        paper_sizes = {'a4': A4, 'letter': LETTER, 'legal': LEGAL}
        paper_size = paper_sizes.get(settings.get('paperSize', 'a4'), A4)
        
        # Apply orientation
        if settings.get('orientation', 'portrait') == 'landscape':
            paper_size = landscape(paper_size)
        else:
            paper_size = portrait(paper_size)
        
        # Create table data
        table_data = generator.create_table_data(parsed_data)
        
        if not table_data or not any(any(cell for cell in row) for row in table_data):
            table_data = [['No data to display']]
        
        # Create drawing for preview (scaled down for preview)
        preview_width = int(paper_size[0] * 0.5)  # 50% size for preview
        preview_height = int(paper_size[1] * 0.5)
        
        drawing = Drawing(preview_width, preview_height)
        
        # Add white background
        drawing.add(Rect(0, 0, preview_width, preview_height, fillColor=rl_colors.white, strokeColor=None))
        
        # Calculate table layout
        num_rows = len(table_data)
        num_cols = len(table_data[0]) if table_data else 0
        
        cell_width = preview_width / num_cols if num_cols > 0 else preview_width
        cell_height = 20  # Fixed cell height for preview
        
        # Draw table
        include_gridlines = settings.get('includeGridlines', True)
        
        y_pos = preview_height - 40  # Start from top with margin
        
        for row_idx, row in enumerate(table_data):
            x_pos = 20  # Left margin
            
            for col_idx, cell_value in enumerate(row):
                # Draw cell border if gridlines enabled
                if include_gridlines:
                    drawing.add(Rect(
                        x_pos, y_pos - cell_height, 
                        cell_width, cell_height,
                        fillColor=None,
                        strokeColor=rl_colors.grey,
                        strokeWidth=0.5
                    ))
                
                # Draw cell text
                if cell_value:
                    drawing.add(String(
                        x_pos + 3, y_pos - cell_height + 5,
                        str(cell_value),
                        fontSize=8,
                        fillColor=rl_colors.black
                    ))
                
                x_pos += cell_width
            
            y_pos -= cell_height
            
            # Stop if we've filled the preview height
            if y_pos < 20:
                break
        
        # Render to PNG
        buffer = BytesIO()
        renderPM.drawToFile(drawing, buffer, fmt='PNG')
        png_bytes = buffer.getvalue()
        buffer.close()
        
        # Convert to base64
        preview_base64 = base64.b64encode(png_bytes).decode('utf-8')
        
        return {
            'success': True,
            'data': {
                'preview': preview_base64
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to generate preview: {str(e)}'
        }
