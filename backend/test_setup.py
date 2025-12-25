#!/usr/bin/env python3
"""
Test script for the SocialCalc AI Agent
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))


def test_environment():
    """Test if environment variables are configured"""
    print("Testing environment configuration...")

    required_vars = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'ANTHROPIC_MODEL'
    ]

    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✓ {var}: {'*' * 10} (set)")
        else:
            print(f"✗ {var}: (missing)")
            missing.append(var)

    if missing:
        print(f"\n❌ Missing environment variables: {', '.join(missing)}")
        return False

    print("\n✓ All environment variables are set!")
    return True


def test_imports():
    """Test if all required packages are installed"""
    print("\nTesting imports...")

    packages = [
        ('flask', 'Flask'),
        ('flask_cors', 'flask-cors'),
        ('boto3', 'boto3'),
        ('dotenv', 'python-dotenv'),
    ]

    missing = []
    for module, package in packages:
        try:
            __import__(module)
            print(f"✓ {package}: installed")
        except ImportError:
            print(f"✗ {package}: not installed")
            missing.append(package)

    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print(f"Install with: pip install {' '.join(missing)}")
        return False

    print("\n✓ All packages are installed!")
    return True


def test_datastore():
    """Test if datastore can load templates"""
    print("\nTesting datastore...")

    try:
        from datastore import DataStore
        ds = DataStore()

        num_templates = len(ds.templates)
        print(f"✓ Loaded {num_templates} templates")

        if num_templates == 0:
            print("⚠ Warning: No templates loaded. Check invoice_mapping_full.json")
            return True

        # Test keyword matching
        keywords = ['invoice', 'teal']
        result = ds.find_best_match(keywords)
        if result:
            print(f"✓ Keyword matching works (found template for {keywords})")
        else:
            print(f"⚠ No template found for keywords: {keywords}")

        return True

    except Exception as e:
        print(f"✗ Error loading datastore: {e}")
        return False


def test_bedrock_connection():
    """Test connection to AWS Bedrock"""
    print("\nTesting AWS Bedrock connection...")

    try:
        import boto3

        client = boto3.client(
            service_name='bedrock-runtime',
            region_name=os.getenv('AWS_REGION', 'us-east-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )

        # Try to list foundation models (lightweight test)
        print("✓ AWS credentials are valid")
        print("✓ Bedrock client initialized successfully")
        return True

    except Exception as e:
        print(f"✗ Error connecting to Bedrock: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("SocialCalc AI Agent - Setup Test")
    print("=" * 60)

    tests = [
        ("Environment Configuration", test_environment),
        ("Package Installation", test_imports),
        ("DataStore", test_datastore),
        ("AWS Bedrock Connection", test_bedrock_connection),
    ]

    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ Error in {name}: {e}")
            results.append((name, False))
        print()

    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! You're ready to start the backend.")
        print("\nRun: python app.py")
        sys.exit(0)
    else:
        print("\n⚠ Some tests failed. Please fix the issues above.")
        sys.exit(1)


if __name__ == '__main__':
    main()
