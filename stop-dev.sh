#!/bin/bash

# Script para parar todos os serviços de desenvolvimento

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${YELLOW}[STOP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "Parando serviços de desenvolvimento..."

# Parar backend
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        print_success "Backend parado (PID: $BACKEND_PID)"
    fi
    rm -f backend.pid
fi

# Parar frontend
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        print_success "Frontend parado (PID: $FRONTEND_PID)"
    fi
    rm -f frontend.pid
fi

# Parar ngrok
if [ -f "ngrok.pid" ]; then
    NGROK_PID=$(cat ngrok.pid)
    if kill -0 $NGROK_PID 2>/dev/null; then
        kill $NGROK_PID
        print_success "ngrok parado (PID: $NGROK_PID)"
    fi
    rm -f ngrok.pid ngrok.url
fi

# Limpar processos restantes nas portas
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
pkill -f "ngrok http 5173" 2>/dev/null || true

print_success "Todos os serviços foram parados"
