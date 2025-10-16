#!/bin/bash

echo "🔧 Corrigindo configuração do Nginx para Sitemap..."
echo "=================================================="

# Fazer backup da configuração atual
echo "💾 Fazendo backup da configuração do Nginx..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)

# Verificar se existe arquivo sitemap.xml estático
echo "🔍 Verificando arquivos estáticos..."
if [ -f "/var/www/productionskina/dist/sitemap.xml" ]; then
    echo "❌ Encontrado sitemap.xml estático em dist/ - removendo..."
    sudo rm /var/www/productionskina/dist/sitemap.xml
fi

if [ -f "/var/www/productionskina/public/sitemap.xml" ]; then
    echo "❌ Encontrado sitemap.xml estático em public/ - removendo..."
    sudo rm /var/www/productionskina/public/sitemap.xml
fi

if [ -f "/var/www/html/sitemap.xml" ]; then
    echo "❌ Encontrado sitemap.xml estático em /var/www/html/ - removendo..."
    sudo rm /var/www/html/sitemap.xml
fi

# Mostrar configuração atual do Nginx
echo "📋 Configuração atual do Nginx:"
echo "================================"
sudo cat /etc/nginx/sites-available/default

echo ""
echo "🔧 Adicionando configuração para sitemap e robots..."

# Criar arquivo temporário com a configuração
cat > /tmp/nginx_sitemap_config << 'EOF'

    # Configurações específicas para SEO
    location /sitemap.xml {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /robots.txt {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

EOF

# Verificar se as configurações já existem
if grep -q "location /sitemap.xml" /etc/nginx/sites-available/default; then
    echo "⚠️  Configuração do sitemap já existe no Nginx"
else
    echo "➕ Adicionando configuração do sitemap ao Nginx..."
    
    # Adicionar as configurações antes da última chave de fechamento
    sudo sed -i '/^}$/i\
    # Configurações específicas para SEO\
    location /sitemap.xml {\
        proxy_pass http://localhost:3001;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '\''upgrade'\'';\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_cache_bypass $http_upgrade;\
        proxy_read_timeout 86400;\
    }\
\
    location /robots.txt {\
        proxy_pass http://localhost:3001;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_read_timeout 86400;\
    }' /etc/nginx/sites-available/default
fi

# Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração do Nginx válida!"
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    sudo systemctl reload nginx
    
    # Aguardar um pouco
    echo "⏳ Aguardando 3 segundos..."
    sleep 3
    
    # Testar sitemap
    echo "🧪 Testando sitemap..."
    curl -I https://skinaecopecas.com.br/sitemap.xml
    
    echo ""
    echo "🧪 Testando conteúdo do sitemap..."
    curl -s https://skinaecopecas.com.br/sitemap.xml | head -10
    
else
    echo "❌ Erro na configuração do Nginx!"
    echo "🔄 Restaurando backup..."
    sudo cp /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/sites-available/default
fi

# Limpar arquivo temporário
rm -f /tmp/nginx_sitemap_config

echo ""
echo "✅ Script concluído!"
echo "🌐 Teste o sitemap em: https://skinaecopecas.com.br/sitemap.xml"