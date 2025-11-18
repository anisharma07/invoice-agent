# Fix AWS Credentials Issue

## Error
```
UnrecognizedClientException: The security token included in the request is invalid.
```

## Cause
Your AWS credentials are either:
- Expired (temporary credentials)
- Incorrect (wrong access key/secret key)
- Not properly configured

## Solutions

### Solution 1: Reconfigure AWS CLI (Easiest)

```bash
aws configure
```

When prompted, enter:
1. **AWS Access Key ID**: Your access key from AWS console
2. **AWS Secret Access Key**: Your secret key
3. **Default region name**: `us-east-1` (or your preferred region)
4. **Default output format**: `json`

### Solution 2: Check Current Credentials

```bash
# View current credentials
aws configure list

# Test credentials
aws sts get-caller-identity
```

If this fails, your credentials are invalid.

### Solution 3: Get New Credentials from AWS Console

1. Go to **AWS IAM Console**: https://console.aws.amazon.com/iam/
2. Click **Users** → Your username
3. Go to **Security credentials** tab
4. Click **Create access key**
5. Copy the **Access Key ID** and **Secret Access Key**
6. Run `aws configure` and enter the new credentials

### Solution 4: Use Environment Variables

```bash
# Set credentials for current session
export AWS_ACCESS_KEY_ID="your-access-key-here"
export AWS_SECRET_ACCESS_KEY="your-secret-key-here"
export AWS_REGION="us-east-1"

# Test
python3 test_setup.py
```

### Solution 5: Check Bedrock Access

Even with valid credentials, you need:
1. **Bedrock enabled** in your AWS region
2. **Claude 3.5 Sonnet access** requested and approved
3. **IAM permissions** for Bedrock:
   - `bedrock:InvokeModel`
   - `bedrock:InvokeModelWithResponseStream`

To enable Claude:
1. Go to **AWS Bedrock Console**
2. Click **Model access** (left sidebar)
3. Click **Manage model access**
4. Enable **Anthropic → Claude 3.5 Sonnet**
5. Submit and wait for approval (usually instant)

## Quick Test Commands

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Test agent setup
cd "/home/anirudh-sharma/Desktop/SocialCalc Stuff/Starknet/Langchain-Claude-Agent"
python3 test_setup.py
```

## Common Issues

### Issue 1: "Access Denied"
- Your IAM user lacks Bedrock permissions
- Add `AmazonBedrockFullAccess` policy to your IAM user

### Issue 2: "Model not found"
- Claude 3.5 Sonnet not enabled in your region
- Go to Bedrock console and enable it

### Issue 3: "Region not supported"
- Bedrock might not be available in your region
- Try `us-east-1` or `us-west-2`

## After Fixing

Once credentials are fixed:

```bash
# Verify setup
python3 test_setup.py

# Try generating again
python3 demo.py
```

## Need Help?

1. Check AWS IAM console for user permissions
2. Verify Bedrock is available in your region
3. Make sure Claude 3.5 Sonnet access is approved
4. Test with `aws sts get-caller-identity`
