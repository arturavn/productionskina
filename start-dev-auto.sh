#!/bin/bash

# Script automatizado para inicializar o ambiente de desenvolvimento
# Autor: Desenvolvedor Skina Auto Peças
# Descrição: Configura automaticamente backend, frontend e ngrok

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Função para verificar se uma porta está em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Porta em uso
    else
        return 1  # Porta livre
    fi
}

# Função para matar processo em uma porta específica
kill_port() {
    local port=$1
    print_status "Verificando porta $port..."
    if check_port $port; then
        print_warning "Porta $port está em uso. Finalizando processo..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
        if check_port $port; then
            print_error "Não foi possível liberar a porta $port"
            return 1
        else
            print_success "Porta $port liberada"
        fi
    else
        print_success "Porta $port está livre"
    fi
}

# Função para verificar se o comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para instalar dependências se necessário
install_dependencies() {
    print_status "Verificando dependências..."
    
    # Verificar Node.js
    if ! command_exists node; then
        print_error "Node.js não encontrado. Por favor, instale o Node.js primeiro."
        exit 1
    fi
    
    # Verificar npm
    if ! command_exists npm; then
        print_error "npm não encontrado. Por favor, instale o npm primeiro."
        exit 1
    fi
    
    # Verificar ngrok
    if ! command_exists ngrok; then
        print_warning "ngrok não encontrado. Instalando via Homebrew..."
        if command_exists brew; then
            brew install ngrok/ngrok/ngrok
        else
            print_error "Homebrew não encontrado. Por favor, instale o ngrok manualmente."
            print_error "Visite: https://ngrok.com/download"
            exit 1
        fi
    fi
    
    print_success "Todas as dependências estão disponíveis"
}

# Função para configurar variáveis de ambiente
setup_environment() {
    print_status "Configurando variáveis de ambiente..."
    
    # Verificar se os arquivos .env existem
    if [ ! -f "server/.env" ]; then
        print_warning "Arquivo server/.env não encontrado. Copiando do exemplo..."
        if [ -f "server/.env.example" ]; then
            cp server/.env.example server/.env
            print_success "Arquivo server/.env criado"
        else
            print_error "Arquivo server/.env.example não encontrado"
        fi
    fi
    
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado. Copiando do exemplo..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Arquivo .env criado"
        else
            print_error "Arquivo .env.example não encontrado"
        fi
    fi
}

# Função para instalar dependências do projeto
install_project_dependencies() {
    print_status "Instalando dependências do frontend..."
    npm install
    
    print_status "Instalando dependências do backend..."
    cd server
    npm install
    cd ..
    
    print_success "Dependências instaladas"
}

# Função para iniciar o backend
start_backend() {
    print_status "Iniciando servidor backend na porta 3001..."
    
    # Verificar e liberar porta 3001
    kill_port 3001
    
    # Iniciar backend em background
    cd server
    npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Aguardar o backend inicializar
    print_status "Aguardando backend inicializar..."
    sleep 5
    
    # Verificar se o backend está rodando
    if check_port 3001; then
        print_success "Backend iniciado com sucesso (PID: $BACKEND_PID)"
        echo $BACKEND_PID > backend.pid
    else
        print_error "Falha ao iniciar o backend"
        print_error "Verifique o log em backend.log"
        exit 1
    fi
}

# Função para iniciar o frontend
start_frontend() {
    print_status "Iniciando servidor frontend na porta 5173..."
    
    # Verificar e liberar porta 5173
    kill_port 5173
    
    # Iniciar frontend em background
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Aguardar o frontend inicializar
    print_status "Aguardando frontend inicializar..."
    sleep 8
    
    # Verificar se o frontend está rodando
    if check_port 5173; then
        print_success "Frontend iniciado com sucesso (PID: $FRONTEND_PID)"
        echo $FRONTEND_PID > frontend.pid
    else
        print_error "Falha ao iniciar o frontend"
        print_error "Verifique o log em frontend.log"
        exit 1
    fi
}

# Função para configurar e iniciar ngrok
start_ngrok() {
    print_status "Configurando ngrok..."
    
    # Verificar se ngrok já está rodando
    if pgrep -f "ngrok http 5173" > /dev/null; then
        print_warning "ngrok já está rodando. Finalizando processo anterior..."
        pkill -f "ngrok http 5173" || true
        sleep 2
    fi
    
    # Iniciar ngrok em background
    ngrok http 5173 --log=stdout > ngrok.log 2>&1 &
    NGROK_PID=$!
    
    # Aguardar ngrok inicializar
    print_status "Aguardando ngrok inicializar..."
    sleep 5
    
    # Extrair URL do ngrok
    NGROK_URL=""
    for i in {1..10}; do
        if [ -f "ngrok.log" ]; then
            NGROK_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.ngrok-free\.app' ngrok.log | head -1)
            if [ ! -z "$NGROK_URL" ]; then
                break
            fi
        fi
        sleep 1
    done
    
    if [ ! -z "$NGROK_URL" ]; then
        print_success "ngrok iniciado com sucesso (PID: $NGROK_PID)"
        print_success "URL pública: $NGROK_URL"
        echo $NGROK_PID > ngrok.pid
        echo $NGROK_URL > ngrok.url
    else
        print_warning "ngrok iniciado, mas URL não foi detectada automaticamente"
        print_warning "Verifique manualmente em: http://localhost:4040"
        echo $NGROK_PID > ngrok.pid
    fi
}

# Função para exibir status dos serviços
show_status() {
    echo
    print_success "=== AMBIENTE DE DESENVOLVIMENTO CONFIGURADO ==="
    echo
    print_status "Serviços rodando:"
    echo "  🔧 Backend:  http://localhost:3001 (PID: $(cat backend.pid 2>/dev/null || echo 'N/A'))"
    echo "  🌐 Frontend: http://localhost:5173 (PID: $(cat frontend.pid 2>/dev/null || echo 'N/A'))"
    if [ -f "ngrok.url" ]; then
        echo "  🌍 Público:  $(cat ngrok.url) (PID: $(cat ngrok.pid 2>/dev/null || echo 'N/A'))"
    else
        echo "  🌍 Público:  Verifique em http://localhost:4040"
    fi
    echo
    print_status "Logs disponíveis:"
    echo "  📄 Backend:  tail -f backend.log"
    echo "  📄 Frontend: tail -f frontend.log"
    echo "  📄 ngrok:    tail -f ngrok.log"
    echo
    print_status "Para parar todos os serviços: ./stop-dev.sh"
    echo
}

# Função para criar script de parada
create_stop_script() {
    cat > stop-dev.sh << 'EOF'
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
EOF

    chmod +x stop-dev.sh
}

# Função principal
main() {
    echo
    print_status "🚀 Iniciando configuração automática do ambiente de desenvolvimento"
    echo
    
    # Verificar se estamos no diretório correto
    if [ ! -f "package.json" ] || [ ! -d "server" ]; then
        print_error "Execute este script no diretório raiz do projeto (skina-ecopecas-storefront-main)"
        exit 1
    fi
    
    # Executar etapas de configuração
    install_dependencies
    setup_environment
    install_project_dependencies
    start_backend
    start_frontend
    start_ngrok
    create_stop_script
    show_status
    
    print_success "🎉 Ambiente configurado com sucesso!"
    print_status "Pressione Ctrl+C para parar todos os serviços ou use ./stop-dev.sh"
    
    # Manter o script rodando para monitorar os processos
    trap 'echo; print_status "Parando serviços..."; ./stop-dev.sh; exit 0' INT TERM
    
    while true; do
        sleep 30
        # Verificar se os serviços ainda estão rodando
        if [ -f "backend.pid" ] && ! kill -0 $(cat backend.pid) 2>/dev/null; then
            print_error "Backend parou inesperadamente. Verifique backend.log"
        fi
        if [ -f "frontend.pid" ] && ! kill -0 $(cat frontend.pid) 2>/dev/null; then
            print_error "Frontend parou inesperadamente. Verifique frontend.log"
        fi
        if [ -f "ngrok.pid" ] && ! kill -0 $(cat ngrok.pid) 2>/dev/null; then
            print_error "ngrok parou inesperadamente. Verifique ngrok.log"
        fi
    done
}

# Executar função principal
main "$@"