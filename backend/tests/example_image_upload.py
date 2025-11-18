"""
Simple example demonstrating invoice image upload usage
"""
import requests
import base64
import json

# Configuration
API_BASE_URL = "http://localhost:8000/api"


def encode_image_file(image_path: str) -> str:
    """
    Encode an image file to base64 format with data URL prefix

    Args:
        image_path: Path to the image file

    Returns:
        Base64 encoded string with data URL prefix
    """
    with open(image_path, "rb") as image_file:
        # Read and encode the image
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

        # Add data URL prefix (adjust media type if needed)
        # For PNG: data:image/png;base64,
        # For JPEG: data:image/jpeg;base64,
        return f"data:image/jpeg;base64,{encoded_string}"


def generate_invoice_from_image(image_path: str, prompt: str = None):
    """
    Generate an invoice by analyzing an uploaded image

    Args:
        image_path: Path to the invoice image
        prompt: Optional custom prompt (default: auto-extract)

    Returns:
        Response JSON with session_id and invoice data
    """
    # Default prompt if none provided
    if prompt is None:
        prompt = "Please analyze this invoice image and extract all the information to create a structured invoice."

    # Encode the image
    print(f"Encoding image from: {image_path}")
    encoded_image = encode_image_file(image_path)
    print(f"Image encoded (length: {len(encoded_image)} characters)")

    # Prepare the request
    request_data = {
        "initial_prompt": prompt,
        "invoice_image": encoded_image
    }

    # Send request
    print(f"\nSending request to: {API_BASE_URL}/generate-invoice")
    response = requests.post(
        f"{API_BASE_URL}/generate-invoice",
        json=request_data
    )

    # Handle response
    if response.status_code == 200:
        result = response.json()
        print("\n✅ Invoice generated successfully!")
        print(f"\nSession ID: {result['session_id']}")
        print(f"\nAssistant Response:\n{result['message']}")
        print(f"\nTokens used: {result['token_count']}")
        return result
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(f"Details: {response.text}")
        return None


def edit_invoice_with_image(session_id: str, image_path: str, prompt: str):
    """
    Edit an existing invoice using a new image reference

    Args:
        session_id: Existing session ID
        image_path: Path to the new invoice image
        prompt: Editing instructions

    Returns:
        Response JSON with updated invoice data
    """
    # Encode the image
    print(f"Encoding image from: {image_path}")
    encoded_image = encode_image_file(image_path)

    # Prepare the request
    request_data = {
        "session_id": session_id,
        "message": prompt,
        "invoice_image": encoded_image
    }

    # Send request
    print(f"\nSending chat request to: {API_BASE_URL}/chat")
    response = requests.post(
        f"{API_BASE_URL}/chat",
        json=request_data
    )

    # Handle response
    if response.status_code == 200:
        result = response.json()
        print("\n✅ Invoice updated successfully!")
        print(f"\nAssistant Response:\n{result['message']}")
        print(
            f"\nTokens used: {result['token_count']}/{result['token_limit']}")
        return result
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(f"Details: {response.text}")
        return None


def generate_invoice_without_image(prompt: str):
    """
    Generate an invoice using text prompt only (no image)

    Args:
        prompt: Description of the invoice to generate

    Returns:
        Response JSON with session_id and invoice data
    """
    request_data = {
        "initial_prompt": prompt
    }

    print(f"Sending request to: {API_BASE_URL}/generate-invoice")
    response = requests.post(
        f"{API_BASE_URL}/generate-invoice",
        json=request_data
    )

    if response.status_code == 200:
        result = response.json()
        print("\n✅ Invoice generated successfully!")
        print(f"\nSession ID: {result['session_id']}")
        print(f"\nAssistant Response:\n{result['message']}")
        return result
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(f"Details: {response.text}")
        return None


# Example usage
if __name__ == "__main__":
    print("="*70)
    print("Invoice Agent - Image Upload Example")
    print("="*70)

    # Example 1: Generate invoice from text only
    print("\n\n📝 Example 1: Text-only invoice generation")
    print("-" * 70)
    result = generate_invoice_without_image(
        "Create an invoice for web development services. "
        "From: Tech Solutions Inc, 123 Main St. "
        "To: Acme Corp, 456 Business Ave. "
        "Items: Website Design ($2500), Backend Development ($3500). "
        "Add 10% tax."
    )

    if result:
        session_id = result['session_id']

        # Example 2: Edit invoice using text
        print("\n\n✏️  Example 2: Edit invoice with text")
        print("-" * 70)
        requests.post(
            f"{API_BASE_URL}/chat",
            json={
                "session_id": session_id,
                "message": "Change the tax rate to 15% and add a third item: Hosting Setup for $500"
            }
        )

    # Example 3: Generate invoice from image (uncomment to use)
    # NOTE: Replace with actual path to your invoice image
    """
    print("\n\n📸 Example 3: Generate invoice from image")
    print("-" * 70)
    image_result = generate_invoice_from_image(
        image_path="/path/to/your/invoice.jpg",
        prompt="Extract all data from this invoice and create a structured version"
    )
    """

    # Example 4: Update invoice based on new image (uncomment to use)
    """
    if image_result:
        print("\n\n🔄 Example 4: Update invoice with new image")
        print("-" * 70)
        edit_invoice_with_image(
            session_id=image_result['session_id'],
            image_path="/path/to/updated/invoice.jpg",
            prompt="Update the line items based on this revised invoice"
        )
    """

    print("\n\n" + "="*70)
    print("Examples completed!")
    print("="*70)
    print("\nTo test with your own images:")
    print("1. Uncomment the image examples above")
    print("2. Replace '/path/to/your/invoice.jpg' with actual image paths")
    print("3. Run: python example_image_upload.py")
    print("="*70)
