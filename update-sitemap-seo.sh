#!/bin/bash

echo "🚀 ATUALIZANDO SITEMAP PARA SEO OTIMIZADO"
echo "========================================"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Resumo das melhorias:${NC}"
echo "✅ URLs amigáveis para produtos (slug ao invés de UUID)"
echo "✅ Páginas de marcas importantes adicionadas"
echo "✅ Prioridades SEO otimizadas"
echo "✅ Páginas estáticas já incluídas"
echo ""

# Fazer backup do arquivo atual
echo -e "${YELLOW}📦 Fazendo backup do sitemap atual...${NC}"
cp server/routes/sitemap.js server/routes/sitemap.js.backup-$(date +%Y%m%d-%H%M%S)

# Verificar se o servidor está rodando
echo -e "${BLUE}🔍 Verificando status do servidor...${NC}"
if pm2 list | grep -q "skina-backend.*online"; then
    echo -e "${GREEN}✅ Servidor Node.js está online${NC}"
    
    # Reiniciar o servidor para aplicar mudanças
    echo -e "${YELLOW}🔄 Reiniciando servidor para aplicar mudanças...${NC}"
    pm2 restart skina-backend
    sleep 3
    
    # Testar sitemap local
    echo -e "${BLUE}🧪 Testando sitemap local...${NC}"
    LOCAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/sitemap.xml)
    if [ "$LOCAL_TEST" = "200" ]; then
        echo -e "${GREEN}✅ Sitemap local funcionando (HTTP $LOCAL_TEST)${NC}"
        
        # Mostrar preview do sitemap
        echo -e "${BLUE}📄 Preview do sitemap atualizado:${NC}"
        curl -s http://localhost:3001/api/sitemap.xml | head -50
        echo "..."
        echo ""
        
        # Testar sitemap externo
        echo -e "${BLUE}🌐 Testando sitemap externo...${NC}"
        EXTERNAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://skinaecopecas.com.br/sitemap.xml)
        if [ "$EXTERNAL_TEST" = "200" ]; then
            echo -e "${GREEN}✅ Sitemap externo funcionando (HTTP $EXTERNAL_TEST)${NC}"
            
            # Verificar content-type
            CONTENT_TYPE=$(curl -s -I https://skinaecopecas.com.br/sitemap.xml | grep -i content-type)
            echo -e "${BLUE}📋 Content-Type: ${NC}$CONTENT_TYPE"
            
            # Contar URLs no sitemap
            URL_COUNT=$(curl -s https://skinaecopecas.com.br/sitemap.xml | grep -c "<loc>")
            echo -e "${GREEN}📊 Total de URLs no sitemap: $URL_COUNT${NC}"
            
        else
            echo -e "${RED}❌ Erro no sitemap externo (HTTP $EXTERNAL_TEST)${NC}"
        fi
        
    else
        echo -e "${RED}❌ Erro no sitemap local (HTTP $LOCAL_TEST)${NC}"
    fi
    
else
    echo -e "${RED}❌ Servidor Node.js não está online${NC}"
    echo "Execute: pm2 start ecosystem.config.cjs"
fi

echo ""
echo -e "${GREEN}🎯 MELHORIAS IMPLEMENTADAS:${NC}"
echo "1. 🔗 URLs amigáveis: /autopecas/produto/filtro-oleo-motor-xyz"
echo "2. 🏷️  Páginas de marcas: /autopecas/marca/jeep, /autopecas/marca/mopar, etc."
echo "3. 📈 Prioridades SEO otimizadas para melhor indexação"
echo "4. 🎯 Sobre e Contato com prioridades aumentadas"
echo ""
echo -e "${BLUE}📝 PRÓXIMOS PASSOS RECOMENDADOS:${NC}"
echo "1. Verificar se as rotas de marcas existem no frontend"
echo "2. Implementar páginas de marcas se necessário"
echo "3. Submeter sitemap atualizado ao Google Search Console"
echo "4. Monitorar indexação nos próximos dias"
echo ""
echo -e "${GREEN}✅ Atualização do sitemap concluída!${NC}"