"""
Authentication API routes.
"""
from flask import Blueprint, request, jsonify, g
from core.auth import require_auth, verify_cognito_token, get_user_from_token

auth_bp = Blueprint('auth', __name__, url_prefix='/api')


@auth_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'SocialCalc Agent API is running'
    })


@auth_bp.route('/auth/verify', methods=['POST'])
def verify_token():
    """
    Verify a Cognito JWT token.
    
    Request JSON:
    {
        "token": "JWT access or id token"
    }
    
    Response JSON:
    {
        "success": true,
        "user": { "sub": "...", "email": "...", "name": "..." }
    }
    """
    try:
        data = request.get_json()
        token = data.get('token') if data else None
        
        if not token:
            # Try Authorization header
            auth_header = request.headers.get('Authorization')
            if auth_header:
                token = auth_header.replace('Bearer ', '')
        
        if not token:
            return jsonify({
                'success': False,
                'error': 'Token is required'
            }), 400
        
        claims = verify_cognito_token(token)
        user = get_user_from_token(claims)
        
        return jsonify({
            'success': True,
            'user': user
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 401


@auth_bp.route('/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    """
    Get current authenticated user profile.
    Requires Authorization header with valid JWT.
    
    Response JSON:
    {
        "success": true,
        "user": { "sub": "...", "email": "...", "name": "..." }
    }
    """
    return jsonify({
        'success': True,
        'user': g.user
    })
