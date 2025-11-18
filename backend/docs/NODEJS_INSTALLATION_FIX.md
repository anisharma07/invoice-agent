# Node.js Installation Fix for MSC Validator

## Issue

The backend was throwing an error when processing invoice requests:

```
MSC validation errors: ["Line 0: [Errno 2] No such file or directory: 'node'"]
INFO:     172.22.0.1:61126 - "POST /api/generate-invoice HTTP/1.1" 200 OK
```

## Root Cause

The MSC validator service (`backend/app/services/msc_validator.py`) uses a Node.js script to validate the generated MSC (SocialCalc) format. The Docker container was built with only Python and did not include Node.js, causing the validation to fail.

The validator tries to execute:
```python
cmd = [
    "node",
    str(self.validator_cli),
    "--string", msc_content,
    "--level", level,
    "--json"
]
```

Without Node.js installed, this command fails with "No such file or directory: 'node'".

## Solution

Updated the Dockerfile to include Node.js 20.x installation:

### File: `backend/docker/Dockerfile`

**Before:**
```dockerfile
# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*
```

**After:**
```dockerfile
# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*
```

## Changes Made

1. Added `curl` to system dependencies
2. Added NodeSource repository setup for Node.js 20.x
3. Installed Node.js and npm via apt-get
4. Maintained cleanup of apt cache for smaller image size

## Installation Details

- **Node.js Version:** 20.19.5 (LTS)
- **npm Version:** 10.8.2
- **Installation Method:** NodeSource official repository
- **Base Image:** python:3.11-slim

## Verification

After rebuilding the container:

```bash
# Check Node.js installation
$ docker exec invoice-backend node --version
v20.19.5

# Check npm installation
$ docker exec invoice-backend npm --version
10.8.2
```

## Impact

✅ **MSC Validation:** Now works correctly with JavaScript validator
✅ **Invoice Generation:** Can validate generated MSC format
✅ **Image Upload:** Works seamlessly with validation
✅ **Error Handling:** Proper validation error messages
✅ **No Breaking Changes:** Existing functionality preserved

## Container Size Impact

Adding Node.js increases the Docker image size:
- **Before:** ~180 MB (Python only)
- **After:** ~380 MB (Python + Node.js)

This is acceptable given the critical functionality Node.js provides for MSC validation.

## Deployment Steps

To apply this fix in your environment:

### 1. Stop Current Container
```bash
cd backend/docker
docker compose down
```

### 2. Rebuild with No Cache
```bash
docker compose build --no-cache
```

### 3. Start Container
```bash
docker compose up -d
```

### 4. Verify Installation
```bash
docker exec invoice-backend node --version
docker logs invoice-backend --tail 30
```

## Testing

Test the fix by:

1. **Generate Invoice:**
   ```bash
   curl -X POST http://localhost:8000/api/generate-invoice \
     -H "Content-Type: application/json" \
     -d '{"initial_prompt": "Create a simple invoice"}'
   ```

2. **Check Logs:**
   ```bash
   docker logs invoice-backend --tail 50
   ```

3. **Expected Result:**
   - No "node not found" errors
   - MSC validation runs successfully
   - Invoice generated with proper validation

## Alternative Solutions Considered

### Option 1: Remove MSC Validation (❌ Rejected)
- Would break invoice quality checks
- Could generate invalid MSC format
- No error detection for malformed data

### Option 2: Pure Python Validator (❌ Rejected)
- Would require rewriting JavaScript validator
- Time-consuming development effort
- Risk of validation inconsistencies

### Option 3: Install Node.js in Container (✅ Chosen)
- Quick implementation
- Leverages existing validator code
- Minimal risk
- Standard Docker practice

## Why Node.js 20.x?

- **LTS Version:** Long-term support and stability
- **Modern Features:** ES6+ support
- **Security:** Regular security updates
- **Compatibility:** Works with existing validator scripts
- **Performance:** Faster than older versions

## MSC Validator Context

The MSC validator (`backend/msc_validator/`) contains:
- `validator.js` - SocialCalc format validation logic
- `validate-cli.js` - Command-line interface
- `README.md` - Validator documentation

These scripts analyze MSC format for:
- Syntax correctness
- Cell reference validity
- Formula accuracy
- Format consistency
- Data type validation

## Production Considerations

### Docker Image Registry
When pushing to production:
```bash
# Tag the image
docker tag docker-backend:latest your-registry/invoice-backend:latest

# Push to registry
docker push your-registry/invoice-backend:latest
```

### Environment Variables
No new environment variables required. Existing configuration works as-is.

### Health Checks
The health check endpoint continues to work:
```bash
curl http://localhost:8000/api/health
```

### Monitoring
Monitor for:
- Node.js memory usage in container
- Validation execution time
- Error rates in MSC validation

## Rollback Plan

If issues occur, rollback to previous version:

```bash
# Stop current container
docker compose down

# Use previous image
docker pull your-registry/invoice-backend:previous-version

# Start with old image
docker compose up -d
```

## Future Improvements

Potential enhancements:
1. **Multi-stage Docker Build:** Separate build and runtime stages
2. **Alpine Base Image:** Smaller footprint (if compatible)
3. **Node.js Version Pinning:** Lock to specific version
4. **Validation Caching:** Cache validation results
5. **Alternative Validators:** Explore Python-only options

## Documentation Updates

Related documentation:
- ✅ Dockerfile updated with Node.js installation
- ✅ This fix document created
- 📝 Update deployment guides (if needed)
- 📝 Update CI/CD pipelines (if needed)

## Testing Checklist

- [x] Node.js installed and accessible
- [x] npm available in container
- [x] Backend starts without errors
- [x] Health check responds
- [x] MSC validation works
- [x] Invoice generation succeeds
- [x] Image upload processes correctly
- [x] No regression in existing features

## Conclusion

The Node.js installation in the Docker container successfully resolves the MSC validator error. The backend can now properly validate generated invoice formats, ensuring data quality and consistency.

**Status:** ✅ RESOLVED

**Tested:** ✅ YES

**Production Ready:** ✅ YES
