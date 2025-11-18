# Docker Setup Guide

This document provides comprehensive instructions for running the Invoice Application using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- AWS credentials (for Claude AI integration)

## Quick Start

### 1. Set Up Environment Variables

Create a `.env` file in the root directory:

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

### 2. Start the Application

#### Option A: Using the Docker Manager Script (Recommended)

```bash
cd backend/docker
./docker-manager.sh start
```

#### Option B: Using Docker Compose Directly

For development:
```bash
cd backend/docker
docker compose up -d
```

For production:
```bash
cd backend/docker
docker compose -f docker-compose.prod.yml up -d
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Backend API Docs**: http://localhost:8000/docs
- **Redis**: localhost:6379

## Architecture

The application consists of three main services:

### 1. Frontend (React + Vite + Ionic)
- **Port**: 3000
- **Technology**: React with Vite, Ionic Framework
- **Development**: Hot-reload enabled with volume mounting
- **Production**: Optimized build served via Vite preview

### 2. Backend (FastAPI + Python)
- **Port**: 8000
- **Technology**: FastAPI with Python 3.11
- **Features**: Claude AI integration, invoice processing
- **Development**: Auto-reload enabled with volume mounting

### 3. Redis
- **Port**: 6379
- **Purpose**: Caching and session management
- **Data Persistence**: Volume-based data storage

## Docker Files

### Frontend Dockerfile Structure

**Dockerfile.dev** (Development):
- Uses Node.js 18 Alpine
- Installs all dependencies
- Runs Vite dev server with hot-reload
- Volume-mounted for live code updates

**Dockerfile** (Production):
- Multi-stage build for optimization
- Builds production assets
- Serves optimized bundle
- Smaller image size

### Backend Dockerfile
- Python 3.11 slim base image
- Installs system dependencies (gcc)
- Installs Python packages
- Runs Uvicorn server

## Docker Manager Script

The `docker-manager.sh` script is located in the `backend/docker/` directory and provides convenient commands for managing the Docker setup:

```bash
cd backend/docker
./docker-manager.sh [command]
```

### Available Commands

| Command | Description |
|---------|-------------|
| `start` | Start all services |
| `stop` | Stop all services |
| `restart` | Restart all services |
| `rebuild` | Rebuild and restart all services (use after code changes) |
| `logs` | Show logs for all services or a specific service |
| `status` | Show current status of all services |
| `clean` | Stop services and clean up Docker resources |

### Examples

```bash
# Navigate to docker directory
cd backend/docker

# Start the application
./docker-manager.sh start

# View backend logs
./docker-manager.sh logs backend

# View all logs
./docker-manager.sh logs

# Rebuild after making changes
./docker-manager.sh rebuild

# Check service status
./docker-manager.sh status

# Clean up everything
./docker-manager.sh clean
```

## Development Workflow

### Making Code Changes

1. **Frontend Changes**:
   - Edit files in `./frontend`
   - Changes are automatically reflected (hot-reload)
   - No rebuild needed

2. **Backend Changes**:
   - Edit files in `./backend`
   - Changes are automatically reflected (auto-reload)
   - No rebuild needed

3. **Dependency Changes**:
   - If you add new npm packages or Python packages
   - Run `./docker-manager.sh rebuild`

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f redis
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find process using the port
lsof -i :3000  # or :8000 or :6379

# Kill the process or stop existing containers
./docker-manager.sh stop
```

### Services Not Starting

1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check logs:
   ```bash
   ./docker-manager.sh logs
   ```

3. Verify environment variables:
   ```bash
   cat .env
   ```

### Build Errors

1. Clean up and rebuild:
   ```bash
   ./docker-manager.sh clean
   ./docker-manager.sh rebuild
   ```

2. Remove all containers and images:
   ```bash
   docker-compose down -v
   docker system prune -a
   ./docker-manager.sh start
   ```

### Database/Redis Connection Issues

1. Check Redis is running:
   ```bash
   docker-compose ps redis
   ```

2. Test Redis connection:
   ```bash
   docker-compose exec redis redis-cli ping
   ```

### Frontend Can't Connect to Backend

1. Ensure `VITE_API_URL` in docker-compose.yml is correct:
   - Development: `http://backend:8000` (internal Docker network)
   - Or use `http://localhost:8000` for external access

2. Check backend is running:
   ```bash
   curl http://localhost:8000/health
   ```

## Production Deployment

### Using Production Docker Compose

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build

# Stop production services
docker-compose -f docker-compose.prod.yml down

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Key Differences (Dev vs Prod)

| Feature | Development | Production |
|---------|------------|------------|
| Build optimization | No | Yes (multi-stage) |
| Hot-reload | Yes | No |
| Volume mounting | Yes | No |
| Image size | Larger | Optimized |
| Restart policy | No | unless-stopped |

## Performance Optimization

### Frontend
- Production build uses multi-stage Docker build
- Optimized assets with Vite
- Smaller final image size

### Backend
- Slim Python base image
- No-cache pip installs
- Minimal system dependencies

### Redis
- Data persistence with volumes
- Health checks for reliability

## Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use secrets management** for production (Docker secrets, vault, etc.)
3. **Regularly update base images**:
   ```bash
   docker-compose pull
   ./docker-manager.sh rebuild
   ```
4. **Scan images for vulnerabilities**:
   ```bash
   docker scan invoice-backend
   docker scan invoice-frontend
   ```

## Useful Docker Commands

```bash
# View running containers
docker-compose ps

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh

# View container resource usage
docker stats

# Remove unused images
docker image prune

# Remove all stopped containers
docker container prune

# View Docker disk usage
docker system df
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI in Docker](https://fastapi.tiangolo.com/deployment/docker/)
- [Vite Docker Guide](https://vitejs.dev/guide/backend-integration.html)

## Support

If you encounter issues:
1. Check the logs: `./docker-manager.sh logs`
2. Verify environment variables in `.env`
3. Try rebuilding: `./docker-manager.sh rebuild`
4. Check Docker daemon is running: `docker info`
