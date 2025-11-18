"""
Meta and Cell Mapping Agent
Analyzes user prompts/images and generates cell mapping structure with template metadata
"""

import os
import json
from typing import Dict, Any, List, Optional, Tuple
from langchain_aws import ChatBedrock
from langchain.schema import HumanMessage, SystemMessage


class MetaAndCellMapAgent:
    """Agent for generating template metadata and cell mappings from user requirements"""

    def __init__(self):
        self.llm = self._initialize_llm()

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
                "temperature": 0.8,  # Higher temperature for creativity
            },
            client=session.client("bedrock-runtime"),
        )

    def _build_system_prompt(self) -> str:
        """Build system prompt for cell mapping generation"""
        return """You are an expert invoice template designer. Your job is to analyze user requirements (text and/or images) and create a structured cell mapping configuration for SocialCalc spreadsheet templates.

CRITICAL RULES:
1. Output ONLY valid JSON - no markdown, no explanations, no code blocks
2. Cell coordinates must use Excel-style notation (A1, B2, C3, etc.)
3. All editable fields must have clear cell mappings
4. Items section must define rows with start/end range
5. Use creative layouts and professional designs
6. Include formulas where calculations are needed (SUM, subtotal, tax, total)

OUTPUT STRUCTURE (respond with ONLY this JSON):
{
  "templateMeta": {
    "name": "Template-Name",
    "domain": "invoice",
    "category": "tax_invoice|simple_invoice|professional_invoice",
    "deviceType": "mobile|tablet|desktop",
    "description": "Brief template description"
  },
  "cellMappings": {
    "logo": {
      "sheet1": "F5"
    },
    "signature": {
      "sheet1": "D38"
    },
    "text": {
      "sheet1": {
        "Heading": "B2",
        "Date": "D20",
        "InvoiceNumber": "C18",
        "From": {
          "Name": "C12",
          "StreetAddress": "C13",
          "CityStateZip": "C14",
          "Phone": "C15",
          "Email": "C16"
        },
        "BillTo": {
          "Name": "C5",
          "StreetAddress": "C6",
          "CityStateZip": "C7",
          "Phone": "C8",
          "Email": "C9"
        },
        "Items": {
          "Name": "Items",
          "Heading": "Items",
          "Subheading": "Item",
          "Rows": {
            "start": 23,
            "end": 35
          },
          "Columns": {
            "Description": "C",
            "Quantity": "D",
            "UnitPrice": "E",
            "Amount": "F"
          }
        },
        "Subtotal": "F36",
        "Tax": "F37",
        "Total": "F38",
        "Notes": "C40",
        "PaymentTerms": "C41"
      }
    }
  }
}

DESIGN GUIDELINES:
- For mobile: Compact layouts, fewer columns (max 4-5), smaller row ranges
- For tablet: Medium layouts, 6-7 columns, medium row ranges (10-15 items)
- For desktop: Full layouts, 8-10 columns, larger row ranges (20-30 items)
- Always include formulas for calculated fields (Subtotal, Tax, Total)
- Position logo and signature appropriately based on layout
- Ensure Items section has clear column mappings for all line item fields
- Use professional spacing and alignment

IMPORTANT: Respond with ONLY the JSON structure above. No explanations, no markdown, no text before or after."""

    def generate_cell_mappings(self, prompt: str, invoice_image: Optional[str] = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Generate template metadata and cell mappings from user requirements

        Args:
            prompt: User's description of invoice requirements
            invoice_image: Optional base64 encoded invoice image for reference

        Returns:
            Tuple of (templateMeta dict, cellMappings dict)
        """
        # Build message content
        content = []

        # Add image if provided
        if invoice_image:
            if invoice_image.startswith("data:image"):
                image_data = invoice_image.split(",", 1)[1]
            else:
                image_data = invoice_image

            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_data
                }
            })

        # Add text prompt
        content.append({
            "type": "text",
            "text": f"""Analyze this invoice requirement and generate cell mappings:

USER REQUEST: {prompt}

Generate a complete cell mapping configuration following the JSON structure specified in your system prompt."""
        })

        # Create messages
        messages = [
            SystemMessage(content=self._build_system_prompt()),
            HumanMessage(content=content if invoice_image else prompt)
        ]

        # Get response from Claude
        response = self.llm.invoke(messages)
        response_text = response.content.strip()

        # Parse JSON response
        try:
            # Try to parse as-is first
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # Try to extract JSON if wrapped in code blocks
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
                result = json.loads(json_str)
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
                result = json.loads(json_str)
            else:
                raise ValueError(
                    f"Failed to parse cell mapping response: {response_text[:200]}")

        # Extract components
        template_meta = result.get("templateMeta", {})
        cell_mappings = result.get("cellMappings", {})

        # Validate structure
        if not template_meta or not cell_mappings:
            raise ValueError(
                "Invalid cell mapping structure: missing templateMeta or cellMappings")

        return template_meta, cell_mappings

    def regenerate_with_feedback(self,
                                 original_prompt: str,
                                 previous_meta: Dict[str, Any],
                                 previous_mappings: Dict[str, Any],
                                 feedback: str,
                                 invoice_image: Optional[str] = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Regenerate cell mappings based on validation feedback or user corrections

        Args:
            original_prompt: Original user request
            previous_meta: Previously generated template metadata
            previous_mappings: Previously generated cell mappings
            feedback: Validation errors or user feedback
            invoice_image: Optional invoice image

        Returns:
            Tuple of (updated templateMeta, updated cellMappings)
        """
        enhanced_prompt = f"""ORIGINAL REQUEST: {original_prompt}

PREVIOUS TEMPLATE META:
{json.dumps(previous_meta, indent=2)}

PREVIOUS CELL MAPPINGS:
{json.dumps(previous_mappings, indent=2)}

FEEDBACK/ERRORS: {feedback}

Please correct the cell mappings based on this feedback and generate an improved version."""

        return self.generate_cell_mappings(enhanced_prompt, invoice_image)
