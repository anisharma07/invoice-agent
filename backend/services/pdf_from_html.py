"""
PDF Generator from HTML
Converts SocialCalc HTML table to PDF using wkhtmltopdf (like invoice-editor)
"""

import base64
import os
import random
import string
import subprocess
import tempfile
from typing import Dict, Any


def get_random_string(size: int = 20) -> str:
    """Generate a random string for unique filenames"""
    char_set = string.ascii_uppercase + string.digits
    return ''.join(random.sample(char_set, size))


def generate_pdf_from_html(sheet_html: str, settings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate PDF from SocialCalc HTML using wkhtmltopdf
    
    Args:
        sheet_html: HTML string from SocialCalc's CreateSheetHTML()
        settings: PDF generation settings
    
    Returns:
        Dictionary with success status and PDF data (base64 encoded)
    """
    try:
        # Extract table from HTML if present
        html_content = sheet_html
        if '<table' in html_content:
            # Extract table element
            table_start = html_content.find('<table')
            table_end = html_content.find('</table>') + 8
            if table_start >= 0 and table_end > table_start:
                table_html = html_content[table_start:table_end]
            else:
                table_html = html_content
        else:
            # If no table, use the full HTML content
            table_html = html_content

        # Paper size mappings for wkhtmltopdf
        paper_sizes = {
            'a3': 'A3',
            'a4': 'A4',
            'a5': 'A5',
            'b4': 'B4',
            'b5': 'B5',
            'letter': 'Letter',
            'legal': 'Legal',
            'tabloid': 'Tabloid',
            'statement': 'Statement',
            'executive': 'Executive',
            'folio': 'Folio'
        }

        # Get margins from settings
        margins = settings.get('margins', {'top': 20, 'right': 20, 'bottom': 20, 'left': 20})
        margin_top = margins.get('top', 20)
        margin_right = margins.get('right', 20)
        margin_bottom = margins.get('bottom', 20)
        margin_left = margins.get('left', 20)

        # Get paper size and orientation
        paper_size = settings.get('paperSize', 'a4')
        orientation = settings.get('orientation', 'portrait')
        page_size = paper_sizes.get(paper_size.lower(), 'A4')

        # Build CSS
        include_gridlines = settings.get('includeGridlines', True)
        scale = settings.get('scale', 100) / 100.0
        fit_to_page = settings.get('fitToPage', False)

        # CSS styling for gridlines
        gridline_css = ""
        if include_gridlines:
            gridline_css = "td, th { border: 1px solid #e0e0e0; }"

        # CSS transform for scaling
        zoom_css = ""
        if not fit_to_page and scale != 1.0:
            zoom_css = f"table {{ transform: scale({scale}); transform-origin: top left; }}"

        css_content = f"""
            * {{ box-sizing: border-box; }}
            body {{ margin: 0; padding: 0; font-family: Arial, sans-serif; }}
            table {{ border-collapse: collapse; width: {'100%' if fit_to_page else 'auto'}; table-layout: auto; }}
            {zoom_css}
            td, th {{ padding: 2px 4px; vertical-align: middle; white-space: nowrap; }}
            {gridline_css}
        """

        # Build complete HTML
        complete_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>{css_content}</style>
</head>
<body>
    {table_html}
</body>
</html>
"""

        # Create temporary files for HTML input and PDF output
        with tempfile.TemporaryDirectory() as tmp_dir:
            fname = get_random_string(20)
            html_file = os.path.join(tmp_dir, f"{fname}.html")
            pdf_file = os.path.join(tmp_dir, f"{fname}.pdf")

            # Write HTML to temp file
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(complete_html)

            cmd = [
                'wkhtmltopdf',
                '--quiet',
                '--enable-local-file-access',
                '--page-size', page_size,
                '--orientation', orientation.capitalize(),
                '--margin-top', f'{margin_top}mm',
                '--margin-right', f'{margin_right}mm',
                '--margin-bottom', f'{margin_bottom}mm',
                '--margin-left', f'{margin_left}mm',
                '--encoding', 'UTF-8',
            ]

            # Add input and output files
            cmd.extend([html_file, pdf_file])

            # Run wkhtmltopdf
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60  # 60 second timeout
            )

            # Check if PDF was created successfully
            if not os.path.exists(pdf_file):
                error_msg = result.stderr if result.stderr else 'PDF generation failed'
                return {
                    'success': False,
                    'error': f'wkhtmltopdf failed: {error_msg}'
                }

            # Read PDF and convert to base64
            with open(pdf_file, 'rb') as f:
                pdf_bytes = f.read()

            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

            # Generate filename
            filename = f"spreadsheet_{paper_size}_{orientation}.pdf"

            return {
                'success': True,
                'data': {
                    'pdf': pdf_base64,
                    'filename': filename
                }
            }

    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'PDF generation timed out'
        }
    except FileNotFoundError:
        return {
            'success': False,
            'error': 'wkhtmltopdf not found. Please install it: sudo apt install wkhtmltopdf'
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Failed to generate PDF: {str(e)}'
        }


def generate_pdf_from_html_with_storage(
    sheet_html: str, 
    settings: Dict[str, Any],
    action: str = None,
    base_path: str = None
) -> Dict[str, Any]:
    """
    Generate PDF from HTML and optionally store on disk (like invoice-editor)
    
    Args:
        sheet_html: HTML string from SocialCalc's CreateSheetHTML()
        settings: PDF generation settings
        action: Optional action type ('preview', 'send', or None)
        base_path: Base path for storing PDFs on disk
    
    Returns:
        Dictionary with success status, PDF data, and file path
    """
    try:
        # Extract table from HTML if present
        html_content = sheet_html
        if '<table' in html_content:
            table_start = html_content.find('<table')
            table_end = html_content.find('</table>') + 8
            if table_start >= 0 and table_end > table_start:
                table_html = html_content[table_start:table_end]
            else:
                table_html = html_content
        else:
            table_html = html_content

        # Paper size mappings
        paper_sizes = {
            'a3': 'A3', 'a4': 'A4', 'a5': 'A5',
            'b4': 'B4', 'b5': 'B5',
            'letter': 'Letter', 'legal': 'Legal', 'tabloid': 'Tabloid',
            'statement': 'Statement', 'executive': 'Executive', 'folio': 'Folio'
        }

        paper_size = settings.get('paperSize', 'a4')
        orientation = settings.get('orientation', 'portrait')
        page_size = paper_sizes.get(paper_size.lower(), 'A4')

        margins = settings.get('margins', {'top': 20, 'right': 20, 'bottom': 20, 'left': 20})
        include_gridlines = settings.get('includeGridlines', True)
        scale = settings.get('scale', 100) / 100.0
        fit_to_page = settings.get('fitToPage', False)

        # CSS styling - preserve original SocialCalc borders
        # When includeGridlines is True: add light gray background grid
        # When False: don't add border CSS, let original borders show
        gridline_css = ""
        if include_gridlines:
            gridline_css = "td, th { border: 1px solid #e0e0e0; }"
        
        zoom_css = ""
        if not fit_to_page and scale != 1.0:
            zoom_css = f"table {{ transform: scale({scale}); transform-origin: top left; }}"

        # Get margins
        margin_top = margins.get('top', 20)
        margin_right = margins.get('right', 20)
        margin_bottom = margins.get('bottom', 20)
        margin_left = margins.get('left', 20)

        css_content = f"""
            * {{ box-sizing: border-box; }}
            body {{ margin: 0; padding: 0; font-family: Arial, sans-serif; }}
            table {{ border-collapse: collapse; width: {'100%' if fit_to_page else 'auto'}; table-layout: auto; }}
            {zoom_css}
            td, th {{ padding: 2px 4px; vertical-align: middle; white-space: nowrap; }}
            {gridline_css}
        """

        complete_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>{css_content}</style>
</head>
<body>
    {table_html}
</body>
</html>
"""

        # Determine storage path
        if base_path is None:
            base_path = os.path.join(os.path.dirname(__file__), 'tmp')
        
        if action == 'preview':
            storage_path = os.path.join(base_path, 'preview')
        else:
            storage_path = base_path

        # Ensure directory exists
        os.makedirs(storage_path, exist_ok=True)

        # Generate unique filename
        while True:
            fname = get_random_string(20)
            full_path = os.path.join(storage_path, fname)
            if not os.path.exists(f"{full_path}.pdf"):
                break

        html_file = f"{full_path}.html"
        pdf_file = f"{full_path}.pdf"

        # Write HTML
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(complete_html)

        # Build wkhtmltopdf command
        cmd = [
            'wkhtmltopdf', '--quiet', '--enable-local-file-access',
            '--page-size', page_size,
            '--orientation', orientation.capitalize(),
            '--margin-top', f'{margin_top}mm',
            '--margin-right', f'{margin_right}mm',
            '--margin-bottom', f'{margin_bottom}mm',
            '--margin-left', f'{margin_left}mm',
            '--encoding', 'UTF-8',
        ]

        cmd.extend([html_file, pdf_file])

        # Run wkhtmltopdf
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

        if not os.path.exists(pdf_file):
            return {
                'success': False,
                'error': f'wkhtmltopdf failed: {result.stderr or "Unknown error"}'
            }

        # Read PDF for base64 response
        with open(pdf_file, 'rb') as f:
            pdf_bytes = f.read()

        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        filename = f"spreadsheet_{paper_size}_{orientation}.pdf"

        # Clean up HTML file (keep PDF for retrieval)
        if os.path.exists(html_file):
            os.remove(html_file)

        return {
            'success': True,
            'data': {
                'pdf': pdf_base64,
                'filename': filename,
                'filePath': pdf_file,
                'fileId': fname,
                'action': action
            }
        }

    except subprocess.TimeoutExpired:
        return {'success': False, 'error': 'PDF generation timed out'}
    except FileNotFoundError:
        return {'success': False, 'error': 'wkhtmltopdf not found. Please install it.'}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': f'Failed to generate PDF: {str(e)}'}


def get_stored_pdf(file_id: str, action: str = None, base_path: str = None) -> Dict[str, Any]:
    """
    Retrieve a stored PDF by file ID (like invoice-editor GET endpoint)
    
    Args:
        file_id: The unique file identifier
        action: Action type ('preview' or None)
        base_path: Base path where PDFs are stored
    
    Returns:
        Dictionary with success status and PDF data
    """
    try:
        if base_path is None:
            base_path = os.path.join(os.path.dirname(__file__), 'tmp')

        if action == 'preview':
            storage_path = os.path.join(base_path, 'preview')
        else:
            storage_path = base_path

        pdf_file = os.path.join(storage_path, f"{file_id}.pdf")

        if os.path.exists(pdf_file):
            with open(pdf_file, 'rb') as f:
                pdf_bytes = f.read()
            
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            return {
                'success': True,
                'data': {
                    'pdf': pdf_base64,
                    'filename': f"{file_id}.pdf"
                }
            }
        else:
            return {
                'success': False,
                'error': 'PDF not found'
            }

    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to retrieve PDF: {str(e)}'
        }
