#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import pg from 'pg';
const { Client } = pg;

console.log('🚨 EMERGENCY FIX - Forçando correção do PostgreSQL');

// 1. Parar todos os processos PM2
console.log('\n1. Parando todos os processos PM2...');
try {
    execSync('pm2 stop all', { stdio: 'inherit' });
    execSync('pm2 delete all', { stdio: 'inherit' });
    console.log('✅ Processos PM2 parados e removidos');
} catch (error) {
    console.log('⚠️ Erro ao parar PM2:', error.message);
}

// 2. Ler variáveis do server/.env
console.log('\n2. Lendo variáveis do server/.env...');
const serverEnvPath = '/var/www/productionskina/server/.env';
const rootEnvPath = '/var/www/productionskina/.env';

let serverEnvContent = '';
try {
    serverEnvContent = fs.readFileSync(serverEnvPath, 'utf8');
    console.log('✅ Arquivo server/.env lido com sucesso');
} catch (error) {
    console.log('❌ Erro ao ler server/.env:', error.message);
    process.exit(1);
}

// 3. Extrair variáveis DB_*
const dbVars = {};
const lines = serverEnvContent.split('\n');
lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('DB_') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove aspas
        dbVars[key] = value;
        console.log(`📝 ${key}=${value}`);
    }
});

// 4. Forçar DB_USER=postgres
dbVars['DB_USER'] = 'postgres';
console.log('🔧 Forçando DB_USER=postgres');

// 5. Criar novo .env na raiz
console.log('\n3. Criando novo .env na raiz...');
let newEnvContent = '';

// Adicionar variáveis DB_*
Object.entries(dbVars).forEach(([key, value]) => {
    newEnvContent += `${key}=${value}\n`;
});

// Adicionar outras variáveis necessárias
newEnvContent += `NODE_ENV=production\n`;
newEnvContent += `PORT=3001\n`;

try {
    fs.writeFileSync(rootEnvPath, newEnvContent);
    console.log('✅ Novo .env criado na raiz');
    console.log('Conteúdo:');
    console.log(newEnvContent);
} catch (error) {
    console.log('❌ Erro ao criar .env:', error.message);
    process.exit(1);
}

// 6. Testar conexão PostgreSQL
console.log('\n4. Testando conexão PostgreSQL...');
const client = new Client({
    host: dbVars.DB_HOST,
    port: parseInt(dbVars.DB_PORT),
    database: dbVars.DB_NAME,
    user: dbVars.DB_USER,
    password: dbVars.DB_PASSWORD
});

try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexão PostgreSQL OK:', result.rows[0]);
    await client.end();
} catch (error) {
    console.log('❌ Erro na conexão PostgreSQL:', error.message);
    console.log('Tentando com usuário root...');
    
    const clientRoot = new Client({
        host: dbVars.DB_HOST,
        port: parseInt(dbVars.DB_PORT),
        database: dbVars.DB_NAME,
        user: 'root',
        password: dbVars.DB_PASSWORD
    });
    
    try {
        await clientRoot.connect();
        const result = await clientRoot.query('SELECT NOW()');
        console.log('✅ Conexão com root OK:', result.rows[0]);
        await clientRoot.end();
        
        // Se root funciona, usar root
        dbVars['DB_USER'] = 'root';
        newEnvContent = newEnvContent.replace('DB_USER=postgres', 'DB_USER=root');
        fs.writeFileSync(rootEnvPath, newEnvContent);
        console.log('🔧 Usando DB_USER=root');
    } catch (rootError) {
        console.log('❌ Erro com root também:', rootError.message);
    }
}

// 7. Definir variáveis de ambiente no processo atual
console.log('\n5. Definindo variáveis de ambiente...');
Object.entries(dbVars).forEach(([key, value]) => {
    process.env[key] = value;
    console.log(`🔧 ${key}=${value}`);
});
process.env.NODE_ENV = 'production';
process.env.PORT = '3001';

// 8. Reiniciar PM2 com variáveis explícitas
console.log('\n6. Reiniciando PM2...');
try {
    const pm2Command = `cd /var/www/productionskina && pm2 start server/server.js --name skina-backend --env-file .env`;
    execSync(pm2Command, { stdio: 'inherit' });
    console.log('✅ PM2 reiniciado com sucesso');
} catch (error) {
    console.log('❌ Erro ao reiniciar PM2:', error.message);
}

// 9. Verificar status
console.log('\n7. Verificando status...');
try {
    execSync('pm2 status', { stdio: 'inherit' });
    console.log('\n8. Logs recentes:');
    execSync('pm2 logs skina-backend --lines 10', { stdio: 'inherit' });
} catch (error) {
    console.log('❌ Erro ao verificar status:', error.message);
}

console.log('\n🚨 EMERGENCY FIX CONCLUÍDO');
console.log('Execute: pm2 logs skina-backend para verificar se o erro foi resolvido');