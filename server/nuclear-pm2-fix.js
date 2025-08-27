#!/usr/bin/env node

/**
 * NUCLEAR PM2 FIX - Correção definitiva e agressiva para PM2
 * Este script força a definição das variáveis de ambiente diretamente no PM2
 * sem depender de arquivos .env ou ecosystem.config.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 NUCLEAR PM2 FIX - CORREÇÃO AGRESSIVA');
console.log('============================================================');

// Função para executar comandos
function runCommand(command, description) {
    try {
        console.log(`\n🔧 ${description}`);
        console.log(`Executando: ${command}`);
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ Sucesso: ${result.trim()}`);
        return result;
    } catch (error) {
        console.log(`⚠️ Aviso: ${error.message}`);
        return null;
    }
}

// 1. PARAR TUDO
console.log('\n🛑 PARANDO TODOS OS PROCESSOS PM2');
runCommand('pm2 kill', 'Matando todos os processos PM2');

// 2. LER VARIÁVEIS DO server/.env
console.log('\n📋 LENDO VARIÁVEIS DE AMBIENTE');
const serverEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

let envVars = {};

if (fs.existsSync(serverEnvPath)) {
    const envContent = fs.readFileSync(serverEnvPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            envVars[key] = value;
            console.log(`📝 ${key}: ${key.includes('PASSWORD') ? '[OCULTA]' : value}`);
        }
    });
}

// 3. FORÇAR VARIÁVEIS ESPECÍFICAS
envVars.DB_USER = 'postgres';
envVars.DB_HOST = 'localhost';
envVars.DB_NAME = 'skina_ecopecas';
envVars.DB_PORT = '5432';
envVars.PORT = '3001';

console.log('\n🔧 VARIÁVEIS FORÇADAS:');
console.log(`DB_USER: ${envVars.DB_USER}`);
console.log(`DB_HOST: ${envVars.DB_HOST}`);
console.log(`DB_NAME: ${envVars.DB_NAME}`);
console.log(`DB_PORT: ${envVars.DB_PORT}`);
console.log(`PORT: ${envVars.PORT}`);

// 4. TESTAR CONEXÃO POSTGRESQL
console.log('\n🔌 TESTANDO CONEXÃO POSTGRESQL');
const { Client } = pg;

const testConnection = async () => {
    const client = new Client({
        user: envVars.DB_USER,
        host: envVars.DB_HOST,
        database: envVars.DB_NAME,
        password: envVars.DB_PASSWORD,
        port: parseInt(envVars.DB_PORT)
    });

    try {
        await client.connect();
        console.log('✅ Conexão PostgreSQL estabelecida!');
        
        const result = await client.query('SELECT NOW() as current_time');
        console.log(`✅ Query teste executada: ${result.rows[0].current_time}`);
        
        await client.end();
        return true;
    } catch (error) {
        console.log(`❌ Erro na conexão PostgreSQL: ${error.message}`);
        return false;
    }
};

const connectionOk = await testConnection();
if (!connectionOk) {
    console.log('❌ FALHA NA CONEXÃO POSTGRESQL - ABORTANDO');
    process.exit(1);
}

// 5. CRIAR .env NA RAIZ (BACKUP)
console.log('\n📄 CRIANDO .env NA RAIZ');
const rootEnvContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

fs.writeFileSync(rootEnvPath, rootEnvContent);
console.log('✅ Arquivo .env criado na raiz');

// 6. DEFINIR VARIÁVEIS NO PROCESSO ATUAL
console.log('\n🔧 DEFININDO VARIÁVEIS NO PROCESSO ATUAL');
Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
    console.log(`✅ ${key} definida`);
});

// 7. INICIAR PM2 COM VARIÁVEIS EXPLÍCITAS
console.log('\n🚀 INICIANDO PM2 COM VARIÁVEIS EXPLÍCITAS');

// Construir comando PM2 com todas as variáveis
const envString = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

const pm2Command = `cd /var/www/productionskina/server && ${envString} pm2 start server.js --name skina-backend --node-args="--max-old-space-size=2048"`;

console.log('Comando PM2:');
console.log(pm2Command);

runCommand(pm2Command, 'Iniciando PM2 com variáveis explícitas');

// 8. AGUARDAR E VERIFICAR STATUS
console.log('\n⏳ AGUARDANDO INICIALIZAÇÃO...');
await new Promise(resolve => setTimeout(resolve, 5000));

runCommand('pm2 status', 'Verificando status do PM2');
runCommand('pm2 logs skina-backend --lines 10', 'Verificando logs recentes');

// 9. TESTAR ENDPOINT
console.log('\n🌐 TESTANDO ENDPOINT');
try {
    const testResult = execSync('curl -s http://localhost:3001/api/test', { encoding: 'utf8' });
    console.log(`✅ Resposta do endpoint: ${testResult}`);
} catch (error) {
    console.log(`❌ Erro no teste do endpoint: ${error.message}`);
}

console.log('\n============================================================');
console.log('🏁 NUCLEAR PM2 FIX CONCLUÍDO');
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Verificar se o PM2 está rodando: pm2 status');
console.log('2. Monitorar logs: pm2 logs skina-backend --lines 20');
console.log('3. Testar endpoint: curl http://localhost:3001/api/test');
console.log('4. Se ainda houver erro, verificar logs detalhados: pm2 logs skina-backend');