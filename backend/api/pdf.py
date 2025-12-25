"""
PDF Generation API routes.
"""
from flask import Blueprint, request, jsonify, send_file
import os
import json
import time

pdf_bp = Blueprint('pdf', __name__, url_prefix='/api')


@pdf_bp.route('/generate-preview', methods=['POST'])
def generate_preview():
    """
    Generate a preview image from SocialCalc sheet data
    """
    try:
        data = request.get_json()

        if not data or 'sheetData' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing sheetData in request body'
            }), 400

        sheet_data = data.get('sheetData', '').strip()
        settings = data.get('settings', {})

        if not sheet_data:
            return jsonify({
                'success': False,
                'error': 'sheetData cannot be empty'
            }), 400

        # Generate preview HTML
        from services.html_preview import generate_html_preview
        result = generate_html_preview(sheet_data, settings)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error in generate_preview endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@pdf_bp.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    """
    Generate PDF from SocialCalc sheet data
    """
    try:
        data = request.get_json()

        if not data or 'sheetData' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing sheetData in request body'
            }), 400

        sheet_data = data.get('sheetData', '').strip()
        settings = data.get('settings', {})

        if not sheet_data:
            return jsonify({
                'success': False,
                'error': 'sheetData cannot be empty'
            }), 400

        # Generate PDF
        from services.pdf_generator import generate_pdf_from_socialcalc
        result = generate_pdf_from_socialcalc(sheet_data, settings)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error in generate_pdf endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@pdf_bp.route('/generate-pdf-from-html', methods=['POST'])
def generate_pdf_from_html_endpoint():
    """
    Generate PDF from SocialCalc HTML (same as preview)
    """
    try:
        data = request.get_json()

        if not data or 'sheetHTML' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing sheetHTML in request body'
            }), 400

        sheet_html = data.get('sheetHTML', '').strip()
        settings = data.get('settings', {})

        if not sheet_html:
            return jsonify({
                'success': False,
                'error': 'sheetHTML cannot be empty'
            }), 400

        # Generate PDF from HTML
        from services.pdf_from_html import generate_pdf_from_html
        result = generate_pdf_from_html(sheet_html, settings)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f"Error in generate_pdf_from_html endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@pdf_bp.route('/htmltopdf', methods=['GET'])
def get_htmltopdf():
    """
    Retrieve a previously generated PDF by file ID
    """
    try:
        fname = request.args.get('fname')
        action = request.args.get('action', None)
        
        if not fname:
            return jsonify({
                'success': False,
                'error': 'Missing fname parameter'
            }), 400
        
        # Determine storage path
        base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tmp')
        if action == 'preview':
            storage_path = os.path.join(base_path, 'preview')
        else:
            storage_path = base_path
        
        pdf_file = os.path.join(storage_path, f"{fname}.pdf")
        
        if os.path.exists(pdf_file):
            return send_file(pdf_file, mimetype='application/pdf')
        else:
            return jsonify({
                'success': False,
                'error': 'PDF not found'
            }), 404
            
    except Exception as e:
        print(f"Error in get_htmltopdf endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@pdf_bp.route('/htmltopdf', methods=['POST'])
def post_htmltopdf():
    """
    Generate PDF from HTML and store on disk
    """
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            content = data.get('content', '')
            action = data.get('action', None)
            uuid = data.get('uuid', None)
            appname = data.get('appname', None)
            filename = data.get('filename', None)
            settings = data.get('settings', {})
        else:
            content = request.form.get('content', '')
            action = request.form.get('action', None)
            uuid = request.form.get('uuid', None)
            appname = request.form.get('appname', None)
            filename = request.form.get('filename', None)
            settings = {}
        
        if not content:
            return jsonify({
                'success': False,
                'error': 'Missing content in request'
            }), 400
        
        # Generate PDF with storage
        from services.pdf_from_html import generate_pdf_from_html_with_storage
        result = generate_pdf_from_html_with_storage(content, settings, action)
        
        if result['success']:
            file_id = result['data']['fileId']
            
            # Save metadata if action is 'send'
            if action == 'send':
                base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'tmp')
                metadata = {
                    "uuid": uuid,
                    "appname": appname,
                    "filename": filename,
                    "created": time.strftime("%Y:%m:%d %H:%M:%S")
                }
                json_file = os.path.join(base_path, f"{file_id}.json")
                with open(json_file, 'w') as f:
                    json.dump(metadata, f)
            
            # Build PDF URL
            pdfurl = f"http://{request.host}/api/htmltopdf?fname={file_id}"
            if action:
                pdfurl += f"&action={action}"
            
            return jsonify({
                'success': True,
                'pdfurl': pdfurl,
                'fileId': file_id,
                'pdf': result['data']['pdf'],
                'result': 'ok'
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'PDF generation failed')
            }), 500
            
    except Exception as e:
        print(f"Error in post_htmltopdf endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500
