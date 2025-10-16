#!/bin/bash

# Script para forçar rebuild completo na VPS
echo "🔄 Iniciando rebuild completo na VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📁 Navegando para o diretório do projeto...${NC}"
cd /var/www/productionskina

echo -e "${BLUE}🔍 Verificando status atual do Git...${NC}"
git status

echo -e "${BLUE}📥 Fazendo backup do .env antes de puxar alterações...${NC}"
cp server/.env server/.env.backup-$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}🔄 Puxando últimas alterações do GitHub...${NC}"
git fetch --all
git reset --hard origin/main

echo -e "${BLUE}📦 Instalando/atualizando dependências do backend...${NC}"
cd server
npm install

echo -e "${BLUE}🔧 Restaurando configurações do .env...${NC}"
if [ -f .env.backup-$(date +%Y%m%d_%H%M%S) ]; then
    cp .env.backup-$(date +%Y%m%d_%H%M%S) .env
    echo -e "${GREEN}✅ Arquivo .env restaurado${NC}"
else
    echo -e "${YELLOW}⚠️  Verifique se o arquivo .env está correto${NC}"
fi

cd ..

echo -e "${BLUE}🏗️  Instalando dependências do frontend...${NC}"
npm install

echo -e "${BLUE}🔨 Fazendo build do frontend...${NC}"
npm run build

echo -e "${BLUE}🔄 Reiniciando aplicação PM2...${NC}"
pm2 restart skina-backend

echo -e "${BLUE}📊 Verificando status da aplicação...${NC}"
pm2 list

echo -e "${BLUE}📝 Mostrando logs recentes...${NC}"
pm2 logs skina-backend --lines 20

echo -e "${GREEN}✅ Rebuild completo finalizado!${NC}"
echo -e "${YELLOW}💡 Aguarde alguns minutos e teste o site${NC}"
echo -e "${YELLOW}💡 Se ainda não funcionar, limpe o cache do navegador (Ctrl+F5)${NC}"