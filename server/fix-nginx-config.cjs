const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 CORREÇÃO DA CONFIGURAÇÃO DO NGINX');
console.log('==================================');
console.log();

function executeCommand(command, description) {
  try {
    console.log(`🔧 ${description}`);
    console.log(`Comando: ${command}`);
    const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
    console.log(`✅ Saída: ${output.trim()}`);
    return output.trim();
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return null;
  }
}

function checkNginxConfig() {
  console.log('\n============================');
  console.log('1️⃣  VERIFICANDO CONFIGURAÇÃO DO NGINX');
  console.log('============================\n');
  
  // Verificar se o Nginx está rodando
  executeCommand('systemctl status nginx', 'Status do Nginx');
  
  // Verificar configuração do site
  const siteConfig = '/etc/nginx/sites-available/skinaecopecas.com.br';
  const siteEnabled = '/etc/nginx/sites-enabled/skinaecopecas.com.br';
  
  console.log(`\n🔍 Verificando arquivo de configuração: ${siteConfig}`);
  try {
    if (fs.existsSync(siteConfig)) {
      const config = fs.readFileSync(siteConfig, 'utf8');
      console.log('✅ Arquivo de configuração encontrado:');
      console.log('📄 Conteúdo atual:');
      console.log(config.substring(0, 800) + '...');
      
      // Verificar se tem proxy_pass para /api (com ou sem barra final)
       const hasApiLocation = config.includes('location /api/') || config.includes('location /api ');
       const hasCorrectProxy = config.includes('proxy_pass http://localhost:3001') || config.includes('proxy_pass http://127.0.0.1:3001');
       
       if (hasApiLocation && hasCorrectProxy) {
         console.log('✅ Configuração de proxy para /api encontrada e correta');
         console.log('✅ Nginx já está configurado corretamente!');
       } else {
         console.log('❌ Configuração de proxy para /api NÃO encontrada ou incorreta');
         console.log('🔧 Criando configuração correta...');
         createNginxConfig();
       }
      
      // Verificar se está habilitado
      if (fs.existsSync(siteEnabled)) {
        console.log('✅ Site está habilitado no Nginx');
      } else {
        console.log('❌ Site NÃO está habilitado no Nginx');
        console.log('💡 Executando: ln -s /etc/nginx/sites-available/skinaecopecas.com.br /etc/nginx/sites-enabled/');
        executeCommand('ln -s /etc/nginx/sites-available/skinaecopecas.com.br /etc/nginx/sites-enabled/', 'Habilitando site');
      }
    } else {
      console.log('❌ Arquivo de configuração não encontrado!');
      console.log('💡 Criando configuração padrão...');
      createNginxConfig();
    }
  } catch (error) {
    console.log(`❌ Erro ao ler configuração: ${error.message}`);
  }
}

function createNginxConfig() {
  console.log('\n🔧 Criando configuração do Nginx...');
  
  const config = `server {
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
    
    # Root directory
    root /var/www/productionskina/dist;
    index index.html;
    
    # API proxy - Configuração correta para rotas /api/*
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Handle specific file types
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}`;
  
  try {
    // Fazer backup da configuração atual
    if (fs.existsSync('/etc/nginx/sites-available/skinaecopecas.com.br')) {
      const backup = `/etc/nginx/sites-available/skinaecopecas.com.br.backup.${Date.now()}`;
      fs.copyFileSync('/etc/nginx/sites-available/skinaecopecas.com.br', backup);
      console.log(`📋 Backup criado: ${backup}`);
    }
    
    fs.writeFileSync('/etc/nginx/sites-available/skinaecopecas.com.br', config);
    console.log('✅ Configuração do Nginx criada');
    
    // Habilitar o site
    executeCommand('ln -s /etc/nginx/sites-available/skinaecopecas.com.br /etc/nginx/sites-enabled/', 'Habilitando site');
  } catch (error) {
    console.log(`❌ Erro ao criar configuração: ${error.message}`);
    console.log('\n📋 Configuração que deveria ser aplicada:');
    console.log(config);
    console.log('\n🔧 Execute manualmente:');
    console.log('sudo nano /etc/nginx/sites-available/skinaecopecas.com.br');
    console.log('Cole a configuração acima e salve o arquivo.');
  }
}

function testNginxConfig() {
  console.log('\n============================');
  console.log('2️⃣  TESTANDO CONFIGURAÇÃO DO NGINX');
  console.log('============================\n');
  
  executeCommand('nginx -t', 'Testando configuração do Nginx');
}

function checkBackendConnection() {
  console.log('\n============================');
  console.log('3️⃣  TESTANDO CONEXÃO COM BACKEND');
  console.log('============================\n');
  
  // Testar conexão direta com o backend
  executeCommand('curl -I http://127.0.0.1:3001/api/test', 'Testando conexão direta com backend');
  
  // Verificar se a porta 3001 está aberta
  executeCommand('netstat -tlnp | grep :3001', 'Verificando porta 3001');
  
  // Testar através do Nginx
  executeCommand('curl -I http://127.0.0.1/api/test', 'Testando através do Nginx (porta 80)');
}

function restartServices() {
  console.log('\n============================');
  console.log('4️⃣  REINICIANDO SERVIÇOS');
  console.log('============================\n');
  
  executeCommand('systemctl reload nginx', 'Recarregando Nginx');
  executeCommand('systemctl status nginx', 'Verificando status do Nginx');
}

function showNextSteps() {
  console.log('\n============================');
  console.log('📋 PRÓXIMOS PASSOS');
  console.log('============================\n');
  
  console.log('1. Verificar se o SSL está configurado corretamente:');
  console.log('   sudo certbot --nginx -d skinaecopecas.com.br -d www.skinaecopecas.com.br');
  console.log();
  console.log('2. Testar o site:');
  console.log('   curl -I https://skinaecopecas.com.br/api/test');
  console.log();
  console.log('3. Verificar logs em caso de erro:');
  console.log('   sudo tail -f /var/log/nginx/error.log');
  console.log('   sudo tail -f /var/log/nginx/access.log');
  console.log();
  console.log('4. Se ainda houver problemas, verificar firewall:');
  console.log('   sudo ufw status');
  console.log('   sudo ufw allow "Nginx Full"');
}

// Executar diagnóstico
async function main() {
  try {
    checkNginxConfig();
    testNginxConfig();
    checkBackendConnection();
    restartServices();
    showNextSteps();
    
    console.log('\n✅ Diagnóstico e correção do Nginx concluídos!');
  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
  }
}

main();