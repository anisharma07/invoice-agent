# Docker Quick Start Guide

Get your Invoice Application running with Docker in 5 minutes!

## 🚀 Quick Setup

### 1. Prerequisites
- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose plugin
- AWS credentials for Claude AI

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
# Copy this template and fill in your values
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
CLAUDE_CODE_USE_BEDROCK=true
REDIS_HOST=redis
REDIS_PORT=6379
```

### 3. Start the Application

```bash
# Navigate to docker directory
cd backend/docker

# Make the script executable (first time only)
chmod +x docker-manager.sh

# Start all services
./docker-manager.sh start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

That's it! 🎉

## 📝 Common Commands

```bash
# Navigate to docker directory first
cd backend/docker

# Start services
./docker-manager.sh start

# Stop services
./docker-manager.sh stop

# View logs
./docker-manager.sh logs

# View specific service logs
./docker-manager.sh logs frontend
./docker-manager.sh logs backend

# Rebuild after code changes
./docker-manager.sh rebuild

# Check status
./docker-manager.sh status

# Clean up
./docker-manager.sh clean
```

## 🔧 Using Docker Compose Directly

If you prefer using Docker Compose commands directly:

```bash
# Navigate to docker directory
cd backend/docker

# Development mode (with hot-reload)
docker compose up -d

# Production mode (optimized build)
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild
docker compose up -d --build
```

## 🐛 Troubleshooting

### Services won't start?
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :8000

# Check Docker status
docker info

# View detailed logs
./docker-manager.sh logs
```

### Need to reset everything?
```bash
./docker-manager.sh clean
./docker-manager.sh start
```

### Frontend can't connect to backend?
- Check that backend is running: `docker compose ps`
- Verify environment variable `VITE_API_URL` in docker-compose.yml
- Check backend health: `curl http://localhost:8000/health`

## 📚 More Information

For detailed documentation, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)

## 🎯 Development Tips

### Hot Reload
Both frontend and backend support hot-reload in development mode. Just edit your code and see changes instantly!

### Running Commands Inside Containers
```bash
# Frontend container
docker compose exec frontend sh

# Backend container
docker compose exec backend bash

# Redis CLI
docker compose exec redis redis-cli
```

### Viewing Resource Usage
```bash
docker stats
```

## 🚢 Production Deployment

For production, use the production docker-compose file:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This uses optimized builds and doesn't mount volumes for better performance.

---

**Need help?** Check the [full documentation](./DOCKER_SETUP.md) or view logs with `./docker-manager.sh logs`
