"""
Test script for invoice image upload functionality
"""
import requests
import base64
import json
from pathlib import Path

# API endpoint
BASE_URL = "http://localhost:8000/api"


def encode_image_to_base64(image_path: str) -> str:
    """Encode an image file to base64 string"""
    with open(image_path, "rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode('utf-8')
        # Return with data URL prefix
        return f"data:image/jpeg;base64,{encoded}"


def test_generate_invoice_with_image(image_path: str = None):
    """Test generating invoice with an image reference"""

    # Prepare request data
    request_data = {
        "initial_prompt": "Create a professional invoice based on the attached image. Extract all the details you can see.",
    }

    # Add image if provided
    if image_path and Path(image_path).exists():
        print(f"Encoding image: {image_path}")
        request_data["invoice_image"] = encode_image_to_base64(image_path)
        print("Image encoded successfully")

    # Send request
    print(f"\nSending request to {BASE_URL}/generate-invoice")
    response = requests.post(
        f"{BASE_URL}/generate-invoice",
        json=request_data,
        headers={"Content-Type": "application/json"}
    )

    # Check response
    if response.status_code == 200:
        result = response.json()
        print("\n✅ SUCCESS!")
        print(f"Session ID: {result['session_id']}")
        print(f"Message: {result['message']}")
        print(f"\nToken count: {result['token_count']}")

        # Save session ID for follow-up
        return result['session_id']
    else:
        print(f"\n❌ ERROR: {response.status_code}")
        print(response.text)
        return None


def test_chat_with_image(session_id: str, message: str, image_path: str = None):
    """Test chat endpoint with image"""

    request_data = {
        "session_id": session_id,
        "message": message,
    }

    # Add image if provided
    if image_path and Path(image_path).exists():
        print(f"Encoding image: {image_path}")
        request_data["invoice_image"] = encode_image_to_base64(image_path)
        print("Image encoded successfully")

    # Send request
    print(f"\nSending chat request to {BASE_URL}/chat")
    response = requests.post(
        f"{BASE_URL}/chat",
        json=request_data,
        headers={"Content-Type": "application/json"}
    )

    # Check response
    if response.status_code == 200:
        result = response.json()
        print("\n✅ SUCCESS!")
        print(f"Message: {result['message']}")
        print(f"\nToken count: {result['token_count']}")
    else:
        print(f"\n❌ ERROR: {response.status_code}")
        print(response.text)


def main():
    """Run tests"""
    print("="*60)
    print("Testing Invoice Image Upload Functionality")
    print("="*60)

    # Test 1: Generate invoice without image
    print("\n\n--- Test 1: Generate invoice without image ---")
    session_id = test_generate_invoice_with_image()

    if session_id:
        # Test 2: Follow-up chat without image
        print("\n\n--- Test 2: Follow-up chat without image ---")
        test_chat_with_image(
            session_id,
            "Add 2 items: Web Development for $1500 and Design Services for $800"
        )

    # Test 3: Generate invoice WITH image (if you have a sample image)
    # Uncomment and provide path to test image
    # print("\n\n--- Test 3: Generate invoice WITH image ---")
    # sample_image_path = "/path/to/sample/invoice.jpg"
    # session_id_with_image = test_generate_invoice_with_image(sample_image_path)

    # if session_id_with_image:
    #     # Test 4: Follow-up with another image
    #     print("\n\n--- Test 4: Follow-up with different image ---")
    #     test_chat_with_image(
    #         session_id_with_image,
    #         "Update the invoice based on this new image",
    #         "/path/to/another/invoice.jpg"
    #     )

    print("\n\n" + "="*60)
    print("Tests completed!")
    print("="*60)


if __name__ == "__main__":
    main()
