#!/bin/bash

# Script para corrigir o carregamento do arquivo .env no PM2
# Problema: PM2 carrega .env da raiz em vez de server/.env
# Solução: Copiar variáveis DB_* do server/.env para .env da raiz

echo "🔧 === CORREÇÃO DO CARREGAMENTO .ENV NO PM2 ==="
echo "📅 Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
echo ""

# Definir caminhos
ROOT_ENV="/var/www/productionskina/.env"
SERVER_ENV="/var/www/productionskina/server/.env"
BACKUP_ENV="/var/www/productionskina/.env.backup-$(date +%Y%m%d-%H%M%S)"

echo "📂 === VERIFICANDO ARQUIVOS ==="
if [ ! -f "$SERVER_ENV" ]; then
    echo "❌ Arquivo server/.env não encontrado: $SERVER_ENV"
    exit 1
fi

if [ ! -f "$ROOT_ENV" ]; then
    echo "❌ Arquivo .env da raiz não encontrado: $ROOT_ENV"
    exit 1
fi

echo "✅ Arquivo server/.env encontrado"
echo "✅ Arquivo .env da raiz encontrado"
echo ""

echo "💾 === FAZENDO BACKUP ==="
cp "$ROOT_ENV" "$BACKUP_ENV"
echo "✅ Backup criado: $BACKUP_ENV"
echo ""

echo "🔍 === EXTRAINDO VARIÁVEIS DB_* DO SERVER/.ENV ==="
# Extrair variáveis DB_* do server/.env
DB_VARS=$(grep '^DB_' "$SERVER_ENV" | grep -v '^#')

if [ -z "$DB_VARS" ]; then
    echo "❌ Nenhuma variável DB_* encontrada em server/.env"
    exit 1
fi

echo "Variáveis encontradas:"
echo "$DB_VARS" | while read line; do
    VAR_NAME=$(echo "$line" | cut -d'=' -f1)
    echo "  ✅ $VAR_NAME"
done
echo ""

echo "📝 === ATUALIZANDO .ENV DA RAIZ ==="
# Remover variáveis DB_* existentes do .env da raiz
grep -v '^DB_' "$ROOT_ENV" > "${ROOT_ENV}.tmp"

# Adicionar variáveis DB_* do server/.env
echo "" >> "${ROOT_ENV}.tmp"
echo "# Variáveis do banco de dados (copiadas de server/.env)" >> "${ROOT_ENV}.tmp"
echo "$DB_VARS" >> "${ROOT_ENV}.tmp"

# Substituir arquivo original
mv "${ROOT_ENV}.tmp" "$ROOT_ENV"
echo "✅ Arquivo .env da raiz atualizado com variáveis DB_*"
echo ""

echo "🔍 === VERIFICANDO RESULTADO ==="
echo "Variáveis DB_* no .env da raiz:"
grep '^DB_' "$ROOT_ENV" | while read line; do
    VAR_NAME=$(echo "$line" | cut -d'=' -f1)
    echo "  ✅ $VAR_NAME"
done
echo ""

echo "🔄 === REINICIANDO PM2 ==="
# Parar todos os processos PM2
echo "⏹️  Parando processos PM2..."
pm2 stop all

# Deletar processos PM2
echo "🗑️  Deletando processos PM2..."
pm2 delete all

# Limpar cache do PM2
echo "🧹 Limpando cache do PM2..."
pm2 kill

# Aguardar um momento
echo "⏳ Aguardando 3 segundos..."
sleep 3

# Iniciar o servidor novamente
echo "🚀 Iniciando servidor..."
cd /var/www/productionskina/server
pm2 start server.js --name "skina-backend"

echo ""
echo "✅ === CORREÇÃO CONCLUÍDA ==="
echo "📋 Próximos passos:"
echo "   1. Verificar status: pm2 status"
echo "   2. Verificar logs: pm2 logs skina-backend"
echo "   3. Testar conexão: curl http://localhost:3001/api/test"
echo ""
echo "💡 O PM2 agora deve carregar as variáveis DB_* corretamente do .env da raiz"
echo "🔄 Se houver problemas, restaure o backup: cp $BACKUP_ENV $ROOT_ENV"