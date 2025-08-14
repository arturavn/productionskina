#!/bin/bash

# Script para iniciar o servidor em modo de desenvolvimento
# Automaticamente alterna para configuração local e inicia o servidor

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando servidor em modo DESENVOLVIMENTO...${NC}"
echo ""

# Verifica se está no diretório correto
if [ ! -d "./server" ]; then
    echo -e "${RED}❌ Diretório server/ não encontrado!${NC}"
    echo -e "${YELLOW}💡 Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Alterna para configuração de desenvolvimento
echo -e "${YELLOW}🔧 Configurando ambiente de desenvolvimento...${NC}"
./switch-env.sh local

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao configurar ambiente de desenvolvimento${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Verificando dependências...${NC}"

# Verifica se node_modules existe no servidor
if [ ! -d "./server/node_modules" ]; then
    echo -e "${YELLOW}📥 Instalando dependências do servidor...${NC}"
    cd server
    npm install
    cd ..
fi

# Verifica se node_modules existe no frontend
if [ ! -d "./node_modules" ]; then
    echo -e "${YELLOW}📥 Instalando dependências do frontend...${NC}"
    npm install
fi

echo ""
echo -e "${GREEN}✅ Configuração completa!${NC}"
echo -e "${BLUE}🌐 URLs disponíveis:${NC}"
echo -e "  Frontend: ${YELLOW}http://localhost:5173${NC}"
echo -e "  Backend:  ${YELLOW}http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}💡 Para parar os servidores, pressione Ctrl+C${NC}"
echo -e "${YELLOW}💡 Para voltar à produção, execute: ./switch-env.sh production${NC}"
echo ""

# Função para cleanup ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Parando servidores...${NC}"
    # Mata processos filhos
    jobs -p | xargs -r kill
    echo -e "${GREEN}✅ Servidores parados${NC}"
    exit 0
}

# Configura trap para cleanup
trap cleanup SIGINT SIGTERM

# Inicia o servidor backend em background
echo -e "${BLUE}🔧 Iniciando servidor backend...${NC}"
cd server
npm start &
BACKEND_PID=$!
cd ..

# Aguarda um pouco para o backend iniciar
sleep 3

# Inicia o servidor frontend
echo -e "${BLUE}🎨 Iniciando servidor frontend...${NC}"
npm run dev &
FRONTEND_PID=$!

# Aguarda os processos
wait $BACKEND_PID $FRONTEND_PID