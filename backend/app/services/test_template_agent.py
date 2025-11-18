"""
Test script for the Template Generation Agent system
Run with: python -m app.services.test_template_agent
"""

import os
import sys
import json
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))


def test_basic_generation():
    """Test basic template generation without image"""
    print("\n" + "="*70)
    print("TEST 1: Basic Template Generation")
    print("="*70)

    try:
        from app.services.template_generation_agent import TemplateGenerationAgent

        agent = TemplateGenerationAgent()

        prompt = "Create a professional tax invoice template for tablet devices with 15 item rows"

        print(f"\nPrompt: {prompt}")
        print("\nGenerating template...")

        result = agent.generate_template(
            user_prompt=prompt,
            invoice_image=None
        )

        # Validate response structure
        assert "assistantResponse" in result, "Missing assistantResponse"
        assert "validation" in result, "Missing validation"

        assistant_response = result["assistantResponse"]
        assert "text" in assistant_response, "Missing text"
        assert "savestr" in assistant_response, "Missing savestr"
        assert "cellMappings" in assistant_response, "Missing cellMappings"
        assert "templateMeta" in assistant_response, "Missing templateMeta"

        validation = result["validation"]
        assert "is_valid" in validation, "Missing is_valid"
        assert "attempts" in validation, "Missing attempts"
        assert "final_errors" in validation, "Missing final_errors"

        print("\n✓ Response structure validated")
        print(
            f"\nTemplate: {assistant_response['templateMeta'].get('name', 'Unknown')}")
        print(
            f"Category: {assistant_response['templateMeta'].get('category', 'Unknown')}")
        print(
            f"Device: {assistant_response['templateMeta'].get('deviceType', 'Unknown')}")
        print(
            f"\nValidation: {'PASSED' if validation['is_valid'] else 'FAILED'}")
        print(f"Attempts: {validation['attempts']}")

        if validation['final_errors']:
            print(f"Errors: {len(validation['final_errors'])}")
            for i, error in enumerate(validation['final_errors'][:3]):
                print(f"  {i+1}. {error}")

        print(
            f"\nSaveStr length: {len(assistant_response['savestr'])} characters")
        print(f"First line: {assistant_response['savestr'].split(chr(10))[0]}")

        # Check cell mappings
        cell_mappings = assistant_response['cellMappings']
        text_mappings = cell_mappings.get('text', {}).get('sheet1', {})
        print(f"\nEditable fields: {len(text_mappings)}")

        if 'Items' in text_mappings:
            items = text_mappings['Items']
            rows = items.get('Rows', {})
            print(f"Item rows: {rows.get('start', 0)} to {rows.get('end', 0)}")
            print(f"Item columns: {list(items.get('Columns', {}).keys())}")

        print("\n✅ TEST 1 PASSED\n")
        return True

    except Exception as e:
        print(f"\n❌ TEST 1 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_cell_mapping_agent():
    """Test MetaAndCellMap agent directly"""
    print("\n" + "="*70)
    print("TEST 2: MetaAndCellMap Agent")
    print("="*70)

    try:
        from app.services.meta_cellmap_agent import MetaAndCellMapAgent

        agent = MetaAndCellMapAgent()

        prompt = "Create a simple invoice for mobile with 5 item rows"

        print(f"\nPrompt: {prompt}")
        print("\nGenerating cell mappings...")

        template_meta, cell_mappings = agent.generate_cell_mappings(prompt)

        print("\n✓ Cell mappings generated")
        print(f"\nTemplate Meta:")
        print(json.dumps(template_meta, indent=2))

        print(f"\nCell Mappings (abbreviated):")
        print(f"  Logo: {cell_mappings.get('logo', {})}")
        print(f"  Signature: {cell_mappings.get('signature', {})}")
        print(
            f"  Text fields: {len(cell_mappings.get('text', {}).get('sheet1', {}))}")

        print("\n✅ TEST 2 PASSED\n")
        return True

    except Exception as e:
        print(f"\n❌ TEST 2 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_savestr_agent():
    """Test SaveStr agent directly"""
    print("\n" + "="*70)
    print("TEST 3: SaveStr Agent")
    print("="*70)

    try:
        from app.services.savestr_agent import SaveStrAgent

        agent = SaveStrAgent()

        # Sample metadata and mappings
        template_meta = {
            "name": "Test-Invoice",
            "domain": "invoice",
            "category": "simple_invoice",
            "deviceType": "mobile"
        }

        cell_mappings = {
            "text": {
                "sheet1": {
                    "Heading": "A1",
                    "Date": "B2",
                    "InvoiceNumber": "B3",
                    "Items": {
                        "Rows": {"start": 5, "end": 10},
                        "Columns": {
                            "Description": "A",
                            "Amount": "B"
                        }
                    },
                    "Total": "B11"
                }
            }
        }

        print("\nGenerating savestr...")

        savestr = agent.generate_savestr(
            template_meta=template_meta,
            cell_mappings=cell_mappings,
            user_prompt="Simple test invoice"
        )

        print("\n✓ SaveStr generated")
        print(f"\nLength: {len(savestr)} characters")
        print(f"First line: {savestr.split(chr(10))[0]}")

        # Check for required elements
        assert savestr.startswith(
            "version:"), "SaveStr should start with version"
        assert "cell:" in savestr, "SaveStr should contain cell definitions"

        print("\n✅ TEST 3 PASSED\n")
        return True

    except Exception as e:
        print(f"\n❌ TEST 3 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_validation():
    """Test MSC validator integration"""
    print("\n" + "="*70)
    print("TEST 4: MSC Validator")
    print("="*70)

    try:
        from app.services.msc_validator import MSCValidator

        validator = MSCValidator()

        # Valid savestr
        valid_savestr = """version:1.5
cell:A1:t:Test
sheet:c:5:r:10
font:1:normal normal 10pt Arial
"""

        print("\nValidating valid savestr...")
        corrected, is_valid, messages = validator.validate_with_corrections(
            valid_savestr)

        print(f"Result: {'VALID' if is_valid else 'INVALID'}")
        print(f"Messages: {messages}")

        # Invalid savestr (missing font definition)
        invalid_savestr = """version:1.5
cell:A1:t:Test:f:5
sheet:c:5:r:10
"""

        print("\nValidating invalid savestr (missing font)...")
        corrected, is_valid, messages = validator.validate_with_corrections(
            invalid_savestr)

        print(f"Result: {'VALID' if is_valid else 'INVALID'}")
        print(f"Messages: {messages[:3] if len(messages) > 3 else messages}")

        print("\n✅ TEST 4 PASSED\n")
        return True

    except Exception as e:
        print(f"\n❌ TEST 4 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("TEMPLATE GENERATION AGENT - TEST SUITE")
    print("="*70)

    # Check environment
    print("\nEnvironment Check:")
    print(f"  AWS_REGION: {os.getenv('AWS_REGION', 'NOT SET')}")
    print(f"  ANTHROPIC_MODEL: {os.getenv('ANTHROPIC_MODEL', 'NOT SET')}")

    if not os.getenv("AWS_REGION"):
        print("\n⚠️  Warning: AWS_REGION not set. Tests may fail.")

    # Run tests
    results = []

    results.append(("Cell Mapping Agent", test_cell_mapping_agent()))
    results.append(("SaveStr Agent", test_savestr_agent()))
    results.append(("MSC Validator", test_validation()))
    results.append(("Full Pipeline", test_basic_generation()))

    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:30} {status}")

    print(f"\n{passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n⚠️  Some tests failed")
        return 1


if __name__ == "__main__":
    exit(main())
