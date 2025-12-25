"""
SocialCalc Agent API - Main Application Entry Point

This is the slim entry point that initializes Flask and registers all API blueprints.
All route handlers are organized in the api/ module.
"""
from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Create Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": True}})

# Register all API blueprints
from api import register_blueprints
register_blueprints(app)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
