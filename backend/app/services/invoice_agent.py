import os
import json
import base64
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from langchain_aws import ChatBedrock
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from .msc_validator import MSCValidator, create_invoice_msc


class InvoiceAgent:
    """Agent for generating and editing invoices using Claude with MSC format support"""

    def __init__(self):
        self.llm = self._initialize_llm()
        self.invoice_template = self._get_invoice_template()
        self.msc_validator = MSCValidator()

    def _initialize_llm(self):
        """Initialize Claude via AWS Bedrock"""
        import boto3

        # Create boto3 session with explicit credentials
        session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION", "us-east-1")
        )

        return ChatBedrock(
            model_id=os.getenv("ANTHROPIC_MODEL",
                               "us.anthropic.claude-sonnet-4-20250514-v1:0"),
            model_kwargs={
                "max_tokens": 4096,
                "temperature": 0.7,
            },
            client=session.client("bedrock-runtime"),
        )

    def _get_invoice_template(self) -> Dict[str, Any]:
        """Get default invoice template structure"""
        return {
            "invoice_number": "",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "due_date": "",
            "from": {
                "name": "",
                "company": "",
                "address": "",
                "email": "",
                "phone": ""
            },
            "to": {
                "name": "",
                "company": "",
                "address": "",
                "email": "",
                "phone": ""
            },
            "items": [],
            "subtotal": 0.0,
            "tax_rate": 0.0,
            "tax_amount": 0.0,
            "total": 0.0,
            "notes": "",
            "payment_terms": ""
        }

    def _build_system_prompt(self) -> str:
        """Build system prompt for invoice agent"""
        return """You are an expert invoice generation and editing assistant with vision capabilities. Your job is to:

1. Generate professional invoices based on user requirements
2. Analyze uploaded invoice images and extract data accurately
3. Edit existing invoices based on natural language requests
4. Calculate totals, taxes, and subtotals automatically
5. Maintain professional invoice formatting
6. Respond in plain text without markdown formatting (no bold, italics, or special characters like asterisks)

Invoice structure you need to maintain:
{
  "invoice_number": "INV-001",
  "date": "2025-01-15",
  "due_date": "2025-02-15",
  "from": {"name": "", "company": "", "address": "", "email": "", "phone": ""},
  "to": {"name": "", "company": "", "address": "", "email": "", "phone": ""},
  "items": [
    {"description": "", "quantity": 1, "unit_price": 100.0, "amount": 100.0}
  ],
  "subtotal": 100.0,
  "tax_rate": 10.0,
  "tax_amount": 10.0,
  "total": 110.0,
  "notes": "",
  "payment_terms": "Net 30"
}

When analyzing invoice images:
- Extract all visible invoice data including company names, addresses, contacts
- Identify invoice number, dates, and payment terms
- List all line items with descriptions, quantities, and amounts
- Extract or calculate subtotals, taxes, and totals
- Maintain data accuracy and preserve formatting

When editing:
- Parse the user's request carefully
- Apply changes to the appropriate fields
- Recalculate totals when items or tax rates change
- Return the complete updated invoice data

Always respond with:
1. A brief plain text explanation of what you did (no markdown formatting)
2. The complete invoice data in a code block marked as ```json

IMPORTANT: Do NOT use markdown formatting in your text responses. Write in plain text without asterisks, bold, italics, or other markdown syntax."""

    def _parse_invoice_from_response(self, response: str) -> Optional[Dict[str, Any]]:
        """Extract JSON invoice data from Claude's response"""
        try:
            # Look for JSON code block
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            elif "```" in response:
                json_start = response.find("```") + 3
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            else:
                # Try to parse entire response as JSON
                json_str = response.strip()

            return json.loads(json_str)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error parsing invoice JSON: {e}")
            return None

    def _clean_markdown(self, text: str) -> str:
        """Remove markdown formatting from text"""
        import re

        # Extract only the text before the JSON code block
        if "```json" in text:
            text = text.split("```json")[0].strip()
        elif "```" in text:
            text = text.split("```")[0].strip()

        # Remove bold (**text** or __text__)
        text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
        text = re.sub(r'__([^_]+)__', r'\1', text)

        # Remove italic (*text* or _text_)
        text = re.sub(r'\*([^\*]+)\*', r'\1', text)
        text = re.sub(r'_([^_]+)_', r'\1', text)

        # Remove headers (# ## ###)
        text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)

        # Remove strikethrough (~~text~~)
        text = re.sub(r'~~([^~]+)~~', r'\1', text)

        # Remove code inline (`text`)
        text = re.sub(r'`([^`]+)`', r'\1', text)

        # Remove list markers (- * +)
        text = re.sub(r'^[\-\*\+]\s+', '', text, flags=re.MULTILINE)

        # Remove numbered list markers (1. 2. etc)
        text = re.sub(r'^\d+\.\s+', '', text, flags=re.MULTILINE)

        return text.strip()

    def generate_invoice(self, prompt: str, conversation_history: Optional[List[Dict[str, Any]]] = None,
                         invoice_image: Optional[str] = None) -> tuple[str, Optional[Dict[str, Any]]]:
        """Generate or edit invoice based on prompt and conversation history"""

        # Build messages
        messages = [SystemMessage(content=self._build_system_prompt())]

        # Add conversation history
        if conversation_history:
            for msg in conversation_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

        # Prepare current message content
        current_content = []

        # Add invoice image if provided
        if invoice_image:
            # Check if it's a base64 string with data URL prefix
            if invoice_image.startswith("data:image"):
                # Extract base64 data from data URL
                image_data = invoice_image.split(",", 1)[1]
            else:
                image_data = invoice_image

            current_content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_data
                }
            })

        # Add text prompt
        current_content.append({
            "type": "text",
            "text": prompt
        })

        # Add current message (handle both simple text and multimodal content)
        if len(current_content) == 1 and current_content[0]["type"] == "text":
            # Simple text-only message
            messages.append(HumanMessage(content=prompt))
        else:
            # Multimodal message with image
            messages.append(HumanMessage(content=current_content))

        # Get response from Claude
        response = self.llm.invoke(messages)
        response_text = response.content

        # Clean markdown from response text
        cleaned_text = self._clean_markdown(response_text)

        # Parse invoice data
        invoice_data = self._parse_invoice_from_response(response_text)

        return cleaned_text, invoice_data

    def edit_invoice(self, current_invoice: Dict[str, Any], edit_prompt: str,
                     conversation_history: Optional[List[Dict[str, Any]]] = None,
                     invoice_image: Optional[str] = None) -> tuple[str, Optional[Dict[str, Any]]]:
        """Edit existing invoice based on natural language prompt"""

        # Create enhanced prompt with current invoice data
        enhanced_prompt = f"""Current Invoice:
```json
{json.dumps(current_invoice, indent=2)}
```

User Request: {edit_prompt}

Please apply the requested changes and return the updated invoice."""

        return self.generate_invoice(enhanced_prompt, conversation_history, invoice_image)

    def generate_invoice_with_msc(self, prompt: str,
                                  conversation_history: Optional[List[Dict[str, Any]]] = None,
                                  invoice_image: Optional[str] = None) -> Tuple[str, Optional[Dict[str, Any]], Optional[str]]:
        """
        Generate invoice with both JSON and MSC format

        Returns:
            Tuple of (response_text, invoice_data, msc_content)
        """
        # Generate invoice as usual
        response_text, invoice_data = self.generate_invoice(
            prompt, conversation_history, invoice_image)

        # Convert to MSC format if invoice_data exists
        msc_content = None
        if invoice_data:
            try:
                msc_content = create_invoice_msc(invoice_data)
                # Validate and correct MSC using JavaScript validator
                corrected_msc, is_valid, messages = self.msc_validator.validate_with_corrections(
                    msc_content)
                if messages:
                    if is_valid:
                        print(f"MSC corrections applied: {messages}")
                    else:
                        print(f"MSC validation errors: {messages}")
                msc_content = corrected_msc
            except Exception as e:
                print(f"Error generating MSC: {e}")

        return response_text, invoice_data, msc_content

    def edit_invoice_with_msc(self, current_invoice: Dict[str, Any], edit_prompt: str,
                              conversation_history: Optional[List[Dict[str, Any]]] = None,
                              invoice_image: Optional[str] = None) -> Tuple[str, Optional[Dict[str, Any]], Optional[str]]:
        """
        Edit invoice with both JSON and MSC format

        Returns:
            Tuple of (response_text, invoice_data, msc_content)
        """
        # Edit invoice as usual
        response_text, invoice_data = self.edit_invoice(
            current_invoice, edit_prompt, conversation_history, invoice_image)

        # Convert to MSC format if invoice_data exists
        msc_content = None
        if invoice_data:
            try:
                msc_content = create_invoice_msc(invoice_data)
                # Validate and correct MSC using JavaScript validator
                corrected_msc, is_valid, messages = self.msc_validator.validate_with_corrections(
                    msc_content)
                if messages:
                    if is_valid:
                        print(f"MSC corrections applied: {messages}")
                    else:
                        print(f"MSC validation errors: {messages}")
                msc_content = corrected_msc
            except Exception as e:
                print(f"Error generating MSC: {e}")

        return response_text, invoice_data, msc_content
