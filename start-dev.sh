#!/bin/bash

echo "Iniciando Skina Ecopecas - Desenvolvimento"
echo ""

# Função para limpar processos ao sair
cleanup() {
    echo "\nParando serviços..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Capturar sinais para limpeza
trap cleanup SIGINT SIGTERM

echo "Iniciando servidor backend..."
cd server
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

echo "Aguardando 5 segundos para o backend inicializar..."
sleep 5

echo "Voltando para o diretório raiz..."
cd ..

echo "Iniciando servidor frontend..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "========================================"
echo "  Skina Ecopecas - Servidores Iniciados"
echo "========================================"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "  API Docs: http://localhost:3001/api/health"
echo "========================================"
echo ""
echo "Pressione Ctrl+C para parar os serviços..."

# Aguardar os processos
wait $BACKEND_PID $FRONTEND_PID