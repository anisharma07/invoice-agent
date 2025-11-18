# Backend Setup Guide

This guide provides step-by-step instructions for setting up the Invoice Agent API backend, including both Docker and non-Docker deployment options.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Option 1: Docker Setup (Recommended)](#option-1-docker-setup-recommended)
- [Option 2: Non-Docker Setup](#option-2-non-docker-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Python**: 3.9 or higher
- **Node.js**: v14+ or higher (for MSC validator)
- **Redis**: Latest stable version (if not using Docker)
- **Docker & Docker Compose**: Latest versions (for Docker setup)

### AWS Setup (Required)

The backend uses **Amazon Bedrock** for Claude AI. You need:

1. **AWS Account** with Bedrock access
2. **AWS CLI** configured with credentials
3. **IAM permissions** for Bedrock service

#### Configure AWS Credentials

```bash
# Install AWS CLI (if not installed)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure credentials
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

---

## Environment Setup

### 1. Clone the Repository

```bash
cd /path/to/Langchain-Claude-Agent/backend
```

### 2. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### 3. Configure Environment Variables

Edit the `.env` file with your actual values:

```bash
# ===================================
# AWS CREDENTIALS (Required)
# ===================================
AWS_ACCESS_KEY_ID=your_actual_access_key
AWS_SECRET_ACCESS_KEY=your_actual_secret_key
AWS_REGION=us-east-1

# Bedrock Model Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# ===================================
# APPLICATION SETTINGS
# ===================================
NODE_ENV=development

# Backend API Configuration
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# Frontend Configuration
FRONTEND_PORT=5173
VITE_API_BASE_URL=http://localhost:8000

# ===================================
# REDIS (Optional - for session/cache management)
# ===================================
REDIS_HOST=localhost  # Use 'redis' for Docker
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

⚠️ **Security Warning**: Never commit the `.env` file to version control!

---

## Option 1: Docker Setup (Recommended)

Docker setup provides isolated environment with all dependencies included.

### Step 1: Ensure Docker is Installed

```bash
# Check Docker installation
docker --version
docker-compose --version

# If not installed, install Docker:
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### Step 2: Build and Start Services

```bash
# Navigate to docker directory
cd docker

# Build and start all services (backend + Redis)
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Step 3: Verify Services

```bash
# Check running containers
docker ps

# View logs
docker-compose logs -f backend
docker-compose logs -f redis

# Check backend health
curl http://localhost:8000/api/health
```

### Docker Management Commands

```bash
# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up --build

# View container status
docker-compose ps

# Execute commands in container
docker-compose exec backend python --version
```

### Using Production Docker Compose

```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Option 2: Non-Docker Setup

Manual setup without Docker containers.

### Step 1: Install Node.js (for MSC Validator)

```bash
# Check Node.js installation
node --version  # Should show v14+ or higher

# If not installed:
# Ubuntu/Debian
sudo apt install nodejs npm

# macOS
brew install node

# Verify installation
node --version
npm --version
```

### Step 2: Install Redis

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping  # Should return: PONG
```

#### macOS

```bash
brew install redis

# Start Redis
brew services start redis

# Verify
redis-cli ping  # Should return: PONG
```

#### Verify Redis Connection

```bash
redis-cli
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> exit
```

### Step 3: Create Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

# Verify activation (should show venv in prompt)
which python
```

### Step 4: Install Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

### Step 5: Verify MSC Validator

```bash
# Test the JavaScript MSC validator
cd msc_validator
node validate-cli.js --string "version:1.5\ncell:A1:v:100"

# Expected output: ✅ VALID - File is valid and can be loaded.
cd ..
```

### Step 6: Start the Backend Server

```bash
# Make sure you're in the backend directory
cd /path/to/Langchain-Claude-Agent/backend

# Activate virtual environment (if not already active)
source venv/bin/activate

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Or using Python module
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The `--reload` flag enables auto-reload on code changes (useful for development).

### Step 7: Keep Server Running

The server will start and display:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using statreload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## Verification

### 1. Test API Health Endpoint

```bash
# Check if backend is running
curl http://localhost:8000/api/health

# Expected response:
# {"status": "healthy"}
```

### 2. Test API Documentation

Open your browser and navigate to:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 3. Test Redis Connection

```bash
# Test Redis connectivity
redis-cli ping

# Check Redis info
redis-cli INFO
```

### 4. Test AWS Bedrock Connection

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1
```

### 5. Check Logs

```bash
# View application logs
tail -f invoice_agent.log

# View specific log lines
grep "ERROR" invoice_agent.log
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

**Error**: `Address already in use: 8000`

**Solution**:
```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>

# Or use a different port
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### 2. Redis Connection Failed

**Error**: `Connection refused to Redis`

**Solution**:
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Start Redis
sudo systemctl start redis-server

# Check Redis port
redis-cli -h localhost -p 6379 ping
```

#### 3. AWS Credentials Not Found

**Error**: `Unable to locate credentials`

**Solution**:
```bash
# Reconfigure AWS CLI
aws configure

# Or set environment variables directly in .env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Verify credentials
aws sts get-caller-identity
```

#### 4. Module Not Found Error

**Error**: `ModuleNotFoundError: No module named 'xxx'`

**Solution**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# Or install specific module
pip install <module_name>
```

#### 5. Node.js Not Found

**Error**: `node: command not found`

**Solution**:
```bash
# Install Node.js
# Ubuntu/Debian
sudo apt install nodejs npm

# macOS
brew install node

# Verify
node --version
```

#### 6. Docker Permission Denied

**Error**: `Permission denied while trying to connect to Docker daemon`

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker

# Or use sudo
sudo docker-compose up
```

#### 7. MSC Validator Issues

**Error**: Validator fails to run

**Solution**:
```bash
# Check Node.js installation
node --version

# Test validator directly
cd msc_validator
node validator.js

# Check validator permissions
chmod +x validate-cli.js
```

### Debug Mode

Enable debug logging for more detailed information:

```python
# In app/main.py, change logging level:
logging.basicConfig(
    level=logging.DEBUG,  # Changed from INFO
    # ... rest of config
)
```

### Getting Help

- Check the logs: `tail -f invoice_agent.log`
- Review API documentation: http://localhost:8000/docs
- Check Docker logs: `docker-compose logs -f backend`
- Verify environment variables: `cat .env`

---

## Development Workflow

### Making Code Changes

#### With Docker:
```bash
# Code changes are automatically reflected due to volume mounting
# If needed, rebuild:
docker-compose up --build
```

#### Without Docker:
```bash
# Server will auto-reload if started with --reload flag
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running Tests

```bash
# Activate virtual environment
source venv/bin/activate

# Run tests
python test_logging.py
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_msc_validator.py
```

### Adding New Dependencies

```bash
# Install new package
pip install <package_name>

# Update requirements.txt
pip freeze > requirements.txt

# For Docker, rebuild:
docker-compose up --build
```

---

## Production Deployment

### Environment Configuration

1. Set `NODE_ENV=production` in `.env`
2. Use strong Redis password
3. Configure proper CORS origins
4. Enable HTTPS/SSL
5. Set up monitoring and logging

### Production Start Command

```bash
# Without reload flag for production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Docker in Production

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

---

## Additional Resources

- **API Documentation**: http://localhost:8000/docs
- **Quick Start Guide**: [QUICKSTART.md](./QUICKSTART.md)
- **Docker Documentation**: [docker/README.md](./docker/README.md)
- **Logging Guide**: [docs/LOGGING_README.md](./docs/LOGGING_README.md)
- **MSC Validator**: [msc_validator/README.md](./msc_validator/README.md)

---

## Summary

You now have the Invoice Agent API backend running! 

**Next Steps:**
1. ✅ Verify health endpoint: http://localhost:8000/api/health
2. ✅ Explore API docs: http://localhost:8000/docs
3. ✅ Set up frontend: See [../frontend/SETUP.md](../frontend/SETUP.md)
4. ✅ Test API endpoints using Swagger UI
5. ✅ Review logging output for any errors

**Default URLs:**
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health
