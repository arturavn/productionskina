#!/bin/bash

# 🚀 Script Completo: Aplicar Mudanças SEO no VPS
# Skina Eco Peças - Atualização SEO Completa

echo "🚀 APLICANDO TODAS AS MUDANÇAS SEO NO VPS..."
echo "=================================================="

DATE=$(date '+%Y-%m-%d %H:%M:%S')
echo "📅 Data/Hora: $DATE"
echo ""

# 1. FAZER BACKUP DOS ARQUIVOS ATUAIS
echo "💾 1. FAZENDO BACKUP DOS ARQUIVOS ATUAIS..."
echo "--------------------------------------------------"
cp server/services/SEOService.js server/services/SEOService.js.backup-$(date +%Y%m%d-%H%M%S)
cp index.html index.html.backup-$(date +%Y%m%d-%H%M%S)
cp public/robots.txt public/robots.txt.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "robots.txt não existe ainda"
echo "✅ Backups criados"
echo ""

# 2. VERIFICAR SE AS MUDANÇAS ESTÃO NO CÓDIGO LOCAL
echo "🔍 2. VERIFICANDO MUDANÇAS NO CÓDIGO LOCAL..."
echo "--------------------------------------------------"
if grep -q "Skina Eco Peças - Referência em Peças Automotivas" index.html; then
    echo "✅ Meta tags otimizadas encontradas no index.html"
else
    echo "❌ Meta tags não otimizadas no index.html"
fi

if grep -q "Setor H Norte" server/services/SEOService.js; then
    echo "✅ SEOService otimizado encontrado"
else
    echo "❌ SEOService não otimizado"
fi
echo ""

# 3. ATUALIZAR ROBOTS.TXT
echo "🤖 3. ATUALIZANDO ROBOTS.TXT..."
echo "--------------------------------------------------"
cat > public/robots.txt << 'EOF'
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://skinaecopecas.com.br/sitemap.xml

# Páginas importantes
Allow: /produtos
Allow: /sobre
Allow: /contato
Allow: /marcas/

# Bloquear arquivos administrativos
Disallow: /admin
Disallow: /.env
Disallow: /server/
EOF
echo "✅ Robots.txt atualizado com referência ao sitemap"
echo ""

# 4. INSTRUÇÕES PARA O VPS
echo "📋 4. INSTRUÇÕES PARA APLICAR NO VPS..."
echo "--------------------------------------------------"
echo "Execute estes comandos no seu VPS:"
echo ""
echo "# 1. Navegar para o diretório do projeto"
echo "cd /caminho/para/seu/projeto"
echo ""
echo "# 2. Fazer backup do estado atual"
echo "cp server/services/SEOService.js server/services/SEOService.js.backup-\$(date +%Y%m%d)"
echo "cp index.html index.html.backup-\$(date +%Y%m%d)"
echo ""
echo "# 3. Puxar as mudanças do repositório"
echo "git pull origin main"
echo ""
echo "# 4. Reiniciar o servidor Node.js"
echo "pm2 restart all"
echo "# OU se usar outro método:"
echo "# systemctl restart seu-servico"
echo ""
echo "# 5. Verificar se as mudanças foram aplicadas"
echo "curl -s https://skinaecopecas.com.br/ | grep -o '<title[^>]*>[^<]*</title>'"
echo ""

# 5. COMANDOS PARA FORÇAR REINDEXAÇÃO
echo "🔄 5. COMANDOS PARA FORÇAR REINDEXAÇÃO NO GOOGLE..."
echo "--------------------------------------------------"
echo "Após aplicar as mudanças no VPS, execute:"
echo ""
echo "A) Google Search Console:"
echo "   1. Acesse: https://search.google.com/search-console/"
echo "   2. Selecione sua propriedade: skinaecopecas.com.br"
echo "   3. Vá em 'Inspeção de URL'"
echo "   4. Digite: https://skinaecopecas.com.br"
echo "   5. Clique em 'Solicitar indexação'"
echo ""
echo "B) Submeter Sitemap:"
echo "   1. No GSC, vá em 'Sitemaps'"
echo "   2. Adicione: sitemap.xml"
echo "   3. Clique em 'Enviar'"
echo ""
echo "C) URLs Importantes para Reindexar:"
echo "   - https://skinaecopecas.com.br/"
echo "   - https://skinaecopecas.com.br/produtos"
echo "   - https://skinaecopecas.com.br/sobre"
echo "   - https://skinaecopecas.com.br/contato"
echo ""

# 6. VERIFICAÇÃO PÓS-APLICAÇÃO
echo "✅ 6. VERIFICAÇÃO PÓS-APLICAÇÃO..."
echo "--------------------------------------------------"
echo "Após aplicar no VPS, teste:"
echo ""
echo "# Verificar meta tags atualizadas"
echo "curl -s https://skinaecopecas.com.br/ | grep -A 2 -B 2 'meta name=\"description\"'"
echo ""
echo "# Verificar título atualizado"
echo "curl -s https://skinaecopecas.com.br/ | grep -o '<title[^>]*>[^<]*</title>'"
echo ""
echo "# Verificar JSON-LD"
echo "curl -s https://skinaecopecas.com.br/ | grep -o 'application/ld+json'"
echo ""
echo "# Verificar robots.txt"
echo "curl -s https://skinaecopecas.com.br/robots.txt"
echo ""

# 7. CRONOGRAMA DE INDEXAÇÃO
echo "⏰ 7. CRONOGRAMA ESPERADO DE INDEXAÇÃO..."
echo "--------------------------------------------------"
echo "📅 Tempo esperado para indexação:"
echo "   🔄 Imediato: Mudanças aplicadas no servidor"
echo "   ⚡ 1-2 horas: Google detecta mudanças via crawling"
echo "   📊 6-24 horas: Novas meta tags aparecem nos resultados"
echo "   🎯 2-7 dias: Indexação completa e posicionamento estabilizado"
echo ""
echo "🚀 DICAS PARA ACELERAR:"
echo "   1. Usar 'Solicitar indexação' no GSC"
echo "   2. Submeter sitemap atualizado"
echo "   3. Compartilhar URLs em redes sociais"
echo "   4. Criar backlinks internos"
echo ""

# 8. MONITORAMENTO
echo "📊 8. MONITORAMENTO CONTÍNUO..."
echo "--------------------------------------------------"
echo "Comandos para monitorar indexação:"
echo ""
echo "# Verificar se o Google vê as mudanças"
echo "site:skinaecopecas.com.br"
echo ""
echo "# Buscar pelo novo título"
echo "\"Skina Eco Peças - Referência em Peças Automotivas no Setor H Norte\""
echo ""
echo "# Verificar rich snippets"
echo "https://search.google.com/test/rich-results?url=https://skinaecopecas.com.br"
echo ""

echo "=================================================="
echo "🎯 RESUMO DAS AÇÕES NECESSÁRIAS:"
echo ""
echo "✅ FEITO (Local):"
echo "   - Meta tags otimizadas"
echo "   - SEOService atualizado"
echo "   - Robots.txt criado"
echo "   - Scripts de verificação"
echo ""
echo "🔄 PENDENTE (VPS):"
echo "   - Aplicar mudanças no servidor"
echo "   - Reiniciar serviços"
echo "   - Submeter ao Google Search Console"
echo "   - Solicitar reindexação"
echo ""
echo "📅 $DATE"
echo "🚀 EXECUTE AS INSTRUÇÕES ACIMA NO SEU VPS!"