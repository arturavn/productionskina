import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

console.log('🚨 ULTIMATE FINAL FIX - Correção definitiva sem ecosystem.config.js');

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

  // 6. Remover ecosystem.config.js se existir
  console.log('\n6. Removendo ecosystem.config.js...');
  try {
    fs.unlinkSync('/var/www/productionskina/ecosystem.config.js');
    console.log('✅ ecosystem.config.js removido');
  } catch (error) {
    console.log('⚠️ ecosystem.config.js não existe');
  }

  // 7. Reiniciar PM2 com comando direto e variáveis explícitas
  console.log('\n7. Reiniciando PM2 com variáveis explícitas...');
  const pm2Command = `cd /var/www/productionskina && DB_HOST=${envVars.DB_HOST} DB_PORT=${envVars.DB_PORT} DB_NAME=${envVars.DB_NAME} DB_USER=${envVars.DB_USER} DB_PASSWORD=${envVars.DB_PASSWORD} NODE_ENV=production PORT=3001 pm2 start server/server.js --name skina-backend`;
  
  console.log('Comando PM2:', pm2Command);
  execSync(pm2Command, { stdio: 'inherit' });
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
  
  console.log('\n🎉 CORREÇÃO ULTIMATE APLICADA COM SUCESSO!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se o erro PostgreSQL foi resolvido: pm2 logs skina-backend --lines 20');
  console.log('2. Testar o endpoint: curl http://localhost:3001/api/test');
  console.log('3. Verificar status: pm2 status');
  console.log('4. Se ainda houver erro, verificar se as variáveis estão sendo lidas: pm2 show skina-backend');
  
} catch (error) {
  console.error('❌ Erro durante a correção ultimate:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}