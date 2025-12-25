"""
API module - Flask Blueprints for all API routes.
"""

def register_blueprints(app):
    """Register all API blueprints with the Flask app."""
    from api.auth import auth_bp
    from api.agent import agent_bp
    from api.pdf import pdf_bp
    from api.storage import storage_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(storage_bp)
