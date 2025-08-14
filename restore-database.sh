#!/bin/bash

# Script de Restauração do Banco de Dados
# Execute este script para restaurar um backup específico
# Uso: ./restore-database.sh [arquivo_backup.sql]

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Script de Restauração do Banco de Dados - Skina Ecopeças${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo ""

# Verificar se o arquivo .env existe
if [ ! -f "server/.env" ]; then
    echo -e "${RED}❌ Arquivo server/.env não encontrado!${NC}"
    echo "Certifique-se de estar no diretório raiz do projeto."
    exit 1
fi

# Carregar variáveis do .env (apenas variáveis do banco)
echo -e "${YELLOW}📋 Carregando configurações do banco...${NC}"
if [ -f "server/.env" ]; then
    # Extrair apenas variáveis do banco de dados
    export DB_HOST=$(grep '^DB_HOST=' server/.env | cut -d'=' -f2 | tr -d '"')
    export DB_PORT=$(grep '^DB_PORT=' server/.env | cut -d'=' -f2 | tr -d '"')
    export DB_NAME=$(grep '^DB_NAME=' server/.env | cut -d'=' -f2 | tr -d '"')
    export DB_USER=$(grep '^DB_USER=' server/.env | cut -d'=' -f2 | tr -d '"')
    export DB_PASSWORD=$(grep '^DB_PASSWORD=' server/.env | cut -d'=' -f2 | tr -d '"')
else
    echo -e "${RED}❌ Arquivo server/.env não encontrado!${NC}"
    exit 1
fi

# Verificar variáveis essenciais
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo -e "${RED}❌ Variáveis DB_NAME ou DB_USER não encontradas no .env${NC}"
    exit 1
fi

# Verificar se foi fornecido um arquivo de backup
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}📋 Backups disponíveis:${NC}"
    if ls backups/backup_*.sql 1> /dev/null 2>&1; then
        ls -lht backups/backup_*.sql | head -10 | awk '{print "   " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'
        echo ""
        echo -e "${YELLOW}💡 Uso: ./restore-database.sh <arquivo_backup>${NC}"
        echo "   Exemplo: ./restore-database.sh backups/backup_skina_ecopecas_20240115_143022.sql"
    else
        echo "   Nenhum backup encontrado no diretório 'backups/'"
        echo ""
        echo -e "${YELLOW}💡 Execute primeiro: ./backup-database.sh${NC}"
    fi
    exit 1
fi

BACKUP_FILE="$1"

# Verificar se o arquivo de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Arquivo de backup não encontrado: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Verificando conexão com o banco...${NC}"

# Testar conexão com o banco
if ! PGPASSWORD="$DB_PASSWORD" psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
    echo -e "${RED}❌ Não foi possível conectar ao banco de dados!${NC}"
    echo "Verifique se:"
    echo "  - PostgreSQL está rodando"
    echo "  - As credenciais no .env estão corretas"
    echo "  - O banco '$DB_NAME' existe"
    exit 1
fi

echo -e "${GREEN}✅ Conexão estabelecida com sucesso!${NC}"
echo ""

# Mostrar informações do backup
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${BLUE}📊 Informações do backup a ser restaurado:${NC}"
echo "   📁 Arquivo: $BACKUP_FILE"
echo "   📏 Tamanho: $BACKUP_SIZE"
echo "   🕐 Modificado: $(stat -f "%Sm" "$BACKUP_FILE")"
echo ""

# Confirmação de segurança
echo -e "${RED}⚠️  ATENÇÃO: Esta operação irá SUBSTITUIR todos os dados atuais!${NC}"
echo -e "${YELLOW}📋 Banco de destino: $DB_NAME${NC}"
echo ""
read -p "Tem certeza que deseja continuar? (digite 'CONFIRMO' para prosseguir): " confirmation

if [ "$confirmation" != "CONFIRMO" ]; then
    echo -e "${YELLOW}❌ Operação cancelada pelo usuário.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Iniciando restauração do banco '$DB_NAME'...${NC}"
echo "📁 Arquivo: $BACKUP_FILE"
echo ""

# Parar o servidor antes da restauração
echo -e "${YELLOW}⏸️  Parando servidor...${NC}"
pm2 stop server 2>/dev/null || echo "Servidor não estava rodando via PM2"
pm2 stop skina-backend 2>/dev/null || echo "skina-backend não estava rodando via PM2"

# Executar restauração
if PGPASSWORD="$DB_PASSWORD" psql \
    -h "${DB_HOST:-localhost}" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$BACKUP_FILE" \
    --quiet; then
    
    echo ""
    echo -e "${GREEN}✅ Restauração realizada com sucesso!${NC}"
    echo ""
    
    # Reiniciar o servidor
    echo -e "${YELLOW}🔄 Reiniciando servidor...${NC}"
    pm2 start server 2>/dev/null || echo "Falha ao iniciar 'server' via PM2"
    pm2 start skina-backend 2>/dev/null || echo "Falha ao iniciar 'skina-backend' via PM2"
    
    echo ""
    echo -e "${GREEN}🎉 Restauração concluída com sucesso!${NC}"
    echo -e "${BLUE}📋 O banco foi restaurado para o estado do backup.${NC}"
    
else
    echo ""
    echo -e "${RED}❌ Erro ao restaurar backup!${NC}"
    echo "Verifique o arquivo de backup e as permissões do banco."
    
    # Tentar reiniciar o servidor mesmo com erro
    echo -e "${YELLOW}🔄 Tentando reiniciar servidor...${NC}"
    pm2 start server 2>/dev/null || echo "Falha ao iniciar 'server' via PM2"
    pm2 start skina-backend 2>/dev/null || echo "Falha ao iniciar 'skina-backend' via PM2"
    
    exit 1
fi

echo ""
echo -e "${BLUE}✅ Processo de restauração finalizado!${NC}"