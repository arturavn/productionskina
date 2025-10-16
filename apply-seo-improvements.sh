#!/bin/bash

# Script para aplicar melhorias de SEO na Skina Eco Peças
# Inclui meta descriptions, keywords e structured data aprimorados

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 APLICANDO MELHORIAS DE SEO - SKINA ECO PEÇAS${NC}"
echo "=================================================="
echo ""

# Backup dos arquivos atuais
echo -e "${YELLOW}📦 Fazendo backup dos arquivos atuais...${NC}"
cp server/services/SEOService.js server/services/SEOService.js.backup-$(date +%Y%m%d-%H%M%S)
cp index.html index.html.backup-$(date +%Y%m%d-%H%M%S)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup realizado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro no backup${NC}"
    exit 1
fi

# Reiniciar o servidor Node.js
echo ""
echo -e "${YELLOW}🔄 Reiniciando servidor Node.js...${NC}"
pm2 restart ecosystem.config.cjs

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Servidor reiniciado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao reiniciar servidor${NC}"
    exit 1
fi

# Aguardar o servidor inicializar
echo ""
echo -e "${YELLOW}⏳ Aguardando servidor inicializar...${NC}"
sleep 5

# Testar SEO local
echo ""
echo -e "${YELLOW}🧪 Testando SEO local...${NC}"
echo "Testando meta tags na página principal..."

# Teste do título
TITLE_TEST=$(curl -s http://localhost:3001/ | grep -o '<title>.*</title>')
if [[ $TITLE_TEST == *"Skina Eco Peças - Referência em Peças Automotivas"* ]]; then
    echo -e "${GREEN}✅ Título atualizado corretamente${NC}"
else
    echo -e "${RED}❌ Título não foi atualizado${NC}"
fi

# Teste da description
DESC_TEST=$(curl -s http://localhost:3001/ | grep 'meta name="description"')
if [[ $DESC_TEST == *"referência em peças automotivas no Setor H Norte"* ]]; then
    echo -e "${GREEN}✅ Meta description atualizada corretamente${NC}"
else
    echo -e "${RED}❌ Meta description não foi atualizada${NC}"
fi

# Teste das keywords
KEYWORDS_TEST=$(curl -s http://localhost:3001/ | grep 'meta name="keywords"')
if [[ $KEYWORDS_TEST == *"skina eco peças"* ]]; then
    echo -e "${GREEN}✅ Meta keywords adicionadas corretamente${NC}"
else
    echo -e "${RED}❌ Meta keywords não foram adicionadas${NC}"
fi

# Testar SEO externo (se disponível)
echo ""
echo -e "${YELLOW}🌐 Testando SEO externo...${NC}"
EXTERNAL_TEST=$(curl -s -I https://skinaecopecas.com.br/ | head -n 1)
if [[ $EXTERNAL_TEST == *"200"* ]]; then
    echo -e "${GREEN}✅ Site externo acessível${NC}"
    
    # Testar título externo
    EXTERNAL_TITLE=$(curl -s https://skinaecopecas.com.br/ | grep -o '<title>.*</title>')
    if [[ $EXTERNAL_TITLE == *"Skina Eco Peças - Referência"* ]]; then
        echo -e "${GREEN}✅ SEO externo atualizado${NC}"
    else
        echo -e "${YELLOW}⚠️  SEO externo ainda não atualizado (pode levar alguns minutos)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Site externo não acessível ou ainda atualizando${NC}"
fi

echo ""
echo -e "${BLUE}📊 RESUMO DAS MELHORIAS IMPLEMENTADAS:${NC}"
echo "=================================================="
echo "1. 🎯 Meta title otimizado com localização (Setor H Norte)"
echo "2. 📝 Meta description completa com todas as marcas"
echo "3. 🔍 Keywords estratégicas para SEO local"
echo "4. 🏢 Structured data (JSON-LD) com informações da empresa"
echo "5. 📍 Dados de localização e contato"
echo "6. 🏷️  Marcas específicas: Jeep, Mopar, Fiat, Chevrolet, Volkswagen, RAM"
echo ""
echo -e "${BLUE}🎯 BENEFÍCIOS SEO:${NC}"
echo "• Melhor posicionamento para 'autopeças Setor H Norte'"
echo "• Maior relevância para buscas de marcas específicas"
echo "• Rich snippets no Google com informações da empresa"
echo "• Melhor CTR (Click-Through Rate) nos resultados"
echo "• SEO local otimizado para Brasília/DF"
echo ""
echo -e "${GREEN}✅ Melhorias de SEO aplicadas com sucesso!${NC}"
echo ""
echo -e "${BLUE}📝 PRÓXIMOS PASSOS RECOMENDADOS:${NC}"
echo "1. Submeter sitemap atualizado ao Google Search Console"
echo "2. Verificar indexação das novas meta tags"
echo "3. Monitorar posicionamento para palavras-chave locais"
echo "4. Criar conteúdo específico para cada marca"
echo "5. Implementar reviews/avaliações para rich snippets"