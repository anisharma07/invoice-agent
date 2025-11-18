"""
Example script to test logging for the generate-invoice API endpoint
"""
import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

# Example request payload
payload = {
    "initial_prompt": "Create a professional invoice template for a coffee shop with sections for customer details, items ordered, quantities, prices, and total amount",
    "invoice_image": None,  # Optional: Add base64 encoded image here
    "session_id": None  # Let the server generate a new session ID
}

print("Sending request to /api/generate-invoice endpoint...")
print(f"Prompt: {payload['initial_prompt'][:80]}...")
print()

try:
    # Make the API call
    response = requests.post(
        f"{BASE_URL}/api/generate-invoice",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    # Check response status
    if response.status_code == 200:
        print("✓ Request successful!")
        print()

        # Parse response
        result = response.json()

        print("Response Summary:")
        print(f"  Session ID: {result.get('session_id')}")
        print(
            f"  Template Name: {result.get('assistantResponse', {}).get('templateMeta', {}).get('name', 'N/A')}")
        print(
            f"  Validation Valid: {result.get('validation', {}).get('is_valid', False)}")
        print(
            f"  Validation Attempts: {result.get('validation', {}).get('attempts', 0)}")
        print(f"  Token Count: {result.get('token_count', 0)}")
        print()

        # Save response to file
        with open('test_response.json', 'w') as f:
            json.dump(result, f, indent=2)
        print("✓ Full response saved to test_response.json")
        print()

        print("Check the following for detailed logs:")
        print("  1. Console output (stdout)")
        print("  2. backend/invoice_agent.log file")
        print()
        print("To view logs:")
        print("  cat backend/invoice_agent.log")
        print("  tail -f backend/invoice_agent.log  # Follow live logs")

    else:
        print(f"✗ Request failed with status code: {response.status_code}")
        print(f"Error: {response.text}")

except requests.exceptions.ConnectionError:
    print("✗ Connection error: Make sure the API server is running")
    print("Run: python -m app.main")
except Exception as e:
    print(f"✗ Error: {str(e)}")
