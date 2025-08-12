#!/bin/bash

# Script para verificar o estado da migração no VPS

echo "🔍 Verificando estado da migração 013_create_slides_table.sql..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "server/migrations/013_create_slides_table.sql" ]; then
    echo "❌ Arquivo de migração não encontrado. Certifique-se de estar no diretório do projeto."
    exit 1
fi

# Mostrar as últimas linhas do arquivo de migração para verificar se tem as correções
echo "📄 Conteúdo atual da migração (últimas 10 linhas):"
echo "================================================"
tail -10 server/migrations/013_create_slides_table.sql
echo "================================================"
echo ""

# Verificar se a coluna is_active está definida
if grep -q "is_active BOOLEAN" server/migrations/013_create_slides_table.sql; then
    echo "✅ Coluna 'is_active' encontrada na migração"
else
    echo "❌ Coluna 'is_active' NÃO encontrada na migração"
fi

# Verificar se tem os casts ::uuid
if grep -q "::uuid" server/migrations/013_create_slides_table.sql; then
    echo "✅ Casts UUID encontrados na migração"
else
    echo "❌ Casts UUID NÃO encontrados na migração"
fi

# Verificar se tem WHERE NOT EXISTS
if grep -q "WHERE NOT EXISTS" server/migrations/013_create_slides_table.sql; then
    echo "✅ Cláusulas WHERE NOT EXISTS encontradas"
else
    echo "❌ Cláusulas WHERE NOT EXISTS NÃO encontradas"
fi

echo ""
echo "🔧 Se alguma verificação falhou, execute:"
echo "   git pull origin main"
echo "   ./run-migrations.sh"
echo "   pm2 restart backend"