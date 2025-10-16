#!/bin/bash

echo "=== CORREÇÃO DO ARQUIVO NGINX CORRETO ==="
echo "Data: $(date)"
echo

# 1. Backup do arquivo correto
echo "1. Fazendo backup do arquivo ativo..."
sudo cp /etc/nginx/sites-available/skinaecopecas.com.br /etc/nginx/sites-available/skinaecopecas.com.br.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup criado!"

# 2. Mostrar configuração atual
echo
echo "2. Configuração atual do arquivo ativo:"
echo "======================================="
sudo cat /etc/nginx/sites-available/skinaecopecas.com.br
echo

# 3. Adicionar configuração sitemap ao arquivo correto
echo "3. Adicionando configuração sitemap ao arquivo correto..."

# Criar nova configuração com sitemap
sudo tee /etc/nginx/sites-available/skinaecopecas.com.br > /dev/null << 'EOF'
server {
    listen 80;
    server_name skinaecopecas.com.br www.skinaecopecas.com.br;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name skinaecopecas.com.br www.skinaecopecas.com.br;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/skinaecopecas.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/skinaecopecas.com.br/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # CONFIGURAÇÃO SITEMAP E ROBOTS - DEVE VIR PRIMEIRO!
    location ~ ^/(sitemap\.xml|robots\.txt)$ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Headers específicos para XML
        proxy_set_header Accept application/xml,text/xml,*/*;
    }
    
    # Proxy para API Mercado Livre
    location /api/mercado_livre/ml-products {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Proxy para todas as outras rotas da API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Root directory para arquivos estáticos React
    root /var/www/productionskina/dist;
    index index.html;
    
    # Servir arquivos estáticos React (DEVE VIR POR ÚLTIMO)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Headers para cache de assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
EOF

echo "✅ Nova configuração aplicada!"

# 4. Testar configuração
echo
echo "4. Testando configuração Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração válida!"
    
    # 5. Recarregar Nginx
    echo
    echo "5. Recarregando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx recarregado!"
    
    # 6. Aguardar um momento
    sleep 3
    
    # 7. Testes finais
    echo
    echo "=== TESTES FINAIS ==="
    echo
    echo "Teste local Node.js (porta 3001):"
    curl -I http://localhost:3001/sitemap.xml
    echo
    echo "Teste local Nginx (porta 80 -> 443):"
    curl -I -H "Host: skinaecopecas.com.br" http://localhost/sitemap.xml
    echo
    echo "Teste externo HTTPS:"
    curl -I https://skinaecopecas.com.br/sitemap.xml
    echo
    echo "Conteúdo do sitemap externo (primeiras 10 linhas):"
    curl -s https://skinaecopecas.com.br/sitemap.xml | head -10
    echo
    echo "Verificar Content-Type do sitemap externo:"
    curl -I https://skinaecopecas.com.br/sitemap.xml | grep -i content-type
    
else
    echo "❌ Erro na configuração Nginx!"
    echo "Restaurando backup..."
    sudo cp /etc/nginx/sites-available/skinaecopecas.com.br.backup-$(date +%Y%m%d-%H%M%S) /etc/nginx/sites-available/skinaecopecas.com.br
    sudo nginx -t
fi

echo
echo "=== CORREÇÃO CONCLUÍDA ==="
echo "Arquivo corrigido: /etc/nginx/sites-available/skinaecopecas.com.br"
echo "Configuração sitemap adicionada ANTES da location / para garantir precedência"