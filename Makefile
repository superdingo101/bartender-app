.PHONY: help setup up down build restart logs clean test lint format db-shell backend-shell frontend-shell

# Default target
help:
	@echo "🍸 Bartending App - Docker Commands"
	@echo "===================================="
	@echo ""
	@echo "Setup & Management:"
	@echo "  make setup          - Initial project setup"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make build          - Rebuild containers"
	@echo "  make restart        - Restart all services"
	@echo "  make clean          - Remove containers and volumes"
	@echo ""
	@echo "Development:"
	@echo "  make logs           - View all logs"
	@echo "  make test           - Run all tests"
	@echo "  make lint           - Run linting"
	@echo "  make format         - Format code"
	@echo ""
	@echo "Shell Access:"
	@echo "  make db-shell       - PostgreSQL shell"
	@echo "  make backend-shell  - Backend container shell"
	@echo "  make frontend-shell - Frontend container shell"

# Initial setup
setup:
	@chmod +x setup.sh
	@./setup.sh

# Start services
up:
	@echo "🚀 Starting services..."
	@docker compose up -d
	@echo "✅ Services started"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend:  http://localhost:5000"

# Stop services
down:
	@echo "🛑 Stopping services..."
	@docker compose down
	@echo "✅ Services stopped"

# Build containers
build:
	@echo "🔨 Building containers..."
	@docker compose up --build -d
	@echo "✅ Build complete"

# Restart services
restart:
	@echo "♻️  Restarting services..."
	@docker compose restart
	@echo "✅ Services restarted"

# View logs
logs:
	@docker compose logs -f

# Clean up everything
clean:
	@echo "🧹 Cleaning up..."
	@docker compose down -v --rmi all
	@echo "✅ Cleanup complete"

# Run tests
test:
	@echo "🧪 Running backend tests..."
	@docker compose exec backend npm test
	@echo ""
	@echo "🧪 Running frontend tests..."
	@docker compose exec frontend npm test -- --watchAll=false

# Run linting
lint:
	@echo "🔍 Linting backend..."
	@docker compose exec backend npm run lint
	@echo ""
	@echo "🔍 Linting frontend..."
	@docker compose exec frontend npm run lint

# Format code
format:
	@echo "✨ Formatting backend..."
	@docker compose exec backend npm run format
	@echo ""
	@echo "✨ Formatting frontend..."
	@docker compose exec frontend npm run format

# Database shell
db-shell:
	@docker compose exec db psql -U bartend -d bartending_app

# Backend shell
backend-shell:
	@docker compose exec backend sh

# Frontend shell
frontend-shell:
	@docker compose exec frontend sh