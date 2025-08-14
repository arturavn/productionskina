#!/bin/bash

# Script de Manutenção Segura com Backup Automático
# Este script automatiza todo o processo de manutenção com segurança
# Uso: ./manutencao-segura.sh

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🔧 Manutenção Segura - Skina Ecopeças${NC}"
echo -e "${PURPLE}====================================${NC}"
echo ""
echo -e "${BLUE}Este script irá:${NC}"
echo "  1. 💾 Fazer backup automático do banco"
echo "  2. 📥 Baixar atualizações do Git"
echo "  3. 🔄 Reiniciar o servidor"
echo "  4. ✅ Verificar se tudo está funcionando"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "server/.env" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório raiz do projeto!${NC}"
    exit 1
fi

# Verificar se os scripts de backup existem
if [ ! -f "backup-database.sh" ]; then
    echo -e "${RED}❌ Script backup-database.sh não encontrado!${NC}"
    exit 1
fi

# Função para verificar status do servidor
check_server_status() {
    echo -e "${YELLOW}🔍 Verificando status do servidor...${NC}"
    pm2 list | grep -E "(server|skina-backend)" || echo "Nenhum processo PM2 encontrado"
}

# Função para verificar se o site está respondendo
check_website() {
    echo -e "${YELLOW}🌐 Testando se o site está respondendo...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
        echo -e "${GREEN}✅ Site está respondendo!${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Site não está respondendo na porta 3000${NC}"
        return 1
    fi
}

# Mostrar status inicial
echo -e "${BLUE}📊 Status inicial:${NC}"
check_server_status
echo ""

# Confirmação do usuário
read -p "Deseja continuar com a manutenção? (s/N): " confirm
if [[ ! $confirm =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}❌ Manutenção cancelada pelo usuário.${NC}"
    exit 0
fi

echo ""
echo -e "${PURPLE}🚀 Iniciando processo de manutenção...${NC}"
echo ""

# ETAPA 1: Backup do banco de dados
echo -e "${BLUE}📋 ETAPA 1/4: Backup do Banco de Dados${NC}"
echo -e "${BLUE}=====================================${NC}"
if ./backup-database.sh; then
    echo -e "${GREEN}✅ Backup realizado com sucesso!${NC}"
else
    echo -e "${RED}❌ Falha no backup! Abortando manutenção por segurança.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 ETAPA 2/4: Atualizações do Git${NC}"
echo -e "${BLUE}=================================${NC}"

# Verificar se há mudanças locais não commitadas
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Há mudanças locais não commitadas:${NC}"
    git status --porcelain
    echo ""
    read -p "Deseja fazer stash das mudanças locais? (s/N): " stash_confirm
    if [[ $stash_confirm =~ ^[Ss]$ ]]; then
        git stash push -m "Backup automático antes da manutenção $(date)"
        echo -e "${GREEN}✅ Mudanças locais salvas em stash${NC}"
    else
        echo -e "${YELLOW}⚠️  Continuando sem fazer stash...${NC}"
    fi
fi

# Fazer git pull
echo -e "${YELLOW}📥 Baixando atualizações...${NC}"
if git pull origin main; then
    echo -e "${GREEN}✅ Atualizações baixadas com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao baixar atualizações!${NC}"
    echo -e "${YELLOW}💡 Verifique conflitos ou problemas de rede${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 ETAPA 3/4: Reiniciar Servidor${NC}"
echo -e "${BLUE}===============================${NC}"

# Parar servidor
echo -e "${YELLOW}⏸️  Parando servidor...${NC}"
pm2 stop server 2>/dev/null || echo "'server' não estava rodando"
pm2 stop skina-backend 2>/dev/null || echo "'skina-backend' não estava rodando"

# Aguardar um momento
sleep 2

# Iniciar servidor
echo -e "${YELLOW}▶️  Iniciando servidor...${NC}"
pm2 start server 2>/dev/null || echo "Falha ao iniciar 'server'"
pm2 start skina-backend 2>/dev/null || echo "Falha ao iniciar 'skina-backend'"

# Aguardar servidor inicializar
echo -e "${YELLOW}⏳ Aguardando servidor inicializar...${NC}"
sleep 5

echo ""
echo -e "${BLUE}📋 ETAPA 4/4: Verificação Final${NC}"
echo -e "${BLUE}==============================${NC}"

# Verificar status final
check_server_status
echo ""

# Testar se o site está funcionando
check_website

echo ""
echo -e "${PURPLE}🎉 MANUTENÇÃO CONCLUÍDA!${NC}"
echo -e "${PURPLE}========================${NC}"
echo ""
echo -e "${GREEN}✅ Resumo da manutenção:${NC}"
echo "   💾 Backup do banco: Realizado"
echo "   📥 Atualizações Git: Baixadas"
echo "   🔄 Servidor: Reiniciado"
echo "   🌐 Site: Funcionando"
echo ""
echo -e "${BLUE}📋 Logs do PM2:${NC}"
pm2 logs --lines 5

echo ""
echo -e "${YELLOW}💡 Dicas:${NC}"
echo "   - Monitore os logs: pm2 logs"
echo "   - Verifique status: pm2 list"
echo "   - Em caso de problemas, restaure o backup com: ./restore-database.sh"
echo ""
echo -e "${GREEN}🔒 Manutenção segura finalizada!${NC}"