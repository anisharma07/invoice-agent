#!/bin/bash

# Docker Management Script for Invoice Application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_message "Error: Docker is not installed. Please install Docker first." "$RED"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_message "Error: Docker Compose is not available. Please install Docker Compose plugin first." "$RED"
        exit 1
    fi
}

# Use docker compose (new syntax)
COMPOSE_CMD="docker compose"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to check environment variables
check_env() {
    if [ ! -f "$SCRIPT_DIR/../.env" ]; then
        print_message "Warning: .env file not found. Creating from template..." "$YELLOW"
        cat > "$SCRIPT_DIR/../.env" << EOF
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
EOF
        print_message "Please edit .env file with your credentials before starting." "$YELLOW"
        exit 1
    fi
}

# Function to start services
start_services() {
    print_message "Starting all services..." "$GREEN"
    cd "$SCRIPT_DIR" && $COMPOSE_CMD up -d
    print_message "Services started successfully!" "$GREEN"
    print_message "Frontend: http://localhost:3000" "$GREEN"
    print_message "Backend: http://localhost:8000" "$GREEN"
    print_message "Redis: localhost:6379" "$GREEN"
}

# Function to stop services
stop_services() {
    print_message "Stopping all services..." "$YELLOW"
    cd "$SCRIPT_DIR" && $COMPOSE_CMD down
    print_message "Services stopped successfully!" "$GREEN"
}

# Function to restart services
restart_services() {
    print_message "Restarting all services..." "$YELLOW"
    cd "$SCRIPT_DIR" && $COMPOSE_CMD restart
    print_message "Services restarted successfully!" "$GREEN"
}

# Function to rebuild services
rebuild_services() {
    print_message "Rebuilding all services..." "$YELLOW"
    cd "$SCRIPT_DIR" && $COMPOSE_CMD down
    cd "$SCRIPT_DIR" && $COMPOSE_CMD build --no-cache
    cd "$SCRIPT_DIR" && $COMPOSE_CMD up -d
    print_message "Services rebuilt and started successfully!" "$GREEN"
}

# Function to show logs
show_logs() {
    if [ -z "$1" ]; then
        cd "$SCRIPT_DIR" && $COMPOSE_CMD logs -f
    else
        cd "$SCRIPT_DIR" && $COMPOSE_CMD logs -f "$1"
    fi
}

# Function to show status
show_status() {
    print_message "Service Status:" "$GREEN"
    cd "$SCRIPT_DIR" && $COMPOSE_CMD ps
}

# Function to clean up
cleanup() {
    print_message "Cleaning up Docker resources..." "$YELLOW"
    cd "$SCRIPT_DIR" && $COMPOSE_CMD down -v
    docker system prune -f
    print_message "Cleanup completed!" "$GREEN"
}

# Main script
check_docker

case "$1" in
    start)
        check_env
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    rebuild)
        check_env
        rebuild_services
        ;;
    logs)
        show_logs "$2"
        ;;
    status)
        show_status
        ;;
    clean)
        cleanup
        ;;
    *)
        print_message "Docker Management Script for Invoice Application" "$GREEN"
        echo ""
        echo "Usage: $0 {start|stop|restart|rebuild|logs|status|clean}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  rebuild  - Rebuild and restart all services"
        echo "  logs     - Show logs (optionally specify service: frontend, backend, redis)"
        echo "  status   - Show service status"
        echo "  clean    - Stop services and clean up Docker resources"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs backend"
        echo "  $0 rebuild"
        exit 1
        ;;
esac

exit 0
