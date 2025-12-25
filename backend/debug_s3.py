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

def list_user_objects():
    prefix = f"{user_id}/"
    print(f"Listing objects in bucket '{user_bucket_name}' with prefix '{prefix}'...")
    try:
        response = s3_client.list_objects_v2(Bucket=user_bucket_name, Prefix=prefix)
        if 'Contents' in response:
            for obj in response['Contents']:
                print(f" - {obj['Key']} (Size: {obj['Size']})")
        else:
            print("No objects found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_user_objects()
