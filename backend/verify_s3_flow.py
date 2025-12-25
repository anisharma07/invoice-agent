import sys
import os
import json
from dotenv import load_dotenv

# Load env variables (assume .env in CWD)
load_dotenv()

# Add current directory to path
sys.path.append(os.getcwd())

from s3_store import S3Store

def run_verification():
    print("Starting S3 Flow Verification...")
    store = S3Store()
    
    # 1. List Global Templates
    print("\n[1] Listing Global Templates...")
    global_templates = store.list_app_templates()
    print(f"Found {len(global_templates)} global templates.")
    if not global_templates:
        print("FAIL: No global templates found. Did seeding run?")
        return
    
    first_template = global_templates[0]
    template_id = first_template['id'].replace('.json', '')
    filename = f"{template_id}.json"
    print(f"Selected template for test: {filename} ({first_template.get('name')})")

    # 2. Fetch Global Template Data
    print(f"\n[2] Fetching Global Template Data for {filename}...")
    global_data = store.get_template(filename, 'app')
    if global_data:
        print("SUCCESS: Fetched global template data.")
    else:
        print("FAIL: Could not fetch global template data.")
        return

    # 3. Import Template
    print(f"\n[3] Importing Template {filename} to User Bucket...")
    if store.import_template(filename):
        print("SUCCESS: Template imported.")
    else:
        print("FAIL: Template import failed.")
        return
        
    # 4. List User Templates
    print("\n[4] Listing User Templates...")
    user_templates = store.list_user_templates()
    found = any(t['filename'] == filename or t['id'] == template_id for t in user_templates)
    
    if found:
        print(f"SUCCESS: Template {filename} found in user templates.")
    else:
        print(f"FAIL: Template {filename} NOT found in user templates after import.")
        # Debug
        print("User Templates:", [t['id'] for t in user_templates])
        return

    # 5. Fetch User Template Data
    print(f"\n[5] Fetching User Template Data for {filename}...")
    user_data = store.get_template(filename, 'user')
    if user_data:
        print("SUCCESS: Fetched user template data.")
        # Optional: Compare with global data
        if user_data == global_data:
             print("SUCCESS: User data matches global data.")
        else:
             print("WARNING: User data differs from global data.")
    else:
        print("FAIL: Could not fetch user template data.")
        return

    print("\nALL TESTS PASSED!")

if __name__ == "__main__":
    run_verification()
