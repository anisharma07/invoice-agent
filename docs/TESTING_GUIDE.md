# 🧪 Testing Guide - Invoice Agent

## Pre-Launch Checklist

Run the system check:
```bash
./check_system.sh
```

## Quick Test (Recommended First)

### Step 1: Start with Docker
```bash
cd "/home/anirudh-sharma/Desktop/SocialCalc Stuff/Starknet/Langchain-Claude-Agent"
chmod +x run_docker.sh
./run_docker.sh
```

Wait for all services to start (you'll see logs from Redis, Backend, and Frontend)

### Step 2: Verify Services

**Backend Health Check**:
```bash
# In a new terminal
curl http://localhost:8000/api/health
```

Expected output:
```json
{
  "status": "healthy",
  "redis": "connected",
  "timestamp": "2025-10-31T..."
}
```

**Frontend**:
- Open browser: http://localhost:3000
- You should see the Invoice Agent interface

## Test Scenarios

### Test 1: Basic Invoice Generation

1. **Open** http://localhost:3000
2. **Type**: "Create an invoice for web development services worth $5000"
3. **Verify**:
   - ✅ Chat shows user message
   - ✅ Assistant responds
   - ✅ Invoice preview appears on right
   - ✅ Token counter updates

### Test 2: Invoice Editing

Continue in the same session:

1. **Type**: "Change the client name to Acme Corporation"
2. **Verify**: Invoice preview updates with new client name
3. **Type**: "Add a line item for consulting services at $500"
4. **Verify**: New line item appears in invoice
5. **Type**: "Set the due date to February 28, 2025"
6. **Verify**: Due date updates

### Test 3: Complex Invoice

Start a new session (click "New Session" button):

1. **Type**:
```
Create an invoice from Tech Solutions Inc to ABC Company for:
- Website redesign: $3000
- SEO optimization: $1500
- Monthly maintenance: $500
Invoice number: INV-2025-001
Due date: March 15, 2025
Add 10% tax
```

2. **Verify**:
   - ✅ All line items present
   - ✅ Correct totals
   - ✅ Tax calculated correctly
   - ✅ From/To information populated

### Test 4: Session Persistence

1. **Refresh** the browser page (F5)
2. **Verify**:
   - ✅ Chat history preserved
   - ✅ Invoice still displayed
   - ✅ Token count accurate
3. **Continue** chatting to ensure session still works

### Test 5: Token Usage Display

1. **Check** token counter at top of chat
2. **Send** several messages
3. **Verify**: Counter increases with each message
4. **Note**: Bar turns red when > 80% of 200k limit

### Test 6: Export Functionality

1. **Generate** an invoice
2. **Click** "💾 Export JSON" button
3. **Verify**: JSON file downloads
4. **Open** file and verify it contains invoice data

### Test 7: Error Handling

**Test Session Expiry**:
1. Wait 61 minutes (session expires after 1 hour)
2. Send a message
3. **Verify**: Error message about expired session
4. System should prompt to start new session

**Test Invalid Session**:
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "invalid-id", "message": "test"}'
```

Expected: 404 error with session not found message

### Test 8: API Direct Testing

**Generate Invoice via API**:
```bash
curl -X POST http://localhost:8000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "initial_prompt": "Create an invoice for consulting services"
  }'
```

**Get Session Info**:
```bash
# Use session_id from previous response
curl http://localhost:8000/api/session/YOUR_SESSION_ID
```

### Test 9: Concurrent Sessions

1. **Open** http://localhost:3000 in Chrome
2. **Open** http://localhost:3000 in incognito/private window
3. **Create** different invoices in each
4. **Verify**: Both sessions work independently

### Test 10: Load Testing (Optional)

```bash
# Install if needed: pip install locust
cd backend
cat > locustfile.py << 'EOF'
from locust import HttpUser, task, between

class InvoiceUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def generate_invoice(self):
        self.client.post("/api/generate-invoice", json={
            "initial_prompt": "Create a simple invoice"
        })
EOF

locust -f locustfile.py --host=http://localhost:8000
```

Access: http://localhost:8089

## API Documentation Testing

1. **Open**: http://localhost:8000/docs
2. **Verify**: Swagger UI loads
3. **Try** "Try it out" on each endpoint:
   - POST /api/generate-invoice
   - POST /api/chat
   - GET /api/session/{session_id}
   - GET /api/health

## Performance Benchmarks

Expected response times (approximate):

- Health check: < 50ms
- Generate invoice (first): 2-5 seconds (Claude processing)
- Chat/edit: 2-4 seconds
- Session lookup: < 100ms
- Export: < 50ms

## Common Issues & Solutions

### Issue: Backend won't start

**Check logs**:
```bash
docker compose logs backend
```

**Common causes**:
- AWS credentials invalid
- Redis not connected
- Port 8000 in use

### Issue: Frontend shows "Failed to fetch"

**Solution**:
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Check browser console (F12)
3. Verify CORS settings in backend

### Issue: Redis connection error

**Solution**:
```bash
# Check Redis
docker compose ps redis
docker compose logs redis

# Restart Redis
docker compose restart redis
```

### Issue: Token limit exceeded immediately

**Solution**:
```bash
# Clear Redis
docker compose exec redis redis-cli FLUSHDB
```

## Cleanup After Testing

**Stop Docker**:
```bash
# Press Ctrl+C in terminal running docker compose
# Then:
docker compose down

# To also remove volumes:
docker compose down -v
```

**Clear Redis Data**:
```bash
docker compose exec redis redis-cli FLUSHDB
```

## Success Criteria

✅ All services start without errors  
✅ Health check returns "healthy"  
✅ Can generate invoice from text  
✅ Can edit invoice via chat  
✅ Invoice preview updates in real-time  
✅ Token counter works  
✅ Session persists across page refresh  
✅ Export downloads valid JSON  
✅ Multiple sessions work independently  
✅ Error messages are user-friendly  

## Ready for Demo?

If all tests pass, your Invoice Agent is production-ready for MVP demo!

## Next Steps After Testing

1. ✅ All tests passing? → Ready for demo
2. ⚠️ Some issues? → Check logs and troubleshoot
3. 🎯 Want to extend? → See INVOICE_AGENT_README.md for architecture

---

**Need help?** Check logs with:
```bash
docker compose logs -f backend    # Backend logs
docker compose logs -f frontend   # Frontend logs
docker compose logs -f redis      # Redis logs
```
