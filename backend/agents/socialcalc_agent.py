import os
import json
import boto3
import time
from typing import Optional, Dict, List
from .datastore import DataStore
from .validator import SocialCalcValidator

# Temporarily disable validation to avoid AWS throttling
VALIDATOR_AVAILABLE = False


class SocialCalcAgent:
    """
    Intelligent agent that uses Claude via Amazon Bedrock to:
    1. Understand user prompts and extract meaningful insights
    2. Determine if task is generation or editing
    3. Retrieve relevant code from dataset or edit current code
    4. Make intelligent modifications based on user request
    """

    def __init__(self):
        """Initialize the agent with Bedrock client and datastore"""
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

        # Initialize datastore
        self.datastore = DataStore()

        # Load syntax reference
        self.syntax_reference = self._load_syntax_reference()

        # Initialize validator if available
        self.validator = SocialCalcValidator({
            'verbose': False,
            'strictMode': False,
            'maxErrors': 50
        }) if VALIDATOR_AVAILABLE else None

        # Validation retry settings
        self.max_validation_retries = 5

    def _load_syntax_reference(self) -> str:
        """Load the SocialCalc syntax reference"""
        try:
            syntax_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                'SYNTAX-COMPILED.txt'
            )
            with open(syntax_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Warning: Could not load syntax reference: {e}")
            return ""

    def _validate_code(self, code: str) -> Dict:
        """
        Validate SocialCalc code using the validator

        Args:
            code: SocialCalc format code to validate

        Returns:
            Dict with validation results
        """
        if not self.validator:
            return {'valid': True, 'errors': [], 'warnings': []}

        try:
            result = self.validator.validate(code)
            return result
        except Exception as e:
            print(f"Validation error: {e}")
            return {'valid': False, 'errors': [{'message': str(e)}], 'warnings': []}

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
                # Prepare the request body
                request_body = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 8000,
                    "temperature": 0.7,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                }

                # Add system prompt if provided
                if system_prompt:
                    request_body["system"] = system_prompt

                # Call Bedrock
                response = self.bedrock_runtime.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(request_body)
                )

                # Parse response
                response_body = json.loads(response['body'].read())
                return response_body['content'][0]['text']

            except Exception as e:
                error_str = str(e)
                if 'ThrottlingException' in error_str or 'Too many requests' in error_str:
                    if attempt < max_retries - 1:
                        # Exponential backoff: 2, 4, 8 seconds
                        wait_time = 2 ** (attempt + 1)
                        print(
                            f"Rate limited, waiting {wait_time}s before retry {attempt + 2}/{max_retries}...")
                        time.sleep(wait_time)
                        continue
                raise Exception(
                    f"Error calling Claude via Bedrock: {error_str}")

    def _analyze_intent(self, prompt: str, has_current_code: bool) -> Dict:
        """
        Analyze user intent to determine mode and extract keywords

        Args:
            prompt: User's natural language request
            has_current_code: Whether user provided current code

        Returns:
            Dict with mode, keywords, and reasoning
        """
        system_prompt = """You are an AI assistant that analyzes user requests for spreadsheet generation/editing.
Your task is to determine:
1. MODE: Is this a "generate" (create new) or "edit" (modify existing) request?
2. KEYWORDS: Extract key terms for matching templates (themes, colors, fonts, document types)
3. REASONING: Brief explanation of your analysis

Guidelines:
- If user says "change", "modify", "update", "edit", "fix" → EDIT mode
- If user says "create", "generate", "make", "new" → GENERATE mode
- If unclear and has_current_code=True → EDIT mode (default to editing)
- If unclear and has_current_code=False → GENERATE mode (default to generating)

Extract keywords like: invoice, report, table, colors (teal, red, orange), fonts (arial, courier), themes, borders, etc.

Respond ONLY with valid JSON in this exact format:
{
  "mode": "generate" or "edit",
  "keywords": ["keyword1", "keyword2", ...],
  "reasoning": "brief explanation"
}"""

        analysis_prompt = f"""Analyze this user request:
"{prompt}"

has_current_code: {has_current_code}

Provide your analysis as JSON."""

        try:
            response = self._call_claude(analysis_prompt, system_prompt)

            # Extract JSON from response
            response = response.strip()
            if response.startswith('```'):
                # Remove markdown code blocks
                lines = response.split('\n')
                json_lines = []
                in_json = False
                for line in lines:
                    if line.strip().startswith('```'):
                        in_json = not in_json
                        continue
                    if in_json or (not line.strip().startswith('```')):
                        json_lines.append(line)
                response = '\n'.join(json_lines)

            analysis = json.loads(response)
            return analysis

        except Exception as e:
            print(f"Error analyzing intent: {e}")
            # Fallback to simple heuristics
            mode = 'edit' if has_current_code else 'generate'
            keywords = prompt.lower().split()
            return {
                'mode': mode,
                'keywords': keywords,
                'reasoning': 'Fallback analysis due to error'
            }

    def _retrieve_relevant_code(self, keywords: List[str]) -> Optional[str]:
        """
        Retrieve the most relevant code from dataset based on keywords

        Args:
            keywords: List of extracted keywords

        Returns:
            Most relevant SocialCalc code or None
        """
        return self.datastore.find_best_match(keywords)

    def _generate_code(self, prompt: str, keywords: List[str], base_code: Optional[str]) -> str:
        """
        Generate new SocialCalc code based on prompt

        Args:
            prompt: User's request
            keywords: Extracted keywords
            base_code: Retrieved template code (if any)

        Returns:
            Generated SocialCalc format code
        """
        system_prompt = f"""You are an expert at generating SocialCalc spreadsheet code.

CRITICAL RULES:
1. ALWAYS start cells from B2, leaving first row and column empty (set col:A:w:10 for margin)
2. Return ONLY the SocialCalc format code - NO explanations, NO markdown
3. Follow the syntax EXACTLY as specified in the reference
4. Use the base_code as a template if provided, but modify it according to user's request
5. Ensure all referenced definitions (font, color, border, layout, etc.) exist before use
6. For merged cells, use colspan/rowspan and leave referenced cells empty
7. Use proper escaping: \\n for newline, \\c for colon in formulas, \\\\ for backslash

SYNTAX REFERENCE:
{self.syntax_reference}

Your response must be PURE SocialCalc format code starting with "version:1.5"."""

        if base_code:
            generation_prompt = f"""User request: "{prompt}"

Base template code (modify this according to user's request):
{base_code}

Generate the modified SocialCalc code:"""
        else:
            generation_prompt = f"""User request: "{prompt}"

Keywords: {', '.join(keywords)}

Generate SocialCalc code for this request:"""

        try:
            response = self._call_claude(generation_prompt, system_prompt)

            # Clean up response - remove markdown if present
            response = response.strip()
            if response.startswith('```'):
                lines = response.split('\n')
                code_lines = []
                in_code = False
                for line in lines:
                    if line.strip().startswith('```'):
                        in_code = not in_code
                        continue
                    if in_code:
                        code_lines.append(line)
                response = '\n'.join(code_lines)

            # Ensure it starts with version
            if not response.startswith('version:'):
                response = 'version:1.5\n' + response

            return response.strip()

        except Exception as e:
            raise Exception(f"Error generating code: {str(e)}")

    def _fix_code_with_validation_errors(self, code: str, validation_result: Dict, original_prompt: str) -> str:
        """
        Ask Claude to fix code based on validation errors

        Args:
            code: The code that failed validation
            validation_result: Validation result with errors
            original_prompt: Original user request

        Returns:
            Fixed SocialCalc code
        """
        errors_summary = "\n".join([
            f"Line {err.get('line', '?')}: {err.get('message', str(err))}"
            for err in validation_result.get('errors', [])
        ])

        system_prompt = f"""You are an expert at fixing SocialCalc spreadsheet code.

Your code failed validation. Fix ONLY the validation errors while keeping the original intent.

SYNTAX REFERENCE:
{self.syntax_reference}

IMPORTANT:
1. Fix ALL validation errors listed below
2. Keep the same structure and content
3. Return ONLY valid SocialCalc format code
4. Start with "version:1.5"
5. Do NOT add explanations or markdown"""

        fix_prompt = f"""Original request: "{original_prompt}"

Code that failed validation:
{code}

Validation errors:
{errors_summary}

Fix these errors and return corrected SocialCalc code:"""

        try:
            response = self._call_claude(fix_prompt, system_prompt)

            # Clean up response
            response = response.strip()
            if response.startswith('```'):
                lines = response.split('\n')
                code_lines = []
                in_code = False
                for line in lines:
                    if line.strip().startswith('```'):
                        in_code = not in_code
                        continue
                    if in_code:
                        code_lines.append(line)
                response = '\n'.join(code_lines)

            if not response.startswith('version:'):
                response = 'version:1.5\n' + response

            return response.strip()

        except Exception as e:
            raise Exception(f"Error fixing code: {str(e)}")

    def _generate_code_with_validation(self, prompt: str, keywords: List[str], base_code: Optional[str]) -> str:
        """
        Generate code with validation loop and automatic fixing

        Args:
            prompt: User's request
            keywords: Extracted keywords
            base_code: Retrieved template code (if any)

        Returns:
            Valid SocialCalc format code
        """
        attempt = 0
        code = None

        while attempt < self.max_validation_retries:
            attempt += 1

            if attempt == 1:
                # First attempt: generate new code
                print(
                    f"Generating code (attempt {attempt}/{self.max_validation_retries})...")
                code = self._generate_code(prompt, keywords, base_code)
            else:
                # Subsequent attempts: fix previous code
                print(
                    f"Fixing code based on validation errors (attempt {attempt}/{self.max_validation_retries})...")
                code = self._fix_code_with_validation_errors(
                    code, validation_result, prompt)

            # Validate the generated code
            print(f"Validating generated code...")
            validation_result = self._validate_code(code)

            if validation_result['valid']:
                print(f"✅ Code validated successfully on attempt {attempt}")
                if validation_result.get('warningCount', 0) > 0:
                    print(
                        f"   Note: {validation_result['warningCount']} warning(s) found but code is valid")
                return code
            else:
                error_count = validation_result.get(
                    'errorCount', len(validation_result.get('errors', [])))
                print(f"❌ Validation failed with {error_count} error(s)")
                if attempt < self.max_validation_retries:
                    print(f"   Retrying...")

        # Max retries reached
        print(
            f"⚠️ Warning: Max validation retries ({self.max_validation_retries}) reached")
        print(f"   Returning last generated code despite validation errors")
        return code

    def _edit_code(self, prompt: str, current_code: str) -> str:
        """
        Edit existing SocialCalc code based on prompt

        Args:
            prompt: User's modification request
            current_code: Current SocialCalc code to modify

        Returns:
            Modified SocialCalc format code
        """
        system_prompt = f"""You are an expert at editing SocialCalc spreadsheet code.

CRITICAL RULES:
1. Make ONLY the changes requested by the user
2. Keep all other aspects of the sheet unchanged
3. Return ONLY the complete modified SocialCalc format code - NO explanations
4. Maintain all existing definitions that are still needed
5. Remove unused definitions if cells no longer reference them
6. Ensure all cell references remain valid after modifications
7. Follow the syntax EXACTLY as specified

SYNTAX REFERENCE:
{self.syntax_reference}

Your response must be PURE SocialCalc format code starting with "version:1.5"."""

        edit_prompt = f"""User's modification request: "{prompt}"

Current code to modify:
{current_code}

Generate the modified SocialCalc code:"""

        try:
            response = self._call_claude(edit_prompt, system_prompt)

            # Clean up response
            response = response.strip()
            if response.startswith('```'):
                lines = response.split('\n')
                code_lines = []
                in_code = False
                for line in lines:
                    if line.strip().startswith('```'):
                        in_code = not in_code
                        continue
                    if in_code:
                        code_lines.append(line)
                response = '\n'.join(code_lines)

            # Ensure it starts with version
            if not response.startswith('version:'):
                response = 'version:1.5\n' + response

            return response.strip()

        except Exception as e:
            raise Exception(f"Error editing code: {str(e)}")

    def _edit_code_with_validation(self, prompt: str, current_code: str) -> str:
        """
        Edit code with validation loop and automatic fixing

        Args:
            prompt: User's modification request
            current_code: Current SocialCalc code to modify

        Returns:
            Valid modified SocialCalc format code
        """
        attempt = 0
        code = None

        while attempt < self.max_validation_retries:
            attempt += 1

            if attempt == 1:
                # First attempt: edit code
                print(
                    f"Editing code (attempt {attempt}/{self.max_validation_retries})...")
                code = self._edit_code(prompt, current_code)
            else:
                # Subsequent attempts: fix previous code
                print(
                    f"Fixing edited code based on validation errors (attempt {attempt}/{self.max_validation_retries})...")
                code = self._fix_code_with_validation_errors(
                    code, validation_result, prompt)

            # Validate the edited code
            print(f"Validating edited code...")
            validation_result = self._validate_code(code)

            if validation_result['valid']:
                print(f"✅ Code validated successfully on attempt {attempt}")
                if validation_result.get('warningCount', 0) > 0:
                    print(
                        f"   Note: {validation_result['warningCount']} warning(s) found but code is valid")
                return code
            else:
                error_count = validation_result.get(
                    'errorCount', len(validation_result.get('errors', [])))
                print(f"❌ Validation failed with {error_count} error(s)")
                if attempt < self.max_validation_retries:
                    print(f"   Retrying...")

        # Max retries reached
        print(
            f"⚠️ Warning: Max validation retries ({self.max_validation_retries}) reached")
        print(f"   Returning last edited code despite validation errors")
        return code

    def process_request(
        self,
        prompt: str,
        current_code: Optional[str] = None,
        mode: Optional[str] = None
    ) -> Dict:
        """
        Process user request and generate/edit SocialCalc code

        Args:
            prompt: User's natural language request
            current_code: Optional current sheet code (for editing)
            mode: Optional mode override ('generate' or 'edit')

        Returns:
            Dict with success status, data, and error info
        """
        try:
            # Step 1: Analyze intent if mode not provided
            if mode not in ['generate', 'edit']:
                analysis = self._analyze_intent(prompt, bool(current_code))
                mode = analysis['mode']
                keywords = analysis['keywords']
                reasoning = analysis['reasoning']
            else:
                # Extract keywords manually if mode is provided
                keywords = [word.lower()
                            for word in prompt.split() if len(word) > 3]
                reasoning = f"Mode explicitly set to {mode}"

            print(f"Mode: {mode}, Keywords: {keywords}")
            print(f"Reasoning: {reasoning}")

            # Step 2: Process based on mode
            if mode == 'edit' and current_code:
                # Edit existing code with validation
                generated_code = self._edit_code_with_validation(
                    prompt, current_code)
                reasoning_msg = f"Modified existing code: {reasoning}"

            else:
                # Generate new code
                # Retrieve relevant template from dataset
                base_code = self._retrieve_relevant_code(keywords)

                if base_code:
                    print(f"Found relevant template in dataset")
                    reasoning_msg = f"Generated from template: {reasoning}"
                else:
                    print(f"No template found, generating from scratch")
                    reasoning_msg = f"Generated from scratch: {reasoning}"

                # Generate code with validation loop
                generated_code = self._generate_code_with_validation(
                    prompt, keywords, base_code)

            return {
                'success': True,
                'data': {
                    'savestr': generated_code,
                    'mode': mode,
                    'reasoning': reasoning_msg
                }
            }

        except Exception as e:
            print(f"Error in process_request: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
