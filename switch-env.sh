#!/bin/bash

# Script para alternar entre configurações de ambiente
# Uso: ./switch-env.sh [local|production]

SERVER_DIR="./server"
ENV_FILE="$SERVER_DIR/.env"
ENV_LOCAL="$SERVER_DIR/.env.local"
ENV_BACKUP="$SERVER_DIR/.env.backup"

# Arquivos do Frontend
FRONTEND_ENV="./.env"
FRONTEND_ENV_LOCAL="./.env.local"
FRONTEND_ENV_BACKUP="./.env.backup"
VITE_CONFIG="./vite.config.ts"
VITE_CONFIG_BACKUP="./vite.config.backup.ts"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para mostrar uso
show_usage() {
    echo -e "${BLUE}Uso: $0 [local|production|status]${NC}"
    echo -e "${YELLOW}Comandos:${NC}"
    echo -e "  local      - Alterna para configuração de desenvolvimento"
    echo -e "  production - Alterna para configuração de produção"
    echo -e "  status     - Mostra qual configuração está ativa"
    echo -e "  backup     - Cria backup da configuração atual"
    echo -e "  restore    - Restaura backup da configuração"
}

# Função para verificar status atual
check_status() {
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
        return 1
    fi
    
    # Verifica se é desenvolvimento ou produção baseado no NODE_ENV
    NODE_ENV=$(grep "^NODE_ENV=" "$ENV_FILE" | cut -d'=' -f2)
    FRONTEND_URL=$(grep "^FRONTEND_URL=" "$ENV_FILE" | cut -d'=' -f2)
    
    echo -e "${BLUE}📊 Status atual da configuração:${NC}"
    echo -e "NODE_ENV: ${YELLOW}$NODE_ENV${NC}"
    echo -e "FRONTEND_URL: ${YELLOW}$FRONTEND_URL${NC}"
    
    if [ "$NODE_ENV" = "development" ]; then
        echo -e "${GREEN}✅ Configuração DESENVOLVIMENTO ativa${NC}"
    elif [ "$NODE_ENV" = "production" ]; then
        echo -e "${GREEN}✅ Configuração PRODUÇÃO ativa${NC}"
    else
        echo -e "${YELLOW}⚠️  Configuração não identificada${NC}"
    fi
}

# Função para criar backup
create_backup() {
    local backup_created=false
    
    # Backup do servidor
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$ENV_BACKUP"
        echo -e "${GREEN}✅ Backup criado: server/.env.backup${NC}"
        backup_created=true
    fi
    
    # Backup do frontend
    if [ -f "$FRONTEND_ENV" ]; then
        cp "$FRONTEND_ENV" "$FRONTEND_ENV_BACKUP"
        echo -e "${GREEN}✅ Backup criado: .env.backup${NC}"
        backup_created=true
    fi
    
    # Backup do vite.config.ts
    if [ -f "$VITE_CONFIG" ]; then
        cp "$VITE_CONFIG" "$VITE_CONFIG_BACKUP"
        echo -e "${GREEN}✅ Backup criado: vite.config.backup.ts${NC}"
        backup_created=true
    fi
    
    if [ "$backup_created" = false ]; then
        echo -e "${RED}❌ Nenhum arquivo encontrado para backup!${NC}"
        return 1
    fi
}

# Função para restaurar backup
restore_backup() {
    local restored=false
    
    # Restaurar servidor
    if [ -f "$ENV_BACKUP" ]; then
        cp "$ENV_BACKUP" "$ENV_FILE"
        echo -e "${GREEN}✅ Servidor restaurado do backup${NC}"
        restored=true
    fi
    
    # Restaurar frontend
    if [ -f "$FRONTEND_ENV_BACKUP" ]; then
        cp "$FRONTEND_ENV_BACKUP" "$FRONTEND_ENV"
        echo -e "${GREEN}✅ Frontend restaurado do backup${NC}"
        restored=true
    fi
    
    # Restaurar vite.config.ts
    if [ -f "$VITE_CONFIG_BACKUP" ]; then
        cp "$VITE_CONFIG_BACKUP" "$VITE_CONFIG"
        echo -e "${GREEN}✅ Vite config restaurado do backup${NC}"
        restored=true
    fi
    
    if [ "$restored" = true ]; then
        check_status
    else
        echo -e "${RED}❌ Nenhum arquivo de backup encontrado!${NC}"
        return 1
    fi
}

# Função para alternar para desenvolvimento
switch_to_local() {
    local missing_files=false
    
    # Verifica arquivos necessários
    if [ ! -f "$ENV_LOCAL" ]; then
        echo -e "${RED}❌ Arquivo server/.env.local não encontrado!${NC}"
        missing_files=true
    fi
    
    if [ ! -f "$FRONTEND_ENV_LOCAL" ]; then
        echo -e "${RED}❌ Arquivo .env.local não encontrado!${NC}"
        missing_files=true
    fi
    
    if [ "$missing_files" = true ]; then
        echo -e "${YELLOW}💡 Alguns arquivos de configuração local estão faltando${NC}"
        return 1
    fi
    
    # Cria backup automático
    create_backup
    
    # Copia configurações locais
    cp "$ENV_LOCAL" "$ENV_FILE"
    cp "$FRONTEND_ENV_LOCAL" "$FRONTEND_ENV"
    
    # Para desenvolvimento, o vite.config.ts padrão já está configurado corretamente
    
    echo -e "${GREEN}✅ Alternado para configuração de DESENVOLVIMENTO${NC}"
    echo -e "${BLUE}🔧 Configurações ativas:${NC}"
    echo -e "  - NODE_ENV: development"
    echo -e "  - FRONTEND_URL: http://localhost:5173"
    echo -e "  - BASE_URL: http://localhost:3001"
    echo -e "  - VITE_API_URL: http://localhost:3001/api"
    echo -e "  - Mercado Pago: SANDBOX"
    echo -e "  - Database: skina_ecopecas_dev"
}

# Função para alternar para produção
switch_to_production() {
    local missing_backups=false
    
    # Verifica se os backups existem
    if [ ! -f "$ENV_BACKUP" ]; then
        echo -e "${RED}❌ Backup server/.env não encontrado!${NC}"
        missing_backups=true
    fi
    
    if [ ! -f "$FRONTEND_ENV_BACKUP" ]; then
        echo -e "${RED}❌ Backup .env não encontrado!${NC}"
        missing_backups=true
    fi
    
    if [ ! -f "$VITE_CONFIG_BACKUP" ]; then
        echo -e "${RED}❌ Backup vite.config.ts não encontrado!${NC}"
        missing_backups=true
    fi
    
    if [ "$missing_backups" = true ]; then
        echo -e "${YELLOW}💡 Execute 'backup' primeiro para criar os backups de produção${NC}"
        return 1
    fi
    
    # Restaura configurações de produção
    cp "$ENV_BACKUP" "$ENV_FILE"
    cp "$FRONTEND_ENV_BACKUP" "$FRONTEND_ENV"
    cp "$VITE_CONFIG_BACKUP" "$VITE_CONFIG"
    
    echo -e "${GREEN}✅ Alternado para configuração de PRODUÇÃO${NC}"
    echo -e "${BLUE}🚀 Configurações ativas:${NC}"
    echo -e "  - NODE_ENV: production"
    echo -e "  - FRONTEND_URL: https://skinaecopecas.com.br"
    echo -e "  - BASE_URL: https://skinaecopecas.com.br"
    echo -e "  - VITE_API_URL: https://skinaecopecas.com.br/api"
    echo -e "  - Mercado Pago: PRODUCTION"
    echo -e "  - Database: skina_ecopecas"
}

# Verifica se está no diretório correto
if [ ! -d "$SERVER_DIR" ]; then
    echo -e "${RED}❌ Diretório server/ não encontrado!${NC}"
    echo -e "${YELLOW}💡 Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Processa argumentos
case "$1" in
    "local")
        switch_to_local
        ;;
    "production")
        switch_to_production
        ;;
    "status")
        check_status
        ;;
    "backup")
        create_backup
        ;;
    "restore")
        restore_backup
        ;;
    "")
        show_usage
        echo ""
        check_status
        ;;
    *)
        echo -e "${RED}❌ Opção inválida: $1${NC}"
        show_usage
        exit 1
        ;;
esac