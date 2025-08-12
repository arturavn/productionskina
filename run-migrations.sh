#!/bin/bash

# Script para executar migrações do banco de dados
# Skina Ecopeças - E-commerce de Auto Peças

echo "🚀 Skina Ecopeças - Execução de Migrações"
echo "==========================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "server/scripts/run-migrations.js" ]; then
    echo "❌ Erro: Execute este script a partir da raiz do projeto"
    echo "📁 Certifique-se de estar no diretório skina-ecopecas-storefront-main"
    exit 1
fi

# Verificar se o arquivo .env existe
if [ ! -f "server/.env" ]; then
    echo "❌ Erro: Arquivo server/.env não encontrado"
    echo "📋 Copie o arquivo server/.env.example para server/.env e configure as variáveis"
    exit 1
fi

echo "📂 Diretório: $(pwd)"
echo "🔧 Configuração: server/.env encontrado"
echo ""

# Navegar para o diretório do servidor
cd server

echo "📦 Verificando dependências do Node.js..."
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências..."
    npm install
else
    echo "✅ Dependências já instaladas"
fi

echo ""
echo "🔄 Executando migrações..."
echo ""

# Executar o script de migrações
node scripts/run-migrations.js

# Verificar o código de saída
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Migrações executadas com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Inicie o servidor: npm run dev (no diretório server/)"
    echo "   2. Inicie o frontend: npm run dev (no diretório raiz)"
    echo "   3. Acesse o painel admin para cadastrar produtos"
    echo ""
else
    echo ""
    echo "❌ Erro na execução das migrações"
    echo "🔍 Verifique:"
    echo "   - PostgreSQL está rodando"
    echo "   - Configurações do arquivo .env"
    echo "   - Banco de dados existe"
    echo ""
    exit 1
fi