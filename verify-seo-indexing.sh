#!/bin/bash

# 🔍 Script de Verificação SEO e Indexação
# Skina Eco Peças - Verificação Completa

echo "🚀 INICIANDO VERIFICAÇÃO SEO COMPLETA..."
echo "=================================================="

DOMAIN="https://skinaecopecas.com.br"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "📅 Data/Hora: $DATE"
echo "🌐 Domínio: $DOMAIN"
echo ""

# 1. VERIFICAR SITEMAP
echo "📋 1. VERIFICANDO SITEMAP..."
echo "--------------------------------------------------"
SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/sitemap.xml")
if [ "$SITEMAP_STATUS" = "200" ]; then
    echo "✅ Sitemap acessível: $DOMAIN/sitemap.xml"
    SITEMAP_URLS=$(curl -s "$DOMAIN/sitemap.xml" | grep -c "<loc>")
    echo "📊 Total de URLs no sitemap: $SITEMAP_URLS"
else
    echo "❌ Erro ao acessar sitemap: HTTP $SITEMAP_STATUS"
fi
echo ""

# 2. VERIFICAR META TAGS
echo "🏷️ 2. VERIFICANDO META TAGS..."
echo "--------------------------------------------------"
PAGE_CONTENT=$(curl -s "$DOMAIN/")

# Verificar Title
TITLE=$(echo "$PAGE_CONTENT" | grep -o '<title[^>]*>[^<]*</title>' | sed 's/<[^>]*>//g')
if [[ "$TITLE" == *"Skina Eco Peças"* ]]; then
    echo "✅ Title otimizado encontrado:"
    echo "   📝 $TITLE"
else
    echo "❌ Title não otimizado ou não encontrado"
fi

# Verificar Meta Description
META_DESC=$(echo "$PAGE_CONTENT" | grep -o 'name="description"[^>]*content="[^"]*"' | sed 's/.*content="//;s/".*//')
if [[ "$META_DESC" == *"Setor H Norte"* ]]; then
    echo "✅ Meta Description otimizada encontrada:"
    echo "   📝 $META_DESC"
else
    echo "❌ Meta Description não otimizada ou não encontrada"
fi

# Verificar Keywords
META_KEYWORDS=$(echo "$PAGE_CONTENT" | grep -o 'name="keywords"[^>]*content="[^"]*"' | sed 's/.*content="//;s/".*//')
if [[ "$META_KEYWORDS" == *"peças automotivas"* ]]; then
    echo "✅ Meta Keywords encontradas:"
    echo "   🔑 $META_KEYWORDS"
else
    echo "❌ Meta Keywords não encontradas"
fi
echo ""

# 3. VERIFICAR STRUCTURED DATA (JSON-LD)
echo "📊 3. VERIFICANDO STRUCTURED DATA..."
echo "--------------------------------------------------"
JSON_LD=$(echo "$PAGE_CONTENT" | grep -o '<script type="application/ld+json">[^<]*</script>' | sed 's/<[^>]*>//g')
if [[ "$JSON_LD" == *"Organization"* ]]; then
    echo "✅ JSON-LD Schema.org encontrado"
    if [[ "$JSON_LD" == *"Skina Eco Peças"* ]]; then
        echo "✅ Dados da empresa incluídos"
    fi
    if [[ "$JSON_LD" == *"Jeep"* ]]; then
        echo "✅ Marcas incluídas no schema"
    fi
else
    echo "❌ JSON-LD não encontrado ou incompleto"
fi
echo ""

# 4. VERIFICAR PÁGINAS IMPORTANTES
echo "🔗 4. VERIFICANDO PÁGINAS IMPORTANTES..."
echo "--------------------------------------------------"
PAGES=("/" "/produtos" "/sobre" "/contato")
for page in "${PAGES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$page")
    if [ "$STATUS" = "200" ]; then
        echo "✅ $DOMAIN$page - HTTP $STATUS"
    else
        echo "❌ $DOMAIN$page - HTTP $STATUS"
    fi
done
echo ""

# 5. VERIFICAR ROBOTS.TXT
echo "🤖 5. VERIFICANDO ROBOTS.TXT..."
echo "--------------------------------------------------"
ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/robots.txt")
if [ "$ROBOTS_STATUS" = "200" ]; then
    echo "✅ Robots.txt acessível: $DOMAIN/robots.txt"
    ROBOTS_CONTENT=$(curl -s "$DOMAIN/robots.txt")
    if [[ "$ROBOTS_CONTENT" == *"Sitemap:"* ]]; then
        echo "✅ Sitemap referenciado no robots.txt"
    else
        echo "⚠️ Sitemap não referenciado no robots.txt"
    fi
else
    echo "❌ Robots.txt não encontrado: HTTP $ROBOTS_STATUS"
fi
echo ""

# 6. TESTE DE VELOCIDADE BÁSICO
echo "⚡ 6. TESTE DE VELOCIDADE BÁSICO..."
echo "--------------------------------------------------"
START_TIME=$(date +%s.%N)
curl -s "$DOMAIN/" > /dev/null
END_TIME=$(date +%s.%N)
LOAD_TIME=$(echo "$END_TIME - $START_TIME" | bc)
echo "⏱️ Tempo de carregamento: ${LOAD_TIME}s"

if (( $(echo "$LOAD_TIME < 3.0" | bc -l) )); then
    echo "✅ Velocidade boa (< 3s)"
elif (( $(echo "$LOAD_TIME < 5.0" | bc -l) )); then
    echo "⚠️ Velocidade aceitável (3-5s)"
else
    echo "❌ Velocidade lenta (> 5s)"
fi
echo ""

# 7. VERIFICAR INDEXAÇÃO NO GOOGLE (simulação)
echo "🔍 7. COMANDOS PARA VERIFICAR INDEXAÇÃO..."
echo "--------------------------------------------------"
echo "Execute estes comandos no Google:"
echo "   🔍 site:skinaecopecas.com.br"
echo "   🔍 \"Skina Eco Peças - Referência em Peças Automotivas\""
echo "   🔍 \"peças automotivas Setor H Norte\""
echo ""

# 8. FERRAMENTAS DE TESTE RECOMENDADAS
echo "🛠️ 8. FERRAMENTAS DE TESTE RECOMENDADAS..."
echo "--------------------------------------------------"
echo "📊 Rich Results Test:"
echo "   🔗 https://search.google.com/test/rich-results?url=$DOMAIN"
echo ""
echo "📈 PageSpeed Insights:"
echo "   🔗 https://pagespeed.web.dev/?url=$DOMAIN"
echo ""
echo "🔍 Google Search Console:"
echo "   🔗 https://search.google.com/search-console/"
echo ""

# 9. RESUMO FINAL
echo "📋 9. RESUMO DA VERIFICAÇÃO..."
echo "--------------------------------------------------"
echo "✅ Itens verificados:"
echo "   - Sitemap XML acessível"
echo "   - Meta tags otimizadas"
echo "   - Structured data (JSON-LD)"
echo "   - Páginas principais"
echo "   - Robots.txt"
echo "   - Velocidade básica"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "   1. Submeter sitemap ao Google Search Console"
echo "   2. Verificar indexação com comandos site:"
echo "   3. Testar rich snippets"
echo "   4. Monitorar posicionamento"
echo ""
echo "=================================================="
echo "🚀 VERIFICAÇÃO SEO CONCLUÍDA!"
echo "📅 $DATE"