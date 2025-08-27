#!/usr/bin/env node

/**
 * ECOSYSTEM FIX - Correção definitiva do ecosystem.config.js
 * 
 * Este script modifica o ecosystem.config.js para forçar o carregamento
 * correto das variáveis de ambiente no PM2
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const PROJECT_ROOT = '/var/www/productionskina';
const SERVER_DIR = path.join(PROJECT_ROOT, 'server');
const ECOSYSTEM_FILE = path.join(PROJECT_ROOT, 'ecosystem.config.js');

console.log('🔧 ECOSYSTEM FIX - Correção definitiva do PM2');
console.log('=' .repeat(60));

// 1. Verificar arquivos existentes
console.log('\n📂 VERIFICANDO ARQUIVOS:');
const envFiles = [
  path.join(PROJECT_ROOT, '.env'),
  path.join(SERVER_DIR, '.env')
];

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - EXISTE`);
  } else {
    console.log(`❌ ${file} - NÃO EXISTE`);
  }
});

// 2. Carregar variáveis de ambiente
console.log('\n🔑 CARREGANDO VARIÁVEIS DE AMBIENTE:');
const envVars = {};

// Carregar do server/.env primeiro
if (fs.existsSync(path.join(SERVER_DIR, '.env'))) {
  const serverEnv = dotenv.parse(fs.readFileSync(path.join(SERVER_DIR, '.env')));
  Object.assign(envVars, serverEnv);
  console.log(`📋 Carregadas ${Object.keys(serverEnv).length} variáveis de server/.env`);
}

// Carregar da raiz (sobrescreve se existir)
if (fs.existsSync(path.join(PROJECT_ROOT, '.env'))) {
  const rootEnv = dotenv.parse(fs.readFileSync(path.join(PROJECT_ROOT, '.env')));
  Object.assign(envVars, rootEnv);
  console.log(`📋 Carregadas ${Object.keys(rootEnv).length} variáveis de .env raiz`);
}

// Mostrar variáveis críticas
const criticalVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT', 'NODE_ENV', 'PORT'];
criticalVars.forEach(key => {
  const value = envVars[key];
  if (value) {
    const maskedValue = key.includes('PASSWORD') ? value.substring(0, 3) + '***' : value;
    console.log(`✅ ${key}=${maskedValue}`);
  } else {
    console.log(`❌ ${key}=undefined`);
  }
});

// 3. Backup do ecosystem.config.js atual
console.log('\n💾 FAZENDO BACKUP:');
if (fs.existsSync(ECOSYSTEM_FILE)) {
  const backupFile = `${ECOSYSTEM_FILE}.backup.${Date.now()}`;
  fs.copyFileSync(ECOSYSTEM_FILE, backupFile);
  console.log(`✅ Backup criado: ${backupFile}`);
} else {
  console.log('⚠️  ecosystem.config.js não existe, será criado');
}

// 4. Criar novo ecosystem.config.js
console.log('\n🔨 CRIANDO NOVO ECOSYSTEM.CONFIG.JS:');

const ecosystemConfig = `module.exports = {
  apps: [{
    name: 'skina-backend',
    script: './server.js',
    cwd: '${SERVER_DIR}',
    instances: 1,
    exec_mode: 'fork',
    node_args: '--max-old-space-size=2048',
    env: {
      NODE_ENV: '${envVars.NODE_ENV || 'production'}',
      PORT: '${envVars.PORT || '3001'}',
      DB_HOST: '${envVars.DB_HOST || 'localhost'}',
      DB_PORT: '${envVars.DB_PORT || '5432'}',
      DB_NAME: '${envVars.DB_NAME || 'skina_ecopecas'}',
      DB_USER: '${envVars.DB_USER || 'postgres'}',
      DB_PASSWORD: '${envVars.DB_PASSWORD || 'skinalogindb'}',
      JWT_SECRET: '${envVars.JWT_SECRET || 'your-secret-key'}',
      MERCADOPAGO_ACCESS_TOKEN: '${envVars.MERCADOPAGO_ACCESS_TOKEN || ''}',
      MERCADOPAGO_PUBLIC_KEY: '${envVars.MERCADOPAGO_PUBLIC_KEY || ''}',
      MERCADOLIVRE_CLIENT_ID: '${envVars.MERCADOLIVRE_CLIENT_ID || ''}',
      MERCADOLIVRE_CLIENT_SECRET: '${envVars.MERCADOLIVRE_CLIENT_SECRET || ''}',
      MERCADOLIVRE_REDIRECT_URI: '${envVars.MERCADOLIVRE_REDIRECT_URI || ''}',
      MELHOR_ENVIO_TOKEN: '${envVars.MELHOR_ENVIO_TOKEN || ''}',
      MELHOR_ENVIO_SANDBOX: '${envVars.MELHOR_ENVIO_SANDBOX || 'true'}',
      EMAIL_HOST: '${envVars.EMAIL_HOST || ''}',
      EMAIL_PORT: '${envVars.EMAIL_PORT || '587'}',
      EMAIL_USER: '${envVars.EMAIL_USER || ''}',
      EMAIL_PASS: '${envVars.EMAIL_PASS || ''}',
      FRONTEND_URL: '${envVars.FRONTEND_URL || 'https://skinaecopecas.com.br'}',
      BACKEND_URL: '${envVars.BACKEND_URL || 'https://skinaecopecas.com.br/api'}'
    },
    error_file: '/root/.pm2/logs/skina-backend-error.log',
    out_file: '/root/.pm2/logs/skina-backend-out.log',
    log_file: '/root/.pm2/logs/skina-backend-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};`;

fs.writeFileSync(ECOSYSTEM_FILE, ecosystemConfig);
console.log(`✅ Novo ecosystem.config.js criado com ${criticalVars.length} variáveis hardcoded`);

// 5. Parar PM2
console.log('\n🛑 PARANDO PM2:');
try {
  execSync('pm2 stop all', { stdio: 'inherit' });
  console.log('✅ PM2 parado com sucesso');
} catch (error) {
  console.log('⚠️  Erro ao parar PM2 (pode não estar rodando):', error.message);
}

// 6. Deletar processos PM2
console.log('\n🗑️  DELETANDO PROCESSOS PM2:');
try {
  execSync('pm2 delete all', { stdio: 'inherit' });
  console.log('✅ Processos PM2 deletados');
} catch (error) {
  console.log('⚠️  Erro ao deletar processos PM2:', error.message);
}

// 7. Iniciar com novo ecosystem
console.log('\n🚀 INICIANDO COM NOVO ECOSYSTEM:');
try {
  execSync(`pm2 start ${ECOSYSTEM_FILE}`, { stdio: 'inherit', cwd: PROJECT_ROOT });
  console.log('✅ PM2 iniciado com novo ecosystem.config.js');
} catch (error) {
  console.error('❌ Erro ao iniciar PM2:', error.message);
  process.exit(1);
}

// 8. Verificar status
console.log('\n📊 STATUS DO PM2:');
try {
  execSync('pm2 status', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Erro ao verificar status:', error.message);
}

// 9. Mostrar logs recentes
console.log('\n📋 LOGS RECENTES:');
try {
  execSync('pm2 logs --lines 10', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Erro ao mostrar logs:', error.message);
}

// 10. Testar endpoint
console.log('\n🧪 TESTANDO ENDPOINT:');
setTimeout(() => {
  try {
    const testResult = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/test', { encoding: 'utf8' });
    if (testResult.trim() === '200') {
      console.log('✅ Endpoint /api/test respondendo com HTTP 200');
    } else {
      console.log(`⚠️  Endpoint respondeu com HTTP ${testResult.trim()}`);
    }
  } catch (error) {
    console.log('❌ Erro ao testar endpoint:', error.message);
  }
  
  console.log('\n🎉 ECOSYSTEM FIX CONCLUÍDO!');
  console.log('=' .repeat(60));
  console.log('✅ ecosystem.config.js recriado com variáveis hardcoded');
  console.log('✅ PM2 reiniciado com nova configuração');
  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se o erro PostgreSQL foi resolvido nos logs');
  console.log('2. Testar as funcionalidades do Mercado Livre');
  console.log('3. Monitorar logs: pm2 logs skina-backend');
}, 5000);