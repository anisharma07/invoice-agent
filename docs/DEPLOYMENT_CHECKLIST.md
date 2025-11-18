# ✅ Invoice Template Generation System - Deployment Checklist

## Pre-Deployment Checklist

### Environment Setup
- [ ] Python 3.8+ installed
- [ ] Node.js 14+ installed
- [ ] Redis server running
- [ ] AWS credentials configured
- [ ] Environment variables set in `.env`

### Dependencies
- [ ] `pip install -r requirements.txt` completed
- [ ] No import errors when running Python
- [ ] Node.js validator accessible at `backend/msc_validator/validator.js`

### Configuration
- [ ] `AWS_REGION` set
- [ ] `AWS_ACCESS_KEY_ID` set
- [ ] `AWS_SECRET_ACCESS_KEY` set
- [ ] `ANTHROPIC_MODEL` set (or using default)
- [ ] `REDIS_HOST` and `REDIS_PORT` configured

---

## Testing Checklist

### Unit Tests
- [ ] Run `python -m app.services.test_template_agent`
- [ ] All 4 tests pass
  - [ ] Cell Mapping Agent test
  - [ ] SaveStr Agent test
  - [ ] MSC Validator test
  - [ ] Full Pipeline test

### Integration Tests
- [ ] Start server: `uvicorn app.main:app --reload`
- [ ] Server starts without errors
- [ ] API docs accessible at `/docs`

### API Tests

#### Test 1: Basic Generation
```bash
curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{"initial_prompt": "Create a simple invoice for mobile"}'
```
- [ ] Returns 200 status
- [ ] Response has `assistantResponse` field
- [ ] Response has `validation` field
- [ ] `assistantResponse.savestr` starts with `version:1.5`
- [ ] `assistantResponse.cellMappings` is present
- [ ] `assistantResponse.templateMeta` has name, category, deviceType
- [ ] `validation.is_valid` is true or has errors listed

#### Test 2: Image Upload
```bash
IMAGE_B64=$(base64 -w 0 test_invoice.jpg)
curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d "{\"initial_prompt\": \"Recreate this\", \"invoice_image\": \"data:image/jpeg;base64,$IMAGE_B64\"}"
```
- [ ] Returns 200 status
- [ ] Template reflects image structure
- [ ] Vision analysis works

#### Test 3: Chat/Edit
```bash
# Use session_id from previous test
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "YOUR_SESSION_ID", "message": "Add a discount field"}'
```
- [ ] Returns 200 status
- [ ] Template updated with changes
- [ ] Session persists

---

## Validation Checklist

### MSC Format Validation
For each generated savestr, verify:
- [ ] Starts with `version:1.5`
- [ ] Contains `cell:` lines
- [ ] Contains `sheet:` line
- [ ] Contains style definitions (`font:`, `color:`, `border:`, etc.)
- [ ] Formulas use `\c` for colon escaping
- [ ] All referenced styles are defined
- [ ] Cell coordinates are valid (A1, B2, AA10, etc.)

### Cell Mappings Validation
- [ ] `text.sheet1` exists
- [ ] Required fields present (Heading, Date, etc.)
- [ ] Items section has Rows (start/end) and Columns
- [ ] Cell coordinates are valid Excel notation

### Template Metadata Validation
- [ ] `name` field present
- [ ] `category` is one of: tax_invoice, simple_invoice, professional_invoice
- [ ] `deviceType` is one of: mobile, tablet, desktop
- [ ] `domain` is "invoice"

---

## Performance Checklist

### Response Times
- [ ] First request: < 30 seconds (model initialization)
- [ ] Subsequent requests: < 15 seconds
- [ ] Image requests: < 30 seconds
- [ ] Edit requests: < 15 seconds

### Validation Success Rate
Monitor console logs for validation attempts:
- [ ] Target: 80%+ validate in 1-2 attempts
- [ ] Acceptable: < 5% require max retries (5 attempts)
- [ ] Investigate: If >20% require 4-5 attempts

### Error Rate
- [ ] < 5% validation failures after max retries
- [ ] < 1% system errors (exceptions)
- [ ] No Redis connection errors

---

## Documentation Checklist

### Files Created
- [ ] `backend/app/services/meta_cellmap_agent.py`
- [ ] `backend/app/services/savestr_agent.py`
- [ ] `backend/app/services/template_generation_agent.py`
- [ ] `backend/app/services/test_template_agent.py`
- [ ] `backend/docs/TEMPLATE_GENERATION_ARCHITECTURE.md`
- [ ] `IMPLEMENTATION_SUMMARY.md`
- [ ] `QUICKSTART_NEW_SYSTEM.md`
- [ ] `FRONTEND_MIGRATION_GUIDE.md`
- [ ] `README_UPGRADE_COMPLETE.md`
- [ ] This checklist

### Files Updated
- [ ] `backend/app/models/schemas.py`
- [ ] `backend/app/api/routes.py`

---

## Frontend Integration Checklist

### TypeScript Updates
- [ ] Add new interfaces (AssistantResponse, ValidationInfo, etc.)
- [ ] Update API call functions
- [ ] Change `response.message` to `response.assistantResponse.text`
- [ ] Change `response.msc_content` to `response.assistantResponse.savestr`

### UI Components
- [ ] Display template name and metadata
- [ ] Show validation status
- [ ] Display cell mappings (optional)
- [ ] Handle validation warnings
- [ ] Show loading states for different pipeline steps

### Error Handling
- [ ] Handle 404 (session not found)
- [ ] Handle 413 (token limit exceeded)
- [ ] Handle validation warnings
- [ ] Show user-friendly error messages

---

## Security Checklist

### Environment Variables
- [ ] AWS credentials not hardcoded
- [ ] API keys stored in `.env` (not in code)
- [ ] `.env` in `.gitignore`

### Input Validation
- [ ] Prompt length limits enforced
- [ ] Image size limits enforced
- [ ] Session ID validation
- [ ] SQL injection prevention (if using DB)

### Rate Limiting
- [ ] Consider adding rate limiting per session
- [ ] Monitor API usage
- [ ] Set token limits per session

---

## Production Readiness Checklist

### Logging
- [ ] Pipeline progress logged to console
- [ ] Errors logged with stack traces
- [ ] Validation attempts logged
- [ ] Consider adding structured logging (JSON format)

### Monitoring
- [ ] Monitor validation success rates
- [ ] Track response times
- [ ] Monitor error rates
- [ ] Set up alerts for high error rates

### Backup & Recovery
- [ ] Redis data backup strategy
- [ ] Session recovery mechanism
- [ ] Error recovery procedures

### Scalability
- [ ] Redis can handle concurrent sessions
- [ ] Consider horizontal scaling for high traffic
- [ ] Monitor AWS Bedrock rate limits
- [ ] Implement request queuing if needed

---

## Deployment Steps

### 1. Pre-Deployment
- [ ] Run all tests
- [ ] Verify all checklists above
- [ ] Backup current system
- [ ] Document rollback procedure

### 2. Deployment
- [ ] Pull latest code
- [ ] Install dependencies
- [ ] Set environment variables
- [ ] Restart services
- [ ] Verify server starts

### 3. Post-Deployment
- [ ] Run smoke tests
- [ ] Test all endpoints
- [ ] Monitor logs for errors
- [ ] Check validation success rate
- [ ] Verify frontend integration

### 4. Rollback Plan (if needed)
- [ ] Revert to previous code
- [ ] Restore previous schemas
- [ ] Restore environment variables
- [ ] Restart services

---

## Maintenance Checklist

### Daily
- [ ] Check error logs
- [ ] Monitor validation success rate
- [ ] Check response times

### Weekly
- [ ] Review validation failures
- [ ] Analyze common error patterns
- [ ] Update documentation if needed
- [ ] Review user feedback

### Monthly
- [ ] Performance optimization review
- [ ] Update dependencies
- [ ] Review and update prompts
- [ ] Analyze usage patterns

---

## Known Issues & Workarounds

### Issue: Validation Takes 4-5 Attempts
**Workaround**: Review SaveStr agent prompts, may need refinement
**Status**: Monitor and improve

### Issue: Image Analysis Slow
**Workaround**: Expected for large images, consider size limits
**Status**: Normal behavior

### Issue: Style Definitions Missing
**Workaround**: Validator auto-adds them, should correct in retry
**Status**: Auto-corrected

---

## Support Resources

### Documentation
- Architecture: `backend/docs/TEMPLATE_GENERATION_ARCHITECTURE.md`
- Quick Start: `QUICKSTART_NEW_SYSTEM.md`
- Frontend Guide: `FRONTEND_MIGRATION_GUIDE.md`
- MSC Syntax: `backend/docs/parser-docs/SYNTAX.md`

### Testing
- Test Suite: `python -m app.services.test_template_agent`
- Manual Testing: See QUICKSTART_NEW_SYSTEM.md

### Debugging
- Enable verbose logging in agents
- Check console output for pipeline progress
- Review validation error messages
- Test individual agents separately

---

## Sign-Off

### Development Team
- [ ] Code reviewed
- [ ] Tests pass
- [ ] Documentation complete

### QA Team
- [ ] All test cases pass
- [ ] Integration tests complete
- [ ] Performance acceptable

### DevOps Team
- [ ] Deployment procedure documented
- [ ] Rollback plan ready
- [ ] Monitoring configured

### Product Owner
- [ ] Features verified
- [ ] Acceptance criteria met
- [ ] Ready for production

---

## Final Status

### Pre-Deployment: ⬜ Not Started | 🟡 In Progress | 🟢 Complete
### Testing: ⬜ Not Started | 🟡 In Progress | 🟢 Complete
### Validation: ⬜ Not Started | 🟡 In Progress | 🟢 Complete
### Documentation: ⬜ Not Started | 🟡 In Progress | 🟢 Complete
### Frontend Integration: ⬜ Not Started | 🟡 In Progress | 🟢 Complete
### Deployment: ⬜ Not Started | 🟡 In Progress | 🟢 Complete

---

**Overall Status**: ⬜ Not Ready | 🟡 Almost Ready | 🟢 Production Ready

**Deployment Date**: _____________

**Deployed By**: _____________

**Verified By**: _____________

---

## Post-Deployment Notes

_Add notes here after deployment_

### Issues Encountered:


### Resolutions:


### Improvements Needed:


---

**Checklist Version**: 1.0  
**Last Updated**: 2025-01-15
