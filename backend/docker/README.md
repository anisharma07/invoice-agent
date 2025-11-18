# Docker Setup

This directory contains all Docker-related files for the Invoice Application backend.

## 📁 Files

- **`Dockerfile`** - Backend Docker image configuration
- **`docker-compose.yml`** - Development environment setup
- **`docker-compose.prod.yml`** - Production environment setup
- **`docker-manager.sh`** - Management script for Docker operations
- **`.dockerignore`** - Files to exclude from Docker context

## 🚀 Quick Start

### Prerequisites
- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose plugin
- AWS credentials configured in `backend/.env`

### Start the Application

```bash
# Navigate to this directory
cd backend/docker

# Make the script executable (first time only)
chmod +x docker-manager.sh

# Start all services
./docker-manager.sh start
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Redis**: localhost:6379

## 📝 Common Commands

All commands should be run from this directory (`backend/docker/`):

```bash
# Start services
./docker-manager.sh start

# Stop services
./docker-manager.sh stop

# Restart services
./docker-manager.sh restart

# Rebuild services (after code changes)
./docker-manager.sh rebuild

# View all logs
./docker-manager.sh logs

# View specific service logs
./docker-manager.sh logs backend
./docker-manager.sh logs redis

# Check service status
./docker-manager.sh status

# Clean up Docker resources
./docker-manager.sh clean
```

## 🔧 Using Docker Compose Directly

If you prefer using Docker Compose commands:

```bash
# Development mode
docker compose up -d

# Production mode
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild
docker compose up -d --build
```

## 📊 Services

The setup includes three services:

| Service | Port | Description |
|---------|------|-------------|
| **backend** | 8000 | FastAPI backend with Claude AI integration |
| **redis** | 6379 | Redis cache for session management |
| **frontend** | 3000 | React frontend (in production mode) |

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory (one level up):

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# Claude Configuration
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
CLAUDE_CODE_USE_BEDROCK=true

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
```

## 📚 Documentation

For more detailed information, see:
- **Quick Start**: `../docs/DOCKER_QUICKSTART.md`
- **Complete Setup Guide**: `../docs/DOCKER_SETUP.md`
- **Implementation Details**: `../docs/DOCKER_IMPLEMENTATION_SUMMARY.md`

## 🐛 Troubleshooting

### Ports already in use
```bash
# Check what's using the ports
lsof -i :8000
lsof -i :6379

# Kill the process or stop other services
```

### Services won't start
```bash
# Check Docker is running
docker --version
docker compose version

# Check logs for errors
./docker-manager.sh logs
```

### Cannot connect to Redis
```bash
# Check Redis is healthy
docker compose ps

# Restart Redis
docker compose restart redis
```

### Changes not reflecting
```bash
# For backend changes, rebuild
./docker-manager.sh rebuild

# Or restart the service
docker compose restart backend
```

## 🔄 Development Workflow

1. Make code changes in `backend/app/`
2. Changes are auto-reloaded (development mode)
3. For dependency changes, rebuild:
   ```bash
   ./docker-manager.sh rebuild
   ```

## 🚢 Production Deployment

For production deployment:

```bash
# Use production compose file
docker compose -f docker-compose.prod.yml up -d --build

# Or use the manager script with production config
COMPOSE_FILE=docker-compose.prod.yml ./docker-manager.sh start
```

## 🛡️ Best Practices

- ✅ Keep this directory clean - only Docker files here
- ✅ Store `.env` in parent `backend/` directory
- ✅ Use `.dockerignore` to optimize build context
- ✅ Run from this directory for consistent paths
- ✅ Use the manager script for common operations
- ✅ Check logs when debugging issues

---

**Need Help?** Check the documentation in `../docs/` or open an issue.
