import os
import json
import base64
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from langchain_aws import ChatBedrock
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage


class InvoiceEditingAgent:
    """Agent for editing spreadsheet cells based on invoice images and natural language prompts"""

    def __init__(self):
        self.llm = self._initialize_llm()

    def _initialize_llm(self):
        """Initialize Claude via AWS Bedrock with vision support"""
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
                "temperature": 0.3,  # Lower temperature for more precise editing
            },
            client=session.client("bedrock-runtime"),
        )

    def _build_system_prompt(self, cell_mappings: Dict[str, Any]) -> str:
        """Build system prompt with cell mapping context"""
        return f"""You are an expert spreadsheet editing assistant specialized in invoice data extraction and cell updates.

Your task is to:
1. Analyze invoice images (if provided) and extract relevant data
2. Parse natural language editing requests
3. Generate precise cell updates in JSON format
4. Use provided cell mappings to determine correct cell addresses

CELL MAPPINGS STRUCTURE:
{json.dumps(cell_mappings, indent=2)}

OUTPUT FORMAT:
You must return a JSON object where:
- Keys are cell addresses (e.g., "B1", "D20", "C12")
- Values are the content to write (text, numbers, or formulas)

Example output:
{{
  "B2": "Professional Services Invoice",
  "D20": "TODAY()",
  "C18": "INV-2025-001",
  "C12": "Acme Corporation",
  "C13": "123 Business Street",
  "C23": "Web Development Services",
  "F23": "1500*8"
}}

IMPORTANT RULES:
1. Use exact cell addresses from the cell mappings provided
2. For formulas, DO NOT include the "=" sign - just write the formula name and arguments (e.g., "TODAY()", "SUM(F23:F35)", "A1+B1")
3. The spreadsheet application will add the "=" when applying the formula
4. For dates, you can use formulas like "TODAY()" or text like "2025-01-15"
5. For item rows (Items.Rows), use cell addresses like C23, C24, etc. (Description column) and F23, F24, etc. (Amount column)
6. Only include cells that need to be updated
7. If processing an invoice image, extract all visible invoice data
8. Maintain data accuracy and professional formatting
9. For currency values, use numbers (e.g., 1500.00) not formatted strings
10. For multi-line addresses, keep them as single cells with proper line breaks if needed

When analyzing invoice images:
- Extract company names, addresses, emails, phones
- Identify invoice number and date
- List all line items with descriptions and amounts
- Calculate or extract totals

When processing text prompts:
- Parse the editing request carefully
- Map the requested changes to appropriate cells
- Apply logical updates based on cell relationships

Always respond with:
1. A brief explanation of the changes you're making
2. The JSON object with cell updates in a code block marked as ```json"""

    def _prepare_messages(
        self,
        prompt: str,
        cell_mappings: Dict[str, Any],
        current_values: Optional[Dict[str, str]],
        invoice_image: Optional[str],
        conversation_history: List[Dict[str, Any]]
    ) -> List[Any]:
        """Prepare messages for the LLM including image if provided"""

        messages = [SystemMessage(
            content=self._build_system_prompt(cell_mappings))]

        # Add conversation history
        for msg in conversation_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        # Build current request
        user_content = []

        # Add invoice image if provided
        if invoice_image:
            # Check if it's a base64 string or needs to be loaded
            if invoice_image.startswith("data:image"):
                # Extract base64 data from data URL
                image_data = invoice_image.split(",", 1)[1]
            else:
                image_data = invoice_image

            user_content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_data
                }
            })

        # Build text prompt with context
        context_parts = [f"User Request: {prompt}"]

        if current_values:
            context_parts.append(
                f"\nCurrent Cell Values:\n{json.dumps(current_values, indent=2)}")

        context_parts.append(
            "\nPlease provide the cell updates in JSON format.")

        user_content.append({
            "type": "text",
            "text": "\n".join(context_parts)
        })

        messages.append(HumanMessage(content=user_content))

        return messages

    def _extract_json_from_response(self, response_text: str) -> Dict[str, str]:
        """Extract JSON object from LLM response"""
        try:
            # Look for JSON code block
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
            else:
                # Try to find JSON object in the text
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                else:
                    return {}

            # Parse JSON and ensure all values are strings
            cell_updates = json.loads(json_str)

            # Convert all values to strings to match schema
            return {k: str(v) for k, v in cell_updates.items()}
        except Exception as e:
            print(f"Error extracting JSON: {e}")
            print(f"Response text: {response_text}")
            return {}

    def process_edit_request(
        self,
        prompt: str,
        cell_mappings: Dict[str, Any],
        current_values: Optional[Dict[str, str]] = None,
        invoice_image: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[str, Dict[str, str]]:
        """
        Process an editing request and return cell updates

        Args:
            prompt: Natural language editing request
            cell_mappings: Dictionary defining available cells for editing
            current_values: Current values in cells (if any)
            invoice_image: Base64 encoded invoice image (optional)
            conversation_history: Previous conversation messages

        Returns:
            Tuple of (explanation_text, cell_updates_dict)
        """
        if conversation_history is None:
            conversation_history = []

        # Prepare messages
        messages = self._prepare_messages(
            prompt,
            cell_mappings,
            current_values,
            invoice_image,
            conversation_history
        )

        # Get response from LLM
        try:
            response = self.llm.invoke(messages)
            response_text = response.content

            # Extract JSON updates
            cell_updates = self._extract_json_from_response(response_text)

            # Extract explanation (text before the JSON block)
            if "```" in response_text:
                explanation = response_text[:response_text.find("```")].strip()
            else:
                explanation = response_text

            # Clean up explanation
            if not explanation:
                explanation = "Successfully processed your request and generated cell updates."

            return explanation, cell_updates

        except Exception as e:
            error_msg = f"Error processing edit request: {str(e)}"
            print(error_msg)
            return error_msg, {}

    def validate_cell_updates(
        self,
        cell_updates: Dict[str, str],
        cell_mappings: Dict[str, Any]
    ) -> Tuple[bool, List[str]]:
        """
        Validate that cell updates reference valid cells from mappings

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        valid_cells = self._extract_valid_cells(cell_mappings)

        for cell_address in cell_updates.keys():
            # Basic cell address format validation
            if not self._is_valid_cell_address(cell_address):
                errors.append(f"Invalid cell address format: {cell_address}")
                continue

            # Check if cell is in the allowed mappings
            # This is lenient - allows any cell in the sheet
            # You can make this stricter if needed
            pass

        return len(errors) == 0, errors

    def _extract_valid_cells(self, cell_mappings: Dict[str, Any]) -> set:
        """Extract all valid cell addresses from mappings"""
        valid_cells = set()

        def extract_cells(obj, path=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key in ["sheet1", "sheet2"]:  # Sheet names
                        extract_cells(value, key)
                    elif key == "Rows" and isinstance(value, dict):
                        # Handle row ranges
                        start = value.get("start", 0)
                        end = value.get("end", 0)
                        # We'll allow any row in this range
                    elif key == "Columns" and isinstance(value, dict):
                        # Handle column mappings
                        for col_name, col_letter in value.items():
                            valid_cells.add(col_letter)
                    elif isinstance(value, str) and len(value) <= 5:
                        # Looks like a cell address
                        if self._is_valid_cell_address(value):
                            valid_cells.add(value)
                    else:
                        extract_cells(value, f"{path}.{key}")
            elif isinstance(obj, list):
                for item in obj:
                    extract_cells(item, path)

        extract_cells(cell_mappings)
        return valid_cells

    def _is_valid_cell_address(self, address: str) -> bool:
        """Check if string is a valid cell address (e.g., A1, B2, AA100)"""
        if not address or len(address) > 10:
            return False

        import re
        # Match pattern like A1, B2, AA100, etc.
        pattern = r'^[A-Z]{1,3}[0-9]{1,7}$'
        return bool(re.match(pattern, address))

    def generate_summary(
        self,
        cell_updates: Dict[str, str],
        cell_mappings: Dict[str, Any]
    ) -> str:
        """Generate a human-readable summary of changes"""
        if not cell_updates:
            return "No cell updates generated."

        summary_parts = [f"Generated {len(cell_updates)} cell updates:"]

        # Group by type
        formulas = []
        text_values = []
        numeric_values = []

        for cell, value in cell_updates.items():
            if str(value).startswith("="):
                formulas.append(f"  - {cell}: {value}")
            elif str(value).replace(".", "").replace("-", "").isdigit():
                numeric_values.append(f"  - {cell}: {value}")
            else:
                text_values.append(f"  - {cell}: {value}")

        if text_values:
            summary_parts.append("\nText values:")
            summary_parts.extend(text_values[:5])  # Limit to first 5
            if len(text_values) > 5:
                summary_parts.append(f"  ... and {len(text_values) - 5} more")

        if numeric_values:
            summary_parts.append("\nNumeric values:")
            summary_parts.extend(numeric_values[:5])
            if len(numeric_values) > 5:
                summary_parts.append(
                    f"  ... and {len(numeric_values) - 5} more")

        if formulas:
            summary_parts.append("\nFormulas:")
            summary_parts.extend(formulas)

        return "\n".join(summary_parts)
