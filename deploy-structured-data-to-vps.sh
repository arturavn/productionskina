#!/bin/bash

# Deploy Structured Data Changes to VPS
# Script para aplicar as mudanças de dados estruturados no VPS

echo "🚀 Iniciando deploy das mudanças de dados estruturados para o VPS..."

# Definir diretório correto do VPS
VPS_DIR="/var/www/productionskina"
SERVER_DIR="/var/www/productionskina/server"

echo "📁 Diretório do projeto: $VPS_DIR"
echo "📁 Diretório do servidor: $SERVER_DIR"

# 1. Criar backup dos arquivos atuais
echo "📦 Criando backup dos arquivos atuais..."
cd $VPS_DIR
cp -r . ../productionskina-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "⚠️  Backup não criado (pode ser normal)"

# 2. Fazer pull das mudanças do GitHub
echo "📥 Fazendo pull das mudanças do GitHub..."
git stash 2>/dev/null || echo "Nada para fazer stash"
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer pull do GitHub"
    exit 1
fi

# 3. Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do frontend"
    exit 1
fi

# 4. Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd $SERVER_DIR
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências do backend"
    exit 1
fi

# 5. Voltar para o diretório principal e fazer build
echo "🔨 Fazendo build da aplicação..."
cd $VPS_DIR
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer build da aplicação"
    exit 1
fi

# 6. Reiniciar serviços PM2
echo "🔄 Reiniciando serviços PM2..."
pm2 restart all

if [ $? -ne 0 ]; then
    echo "❌ Erro ao reiniciar PM2"
    exit 1
fi

# 7. Aguardar alguns segundos para os serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 5

# 8. Verificar status dos serviços
echo "📊 Verificando status dos serviços..."
pm2 status

# 9. Testar se o site está respondendo
echo "🌐 Testando se o site está respondendo..."
curl -s -o /dev/null -w "%{http_code}" https://skinaecopecas.com.br

if [ $? -eq 0 ]; then
    echo "✅ Site está respondendo!"
else
    echo "⚠️  Site pode não estar respondendo corretamente"
fi

# 10. Verificar se os dados estruturados estão presentes
echo "🔍 Verificando dados estruturados JSON-LD..."
STRUCTURED_DATA=$(curl -s https://skinaecopecas.com.br | grep -c 'application/ld+json')

if [ $STRUCTURED_DATA -gt 0 ]; then
    echo "✅ Dados estruturados JSON-LD encontrados no site!"
    echo "📊 Quantidade de blocos JSON-LD: $STRUCTURED_DATA"
else
    echo "❌ Dados estruturados JSON-LD NÃO encontrados no site"
    echo "🔍 Verificando se o React está carregando..."
    curl -s https://skinaecopecas.com.br | grep -A 10 -B 10 "root"
fi

echo ""
echo "🎉 Deploy concluído!"
echo "📝 Próximos passos:"
echo "   1. Verificar o site em https://skinaecopecas.com.br"
echo "   2. Testar os dados estruturados com Google Rich Results Test"
echo "   3. Submeter sitemap atualizado no Google Search Console"
echo ""