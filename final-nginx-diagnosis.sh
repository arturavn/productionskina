#!/bin/bash

echo "=== DIAGNÓSTICO FINAL NGINX - SITEMAP ==="
echo "Data: $(date)"
echo

# 1. Verificar todas as configurações Nginx ativas
echo "1. CONFIGURAÇÕES NGINX ATIVAS:"
echo "================================"
echo "Arquivo principal nginx.conf:"
sudo nginx -T 2>/dev/null | head -50
echo
echo "Sites habilitados:"
ls -la /etc/nginx/sites-enabled/
echo
echo "Sites disponíveis:"
ls -la /etc/nginx/sites-available/
echo

# 2. Verificar se existe configuração para sitemap
echo "2. BUSCA POR CONFIGURAÇÕES SITEMAP:"
echo "==================================="
echo "Em sites-enabled:"
sudo grep -r "sitemap" /etc/nginx/sites-enabled/ 2>/dev/null || echo "Nenhuma configuração sitemap encontrada em sites-enabled"
echo
echo "Em sites-available:"
sudo grep -r "sitemap" /etc/nginx/sites-available/ 2>/dev/null || echo "Nenhuma configuração sitemap encontrada em sites-available"
echo
echo "Em nginx.conf:"
sudo grep -r "sitemap" /etc/nginx/nginx.conf 2>/dev/null || echo "Nenhuma configuração sitemap encontrada em nginx.conf"
echo

# 3. Verificar configuração do domínio
echo "3. CONFIGURAÇÃO DO DOMÍNIO:"
echo "=========================="
echo "Configuração ativa para skinaecopecas.com.br:"
sudo nginx -T 2>/dev/null | grep -A 20 -B 5 "skinaecopecas.com.br" || echo "Domínio não encontrado na configuração"
echo

# 4. Verificar se PM2 está rodando
echo "4. STATUS PM2:"
echo "============="
pm2 list
echo
echo "Teste local Node.js:"
curl -I http://localhost:3001/sitemap.xml 2>/dev/null || echo "Erro ao conectar com Node.js local"
echo

# 5. Verificar logs de erro Nginx
echo "5. LOGS DE ERRO NGINX (últimas 10 linhas):"
echo "=========================================="
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "Arquivo de log não encontrado"
echo

# 6. Teste de configuração Nginx
echo "6. TESTE CONFIGURAÇÃO NGINX:"
echo "============================"
sudo nginx -t
echo

echo "=== APLICANDO CORREÇÃO ==="
echo

# 7. Backup da configuração atual
echo "7. Fazendo backup da configuração atual..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup-$(date +%Y%m%d-%H%M%S)

# 8. Criar configuração limpa e funcional
echo "8. Criando configuração Nginx limpa..."
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name skinaecopecas.com.br www.skinaecopecas.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name skinaecopecas.com.br www.skinaecopecas.com.br;

    # SSL configuration (certificados devem estar configurados)
    # ssl_certificate /path/to/certificate;
    # ssl_certificate_key /path/to/private/key;

    # Proxy para sitemap e robots - DEVE VIR ANTES da location /
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
        
        # Headers específicos para XML
        proxy_set_header Accept application/xml,text/xml,*/*;
        add_header Content-Type application/xml;
    }

    # Proxy para API - rotas que começam com /api
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
    }

    # Servir arquivos estáticos do React (DEVE VIR POR ÚLTIMO)
    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Headers para cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
EOF

# 9. Testar nova configuração
echo "9. Testando nova configuração..."
if sudo nginx -t; then
    echo "✅ Configuração válida!"
    
    # 10. Recarregar Nginx
    echo "10. Recarregando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx recarregado!"
    
    # 11. Aguardar um momento
    sleep 2
    
    # 12. Testes finais
    echo
    echo "=== TESTES FINAIS ==="
    echo
    echo "Teste local Node.js:"
    curl -I http://localhost:3001/sitemap.xml
    echo
    echo "Teste local Nginx:"
    curl -I -H "Host: skinaecopecas.com.br" http://localhost/sitemap.xml
    echo
    echo "Teste externo (aguarde...):"
    curl -I https://skinaecopecas.com.br/sitemap.xml
    echo
    echo "Conteúdo do sitemap externo (primeiras 5 linhas):"
    curl -s https://skinaecopecas.com.br/sitemap.xml | head -5
    
else
    echo "❌ Erro na configuração Nginx!"
    echo "Restaurando backup..."
    sudo cp /etc/nginx/sites-available/default.backup-$(date +%Y%m%d-%H%M%S) /etc/nginx/sites-available/default
fi

echo
echo "=== DIAGNÓSTICO CONCLUÍDO ==="