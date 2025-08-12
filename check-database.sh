#!/bin/bash

echo "🔍 Verificando bancos de dados disponíveis..."
echo "==========================================="

# Listar todos os bancos de dados
echo "📋 Bancos de dados disponíveis:"
sudo -u postgres psql -l

echo ""
echo "🔍 Verificando arquivo .env do servidor..."
echo "==========================================="

if [ -f "server/.env" ]; then
    echo "📄 Conteúdo do arquivo server/.env:"
    cat server/.env | grep -E "DB_|DATABASE_"
else
    echo "❌ Arquivo server/.env não encontrado!"
    echo "📄 Conteúdo do arquivo server/.env.example:"
    cat server/.env.example | grep -E "DB_|DATABASE_"
fi

echo ""
echo "💡 Instruções:"
echo "1. Identifique o nome correto do banco na lista acima"
echo "2. Execute o script fix-slides-permissions.sql com o nome correto:"
echo "   sudo -u postgres psql -d NOME_DO_BANCO -f fix-slides-permissions.sql"
echo "3. Exemplos de nomes comuns: skina_ecopecas, productionskina, skina_db"