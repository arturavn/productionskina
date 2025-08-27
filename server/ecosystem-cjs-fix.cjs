#!/usr/bin/env node

// Script para corrigir o problema ES modules vs CommonJS no ecosystem.config.js
// Este script resolve o erro: require() of ES Module not supported

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🔧 ECOSYSTEM CJS FIX - Corrigindo problema ES modules vs CommonJS');
console.log('=' .repeat(70));

const projectRoot = path.join(__dirname, '..');
const ecosystemPath = path.join(projectRoot, 'ecosystem.config.js');
const ecosystemCjsPath = path.join(projectRoot, 'ecosystem.config.cjs');

try {
  // 1. Verificar arquivos .env
  console.log('\n📂 VERIFICANDO ARQUIVOS:');
  const envFiles = [
    path.join(projectRoot, '.env'),
    path.join(__dirname, '.env')
  ];
  
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(` ✅ ${file} - EXISTE`);
    } else {
      console.log(` ❌ ${file} - NÃO EXISTE`);
    }
  });

  // 2. Carregar variáveis de ambiente
  console.log('\n🔑 CARREGANDO VARIÁVEIS DE AMBIENTE:');
  const dbVars = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_NAME: process.env.DB_NAME || 'skina_ecopecas',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_PORT: process.env.DB_PORT || '5432',
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '3001'
  };

  Object.entries(dbVars).forEach(([key, value]) => {
    const displayValue = key === 'DB_PASSWORD' ? value.substring(0, 3) + '***' : value;
    console.log(` ✅ ${key}=${displayValue}`);
  });

  // 3. Remover ecosystem.config.js se existir
  if (fs.existsSync(ecosystemPath)) {
    console.log('\n🗑️  REMOVENDO ECOSYSTEM.CONFIG.JS:');
    fs.unlinkSync(ecosystemPath);
    console.log(' ✅ ecosystem.config.js removido');
  }

  // 4. Criar ecosystem.config.cjs (formato CommonJS)
  console.log('\n🔨 CRIANDO ECOSYSTEM.CONFIG.CJS:');
  const ecosystemContent = `// PM2 Ecosystem Configuration (CommonJS format)
// Este arquivo resolve o problema ES modules vs CommonJS

module.exports = {
  apps: [{
    name: 'skina-backend',
    script: './server/server.js',
    cwd: '${projectRoot}',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: '${dbVars.NODE_ENV}',
      PORT: '${dbVars.PORT}',
      DB_HOST: '${dbVars.DB_HOST}',
      DB_USER: '${dbVars.DB_USER}',
      DB_NAME: '${dbVars.DB_NAME}',
      DB_PASSWORD: '${dbVars.DB_PASSWORD}',
      DB_PORT: '${dbVars.DB_PORT}'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};`;

  fs.writeFileSync(ecosystemCjsPath, ecosystemContent);
  console.log(` ✅ ecosystem.config.cjs criado com ${Object.keys(dbVars).length} variáveis hardcoded`);

  // 5. Parar PM2
  console.log('\n🛑 PARANDO PM2:');
  try {
    const stopResult = execSync('pm2 stop all', { encoding: 'utf8' });
    console.log(stopResult);
    console.log(' ✅ PM2 parado com sucesso');
  } catch (error) {
    console.log(' ⚠️  PM2 já estava parado ou erro:', error.message);
  }

  // 6. Deletar processos PM2
  console.log('\n🗑️  DELETANDO PROCESSOS PM2:');
  try {
    const deleteResult = execSync('pm2 delete all', { encoding: 'utf8' });
    console.log(deleteResult);
    console.log(' ✅ Processos PM2 deletados');
  } catch (error) {
    console.log(' ⚠️  Nenhum processo para deletar ou erro:', error.message);
  }

  // 7. Criar diretório de logs
  const logsDir = path.join(projectRoot, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('\n📁 Diretório logs criado');
  }

  // 8. Iniciar com ecosystem.config.cjs
  console.log('\n🚀 INICIANDO COM ECOSYSTEM.CONFIG.CJS:');
  try {
    const startResult = execSync(`pm2 start ${ecosystemCjsPath}`, { encoding: 'utf8' });
    console.log(startResult);
    console.log(' ✅ PM2 iniciado com sucesso usando .cjs');
  } catch (error) {
    console.log(' ❌ Erro ao iniciar PM2:', error.message);
    throw error;
  }

  // 9. Verificar status
  console.log('\n📊 STATUS PM2:');
  try {
    const statusResult = execSync('pm2 status', { encoding: 'utf8' });
    console.log(statusResult);
  } catch (error) {
    console.log(' ❌ Erro ao verificar status:', error.message);
  }

  // 10. Verificar logs
  console.log('\n📋 LOGS PM2 (últimas 10 linhas):');
  try {
    const logsResult = execSync('pm2 logs --lines 10', { encoding: 'utf8' });
    console.log(logsResult);
  } catch (error) {
    console.log(' ❌ Erro ao verificar logs:', error.message);
  }

  // 11. Teste de endpoint
  console.log('\n🧪 TESTANDO ENDPOINT:');
  setTimeout(() => {
    try {
      const testResult = execSync('curl -s http://localhost:3001/api/test', { encoding: 'utf8' });
      console.log(' ✅ Resposta do endpoint:', testResult);
    } catch (error) {
      console.log(' ❌ Erro no teste de endpoint:', error.message);
    }
  }, 3000);

  console.log('\n🎉 ECOSYSTEM CJS FIX CONCLUÍDO!');
  console.log('✅ Arquivo ecosystem.config.cjs criado em formato CommonJS');
  console.log('✅ PM2 reiniciado com nova configuração');
  console.log('✅ Variáveis de ambiente hardcoded no arquivo');
  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se o processo está online: pm2 status');
  console.log('2. Monitorar logs: pm2 logs');
  console.log('3. Testar endpoint: curl http://localhost:3001/api/test');

} catch (error) {
  console.error('\n❌ ERRO CRÍTICO:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}