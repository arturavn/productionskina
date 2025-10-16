#!/bin/bash

echo "🔧 Corrigindo Sitemap na VPS..."
echo "================================"

# Navegar para o diretório do projeto
cd /var/www/productionskina

echo "📁 Diretório atual: $(pwd)"

# Fazer backup do .env
echo "💾 Fazendo backup do .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Puxar as últimas mudanças
echo "📥 Puxando mudanças do GitHub..."
git status
git pull origin main

# Verificar se o arquivo sitemap.js existe
echo "🔍 Verificando arquivo sitemap.js..."
if [ -f "server/routes/sitemap.js" ]; then
    echo "✅ Arquivo sitemap.js encontrado"
    ls -la server/routes/sitemap.js
else
    echo "❌ Arquivo sitemap.js NÃO encontrado!"
    echo "📂 Listando arquivos em server/routes/:"
    ls -la server/routes/
fi

# Instalar dependências do backend (caso necessário)
echo "📦 Instalando dependências do backend..."
npm install

# Restaurar .env
echo "🔄 Restaurando .env..."
cp .env.backup.$(date +%Y%m%d_%H%M%S) .env 2>/dev/null || echo "⚠️  Backup do .env não encontrado"

# Reiniciar PM2
echo "🔄 Reiniciando aplicação PM2..."
pm2 restart productionskina

# Aguardar um pouco
echo "⏳ Aguardando 5 segundos..."
sleep 5

# Testar o sitemap
echo "🧪 Testando sitemap..."
curl -I https://skinaecopecas.com.br/sitemap.xml

echo ""
echo "🔍 Testando conteúdo do sitemap..."
curl -s https://skinaecopecas.com.br/sitemap.xml | head -20

echo ""
echo "📊 Status do PM2:"
pm2 status

echo ""
echo "📋 Logs recentes do PM2:"
pm2 logs productionskina --lines 10

echo ""
echo "✅ Script concluído!"
echo "🌐 Teste o sitemap em: https://skinaecopecas.com.br/sitemap.xml"