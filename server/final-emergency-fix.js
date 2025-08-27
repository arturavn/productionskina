import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

console.log('🚨 FINAL EMERGENCY FIX - Correção definitiva do PM2');

try {
  // 1. Parar e remover todos os processos PM2
  console.log('\n1. Parando todos os processos PM2...');
  try {
    execSync('pm2 stop all', { stdio: 'inherit' });
    execSync('pm2 delete all', { stdio: 'inherit' });
    console.log('✅ Processos PM2 parados e removidos');
  } catch (error) {
    console.log('⚠️ Nenhum processo PM2 para parar');
  }

  // 2. Ler variáveis do server/.env
  console.log('\n2. Lendo variáveis do server/.env...');
  const serverEnvPath = '/var/www/productionskina/server/.env';
  const serverEnvContent = fs.readFileSync(serverEnvPath, 'utf8');
  console.log('✅ Arquivo server/.env lido com sucesso');
  
  const envVars = {};
  serverEnvContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value;
        if (key.startsWith('DB_')) {
          console.log(`📝 ${key}=${value}`);
        }
      }
    }
  });

  // Forçar DB_USER=postgres
  envVars.DB_USER = 'postgres';
  console.log('🔧 Forçando DB_USER=postgres');

  // 3. Criar novo .env na raiz
  console.log('\n3. Criando novo .env na raiz...');
  const rootEnvPath = '/var/www/productionskina/.env';
  const newEnvContent = [
    `DB_HOST=${envVars.DB_HOST}`,
    `DB_PORT=${envVars.DB_PORT}`,
    `DB_NAME=${envVars.DB_NAME}`,
    `DB_USER=${envVars.DB_USER}`,
    `DB_PASSWORD=${envVars.DB_PASSWORD}`,
    'NODE_ENV=production',
    'PORT=3001',
    ''
  ].join('\n');
  
  fs.writeFileSync(rootEnvPath, newEnvContent);
  console.log('✅ Novo .env criado na raiz');
  console.log('Conteúdo:');
  console.log(newEnvContent);

  // 4. Testar conexão PostgreSQL
  console.log('4. Testando conexão PostgreSQL...');
  const client = new Client({
    host: envVars.DB_HOST,
    port: parseInt(envVars.DB_PORT),
    database: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
  });
  
  await client.connect();
  const result = await client.query('SELECT NOW()');
  await client.end();
  console.log('✅ Conexão PostgreSQL OK:', result.rows[0]);

  // 5. Definir variáveis de ambiente no processo atual
  console.log('\n5. Definindo variáveis de ambiente...');
  Object.keys(envVars).forEach(key => {
    if (key.startsWith('DB_')) {
      process.env[key] = envVars[key];
      console.log(`🔧 ${key}=${envVars[key]}`);
    }
  });
  process.env.NODE_ENV = 'production';
  process.env.PORT = '3001';

  // 6. Criar arquivo ecosystem.config.js para PM2
  console.log('\n6. Criando arquivo ecosystem.config.js...');
  const ecosystemConfig = `module.exports = {
  apps: [{
    name: 'skina-backend',
    script: 'server/server.js',
    cwd: '/var/www/productionskina',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_HOST: '${envVars.DB_HOST}',
      DB_PORT: '${envVars.DB_PORT}',
      DB_NAME: '${envVars.DB_NAME}',
      DB_USER: '${envVars.DB_USER}',
      DB_PASSWORD: '${envVars.DB_PASSWORD}'
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/skina-backend-error.log',
    out_file: '/var/log/pm2/skina-backend-out.log',
    log_file: '/var/log/pm2/skina-backend.log'
  }]
};`;
  
  fs.writeFileSync('/var/www/productionskina/ecosystem.config.js', ecosystemConfig);
  console.log('✅ Arquivo ecosystem.config.js criado');

  // 7. Reiniciar PM2 com ecosystem.config.js
  console.log('\n7. Reiniciando PM2 com ecosystem.config.js...');
  execSync('cd /var/www/productionskina && pm2 start ecosystem.config.js', { stdio: 'inherit' });
  console.log('✅ PM2 reiniciado com sucesso');

  // 8. Aguardar um pouco e verificar status
  console.log('\n8. Aguardando 3 segundos e verificando status...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  execSync('pm2 status', { stdio: 'inherit' });
  
  console.log('\n9. Verificando logs recentes...');
  execSync('pm2 logs skina-backend --lines 10', { stdio: 'inherit' });
  
  console.log('\n10. Testando endpoint...');
  try {
    execSync('curl -s http://localhost:3001/api/test', { stdio: 'inherit' });
    console.log('\n✅ Endpoint respondendo!');
  } catch (error) {
    console.log('\n⚠️ Endpoint não está respondendo ainda');
  }
  
  console.log('\n🎉 CORREÇÃO FINAL APLICADA COM SUCESSO!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se o erro PostgreSQL foi resolvido: pm2 logs skina-backend --lines 20');
  console.log('2. Testar o endpoint: curl http://localhost:3001/api/test');
  console.log('3. Verificar status: pm2 status');
  
} catch (error) {
  console.error('❌ Erro durante a correção final:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}