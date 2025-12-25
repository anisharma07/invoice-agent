import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def check_s3():
    print("Checking S3 Configuration...")
    
    # Check Env Vars
    print(f"APP_BUCKET_NAME: {os.getenv('APP_BUCKET_NAME')}")
    print(f"USER_BUCKET_NAME: {os.getenv('USER_BUCKET_NAME')}")
    print(f"AWS_ACCESS_KEY_ID present: {bool(os.getenv('AWS_ACCESS_KEY_ID'))}")
    
    # Try to list buckets
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        response = s3.list_buckets()
        print("Available Buckets:")
        for bucket in response['Buckets']:
            print(f" - {bucket['Name']}")
            
    except Exception as e:
        print(f"Error checking S3: {e}")

if __name__ == "__main__":
    check_s3()
