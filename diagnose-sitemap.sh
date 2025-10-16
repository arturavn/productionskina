#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO DO SITEMAP"
echo "=================================="
echo ""

# 1. Verificar se o Node.js está rodando
echo "1️⃣ Verificando se o Node.js está rodando..."
echo "============================================"
pm2 status
echo ""

# 2. Testar sitemap localmente no Node.js
echo "2️⃣ Testando sitemap localmente (Node.js)..."
echo "============================================"
curl -I http://localhost:3001/sitemap.xml
echo ""
echo "Conteúdo do sitemap local:"
curl -s http://localhost:3001/sitemap.xml | head -10
echo ""

# 3. Verificar configuração do Nginx
echo "3️⃣ Verificando configuração do Nginx..."
echo "======================================="
echo "Procurando por configurações de sitemap:"
grep -n "sitemap" /etc/nginx/sites-available/default || echo "❌ Nenhuma configuração de sitemap encontrada"
echo ""
echo "Procurando por configurações de proxy_pass:"
grep -n "proxy_pass" /etc/nginx/sites-available/default || echo "❌ Nenhuma configuração de proxy_pass encontrada"
echo ""

# 4. Verificar se há arquivos estáticos conflitantes
echo "4️⃣ Verificando arquivos estáticos conflitantes..."
echo "================================================"
echo "Verificando /var/www/productionskina/dist/:"
ls -la /var/www/productionskina/dist/ | grep -E "(sitemap|robots)" || echo "✅ Nenhum arquivo conflitante em dist/"
echo ""
echo "Verificando /var/www/productionskina/public/:"
ls -la /var/www/productionskina/public/ | grep -E "(sitemap|robots)" || echo "✅ Nenhum arquivo conflitante em public/"
echo ""
echo "Verificando /var/www/html/:"
ls -la /var/www/html/ | grep -E "(sitemap|robots)" || echo "✅ Nenhum arquivo conflitante em /var/www/html/"
echo ""

# 5. Verificar logs do Nginx
echo "5️⃣ Verificando logs do Nginx..."
echo "==============================="
echo "Últimas 10 linhas do access.log:"
tail -10 /var/log/nginx/access.log | grep sitemap || echo "❌ Nenhuma requisição para sitemap nos logs"
echo ""
echo "Últimas 10 linhas do error.log:"
tail -10 /var/log/nginx/error.log || echo "✅ Nenhum erro recente"
echo ""

# 6. Verificar logs do PM2
echo "6️⃣ Verificando logs do PM2..."
echo "============================="
echo "Logs recentes do PM2:"
pm2 logs productionskina --lines 5 --nostream
echo ""

# 7. Testar diferentes URLs
echo "7️⃣ Testando diferentes URLs..."
echo "=============================="
echo "Testando https://skinaecopecas.com.br/sitemap.xml:"
curl -I https://skinaecopecas.com.br/sitemap.xml
echo ""
echo "Testando https://skinaecopecas.com.br/robots.txt:"
curl -I https://skinaecopecas.com.br/robots.txt
echo ""

# 8. Verificar configuração completa do Nginx
echo "8️⃣ Configuração completa do Nginx..."
echo "===================================="
cat /etc/nginx/sites-available/default
echo ""

# 9. Verificar se o arquivo sitemap.js existe
echo "9️⃣ Verificando arquivo sitemap.js..."
echo "==================================="
if [ -f "/var/www/productionskina/server/routes/sitemap.js" ]; then
    echo "✅ Arquivo sitemap.js encontrado"
    echo "Tamanho: $(wc -l < /var/www/productionskina/server/routes/sitemap.js) linhas"
    echo "Últimas modificações:"
    ls -la /var/www/productionskina/server/routes/sitemap.js
    echo ""
    echo "Primeiras 20 linhas do arquivo:"
    head -20 /var/www/productionskina/server/routes/sitemap.js
else
    echo "❌ Arquivo sitemap.js NÃO encontrado!"
fi
echo ""

# 10. Verificar se a rota está registrada no server.js
echo "🔟 Verificando registro da rota no server.js..."
echo "==============================================="
grep -n "sitemap" /var/www/productionskina/server/server.js || echo "❌ Rota sitemap não encontrada no server.js"
echo ""

# 11. Testar conectividade
echo "1️⃣1️⃣ Testando conectividade..."
echo "=============================="
echo "Testando se o Node.js responde na porta 3001:"
netstat -tlnp | grep :3001 || echo "❌ Porta 3001 não está escutando"
echo ""

# 12. Verificar variáveis de ambiente
echo "1️⃣2️⃣ Verificando variáveis de ambiente..."
echo "========================================"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo ""

echo "🎯 DIAGNÓSTICO CONCLUÍDO!"
echo "========================"
echo ""
echo "📋 PRÓXIMOS PASSOS BASEADOS NO DIAGNÓSTICO:"
echo "1. Se o Node.js não estiver rodando → pm2 restart productionskina"
echo "2. Se não houver configuração de proxy no Nginx → adicionar configuração"
echo "3. Se houver arquivos estáticos conflitantes → remover"
echo "4. Se a rota não estiver registrada → verificar server.js"
echo ""