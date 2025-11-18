# Backend Troubleshooting Guide

## Common Issues and Solutions

### 1. MSC Validator Error: "No such file or directory: 'node'"

**Error Message:**
```
MSC validation errors: ["Line 0: [Errno 2] No such file or directory: 'node'"]
```

**Cause:** Node.js not installed in Docker container

**Solution:**
```bash
# Rebuild container with Node.js support
cd backend/docker
docker compose down
docker compose build --no-cache
docker compose up -d
```

**Verify:**
```bash
docker exec invoice-backend node --version
# Should output: v20.19.5 or similar
```

---

### 2. Backend Offline / Connection Refused

**Error Message:**
```
Backend is offline. Please ensure Docker container is running.
```

**Check Container Status:**
```bash
docker ps | grep invoice-backend
```

**Solution:**
```bash
# Start the container
cd backend/docker
docker compose up -d

# Check logs for errors
docker logs invoice-backend --tail 50
```

---

### 3. Image Upload Fails

**Error Message:**
```
Failed to send message. Please try again.
```

**Possible Causes:**
- Image too large (>5MB)
- Invalid image format
- Backend not running
- Node.js missing (MSC validator error)

**Solutions:**

**Check Image Size:**
- Frontend validates max 5MB
- Compress images before uploading

**Check Backend:**
```bash
docker logs invoice-backend --tail 50
```

**Test API:**
```bash
curl http://localhost:8000/api/health
```

---

### 4. CORS Errors

**Error Message:**
```
Access to fetch at 'http://localhost:8000/api/...' has been blocked by CORS policy
```

**Check Backend CORS Settings:**
```bash
# View backend logs
docker logs invoice-backend | grep CORS
```

**Verify Frontend URL:**
- Frontend should run on http://localhost:5173
- Backend allows this origin by default

---

### 5. Session Not Found

**Error Message:**
```
Session xyz123 not found or expired
```

**Causes:**
- Session expired (Redis TTL)
- Backend restarted
- Invalid session ID

**Solutions:**
```bash
# Check Redis
docker exec invoice-redis redis-cli KEYS "session:*"

# Start new session
# Click "New Session" in frontend
```

---

### 6. Port Already in Use

**Error Message:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:8000: bind: address already in use
```

**Find Process:**
```bash
lsof -i :8000
```

**Kill Process:**
```bash
kill -9 <PID>
```

**Or Use Different Port:**
Edit `docker/docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Change to different port
```

---

### 7. Docker Build Fails

**Error Message:**
```
ERROR: failed to solve: process "/bin/sh -c..." did not complete successfully
```

**Clear Docker Cache:**
```bash
docker system prune -a
docker compose build --no-cache
```

**Check Disk Space:**
```bash
df -h
```

---

### 8. Missing Environment Variables

**Error Message:**
```
ANTHROPIC_API_KEY not found
```

**Solution:**
```bash
# Create .env file in backend directory
echo "ANTHROPIC_API_KEY=your-key-here" > backend/.env

# Restart container
cd backend/docker
docker compose down
docker compose up -d
```

---

### 9. Python Dependencies Error

**Error Message:**
```
ModuleNotFoundError: No module named 'anthropic'
```

**Solution:**
```bash
# Rebuild container
cd backend/docker
docker compose build --no-cache
docker compose up -d
```

**Verify Dependencies:**
```bash
docker exec invoice-backend pip list
```

---

### 10. MSC Validation Timeout

**Error Message:**
```
MSC validation errors: ["Validation timeout"]
```

**Causes:**
- Large invoice with many items
- Complex formulas
- Slow container performance

**Solutions:**

**Increase Timeout:**
Edit `backend/app/services/msc_validator.py`:
```python
result = subprocess.run(
    cmd,
    capture_output=True,
    text=True,
    cwd=str(self.validator_dir),
    timeout=30  # Increase from 10 to 30
)
```

**Check Container Resources:**
```bash
docker stats invoice-backend
```

---

## Quick Commands Reference

### Container Management
```bash
# Start containers
docker compose up -d

# Stop containers
docker compose down

# Restart backend
docker restart invoice-backend

# View logs
docker logs invoice-backend -f

# Access container shell
docker exec -it invoice-backend bash
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/api/health

# Redis health
docker exec invoice-redis redis-cli PING

# Node.js check
docker exec invoice-backend node --version
```

### Debugging
```bash
# View real-time logs
docker logs invoice-backend -f --tail 100

# Check container processes
docker exec invoice-backend ps aux

# Check disk usage
docker exec invoice-backend df -h

# Test MSC validator manually
docker exec invoice-backend node /app/msc_validator/validate-cli.js --help
```

### Database Operations
```bash
# List all sessions
docker exec invoice-redis redis-cli KEYS "session:*"

# View session data
docker exec invoice-redis redis-cli GET "session:your-session-id"

# Clear all sessions
docker exec invoice-redis redis-cli FLUSHDB

# Check Redis memory
docker exec invoice-redis redis-cli INFO memory
```

---

## Log Analysis

### Find Errors
```bash
docker logs invoice-backend 2>&1 | grep -i error
```

### Find MSC Validation Issues
```bash
docker logs invoice-backend 2>&1 | grep -i "msc validation"
```

### Find API Requests
```bash
docker logs invoice-backend 2>&1 | grep "POST /api"
```

### Monitor in Real-time
```bash
docker logs invoice-backend -f | grep -E "ERROR|WARNING|MSC"
```

---

## Performance Issues

### High CPU Usage
```bash
# Check stats
docker stats invoice-backend

# Identify process
docker exec invoice-backend top -b -n 1
```

**Solutions:**
- Reduce concurrent requests
- Increase container resources
- Optimize validation timeouts

### High Memory Usage
```bash
# Check memory
docker stats invoice-backend --no-stream
```

**Solutions:**
- Restart container periodically
- Implement session cleanup
- Adjust Redis memory limits

---

## Network Issues

### Test Container Network
```bash
# Check network
docker network inspect docker_invoice-network

# Test connectivity
docker exec invoice-backend ping invoice-redis

# Check DNS resolution
docker exec invoice-backend nslookup invoice-redis
```

### Test External Access
```bash
# From host
curl http://localhost:8000/api/health

# From another container
docker run --network docker_invoice-network curlimages/curl \
  curl http://invoice-backend:8000/api/health
```

---

## Frontend Issues

### Backend Connection
```bash
# Check VITE_API_BASE_URL
grep VITE_API_BASE_URL frontend/.env

# Should be:
VITE_API_BASE_URL=http://localhost:8000
```

### Build Issues
```bash
cd frontend
npm install
npm run build
```

### Dev Server
```bash
cd frontend
npm run dev
# Should start on http://localhost:5173
```

---

## Production Deployment

### Pre-deployment Checklist
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Node.js installed in container
- [ ] Dependencies up to date
- [ ] Health checks passing
- [ ] Logging configured
- [ ] Monitoring set up

### Deployment Commands
```bash
# Build for production
docker compose -f docker-compose.prod.yml build

# Start production
docker compose -f docker-compose.prod.yml up -d

# Verify
curl https://your-domain.com/api/health
```

---

## Getting Help

### Check Documentation
- [Backend Architecture](BACKEND_ARCHITECTURE.md)
- [Docker Setup](DOCKER_SETUP.md)
- [Node.js Fix](NODEJS_INSTALLATION_FIX.md)
- [Image Upload Guide](IMAGE_UPLOAD_GUIDE.md)

### Debug Steps
1. Check container status: `docker ps`
2. View recent logs: `docker logs invoice-backend --tail 50`
3. Test health endpoint: `curl http://localhost:8000/api/health`
4. Verify Node.js: `docker exec invoice-backend node --version`
5. Check Redis: `docker exec invoice-redis redis-cli PING`

### Collect Information
When reporting issues, include:
- Error messages from logs
- Docker container status
- Node.js and npm versions
- API request/response details
- Frontend browser console errors
- Steps to reproduce

---

## Emergency Procedures

### Complete Reset
```bash
# WARNING: Deletes all data
cd backend/docker
docker compose down -v
docker system prune -a -f
docker compose build --no-cache
docker compose up -d
```

### Backup Data
```bash
# Backup Redis data
docker exec invoice-redis redis-cli SAVE
docker cp invoice-redis:/data/dump.rdb ./redis-backup.rdb

# Backup logs
docker logs invoice-backend > backend-logs.txt
```

### Restore Data
```bash
# Restore Redis
docker cp ./redis-backup.rdb invoice-redis:/data/dump.rdb
docker restart invoice-redis
```

---

## Status Indicators

### Healthy System
```
✅ Container running (docker ps shows "Up")
✅ Health check returns 200 OK
✅ Node.js version displays
✅ Redis responds to PING
✅ No errors in logs (last 50 lines)
✅ API requests succeed
```

### Unhealthy System
```
❌ Container not in docker ps
❌ Health check fails or times out
❌ "node not found" errors
❌ Redis connection refused
❌ Errors in logs
❌ API requests fail with 500/502/503
```

---

## Monitoring Commands

### Watch Logs
```bash
# Terminal 1: Backend logs
docker logs invoice-backend -f

# Terminal 2: Redis logs
docker logs invoice-redis -f

# Terminal 3: Container stats
watch -n 5 'docker stats --no-stream'
```

### Automated Health Check
```bash
#!/bin/bash
# health-check.sh
while true; do
  if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Backend healthy at $(date)"
  else
    echo "❌ Backend unhealthy at $(date)"
  fi
  sleep 60
done
```

Make executable: `chmod +x health-check.sh`
Run: `./health-check.sh`
