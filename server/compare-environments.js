#!/usr/bin/env node

/**
 * Script para comparar ambiente local vs VPS
 * Identifica diferenças que podem causar problemas de funcionamento
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 COMPARAÇÃO DE AMBIENTES: LOCAL vs VPS\n');
console.log('=' .repeat(60));

// 1. ANÁLISE DE ARQUIVOS .env
console.log('\n📁 ANÁLISE DE ARQUIVOS .env:');
console.log('-'.repeat(40));

const envFiles = [
  { name: 'Root .env', path: path.join(__dirname, '../.env') },
  { name: 'Server .env', path: path.join(__dirname, '.env') },
  { name: 'Server .env.example', path: path.join(__dirname, '.env.example') }
];

envFiles.forEach(envFile => {
  console.log(`\n${envFile.name}:`);
  if (fs.existsSync(envFile.path)) {
    const content = fs.readFileSync(envFile.path, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log(`  ✅ Existe (${lines.length} variáveis)`);
    
    // Mostrar variáveis (sem valores sensíveis)
    lines.forEach(line => {
      const [key] = line.split('=');
      if (key) {
        console.log(`    - ${key}`);
      }
    });
  } else {
    console.log('  ❌ Não existe');
  }
});

// 2. CARREGAMENTO DE VARIÁVEIS DE AMBIENTE
console.log('\n\n🔧 CARREGAMENTO DE VARIÁVEIS:');
console.log('-'.repeat(40));

// Tentar carregar .env do server
const serverEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
  console.log('✅ Carregado server/.env');
} else {
  console.log('❌ server/.env não encontrado');
}

// Tentar carregar .env da raiz
const rootEnvPath = path.join(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
  console.log('✅ Carregado .env da raiz');
} else {
  console.log('❌ .env da raiz não encontrado');
}

// 3. VERIFICAÇÃO DE VARIÁVEIS CRÍTICAS
console.log('\n\n⚙️  VARIÁVEIS CRÍTICAS:');
console.log('-'.repeat(40));

const criticalVars = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT', 
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOLIVRE_CLIENT_ID',
  'MERCADOLIVRE_CLIENT_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL'
];

criticalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mascarar valores sensíveis
    const maskedValue = ['PASSWORD', 'SECRET', 'TOKEN'].some(sensitive => 
      varName.includes(sensitive)
    ) ? '***MASKED***' : value;
    
    console.log(`  ✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`  ❌ ${varName}: UNDEFINED`);
  }
});

// 4. ANÁLISE DE CONFIGURAÇÃO DO SERVIDOR
console.log('\n\n🖥️  CONFIGURAÇÃO DO SERVIDOR:');
console.log('-'.repeat(40));

console.log(`Node.js Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Current Working Directory: ${process.cwd()}`);
console.log(`Script Directory: ${__dirname}`);

// 5. VERIFICAÇÃO DE ARQUIVOS CRÍTICOS
console.log('\n\n📋 ARQUIVOS CRÍTICOS:');
console.log('-'.repeat(40));

const criticalFiles = [
  'server.js',
  'package.json',
  'ecosystem.config.js',
  'ecosystem.config.cjs',
  'config/database.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${stats.size} bytes, modificado: ${stats.mtime.toISOString()})`);
  } else {
    console.log(`  ❌ ${file}: NÃO ENCONTRADO`);
  }
});

// 6. ANÁLISE DE DEPENDÊNCIAS
console.log('\n\n📦 DEPENDÊNCIAS:');
console.log('-'.repeat(40));

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log(`Nome: ${packageJson.name}`);
  console.log(`Versão: ${packageJson.version}`);
  console.log(`Tipo: ${packageJson.type || 'commonjs'}`);
  
  const depCount = Object.keys(packageJson.dependencies || {}).length;
  const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
  
  console.log(`Dependências: ${depCount}`);
  console.log(`Dev Dependencies: ${devDepCount}`);
  
  // Verificar dependências críticas
  const criticalDeps = ['express', 'pg', 'dotenv', 'cors', 'helmet'];
  console.log('\nDependências críticas:');
  criticalDeps.forEach(dep => {
    const version = packageJson.dependencies?.[dep];
    if (version) {
      console.log(`  ✅ ${dep}: ${version}`);
    } else {
      console.log(`  ❌ ${dep}: NÃO INSTALADO`);
    }
  });
} else {
  console.log('❌ package.json não encontrado');
}

// 7. DIFERENÇAS ENTRE AMBIENTES
console.log('\n\n🔄 DIFERENÇAS ENTRE AMBIENTES:');
console.log('-'.repeat(40));

console.log('\n📍 AMBIENTE LOCAL (ngrok):');
console.log('  - Execução: node server.js ou npm start');
console.log('  - Proxy: ngrok tunnel');
console.log('  - Variáveis: carregadas diretamente do .env');
console.log('  - Banco: PostgreSQL local ou remoto');
console.log('  - SSL: fornecido pelo ngrok');
console.log('  - Logs: console direto');

console.log('\n🏢 AMBIENTE VPS:');
console.log('  - Execução: PM2 (processo gerenciado)');
console.log('  - Proxy: nginx reverse proxy');
console.log('  - Variáveis: carregadas via PM2/ecosystem');
console.log('  - Banco: PostgreSQL na VPS');
console.log('  - SSL: certificado Let\'s Encrypt via nginx');
console.log('  - Logs: PM2 logs + arquivos de log');

// 8. POSSÍVEIS CAUSAS DE PROBLEMAS
console.log('\n\n⚠️  POSSÍVEIS CAUSAS DE PROBLEMAS:');
console.log('-'.repeat(40));

const issues = [
  'Variáveis de ambiente não carregadas pelo PM2',
  'Diferenças na configuração do proxy (ngrok vs nginx)',
  'Permissões de arquivo diferentes na VPS',
  'Versões diferentes do Node.js',
  'Configuração de banco de dados diferente',
  'Headers HTTP diferentes entre ngrok e nginx',
  'Timeouts diferentes',
  'Configuração de CORS diferente',
  'Caminhos de arquivo absolutos vs relativos',
  'Configuração de SSL/HTTPS'
];

issues.forEach((issue, index) => {
  console.log(`  ${index + 1}. ${issue}`);
});

// 9. PRÓXIMOS PASSOS RECOMENDADOS
console.log('\n\n🎯 PRÓXIMOS PASSOS RECOMENDADOS:');
console.log('-'.repeat(40));

const steps = [
  'Comparar este output com o mesmo script executado na VPS',
  'Verificar se todas as variáveis críticas estão definidas na VPS',
  'Testar conectividade do banco de dados na VPS',
  'Comparar configuração do nginx com configuração do ngrok',
  'Verificar logs detalhados do PM2 na VPS',
  'Testar rotas específicas que funcionam local mas não na VPS',
  'Verificar permissões de arquivos na VPS',
  'Comparar headers HTTP entre os dois ambientes'
];

steps.forEach((step, index) => {
  console.log(`  ${index + 1}. ${step}`);
});

console.log('\n' + '='.repeat(60));
console.log('🏁 COMPARAÇÃO CONCLUÍDA');
console.log('\n💡 Execute este mesmo script na VPS para comparar os resultados!');
console.log('\n📝 Comando para VPS:');
console.log('   cd /var/www/productionskina/server && node compare-environments.js');