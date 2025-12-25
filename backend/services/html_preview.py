"""
HTML Preview Generator for SocialCalc
Generates HTML preview instead of PNG to avoid Cairo dependencies
"""

import base64
from typing import Dict, Any
import json


def generate_html_preview(sheet_data: str, settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an HTML preview from SocialCalc data
    
    Args:
        sheet_data: MSC format string or JSON workbook format
        settings: Preview generation settings
        
    Returns:
        Dictionary with success status and HTML preview data
    """
    try:
        # Check if data is JSON format (workbook)
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
        cells = {}
        max_row = 0
        max_col = 0
        
        lines = msc_data.strip().split('\n')
        
        for line in lines:
            if line.startswith('cell:'):
                parts = line.split(':')
                if len(parts) >= 4:
                    cell_ref = parts[1]
                    cell_type = parts[2]
                    cell_value = parts[3] if len(parts) > 3 else ''
                    
                    # Parse formatting
                    is_bold = False
                    bg_color = ''
                    text_color = ''
                    
                    for i in range(4, len(parts), 2):
                        if i + 1 < len(parts):
                            if parts[i] == 'f' and parts[i + 1] == '1':
                                is_bold = True
                            elif parts[i] == 'bg':
                                bg_color = parts[i + 1]
                            elif parts[i] == 'color':
                                text_color = parts[i + 1]
                    
                    # Parse cell reference
                    import re
                    match = re.match(r'([A-Z]+)(\d+)', cell_ref)
                    if match:
                        col_str = match.group(1)
                        row_num = int(match.group(2))
                        
                        # Convert column letters to number
                        col = 0
                        for char in col_str:
                            col = col * 26 + (ord(char) - 65)
                        
                        max_row = max(max_row, row_num)
                        max_col = max(max_col, col)
                        
                        cells[cell_ref] = {
                            'value': cell_value,
                            'bold': is_bold,
                            'bg': bg_color,
                            'color': text_color,
                            'row': row_num - 1,
                            'col': col
                        }
        
        # Build HTML table
        include_gridlines = settings.get('includeGridlines', True)
        
        html = '''
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif; 
            background: white;
        }
        table { 
            border-collapse: collapse; 
            width: 100%;
            font-size: 11px;
        }
        td { 
            padding: 4px 6px;
            min-width: 60px;
            height: 20px;
            vertical-align: middle;
'''
        
        if include_gridlines:
            html += '''
            border: 1px solid #c0c0c0;
'''
        
        html += '''
        }
        .bold { font-weight: bold; }
    </style>
</head>
<body>
    <table>
'''
        
        # Generate table rows
        for row in range(max_row):
            html += '        <tr>\n'
            for col in range(max_col + 1):
                # Find cell
                cell_ref = ''
                col_num = col
                while col_num >= 0:
                    cell_ref = chr(65 + (col_num % 26)) + cell_ref
                    col_num = col_num // 26 - 1
                    if col_num < 0:
                        break
                cell_ref += str(row + 1)
                
                cell = cells.get(cell_ref, {})
                value = cell.get('value', '')
                
                # Build cell style
                style_parts = []
                if cell.get('bg'):
                    style_parts.append(f"background-color: {cell['bg']}")
                if cell.get('color'):
                    style_parts.append(f"color: {cell['color']}")
                
                style_attr = f' style="{"; ".join(style_parts)}"' if style_parts else ''
                class_attr = ' class="bold"' if cell.get('bold') else ''
                
                html += f'            <td{style_attr}{class_attr}>{value}</td>\n'
            
            html += '        </tr>\n'
        
        html += '''    </table>
</body>
</html>
'''
        
        # Encode HTML as base64
        html_base64 = base64.b64encode(html.encode('utf-8')).decode('utf-8')
        
        return {
            'success': True,
            'data': {
                'preview': html_base64,
                'type': 'html'
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to generate preview: {str(e)}'
        }
