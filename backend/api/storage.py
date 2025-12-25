"""
Storage API routes - Templates and Invoices.
"""
from flask import Blueprint, request, jsonify
from services.s3_store import S3Store

storage_bp = Blueprint('storage', __name__, url_prefix='/api')

# Initialize S3 Store
s3_store = S3Store()


# ============== Template Endpoints ==============

@storage_bp.route('/templates', methods=['GET'])
def list_templates():
    """List available templates"""
    template_type = request.args.get('type', 'app')
    user_id = request.args.get('userId', 'default_user')
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
    except (ValueError, TypeError):
        page = 1
        limit = 10

    result = s3_store.list_templates(template_type, user_id=user_id, page=page, limit=limit)
    return jsonify({
        'success': True,
        'data': result['items'],
        'pagination': {
            'total': result['total'],
            'page': result['page'],
            'limit': result['limit']
        }
    })


@storage_bp.route('/templates/<path:filename>', methods=['GET'])
def get_template(filename):
    """Get a specific template"""
    template_type = request.args.get('type', 'user')
    user_id = request.args.get('userId', 'default_user')
    
    # Map 'global' to 'app' for bucket_type
    bucket_type = 'app' if template_type == 'global' else template_type
    template = s3_store.get_template(filename, bucket_type=bucket_type, user_id=user_id)
    if template:
        return jsonify({
            'success': True,
            'data': template
        })
    return jsonify({
        'success': False,
        'error': 'Template not found'
    }), 404


@storage_bp.route('/templates/<path:filename>', methods=['DELETE'])
def delete_template(filename):
    """Delete a user template"""
    user_id = request.args.get('userId', 'default_user')
    if s3_store.delete_user_template(filename, user_id=user_id):
        return jsonify({"success": True, "message": "Template deleted successfully"})
    return jsonify({"success": False, "error": "Failed to delete template"}), 500


@storage_bp.route('/templates/<path:filename>/meta', methods=['PATCH'])
def update_template_meta(filename):
    """Update user template metadata"""
    data = request.get_json()
    user_id = data.get('userId', 'default_user')
    updates = data.get('updates', {})
    
    if not updates:
        return jsonify({'success': False, 'error': 'No updates provided'}), 400
    
    if s3_store.update_user_template_meta(filename, updates, user_id=user_id):
        return jsonify({'success': True, 'message': 'Template metadata updated'})
    return jsonify({'success': False, 'error': 'Failed to update template'}), 500


@storage_bp.route('/templates/import', methods=['POST'])
def import_template():
    """Import a template to user bucket"""
    data = request.json
    filename = data.get('filename')
    target_filename = data.get('targetFilename')
    user_id = data.get('userId', 'default_user')
    
    if not filename:
        return jsonify({'success': False, 'error': 'Filename required'}), 400
        
    result = s3_store.import_template(filename, target_filename=target_filename, user_id=user_id)
    
    if result:
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Import failed'}), 500


# ============== Invoice Endpoints ==============

@storage_bp.route('/invoices', methods=['GET'])
def list_invoices():
    """List saved invoices"""
    user_id = request.args.get('userId', 'default_user')
    invoices = s3_store.list_invoices(user_id=user_id)
    return jsonify(invoices)


@storage_bp.route('/invoices', methods=['POST'])
def save_invoice():
    """Save an invoice"""
    data = request.json
    filename = data.get('filename')
    content = data.get('content')
    template_id = data.get('templateId')
    bill_type = data.get('billType', 1)
    user_id = data.get('userId', 'default_user')
    invoice_id = data.get('invoiceId')
    total = data.get('total')
    # New fields
    invoice_name = data.get('invoiceName')
    status = data.get('status', 'draft')
    invoice_number = data.get('invoiceNumber')
    app_mapping = data.get('appMapping')
    footer = data.get('footer')

    if not filename or not content:
        return jsonify({"error": "Filename and content are required"}), 400

    if s3_store.save_invoice(filename, content, template_id, bill_type, user_id=user_id, 
                              invoice_id=invoice_id, total=total, invoice_name=invoice_name,
                              status=status, invoice_number=invoice_number,
                              app_mapping=app_mapping, footer=footer):
        return jsonify({"message": "Invoice saved successfully"})
    return jsonify({"error": "Failed to save invoice"}), 500


@storage_bp.route('/invoices/<path:filename>', methods=['GET'])
def get_invoice(filename):
    """Get a specific invoice"""
    user_id = request.args.get('userId', 'default_user')
    invoice = s3_store.get_invoice(filename, user_id=user_id)
    if invoice:
        return jsonify(invoice)
    return jsonify({"error": "Invoice not found"}), 404


@storage_bp.route('/invoices/<path:filename>', methods=['DELETE'])
def delete_invoice(filename):
    """Delete an invoice"""
    user_id = request.args.get('userId', 'default_user')
    if s3_store.delete_invoice(filename, user_id=user_id):
        return jsonify({"message": "Invoice deleted successfully"})
    return jsonify({"error": "Failed to delete invoice"}), 500


# ============== Admin Endpoints ==============

@storage_bp.route('/admin/seed-templates', methods=['POST'])
def seed_templates():
    """Seed templates to S3 (Admin utility)"""
    data = request.get_json()
    if not data or 'templates' not in data:
        return jsonify({
            'success': False,
            'error': 'Missing templates data'
        }), 400
        
    results = []
    for t in data['templates']:
        filename = t.get('filename')
        content = t.get('content')
        if filename and content:
            success = s3_store.save_template(filename, content)
            results.append({'filename': filename, 'success': success})
            
    return jsonify({
        'success': True,
        'results': results
    })
