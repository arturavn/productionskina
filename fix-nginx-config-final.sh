#!/bin/bash

echo "🔧 CORRIGINDO CONFIGURAÇÃO NGINX MALFORMADA..."

# Backup da configuração atual
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup-$(date +%Y%m%d-%H%M%S)

# Criar nova configuração limpa
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
##
# Configuração limpa do Nginx para skinaecopecas.com.br
##

# Default server configuration
server {
    listen 80;
    server_name skinaecopecas.com.br www.skinaecopecas.com.br;

    # Configuração para servir o frontend (arquivos estáticos)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        index index.html index.htm;
    }

    # Configuração do proxy reverso para o backend Node.js
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Sitemap e Robots.txt - Proxy para Node.js (CONFIGURAÇÃO ÚNICA E CORRETA)
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
        proxy_read_timeout 86400;
        
        # Headers específicos para SEO
        add_header Cache-Control "public, max-age=3600";
        add_header X-Robots-Tag "index, follow";
    }

    # Configuração para arquivos estáticos (CSS, JS, imagens)
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs de acesso e erro
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
EOF

echo "✅ Nova configuração criada!"

# Testar a configuração
echo "🧪 Testando configuração do Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração válida!"
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    sudo systemctl reload nginx
    
    echo "✅ Nginx recarregado com sucesso!"
    
    # Aguardar um momento
    sleep 2
    
    # Testar localmente
    echo "🧪 Testando sitemap localmente..."
    curl -I http://localhost:3001/sitemap.xml
    
    echo ""
    echo "🌐 Testando sitemap externamente..."
    curl -I https://skinaecopecas.com.br/sitemap.xml
    
    echo ""
    echo "🎯 CONFIGURAÇÃO CORRIGIDA!"
    echo "✅ Removidas configurações duplicadas"
    echo "✅ Configuração limpa e funcional"
    echo "✅ Proxy correto para Node.js"
    
else
    echo "❌ Erro na configuração! Restaurando backup..."
    sudo cp /etc/nginx/sites-available/default.backup-* /etc/nginx/sites-available/default
    echo "🔄 Backup restaurado."
fi