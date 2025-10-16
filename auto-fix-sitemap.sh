#!/bin/bash

echo "🔧 CORREÇÃO AUTOMÁTICA DO SITEMAP"
echo "================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar e reiniciar PM2
echo -e "${BLUE}1. Verificando status do PM2...${NC}"
pm2 status productionskina
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}PM2 não encontrado, tentando iniciar...${NC}"
    pm2 start ecosystem.config.cjs
else
    echo -e "${YELLOW}Reiniciando PM2...${NC}"
    pm2 restart productionskina
fi

# 2. Remover arquivos sitemap.xml estáticos conflitantes
echo -e "${BLUE}2. Removendo arquivos sitemap.xml estáticos...${NC}"
find /var/www/productionskina/dist/ -name "sitemap.xml" -delete 2>/dev/null
find /var/www/productionskina/public/ -name "sitemap.xml" -delete 2>/dev/null
find /var/www/html/ -name "sitemap.xml" -delete 2>/dev/null
echo -e "${GREEN}Arquivos estáticos removidos${NC}"

# 3. Backup da configuração do Nginx
echo -e "${BLUE}3. Fazendo backup da configuração do Nginx...${NC}"
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup-$(date +%Y%m%d-%H%M%S)

# 4. Adicionar configuração de proxy para sitemap no Nginx
echo -e "${BLUE}4. Adicionando configuração de proxy no Nginx...${NC}"
sudo tee -a /etc/nginx/sites-available/default > /dev/null << 'EOF'

    # Sitemap e Robots.txt - Proxy para Node.js
    location ~ ^/(sitemap\.xml|robots\.txt)$ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Headers específicos para SEO
        add_header Cache-Control "public, max-age=3600";
        add_header X-Robots-Tag "index, follow";
    }
EOF

# 5. Testar configuração do Nginx
echo -e "${BLUE}5. Testando configuração do Nginx...${NC}"
sudo nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Configuração do Nginx válida${NC}"
    
    # 6. Recarregar Nginx
    echo -e "${BLUE}6. Recarregando Nginx...${NC}"
    sudo systemctl reload nginx
    echo -e "${GREEN}Nginx recarregado com sucesso${NC}"
else
    echo -e "${RED}Erro na configuração do Nginx! Restaurando backup...${NC}"
    sudo cp /etc/nginx/sites-available/default.backup-$(date +%Y%m%d-%H%M%S) /etc/nginx/sites-available/default
    sudo systemctl reload nginx
    exit 1
fi

# 7. Aguardar um momento para estabilizar
echo -e "${BLUE}7. Aguardando estabilização...${NC}"
sleep 5

# 8. Testar sitemap localmente
echo -e "${BLUE}8. Testando sitemap localmente...${NC}"
LOCAL_TEST=$(curl -s -I http://localhost:3001/sitemap.xml | head -n 1)
echo "Teste local: $LOCAL_TEST"

# 9. Testar sitemap externamente
echo -e "${BLUE}9. Testando sitemap externamente...${NC}"
EXTERNAL_TEST=$(curl -s -I https://skinaecopecas.com.br/sitemap.xml | head -n 2)
echo "Teste externo:"
echo "$EXTERNAL_TEST"

# 10. Verificar content-type
echo -e "${BLUE}10. Verificando content-type...${NC}"
CONTENT_TYPE=$(curl -s -I https://skinaecopecas.com.br/sitemap.xml | grep -i "content-type")
echo "Content-Type: $CONTENT_TYPE"

if [[ "$CONTENT_TYPE" == *"application/xml"* ]]; then
    echo -e "${GREEN}✅ SUCESSO! Sitemap funcionando corretamente!${NC}"
    echo -e "${GREEN}✅ Content-Type: application/xml${NC}"
else
    echo -e "${RED}❌ PROBLEMA: Content-Type ainda não é XML${NC}"
    echo -e "${YELLOW}Verifique os logs do PM2: pm2 logs productionskina${NC}"
fi

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}CORREÇÃO AUTOMÁTICA CONCLUÍDA${NC}"
echo -e "${BLUE}=================================${NC}"