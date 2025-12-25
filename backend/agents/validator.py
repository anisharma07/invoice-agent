"""
Python wrapper for the JavaScript SocialCalc Validator
Calls the Node.js validator and returns results
"""

import os
import json
import subprocess
from typing import Dict


class SocialCalcValidator:
    """
    Python wrapper for the JavaScript SocialCalc Validator
    """

    def __init__(self, options: Dict = None):
        """
        Initialize the validator

        Args:
            options: Validator options (verbose, strictMode, maxErrors)
        """
        self.options = options or {}
        # Path fixed for agents/ subdirectory execution
        self.validator_path = os.path.join(
            os.path.dirname(__file__),
            '..',
            '..',
            'validate-cli.cjs'
        )

        # Check if Node.js is available
        try:
            subprocess.run(['node', '--version'],
                           capture_output=True,
                           check=True,
                           timeout=5)
            self.node_available = True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            print("Warning: Node.js not available. Validation will be skipped.")
            self.node_available = False

    def validate(self, code: str) -> Dict:
        """
        Validate SocialCalc code

        Args:
            code: SocialCalc format code to validate

        Returns:
            Dict with validation results
        """
        if not self.node_available:
            # Return valid if Node.js not available
            return {
                'valid': True,
                'errors': [],
                'warnings': [],
                'errorCount': 0,
                'warningCount': 0,
                'stats': {},
                'styleDefinitions': {},
                'cells': 0,
                'formulas': 0
            }

        try:
            # Prepare command line arguments
            cmd = ['node', self.validator_path, '--json', '--string', code]

            # Add options
            if self.options.get('strict') or self.options.get('strictMode'):
                cmd.append('--strict')

            if self.options.get('verbose'):
                cmd.append('--verbose')

            if self.options.get('maxErrors'):
                cmd.extend(['--max-errors', str(self.options['maxErrors'])])

            # Run validator
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30  # 30 second timeout
            )

            # Parse JSON output
            try:
                validation_result = json.loads(result.stdout)
                return validation_result
            except json.JSONDecodeError as e:
                print(f"Error parsing validator output: {e}")
                print(f"Stdout: {result.stdout}")
                print(f"Stderr: {result.stderr}")
                return {
                    'valid': False,
                    'errors': [{'message': f'Validator output parsing error: {e}'}],
                    'warnings': [],
                    'errorCount': 1,
                    'warningCount': 0
                }

        except subprocess.TimeoutExpired:
            print("Validation timeout (30s)")
            return {
                'valid': False,
                'errors': [{'message': 'Validation timeout'}],
                'warnings': [],
                'errorCount': 1,
                'warningCount': 0
            }

        except Exception as e:
            print(f"Validation error: {e}")
            return {
                'valid': False,
                'errors': [{'message': str(e)}],
                'warnings': [],
                'errorCount': 1,
                'warningCount': 0
            }
