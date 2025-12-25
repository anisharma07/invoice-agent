#!/bin/bash

# Script to start the Flask backend server

echo "Starting SocialCalc AI Agent Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo "Error: .env file not found in parent directory!"
    echo "Please create a .env file with your AWS credentials."
    exit 1
fi

# Start Flask server
echo "Starting Flask server on http://localhost:5000"
python app.py
