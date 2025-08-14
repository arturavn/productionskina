#!/bin/bash

# Script para preparar arquivos para produção/VPS
# Automaticamente alterna para configuração de produção e constrói a aplicação

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Preparando arquivos para PRODUÇÃO/VPS...${NC}"
echo ""

# Verifica se está no diretório correto
if [ ! -d "./server" ]; then
    echo -e "${RED}❌ Diretório server/ não encontrado!${NC}"
    echo -e "${YELLOW}💡 Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Alterna para configuração de produção
echo -e "${YELLOW}🔧 Configurando ambiente de produção...${NC}"
./switch-env.sh production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao configurar ambiente de produção${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Verificando dependências...${NC}"

# Verifica se node_modules existe no servidor
if [ ! -d "./server/node_modules" ]; then
    echo -e "${YELLOW}📥 Instalando dependências do servidor...${NC}"
    cd server
    npm install --production
    cd ..
fi

# Verifica se node_modules existe no frontend
if [ ! -d "./node_modules" ]; then
    echo -e "${YELLOW}📥 Instalando dependências do frontend...${NC}"
    npm install
fi

echo ""
echo -e "${BLUE}🏗️  Construindo aplicação para produção...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao construir aplicação${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Arquivos preparados para produção!${NC}"
echo -e "${BLUE}📁 Arquivos prontos para deploy:${NC}"
echo -e "  📦 Build do frontend: ${YELLOW}./dist/${NC}"
echo -e "  🔧 Configurações: ${YELLOW}.env (produção)${NC}"
echo -e "  🗄️  Backend: ${YELLOW}./server/${NC}"
echo ""
echo -e "${BLUE}🌐 Configurações de produção ativas:${NC}"
echo -e "  Frontend: ${YELLOW}https://skinaecopecas.com.br${NC}"
echo -e "  Backend:  ${YELLOW}https://skinaecopecas.com.br${NC}"
echo -e "  Database: ${YELLOW}skina_ecopecas${NC}"
echo -e "  Mercado Pago: ${YELLOW}PRODUCTION${NC}"
echo ""
echo -e "${GREEN}🚀 Próximos passos:${NC}"
echo -e "  1. Envie os arquivos para o VPS"
echo -e "  2. Use os comandos do ${YELLOW}COMANDOS_VPS.md${NC} para iniciar no servidor"
echo -e "  3. Para desenvolvimento local: ${YELLOW}./start-local.sh${NC}"
echo ""