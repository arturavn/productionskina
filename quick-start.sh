#!/bin/bash

# Script rápido para iniciar o ambiente de desenvolvimento
# Para uso quando você já tem tudo configurado e só quer iniciar rapidamente

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Função para matar processos nas portas
kill_ports() {
    print_status "Liberando portas..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    pkill -f "ngrok http 5173" 2>/dev/null || true
    sleep 2
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] || [ ! -d "server" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "🚀 Iniciando ambiente de desenvolvimento..."
echo

# Limpar portas
kill_ports

# Iniciar backend
print_status "Iniciando backend..."
cd server
npm start > ../backend.log 2>&1 &
echo $! > ../backend.pid
cd ..
sleep 3

# Iniciar frontend
print_status "Iniciando frontend..."
npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid
sleep 5

# Iniciar ngrok
print_status "Iniciando ngrok..."
ngrok http 5173 --log=stdout > ngrok.log 2>&1 &
echo $! > ngrok.pid
sleep 3

# Extrair URL do ngrok
NGROK_URL=""
for i in {1..5}; do
    if [ -f "ngrok.log" ]; then
        NGROK_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.ngrok-free\.app' ngrok.log | head -1)
        if [ ! -z "$NGROK_URL" ]; then
            break
        fi
    fi
    sleep 1
done

echo
print_success "✅ Ambiente iniciado!"
echo
echo "📱 Serviços:"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
if [ ! -z "$NGROK_URL" ]; then
    echo "   Público:  $NGROK_URL"
    echo $NGROK_URL > ngrok.url
else
    echo "   Público:  Verifique em http://localhost:4040"
fi
echo
echo "🛑 Para parar: ./stop-dev.sh"
echo "📄 Logs: tail -f backend.log | frontend.log | ngrok.log"
echo

# Manter rodando
trap 'echo; echo "Parando..."; ./stop-dev.sh 2>/dev/null || kill $(cat *.pid 2>/dev/null) 2>/dev/null || true; exit 0' INT TERM

while true; do
    sleep 60
done