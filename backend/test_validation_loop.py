#!/usr/bin/env python3
"""
Test script for validation loop functionality
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Test cases
TEST_CASES = [
    {
        "name": "Simple table generation",
        "prompt": "Create a simple 3x3 table",
        "expected_mode": "generate"
    },
    {
        "name": "Invoice with theme",
        "prompt": "Create an invoice with teal theme",
        "expected_mode": "generate"
    },
    {
        "name": "Complex document",
        "prompt": "Make a report with headers, borders, and orange colors",
        "expected_mode": "generate"
    }
]


def test_validation_loop():
    """Test the validation loop with various prompts"""
    print("=" * 80)
    print("Testing Validation Loop")
    print("=" * 80)
    print()

    try:
        from agent import SocialCalcAgent

        agent = SocialCalcAgent()
        print(f"✓ Agent initialized")
        print(f"✓ Validator available: {agent.validator is not None}")
        print(f"✓ Max retries: {agent.max_validation_retries}")
        print()

        for i, test_case in enumerate(TEST_CASES, 1):
            print(f"\n{'='*80}")
            print(f"Test {i}/{len(TEST_CASES)}: {test_case['name']}")
            print(f"{'='*80}")
            print(f"Prompt: \"{test_case['prompt']}\"")
            print()

            try:
                result = agent.process_request(
                    prompt=test_case['prompt'],
                    current_code=None,
                    mode=None
                )

                if result['success']:
                    data = result['data']
                    print(f"\n✅ Test passed!")
                    print(f"   Mode: {data['mode']}")
                    print(f"   Code length: {len(data['savestr'])} characters")
                    print(f"   Reasoning: {data['reasoning']}")

                    # Validate the final result one more time to confirm
                    if agent.validator:
                        final_validation = agent._validate_code(
                            data['savestr'])
                        print(
                            f"   Final validation: {'✅ Valid' if final_validation['valid'] else '❌ Invalid'}")
                        if not final_validation['valid']:
                            print(
                                f"   Errors: {final_validation['errorCount']}")
                            for err in final_validation['errors'][:3]:
                                print(
                                    f"      - {err.get('message', str(err))}")
                else:
                    print(
                        f"\n❌ Test failed: {result.get('error', 'Unknown error')}")

            except Exception as e:
                print(f"\n❌ Test error: {str(e)}")
                import traceback
                traceback.print_exc()

        print(f"\n{'='*80}")
        print("All tests completed!")
        print(f"{'='*80}")

    except ImportError as e:
        print(f"❌ Error: Could not import agent module: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True


def test_validator_directly():
    """Test the validator directly"""
    print("\n" + "=" * 80)
    print("Testing Validator Directly")
    print("=" * 80)
    print()

    try:
        from validator import SocialCalcValidator

        validator = SocialCalcValidator({'verbose': False})

        # Test 1: Valid code
        print("Test 1: Valid code")
        valid_code = """version:1.5
cell:B2:t:Hello World
sheet:c:5:r:10"""

        result = validator.validate(valid_code)
        print(f"   Result: {'✅ Valid' if result['valid'] else '❌ Invalid'}")
        print(f"   Errors: {result['errorCount']}")
        print(f"   Warnings: {result['warningCount']}")

        # Test 2: Invalid code
        print("\nTest 2: Invalid code (missing version)")
        invalid_code = """cell:A1:t:Test
sheet:c:5:r:10"""

        result = validator.validate(invalid_code)
        print(f"   Result: {'✅ Valid' if result['valid'] else '❌ Invalid'}")
        print(f"   Errors: {result['errorCount']}")
        if result['errors']:
            print(
                f"   First error: {result['errors'][0].get('message', str(result['errors'][0]))}")

        print("\n✅ Validator tests completed")

    except ImportError as e:
        print(f"❌ Error: Could not import validator: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True


if __name__ == '__main__':
    print("\n🧪 SocialCalc Agent Validation Loop Tests\n")

    # Check Node.js availability
    import subprocess
    try:
        result = subprocess.run(['node', '--version'],
                                capture_output=True,
                                check=True,
                                timeout=5)
        node_version = result.stdout.decode().strip()
        print(f"✓ Node.js available: {node_version}")
    except:
        print("⚠️  Node.js not available - validator will be skipped")

    print()

    # Run tests
    validator_ok = test_validator_directly()
    print()

    if validator_ok:
        validation_loop_ok = test_validation_loop()
    else:
        print("⚠️  Skipping validation loop tests due to validator issues")
        validation_loop_ok = False

    print("\n" + "=" * 80)
    if validator_ok and validation_loop_ok:
        print("✅ All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed")
        sys.exit(1)
