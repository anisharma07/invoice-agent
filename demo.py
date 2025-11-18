"""
Simple demo script for the Spreadsheet Agent
"""

from spreadsheet_agent import SpreadsheetAgent


def demo_generate():
    """Demonstrate spreadsheet generation."""
    print("\n" + "="*70)
    print("DEMO 1: GENERATE SIMPLE INVOICE")
    print("="*70)

    agent = SpreadsheetAgent()

    description = """
    Create a simple invoice with:
    - Company name "Tech Solutions" at the top
    - Invoice number and date
    - Bill to section
    - A table with 3 items: Product, Quantity, Price, Total
    - Item 1: Laptop, 2, $1200
    - Item 2: Mouse, 5, $25
    - Item 3: Keyboard, 3, $75
    - Calculate totals with formulas
    - Grand total at the bottom
    """

    print("\nDescription:", description)
    print("\n⏳ Generating...")

    msc_code = agent.generate_spreadsheet(description)

    print("\n--- GENERATED MSC CODE ---")
    print(msc_code)

    # Validate
    validation = agent.validate_msc(msc_code)
    print("\n--- VALIDATION ---")
    if validation["valid"]:
        print("✓ Valid MSC syntax!")
    else:
        print("⚠ Issues:")
        for issue in validation["issues"]:
            print(f"  - {issue}")

    # Save
    agent.save_to_file(msc_code, "demo_invoice.msc")


def demo_generate_budget():
    """Demonstrate budget spreadsheet generation."""
    print("\n" + "="*70)
    print("DEMO 2: GENERATE MONTHLY BUDGET")
    print("="*70)

    agent = SpreadsheetAgent()

    description = """
    Create a monthly budget spreadsheet with:
    - Title "Monthly Budget - January 2025" centered and bold
    - Income section with salary $5000
    - Expenses section with categories:
      * Rent: $1500
      * Food: $600
      * Transportation: $300
      * Utilities: $200
      * Entertainment: $150
    - Calculate total expenses with SUM formula
    - Calculate remaining balance (Income - Expenses)
    - Use colors: green for income, red for expenses
    - Add borders to the table
    """

    print("\nDescription:", description)
    print("\n⏳ Generating...")

    msc_code = agent.generate_spreadsheet(description)

    print("\n--- GENERATED MSC CODE ---")
    print(msc_code)

    agent.save_to_file(msc_code, "demo_budget.msc")


def demo_correct():
    """Demonstrate spreadsheet correction."""
    print("\n" + "="*70)
    print("DEMO 3: CORRECT BROKEN MSC CODE")
    print("="*70)

    agent = SpreadsheetAgent()

    # Intentionally broken MSC code
    broken_code = """
cell:A1:t:Hello World:f:1
cell:A2:v:100
cell:A3:vtf:n:200:A2*2
sheet:c:1:r:3
"""

    print("\n--- ORIGINAL (BROKEN) CODE ---")
    print(broken_code)

    validation = agent.validate_msc(broken_code)
    print("\n--- ISSUES DETECTED ---")
    for issue in validation["issues"]:
        print(f"  ⚠ {issue}")

    print("\n⏳ Correcting...")
    corrected = agent.correct_spreadsheet(
        broken_code, "Missing version line and undefined font reference")

    print("\n--- CORRECTED CODE ---")
    print(corrected)

    agent.save_to_file(corrected, "demo_corrected.msc")


def demo_medical_invoice():
    """Demonstrate complex medical invoice generation."""
    print("\n" + "="*70)
    print("DEMO 4: GENERATE MEDICAL INVOICE")
    print("="*70)

    agent = SpreadsheetAgent()

    description = """
    Create a medical clinic invoice with:
    - Header: "City Medical Clinic" in large bold font
    - Patient name and ID
    - Date with TODAY() function
    - Services table with borders:
      * Consultation: $150
      * Blood Test: $85
      * X-Ray: $200
      * Prescription: $45
    - Calculate subtotal
    - Insurance coverage (80% of subtotal)
    - Patient responsibility (20%)
    - Professional styling with blue theme
    """

    print("\nDescription:", description)
    print("\n⏳ Generating...")

    msc_code = agent.generate_spreadsheet(description)

    print("\n--- GENERATED MSC CODE ---")
    print(msc_code[:1000] + "..." if len(msc_code) > 1000 else msc_code)
    print(f"\nTotal lines: {len(msc_code.split(chr(10)))}")

    agent.save_to_file(msc_code, "demo_medical.msc")


if __name__ == "__main__":
    print("="*70)
    print("SPREADSHEET AGENT - DEMONSTRATION SUITE")
    print("Using Claude Sonnet 3.5 via Amazon Bedrock")
    print("="*70)

    demos = [
        ("1", "Simple Invoice", demo_generate),
        ("2", "Monthly Budget", demo_generate_budget),
        ("3", "Correct Broken Code", demo_correct),
        ("4", "Medical Invoice", demo_medical_invoice),
        ("5", "Run All Demos", lambda: [
         demo_generate(), demo_generate_budget(), demo_correct(), demo_medical_invoice()])
    ]

    print("\nAvailable Demos:")
    for num, name, _ in demos:
        print(f"  {num}. {name}")

    choice = input("\nSelect demo (1-5): ").strip()

    for num, name, func in demos:
        if choice == num:
            func()
            break
    else:
        print("Invalid choice!")
