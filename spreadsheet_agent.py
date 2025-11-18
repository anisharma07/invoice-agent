"""
Spreadsheet Generation and Correction Agent using Claude Sonnet 3.5 via Amazon Bedrock
This agent can generate and correct spreadsheets in MSC (Multi-Sheet Calc) syntax.
"""

import json
import os
from typing import Dict, List, Optional
import boto3
from langchain_core.prompts import ChatPromptTemplate
from langchain_aws import ChatBedrock
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class SpreadsheetAgent:
    """
    AI Agent for generating and correcting spreadsheets in MSC syntax.
    Uses Claude Sonnet 3.5 via Amazon Bedrock with training examples.
    """

    def __init__(self, training_file: str = "training.jsonl", region_name: str = "us-east-1"):
        """
        Initialize the Spreadsheet Agent.

        Args:
            training_file: Path to the JSONL file containing training examples
            region_name: AWS region for Bedrock (default: us-east-1 for US Claude Sonnet 4)
        """
        self.training_examples = self._load_training_examples(training_file)
        self.region_name = region_name
        self.llm = self._initialize_llm()
        self.system_prompt = self._create_system_prompt()

    def _load_training_examples(self, training_file: str) -> List[Dict]:
        """Load training examples from JSONL file."""
        examples = []
        try:
            with open(training_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        examples.append(json.loads(line))
            print(
                f"✓ Loaded {len(examples)} training examples from {training_file}")
        except Exception as e:
            print(f"Warning: Could not load training file: {e}")
        return examples

    def _initialize_llm(self) -> ChatBedrock:
        """Initialize Claude Sonnet via Amazon Bedrock."""
        try:
            # Get AWS credentials from environment variables
            aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
            aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
            aws_region = os.getenv('AWS_REGION', self.region_name)
            model_id = os.getenv(
                'ANTHROPIC_MODEL', 'us.anthropic.claude-sonnet-4-20250514-v1:0')

            bedrock_runtime = boto3.client(
                service_name='bedrock-runtime',
                region_name=aws_region,
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key
            )

            llm = ChatBedrock(
                client=bedrock_runtime,
                model_id=model_id,
                model_kwargs={
                    "temperature": 0.3,
                    "max_tokens": 8000,
                    "top_p": 0.9
                }
            )
            print(
                f"✓ Connected to Claude Sonnet 4 via Amazon Bedrock in {aws_region}")
            return llm
        except Exception as e:
            print(f"✗ Error initializing Bedrock: {e}")
            raise

    def _create_system_prompt(self) -> str:
        """Create a comprehensive system prompt with training examples."""

        # Select diverse examples for the prompt
        example_prompts = []
        # Use first 10 examples
        for i, example in enumerate(self.training_examples[:10]):
            messages = example.get('messages', [])
            if len(messages) >= 2:
                user_msg = messages[0].get('content', '')
                assistant_msg = messages[1].get('content', '')
                example_prompts.append(
                    f"Example {i+1}:\nUser: {user_msg}\nAssistant:\n{assistant_msg}\n")

        examples_text = "\n".join(example_prompts)

        system_prompt = f"""You are an expert spreadsheet generation and correction agent specialized in MSC (Multi-Sheet Calc) syntax.

MSC SYNTAX OVERVIEW:
The MSC format is a plain-text spreadsheet format with specific syntax rules:

1. VERSION LINE (required first line):
   version:1.5

2. CELL DEFINITIONS:
   cell:<CellID>:<properties>
   
   Properties (separated by colons):
   - t:<text> - Text content
   - v:<number> - Numeric value
   - vtf:<type>:<value>:<formula> - Value with formula (type: n=number, t=text, nd=number-date, nl=number-logical, ne=number-error)
   - f:<fontID> - Font reference
   - c:<colorID> - Text color reference
   - bg:<colorID> - Background color reference
   - cf:<formatID> - Cell format (alignment) reference
   - l:<layoutID> - Layout (padding, vertical-align) reference
   - b:<top>:<right>:<bottom>:<left> - Border references (0=no border, ID=border style)
   - ntvf:<formatID> - Number/text/value format reference
   - tvf:<formatID> - Text/value format reference
   - colspan:<number> - Column span (merge cells horizontally)
   - rowspan:<number> - Row span (merge cells vertically)

3. SHEET DEFINITION (required):
   sheet:c:<columns>:r:<rows>

4. STYLE DEFINITIONS:
   - font:<ID>:<style> <weight> <size> <family>
     Example: font:1:normal bold 14pt Arial,Helvetica,sans-serif
     
   - color:<ID>:<rgb>
     Example: color:1:rgb(255,0,0)
     
   - cellformat:<ID>:<alignment>
     Example: cellformat:1:center
     
   - layout:<ID>:padding:<values>;vertical-align:<value>;
     Example: layout:1:padding:20px * * *;vertical-align:top;
     
   - border:<ID>:<style>
     Example: border:1:1px solid rgb(0,0,0)
     
   - valueformat:<ID>:<format>
     Example: valueformat:1:dd-mmm-yyyy

5. COLUMN/ROW SIZING:
   - col:<ColumnID>:w:<width>
   - row:<RowID>:h:<height>

FORMULAS:
- Use standard spreadsheet formulas: SUM(), AVERAGE(), IF(), etc.
- Cell ranges: A1\\cA5 (backslash-c for range separator)
- TODAY() for current date (returns serial number)
- Arithmetic: +, -, *, /

TRAINING EXAMPLES:
{examples_text}

KEY RULES:
1. ALWAYS start with "version:1.5"
2. ALWAYS include "sheet:c:<cols>:r:<rows>" line
3. Cell references start at A1 (A-Z for columns, 1-N for rows)
4. For formulas, use vtf:n:<result>:<formula> format
5. For merged cells, use colspan and/or rowspan
6. Reference IDs (font, color, etc.) must be defined before use
7. Use proper escaping: \\c for colons in text, \\n for newlines
8. TODAY() returns a date serial number (e.g., 45951 for current date)

When generating spreadsheets:
- Parse the user request carefully
- Create appropriate cell structure
- Add formulas where calculations are needed
- Apply styling (fonts, colors, borders) for professional appearance
- Use merged cells for headers and sections
- Include proper formatting for numbers, dates, currency

When correcting spreadsheets:
- Identify syntax errors
- Fix incorrect references
- Validate formula syntax
- Ensure all referenced IDs are defined
- Maintain MSC format conventions"""

        return system_prompt

    def generate_spreadsheet(self, description: str) -> str:
        """
        Generate a spreadsheet in MSC syntax based on user description.

        Args:
            description: Natural language description of the spreadsheet

        Returns:
            MSC syntax string
        """
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", self.system_prompt),
                ("human",
                 "Generate a spreadsheet in MSC syntax based on this description:\n\n{description}\n\nReturn ONLY the MSC syntax code, no explanations or markdown formatting.")
            ])

            chain = prompt | self.llm
            response = chain.invoke({"description": description})

            # Extract content from response
            msc_code = response.content if hasattr(
                response, 'content') else str(response)
            msc_code = msc_code.strip()

            # Clean up response (remove markdown code blocks if present)
            if msc_code.startswith("```"):
                lines = msc_code.split('\n')
                msc_code = '\n'.join(
                    lines[1:-1]) if len(lines) > 2 else msc_code

            return msc_code

        except Exception as e:
            return f"Error generating spreadsheet: {e}"

    def correct_spreadsheet(self, msc_code: str, issue_description: Optional[str] = None) -> str:
        """
        Correct errors in MSC syntax code.

        Args:
            msc_code: MSC syntax code with potential errors
            issue_description: Optional description of the issue

        Returns:
            Corrected MSC syntax string
        """
        try:
            correction_prompt_text = f"""Analyze and correct the following MSC syntax code:

```
{msc_code}
```
"""
            if issue_description:
                correction_prompt_text += f"\nSpecific issue to address: {issue_description}"

            correction_prompt_text += "\n\nReturn ONLY the corrected MSC syntax code, no explanations."

            prompt = ChatPromptTemplate.from_messages([
                ("system", self.system_prompt),
                ("human", correction_prompt_text)
            ])

            chain = prompt | self.llm
            response = chain.invoke({})

            # Extract content from response
            corrected_code = response.content if hasattr(
                response, 'content') else str(response)
            corrected_code = corrected_code.strip()

            # Clean up response
            if corrected_code.startswith("```"):
                lines = corrected_code.split('\n')
                corrected_code = '\n'.join(
                    lines[1:-1]) if len(lines) > 2 else corrected_code

            return corrected_code

        except Exception as e:
            return f"Error correcting spreadsheet: {e}"

    def validate_msc(self, msc_code: str) -> Dict[str, any]:
        """
        Validate MSC syntax and provide feedback.

        Args:
            msc_code: MSC syntax code to validate

        Returns:
            Dictionary with validation results
        """
        issues = []

        lines = msc_code.strip().split('\n')

        # Check for version line
        if not lines or not lines[0].startswith('version:'):
            issues.append(
                "Missing or incorrect version line (should be 'version:1.5')")

        # Check for sheet definition
        has_sheet = any(line.startswith('sheet:') for line in lines)
        if not has_sheet:
            issues.append("Missing sheet definition line")

        # Check for referenced IDs
        defined_fonts = set()
        defined_colors = set()
        defined_cellformats = set()
        used_fonts = set()
        used_colors = set()
        used_bg_colors = set()
        used_cellformats = set()

        for line in lines:
            if line.startswith('font:'):
                parts = line.split(':')
                if len(parts) > 1:
                    defined_fonts.add(parts[1])
            elif line.startswith('color:'):
                parts = line.split(':')
                if len(parts) > 1:
                    defined_colors.add(parts[1])
            elif line.startswith('cellformat:'):
                parts = line.split(':')
                if len(parts) > 1:
                    defined_cellformats.add(parts[1])
            elif line.startswith('cell:'):
                if ':f:' in line:
                    # Extract font ID
                    parts = line.split(':f:')
                    if len(parts) > 1:
                        font_id = parts[1].split(':')[0]
                        used_fonts.add(font_id)
                if ':c:' in line:
                    parts = line.split(':c:')
                    if len(parts) > 1:
                        color_id = parts[1].split(':')[0]
                        used_colors.add(color_id)
                if ':bg:' in line:
                    parts = line.split(':bg:')
                    if len(parts) > 1:
                        color_id = parts[1].split(':')[0]
                        used_bg_colors.add(color_id)
                if ':cf:' in line:
                    parts = line.split(':cf:')
                    if len(parts) > 1:
                        cf_id = parts[1].split(':')[0]
                        used_cellformats.add(cf_id)

        # Check for undefined references
        undefined_fonts = used_fonts - defined_fonts
        undefined_colors = (used_colors | used_bg_colors) - defined_colors
        undefined_cellformats = used_cellformats - defined_cellformats

        if undefined_fonts:
            issues.append(f"Undefined font IDs: {', '.join(undefined_fonts)}")
        if undefined_colors:
            issues.append(
                f"Undefined color IDs: {', '.join(undefined_colors)}")
        if undefined_cellformats:
            issues.append(
                f"Undefined cellformat IDs: {', '.join(undefined_cellformats)}")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "line_count": len(lines)
        }

    def save_to_file(self, msc_code: str, filename: str) -> None:
        """
        Save MSC code to a file.

        Args:
            msc_code: MSC syntax code
            filename: Output filename
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(msc_code)
            print(f"✓ Saved spreadsheet to {filename}")
        except Exception as e:
            print(f"✗ Error saving file: {e}")


def main():
    """Main function demonstrating the agent's capabilities."""
    print("=" * 70)
    print("SPREADSHEET GENERATION & CORRECTION AGENT")
    print("Using Claude Sonnet 3.5 via Amazon Bedrock")
    print("=" * 70)
    print()

    # Initialize the agent
    agent = SpreadsheetAgent()

    # Interactive mode
    while True:
        print("\n" + "=" * 70)
        print("OPTIONS:")
        print("1. Generate new spreadsheet")
        print("2. Correct existing spreadsheet")
        print("3. Validate MSC syntax")
        print("4. Exit")
        print("=" * 70)

        choice = input("\nEnter your choice (1-4): ").strip()

        if choice == "1":
            print("\n--- GENERATE NEW SPREADSHEET ---")
            description = input(
                "Describe the spreadsheet you want to create:\n> ")

            if description:
                print("\n⏳ Generating spreadsheet...")
                msc_code = agent.generate_spreadsheet(description)
                print("\n--- GENERATED MSC CODE ---")
                print(msc_code)

                # Validate
                validation = agent.validate_msc(msc_code)
                print("\n--- VALIDATION ---")
                if validation["valid"]:
                    print("✓ Syntax is valid!")
                else:
                    print("⚠ Issues found:")
                    for issue in validation["issues"]:
                        print(f"  - {issue}")

                # Save option
                save = input("\nSave to file? (y/n): ").strip().lower()
                if save == 'y':
                    filename = input(
                        "Enter filename (e.g., output.msc): ").strip()
                    agent.save_to_file(msc_code, filename)

        elif choice == "2":
            print("\n--- CORRECT SPREADSHEET ---")
            print("Enter MSC code (type 'END' on a new line when done):")
            lines = []
            while True:
                line = input()
                if line == "END":
                    break
                lines.append(line)

            msc_code = '\n'.join(lines)
            issue = input(
                "\nDescribe the issue (optional, press Enter to skip): ").strip()

            print("\n⏳ Correcting spreadsheet...")
            corrected = agent.correct_spreadsheet(
                msc_code, issue if issue else None)
            print("\n--- CORRECTED MSC CODE ---")
            print(corrected)

            # Save option
            save = input("\nSave to file? (y/n): ").strip().lower()
            if save == 'y':
                filename = input(
                    "Enter filename (e.g., corrected.msc): ").strip()
                agent.save_to_file(corrected, filename)

        elif choice == "3":
            print("\n--- VALIDATE MSC SYNTAX ---")
            print("Enter MSC code (type 'END' on a new line when done):")
            lines = []
            while True:
                line = input()
                if line == "END":
                    break
                lines.append(line)

            msc_code = '\n'.join(lines)
            validation = agent.validate_msc(msc_code)

            print("\n--- VALIDATION RESULTS ---")
            print(f"Lines: {validation['line_count']}")
            if validation["valid"]:
                print("✓ Syntax is valid!")
            else:
                print("⚠ Issues found:")
                for issue in validation["issues"]:
                    print(f"  - {issue}")

        elif choice == "4":
            print("\n👋 Goodbye!")
            break

        else:
            print("\n❌ Invalid choice. Please try again.")


if __name__ == "__main__":
    main()
