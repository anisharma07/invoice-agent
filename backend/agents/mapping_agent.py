import os
import json
import boto3
import time
import re
from typing import Dict, Optional, List

class MappingAgent:
    """
    AI-powered agent that analyzes SocialCalc MSC code and generates
    JSON mapping structure based on the sheet content.
    """

    def __init__(self):
        """Initialize the mapping agent with Bedrock client"""
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.model_id = os.getenv(
            'ANTHROPIC_MODEL', 'us.anthropic.claude-sonnet-4-20250514-v1:0')

        # Initialize Bedrock client
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=self.aws_region,
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )

    def _call_claude(self, prompt: str, system_prompt: str = "", max_retries: int = 3) -> str:
        """
        Call Claude via Amazon Bedrock with retry logic

        Args:
            prompt: User prompt
            system_prompt: System instructions for Claude
            max_retries: Maximum number of retry attempts

        Returns:
            Claude's response text
        """
        for attempt in range(max_retries):
            try:
                request_body = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 8000,
                    "temperature": 0.3,  # Lower temperature for more consistent output
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                }

                if system_prompt:
                    request_body["system"] = system_prompt

                response = self.bedrock_runtime.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(request_body)
                )

                response_body = json.loads(response['body'].read())
                return response_body['content'][0]['text']

            except Exception as e:
                error_str = str(e)
                if 'ThrottlingException' in error_str or 'Too many requests' in error_str:
                    if attempt < max_retries - 1:
                        wait_time = 2 ** (attempt + 1)
                        print(f"Rate limited, waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
                        continue
                raise Exception(f"Error calling Claude via Bedrock: {error_str}")

    def _parse_msc_code(self, msc_code: str) -> Dict:
        """
        Parse MSC code to extract cell information

        Args:
            msc_code: SocialCalc MSC format code

        Returns:
            Dict with parsed cell data
        """
        cells = {}
        merged_cells = {}
        
        lines = msc_code.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Parse cell lines: cell:B2:t:Company Name:f:1
            if line.startswith('cell:'):
                parts = line.split(':')
                if len(parts) >= 3:
                    cell_ref = parts[1]
                    cell_data = {'ref': cell_ref}
                    
                    # Parse cell properties
                    i = 2
                    while i < len(parts):
                        key = parts[i]
                        if i + 1 < len(parts):
                            value = parts[i + 1]
                            if key == 't':  # text
                                cell_data['text'] = value
                            elif key == 'v':  # value
                                cell_data['value'] = value
                            elif key == 'f':  # font
                                cell_data['font'] = value
                            elif key == 'c':  # color
                                cell_data['color'] = value
                            elif key == 'bg':  # background
                                cell_data['background'] = value
                            elif key == 'colspan':
                                cell_data['colspan'] = int(value)
                            elif key == 'rowspan':
                                cell_data['rowspan'] = int(value)
                        i += 2
                    
                    cells[cell_ref] = cell_data
        
        return {'cells': cells, 'merged_cells': merged_cells}

    def _extract_json_from_response(self, response: str) -> Dict:
        """Extract JSON from Claude's response"""
        response = response.strip()
        
        # Try to find JSON in code blocks
        if '```json' in response:
            match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
            if match:
                response = match.group(1)
        elif '```' in response:
            match = re.search(r'```\s*([\s\S]*?)\s*```', response)
            if match:
                response = match.group(1)
        
        # Try to parse as JSON
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to find JSON object in the response
            match = re.search(r'\{[\s\S]*\}', response)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass
        
        return {}

    def generate_mapping(self, msc_code: str) -> Dict:
        """
        Generate JSON mapping from MSC code using AI

        Args:
            msc_code: SocialCalc MSC format code

        Returns:
            Dict with the generated mapping structure
        """
        system_prompt = """You are an expert at analyzing spreadsheet templates and generating structured data mappings.

Your task is to analyze SocialCalc MSC code and generate a JSON mapping that describes the semantic structure of the template.

OUTPUT FORMAT - You must output valid JSON following this exact TypeScript structure:

```typescript
interface AppMappingItem {
    type: "text" | "image" | "table" | "form";
    cell?: string;           // Cell reference like "B2", "C5"
    editable?: boolean;      // Whether this field can be edited
    unitname?: string;       // For tables: name of each row item (e.g., "Item", "Product")
    rows?: { start: number; end: number }; // For tables: row range
    col?: { [columnKey: string]: AppMappingItem }; // For table columns
    name?: string;           // Display name
    formContent?: { [key: string]: AppMappingItem }; // For forms: nested fields
}

// Root structure - mapping field names to their configurations
interface MappingOutput {
    [fieldName: string]: AppMappingItem;
}
```

RULES FOR GENERATING MAPPINGS:

1. **Text Fields**: Single cells with text content (company name, date, invoice number, etc.)
   - type: "text"
   - cell: the cell reference
   - editable: true for user-editable fields

2. **Image Fields**: Cells that contain image data or logos
   - type: "image"
   - cell: the cell reference

3. **Form Fields**: Group of related fields that belong together (like address, contact info)
   - type: "form"
   - formContent: nested mapping of sub-fields

4. **Table Fields**: Repeating row structures (like line items in an invoice)
   - type: "table"
   - rows: { start: first data row, end: last data row }
   - unitname: what each row represents (e.g., "Item")
   - col: mapping of column fields

5. **Field Names**: Use semantic, camelCase names like:
   - companyName, invoiceNumber, invoiceDate, customerName
   - billingAddress, shippingAddress
   - lineItems (for tables)
   - logo (for images)

RESPONSE: Output ONLY valid JSON, no explanations or markdown."""

        user_prompt = f"""Analyze this SocialCalc MSC code and generate a JSON mapping structure:

```
{msc_code}
```

Generate the mapping JSON that describes all the fields in this template. Identify:
- Header fields (company name, invoice number, date, etc.)
- Address sections (billing/shipping as form groups)
- Line items table (products, quantities, prices)
- Footer fields (subtotal, tax, total, notes)
- Any images/logos

Output only the JSON mapping."""

        try:
            print("Generating mapping using AI...")
            response = self._call_claude(user_prompt, system_prompt)
            
            mapping = self._extract_json_from_response(response)
            
            if not mapping:
                raise Exception("Failed to parse AI response as JSON")
            
            print(f"Successfully generated mapping with {len(mapping)} top-level fields")
            return {
                'success': True,
                'data': {
                    'mapping': mapping,
                    'fieldCount': len(mapping)
                }
            }

        except Exception as e:
            print(f"Error generating mapping: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance for the app
mapping_agent = MappingAgent()
