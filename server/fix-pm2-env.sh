#!/bin/bash

# Script para resolver problema de cache de variáveis de ambiente no PM2
# Este script força o PM2 a recarregar completamente as variáveis do .env

echo "🔄 Iniciando correção do PM2 para resolver erro PostgreSQL..."

# 1. Parar e deletar o processo completamente
echo "📋 Parando processo skina-backend..."
pm2 stop skina-backend 2>/dev/null || echo "Processo já estava parado"

echo "🗑️ Deletando processo skina-backend..."
pm2 delete skina-backend 2>/dev/null || echo "Processo já foi deletado"

# 2. Limpar cache do PM2
echo "🧹 Limpando cache do PM2..."
pm2 flush
pm2 kill

# 3. Aguardar um momento para garantir limpeza completa
echo "⏳ Aguardando limpeza completa..."
sleep 3

# 4. Verificar se o arquivo .env existe e tem a senha correta
echo "🔍 Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo "❌ Erro: Arquivo .env não encontrado!"
    exit 1
fi

# Verificar se a senha está configurada corretamente
if grep -q 'DB_PASSWORD="skinalogindb"' .env; then
    echo "✅ Senha do banco configurada corretamente"
else
    echo "⚠️ Aviso: Senha do banco pode não estar configurada corretamente"
    echo "Conteúdo atual da DB_PASSWORD:"
    grep DB_PASSWORD .env || echo "DB_PASSWORD não encontrada"
fi

# 5. Reiniciar PM2 do zero
echo "🚀 Iniciando PM2 com reload completo das variáveis..."
pm2 start server.js --name skina-backend

# 6. Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# 7. Verificar status
echo "📊 Status do processo:"
pm2 status skina-backend

# 8. Mostrar logs recentes para verificar se o erro foi resolvido
echo "📋 Logs recentes (últimas 20 linhas):"
pm2 logs skina-backend --lines 20

echo "✅ Script concluído! Verifique os logs acima para confirmar se o erro PostgreSQL foi resolvido."
echo "Se ainda houver erros, execute: pm2 logs skina-backend --lines 50"