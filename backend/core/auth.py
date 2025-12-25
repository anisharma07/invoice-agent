"""
AWS Cognito JWT Token Verification for Flask

This module provides JWT token verification using AWS Cognito's JWKS (JSON Web Key Sets).
It verifies tokens from the Authorization header and provides user info to protected endpoints.
"""

import os
import json
import time
import requests
import jwt
from jwt import PyJWKClient
from functools import wraps
from flask import request, jsonify, g

# Cognito configuration from environment
COGNITO_REGION = os.getenv('COGNITO_REGION', 'us-east-1')
COGNITO_USER_POOL_ID = os.getenv('COGNITO_USER_POOL_ID')
COGNITO_APP_CLIENT_ID = os.getenv('COGNITO_APP_CLIENT_ID')

# Cognito JWKS URL
COGNITO_ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}"
JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"

# Cache for JWKS client
_jwks_client = None
_jwks_cache_time = 0
JWKS_CACHE_DURATION = 3600  # 1 hour


def get_jwks_client():
    """Get cached JWKS client or create a new one."""
    global _jwks_client, _jwks_cache_time
    
    current_time = time.time()
    if _jwks_client is None or (current_time - _jwks_cache_time) > JWKS_CACHE_DURATION:
        _jwks_client = PyJWKClient(JWKS_URL)
        _jwks_cache_time = current_time
    
    return _jwks_client


def verify_cognito_token(token):
    """
    Verify a Cognito JWT token.
    
    Args:
        token: The JWT token string (without 'Bearer ' prefix)
        
    Returns:
        dict: Decoded token claims if valid
        
    Raises:
        Exception: If token is invalid or verification fails
    """
    if not COGNITO_USER_POOL_ID or not COGNITO_APP_CLIENT_ID:
        raise Exception("Cognito configuration missing. Set COGNITO_USER_POOL_ID and COGNITO_APP_CLIENT_ID")
    
    try:
        # Get the signing key
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Decode and verify the token
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=COGNITO_ISSUER,
            options={
                "verify_aud": False,  # Cognito uses 'client_id' claim instead of 'aud'
                "verify_exp": True,
            }
        )
        
        # Verify the client_id claim
        token_client_id = claims.get('client_id') or claims.get('aud')
        if token_client_id != COGNITO_APP_CLIENT_ID:
            raise Exception("Token was not issued for this application")
        
        # Verify token_use (should be 'access' or 'id')
        token_use = claims.get('token_use')
        if token_use not in ['access', 'id']:
            raise Exception("Invalid token type")
        
        return claims
        
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError as e:
        raise Exception(f"Invalid token: {str(e)}")
    except Exception as e:
        raise Exception(f"Token verification failed: {str(e)}")


def get_user_from_token(claims):
    """
    Extract user information from token claims.
    
    Args:
        claims: Decoded JWT claims
        
    Returns:
        dict: User information
    """
    return {
        'sub': claims.get('sub'),  # Unique user ID
        'email': claims.get('email'),
        'name': claims.get('name') or claims.get('cognito:username'),
        'username': claims.get('cognito:username') or claims.get('username'),
        'email_verified': claims.get('email_verified', False),
        'auth_time': claims.get('auth_time'),
    }


def require_auth(f):
    """
    Decorator to require authentication for a Flask route.
    
    Usage:
        @app.route('/protected')
        @require_auth
        def protected_route():
            user = g.user  # Access authenticated user
            return jsonify({'message': f'Hello, {user["email"]}'})
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'Authorization header missing'
            }), 401
        
        # Extract token (remove 'Bearer ' prefix if present)
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        else:
            token = auth_header
        
        try:
            # Verify token
            claims = verify_cognito_token(token)
            
            # Store user info in Flask's g object
            g.user = get_user_from_token(claims)
            g.token_claims = claims
            
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 401
    
    return decorated


def optional_auth(f):
    """
    Decorator for routes where authentication is optional.
    If a valid token is provided, user info is available in g.user.
    If no token or invalid token, g.user is None but the request continues.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        g.user = None
        g.token_claims = None
        
        if auth_header:
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
            else:
                token = auth_header
            
            try:
                claims = verify_cognito_token(token)
                g.user = get_user_from_token(claims)
                g.token_claims = claims
            except:
                pass  # Silently continue without user info
        
        return f(*args, **kwargs)
    
    return decorated
