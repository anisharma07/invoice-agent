"""
SaveStr Agent
Converts cell mappings and invoice data to valid SocialCalc (MSC) save string format
"""

import os
import json
from typing import Dict, Any, List, Optional, Tuple
from langchain_aws import ChatBedrock
from langchain.schema import HumanMessage, SystemMessage


class SaveStrAgent:
    """Agent for generating SocialCalc save strings from cell mappings and data"""

    def __init__(self):
        self.llm = self._initialize_llm()
        self.syntax_guide = self._load_syntax_guide()

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
                "max_tokens": 8192,
                "temperature": 0.3,
            },
            client=session.client("bedrock-runtime"),
        )

    def _load_syntax_guide(self) -> str:
        """Load SocialCalc syntax reference"""
        return """SocialCalc Save Format Syntax (MSC) - CRITICAL REFERENCE

GENERAL FORMAT:
linetype:param1:param2:param3:...

REQUIRED FIRST LINE:
version:1.5

COMMON LINE TYPES:

1. CELL LINE:
cell:<coord>:<attr>:<value>:<attr>:<value>...

Cell Coordinates: A1, B5, AA10, etc.

Cell Value Attributes:
- t:<text> - Plain text
- v:<number> - Numeric value
- vtf:<type>:<value>:<formula> - Formula with result
- vt:<type>:<value> - Typed value

Value Types:
- n = numeric
- t = text
- nd = numeric date
- nt = numeric time
- n$ = currency

Cell Formatting Attributes:
- f:<num> - Font style (refs font:NUM line)
- c:<num> - Text color (refs color:NUM line)
- bg:<num> - Background color (refs color:NUM line)
- b:<t>:<r>:<b>:<l> - Borders (top:right:bottom:left, refs border:NUM)
- cf:<num> - Cell format/alignment (refs cellformat:NUM)
- l:<num> - Layout/padding (refs layout:NUM)
- ntvf:<num> - Number value format (refs valueformat:NUM)
- tvf:<num> - Text value format (refs valueformat:NUM)
- colspan:<num> - Merge columns
- rowspan:<num> - Merge rows

FORMULAS:
- Colons in formulas MUST be escaped as \\c
- Example: SUM(A1:A10) becomes SUM(A1\\cA10)
- Example: cell:F36:vtf:n:150:SUM(F23\\cF35)

2. SHEET LINE:
sheet:c:<cols>:r:<rows>:w:<width>:h:<height>
Example: sheet:c:7:r:42:h:12.75

3. STYLE DEFINITIONS (must exist before referencing):

FONT:
font:<num>:<style> <weight> <size> <family>
- style: normal, italic, * (default)
- weight: normal, bold, * (default)
- size: 10pt, 12px, small, medium, large, * (default)
Example: font:1:normal bold 14pt Arial

COLOR:
color:<num>:rgb(R,G,B) or #RRGGBB
Example: color:1:rgb(0,0,0)

BORDER:
border:<num>:<thickness> <style> <color>
- thickness: 1px, 2px, thin
- style: solid, dashed, dotted, double
Example: border:1:1px solid rgb(0,0,0)

CELLFORMAT (alignment):
cellformat:<num>:<alignment>
- alignment: left, center, right
Example: cellformat:1:center

LAYOUT (padding):
layout:<num>:padding:<t> <r> <b> <l>;vertical-align:<value>;
Example: layout:1:padding:* * * *;vertical-align:bottom;

VALUEFORMAT (number/date formatting):
valueformat:<num>:<pattern>
Examples:
- valueformat:1:#,##0.00
- valueformat:2:$#,##0.00
- valueformat:3:m/d/yy

4. COLUMN/ROW SIZING:
col:<letter>:w:<width>
row:<num>:h:<height>
Examples:
- col:A:w:100
- row:1:h:20

CRITICAL RULES:
1. version:1.5 MUST be first line
2. Define ALL styles (font, color, border, etc.) BEFORE using them in cells
3. Escape colons in formulas with \\c
4. Cell coordinates are Excel-style (A1, B2, AA10)
5. All referenced style numbers must have corresponding definition lines
6. Use vtf:<type>:<value>:<formula> for cells with formulas
7. Borders format: b:<top>:<right>:<bottom>:<left> (use 0 for no border)
8. Column letters: A-Z, then AA, AB, AC... for columns beyond Z
"""

    def _build_system_prompt(self) -> str:
        """Build system prompt for savestr generation"""
        return f"""You are an expert SocialCalc save string generator. Your job is to convert cell mapping configurations and invoice data into valid MSC (SocialCalc save format) strings.

{self.syntax_guide}

YOUR TASK:
1. Receive cell mappings, template metadata, and optional invoice data (from text/image)
2. Generate a complete, valid MSC save string
3. Include proper styling (fonts, colors, borders, layouts)
4. Add formulas for calculations (Subtotal, Tax, Total using SUM)
5. Create professional invoice layouts with merged cells, borders, and formatting
6. Output ONLY the raw savestr content - no explanations, no markdown, no code blocks

FORMULA EXAMPLES:
- Subtotal: cell:F36:vtf:n:150:SUM(F23\\cF35)
- Total: cell:F38:vtf:n:165:F36+F37
- Item Amount: cell:F23:vtf:n:100:D23*E23

STRUCTURE ORDER:
1. version:1.5
2. All cell lines (with formulas where needed)
3. All col lines (column widths)
4. All row lines (row heights)
5. sheet line (dimensions)
6. All style definitions (border, cellformat, font, color, layout, valueformat)

DESIGN PRINCIPLES:
- Use merged cells (colspan/rowspan) for headers and labels
- Apply borders (b:1:1:1:1) to important sections
- Use bold fonts for headers and totals
- Center-align headers (cf:1), left-align text (cf:2)
- Apply number formatting (ntvf:1) to currency values
- Create clear visual hierarchy with fonts and spacing

CRITICAL: Output ONLY the raw savestr lines. Start with "version:1.5" and end with the last valueformat/layout line. NO explanations, NO markdown, NO code blocks."""

    def generate_savestr(self,
                         template_meta: Dict[str, Any],
                         cell_mappings: Dict[str, Any],
                         invoice_data: Optional[Dict[str, Any]] = None,
                         user_prompt: str = "",
                         invoice_image: Optional[str] = None) -> str:
        """
        Generate SocialCalc save string from cell mappings

        Args:
            template_meta: Template metadata (name, category, etc.)
            cell_mappings: Cell mapping structure
            invoice_data: Optional parsed invoice data from user prompt/image
            user_prompt: Original user request for context
            invoice_image: Optional invoice image for visual reference

        Returns:
            Complete MSC save string
        """
        # Build context
        context = f"""TEMPLATE METADATA:
{json.dumps(template_meta, indent=2)}

CELL MAPPINGS:
{json.dumps(cell_mappings, indent=2)}
"""

        if invoice_data:
            context += f"""

INVOICE DATA:
{json.dumps(invoice_data, indent=2)}
"""

        if user_prompt:
            context += f"""

USER REQUEST: {user_prompt}
"""

        # Build message content
        content = []

        # Add invoice image if provided
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

        # Add text context
        content.append({
            "type": "text",
            "text": context + "\n\nGenerate a complete, valid MSC save string for this invoice template. Include all necessary styling, formulas, and formatting."
        })

        # Create messages
        messages = [
            SystemMessage(content=self._build_system_prompt()),
            HumanMessage(content=content if invoice_image else context)
        ]

        # Get response from Claude
        response = self.llm.invoke(messages)
        savestr = response.content.strip()

        # Clean up response - remove code blocks if present
        if "```" in savestr:
            # Extract content between code blocks
            if "```msc" in savestr or "```socialcalc" in savestr:
                start = savestr.find("```") + 3
                # Skip the language identifier
                start = savestr.find("\n", start) + 1
            elif "```" in savestr:
                start = savestr.find("```") + 3
                start = savestr.find(
                    "\n", start) + 1 if "\n" in savestr[start:start+20] else start

            end = savestr.find("```", start)
            if end > start:
                savestr = savestr[start:end].strip()

        # Ensure it starts with version
        if not savestr.startswith("version:"):
            # Try to find version line
            version_idx = savestr.find("version:")
            if version_idx > 0:
                savestr = savestr[version_idx:]
            else:
                # Prepend version if missing
                savestr = "version:1.5\n" + savestr

        return savestr

    def fix_savestr_with_errors(self,
                                savestr: str,
                                validation_errors: List[str],
                                template_meta: Dict[str, Any],
                                cell_mappings: Dict[str, Any]) -> str:
        """
        Fix savestr based on validation errors

        Args:
            savestr: Current (invalid) savestr
            validation_errors: List of validation error messages
            template_meta: Template metadata
            cell_mappings: Cell mappings

        Returns:
            Corrected savestr
        """
        # Build fix prompt
        fix_prompt = f"""CURRENT SAVESTR (INVALID):
{savestr[:2000]}... (truncated for brevity)

VALIDATION ERRORS:
{json.dumps(validation_errors, indent=2)}

TEMPLATE METADATA:
{json.dumps(template_meta, indent=2)}

CELL MAPPINGS:
{json.dumps(cell_mappings, indent=2)}

Fix these validation errors and generate a corrected MSC save string. Pay special attention to:
1. Undefined style references (font, color, border, layout, cellformat, valueformat)
2. Incorrect formula escaping (use \\c for colons)
3. Invalid cell coordinates
4. Missing or incorrect line formats

Output ONLY the corrected savestr - no explanations."""

        messages = [
            SystemMessage(content=self._build_system_prompt()),
            HumanMessage(content=fix_prompt)
        ]

        response = self.llm.invoke(messages)
        corrected_savestr = response.content.strip()

        # Clean up response
        if "```" in corrected_savestr:
            start = corrected_savestr.find("```") + 3
            start = corrected_savestr.find(
                "\n", start) + 1 if "\n" in corrected_savestr[start:start+20] else start
            end = corrected_savestr.find("```", start)
            if end > start:
                corrected_savestr = corrected_savestr[start:end].strip()

        if not corrected_savestr.startswith("version:"):
            version_idx = corrected_savestr.find("version:")
            if version_idx > 0:
                corrected_savestr = corrected_savestr[version_idx:]

        return corrected_savestr
