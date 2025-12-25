import boto3
import os
from botocore.exceptions import ClientError

user_bucket_name = 'amzn-invoice-user'
user_id = '24e8f428-3051-7088-7b12-d2055f1133a5'

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    region_name=os.environ.get('AWS_REGION', 'us-east-1')
)

def fix_file(bad_key, correct_key):
    print(f"Renaming {bad_key} -> {correct_key}...")
    try:
        # Copy
        s3_client.copy_object(
            Bucket=user_bucket_name,
            CopySource={'Bucket': user_bucket_name, 'Key': bad_key},
            Key=correct_key
        )
        print("Copy successful.")
        
        # Delete original
        s3_client.delete_object(Bucket=user_bucket_name, Key=bad_key)
        print("Delete successful.")
        
    except ClientError as e:
        print(f"Error fixing {bad_key}: {e}")

def main():
    # Fix Data
    bad_data = f"{user_id}/templates/data/Work-Order.json.json"
    good_data = f"{user_id}/templates/data/Work-Order.json"
    fix_file(bad_data, good_data)
    
    # Fix Metadata
    bad_meta = f"{user_id}/templates/metadata/Work-Order.json.json"
    good_meta = f"{user_id}/templates/metadata/Work-Order.json"
    fix_file(bad_meta, good_meta)
    
    # Also check if another one exists?
    # List again to verify
    prefix = f"{user_id}/"
    resp = s3_client.list_objects_v2(Bucket=user_bucket_name, Prefix=prefix)
    if 'Contents' in resp:
        for obj in resp['Contents']:
            print(f"Current: {obj['Key']}")

if __name__ == "__main__":
    main()
