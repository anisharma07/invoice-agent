import json
import os
import sys

# Add backend directory to sys.path to allow importing s3_store
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from s3_store import S3Store

def seed_templates():
    print("Initializing S3 Seed Process...")
    
    # Initialize S3 Store
    store = S3Store()
    
    # Path to migration output
    data_path = os.path.join(os.path.dirname(__file__), '../.agent/migration/output.json')
    
    try:
        with open(data_path, 'r') as f:
            all_templates_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Migration output not found at {data_path}")
        return

    # Metadata map (Manually extracted from frontend/src/templates-meta.ts)
    # This ensures we have the correct display names and descriptions
    metadata_map = {
        "1001": {
            "name": "Mobile-Invoice-1",
            "type": "invoice",
            "device": "mobile",
            "description": "Simple mobile invoice template",
            "isPremium": False,
            "price": {"USD": 0}
        },
        "1002": {
            "name": "Mobile-Tax-Invoice",
            "type": "invoice",
            "device": "mobile",
            "description": "Mobile tax invoice with detailed tax breakdown",
            "isPremium": False,
            "price": {"USD": 0}
        },
        "1003": {
            "name": "Mobile-Multi-Invoice",
            "type": "invoice",
            "device": "mobile",
            "description": "Mobile invoice with multiple items and categories",
            "isPremium": False,
            "price": {"USD": 0}
        }
    }

    print(f"Found {len(all_templates_data)} templates to seed.")

    for template_id, template_data in all_templates_data.items():
        print(f"Seeding template {template_id}...")
        
        # Get metadata or default
        meta = metadata_map.get(template_id, {
            "name": f"Template {template_id}",
            "type": "invoice",
            "device": "desktop",
            "description": "Imported Template",
            "isPremium": False,
            "price": {"USD": 0}
        })
        
        # Construct full metadata object
        # We store this in templates/metadata/{id}.json
        # The id in S3 filename serves as the unique identifier
        full_metadata = {
            "id": template_id,
            **meta
        }
        
        # Construct full data object
        # The actual spreadsheet data and app mapping
        # We store this in templates/data/{id}.json
        # It's what the application loads when editing
        full_data = {
            "templateId": template_id, # Keep ID in data for reference
            **template_data
        }
        
        filename = f"{template_id}.json"
        
        if store.save_template_seed(filename, full_metadata, full_data):
            print(f"Successfully seeded {filename}")
        else:
            print(f"Failed to seed {filename}")

if __name__ == "__main__":
    seed_templates()
