#!/bin/bash

# Script de Backup Automático do Banco de Dados
# Execute este script antes de qualquer manutenção no site
# Uso: ./backup-database.sh

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  Script de Backup do Banco de Dados - Skina Ecopeças${NC}"
echo -e "${BLUE}=================================================${NC}"
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

# Criar diretório de backups se não existir
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Gerar nome do arquivo de backup com timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"

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

# Realizar backup
echo -e "${YELLOW}💾 Iniciando backup do banco '$DB_NAME'...${NC}"
echo "📁 Arquivo: $BACKUP_FILE"
echo ""

# Executar pg_dump
if PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "${DB_HOST:-localhost}" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --format=plain \
    --file="$BACKUP_FILE"; then
    
    echo ""
    echo -e "${GREEN}✅ Backup realizado com sucesso!${NC}"
    
    # Mostrar informações do arquivo
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${BLUE}📊 Informações do backup:${NC}"
    echo "   📁 Arquivo: $BACKUP_FILE"
    echo "   📏 Tamanho: $BACKUP_SIZE"
    echo "   🕐 Data: $(date)"
    echo ""
    
    # Listar backups existentes
    echo -e "${BLUE}📋 Backups disponíveis:${NC}"
    ls -lh "$BACKUP_DIR"/backup_*.sql 2>/dev/null | awk '{print "   " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}' || echo "   Nenhum backup anterior encontrado"
    echo ""
    
    # Instruções de uso
    echo -e "${YELLOW}📝 Como restaurar este backup:${NC}"
    echo "   sudo -u postgres psql -d $DB_NAME -f $BACKUP_FILE"
    echo ""
    echo -e "${GREEN}🎉 Backup concluído! Agora você pode fazer manutenções com segurança.${NC}"
    
else
    echo ""
    echo -e "${RED}❌ Erro ao realizar backup!${NC}"
    echo "Verifique as permissões e configurações do banco."
    exit 1
fi

# Limpeza automática (manter apenas os 10 backups mais recentes)
echo -e "${YELLOW}🧹 Limpando backups antigos (mantendo os 10 mais recentes)...${NC}"
ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | tail -n +11 | xargs -r rm -f
echo -e "${GREEN}✅ Limpeza concluída!${NC}"

echo ""
echo -e "${BLUE}🔒 Backup seguro criado! Prossiga com a manutenção.${NC}"