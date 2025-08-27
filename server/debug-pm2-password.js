import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

console.log('🔍 DIAGNÓSTICO ESPECÍFICO - PROBLEMA DE SENHA POSTGRESQL');
console.log('=' .repeat(60));

// Verificar variáveis de ambiente carregadas pelo PM2
console.log('\n📋 STEP 1: Verificando variáveis de ambiente no processo PM2');
console.log('-'.repeat(50));

const envVars = {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD
};

console.log('Variáveis carregadas pelo PM2:');
for (const [key, value] of Object.entries(envVars)) {
    if (key === 'DB_PASSWORD') {
        console.log(`  ${key}: ${value ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
        if (value) {
            console.log(`    - Tipo: ${typeof value}`);
            console.log(`    - Comprimento: ${value.length}`);
            console.log(`    - Primeiro char: '${value.charAt(0)}'`);
            console.log(`    - Último char: '${value.charAt(value.length - 1)}'`);
            console.log(`    - Contém aspas duplas: ${value.includes('"')}`);
            console.log(`    - Valor raw: ${JSON.stringify(value)}`);
        }
    } else {
        console.log(`  ${key}: ${value || '[NÃO DEFINIDA]'}`);
    }
}

// Verificar arquivo .env da raiz
console.log('\n📋 STEP 2: Verificando arquivo .env da raiz');
console.log('-'.repeat(50));

const rootEnvPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(rootEnvPath)) {
    const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');
    const passwordLine = rootEnvContent.split('\n').find(line => line.startsWith('DB_PASSWORD'));
    console.log(`Linha DB_PASSWORD no .env da raiz: ${passwordLine || 'NÃO ENCONTRADA'}`);
    
    if (passwordLine) {
        const [, value] = passwordLine.split('=');
        console.log(`Valor extraído: ${JSON.stringify(value)}`);
    }
} else {
    console.log('❌ Arquivo .env da raiz não encontrado');
}

// Verificar arquivo .env do server
console.log('\n📋 STEP 3: Verificando arquivo .env do server');
console.log('-'.repeat(50));

const serverEnvPath = path.resolve(process.cwd(), 'server', '.env');
if (fs.existsSync(serverEnvPath)) {
    const serverEnvContent = fs.readFileSync(serverEnvPath, 'utf8');
    const passwordLine = serverEnvContent.split('\n').find(line => line.startsWith('DB_PASSWORD'));
    console.log(`Linha DB_PASSWORD no server/.env: ${passwordLine || 'NÃO ENCONTRADA'}`);
    
    if (passwordLine) {
        const [, value] = passwordLine.split('=');
        console.log(`Valor extraído: ${JSON.stringify(value)}`);
    }
} else {
    console.log('❌ Arquivo server/.env não encontrado');
}

// Testar diferentes formatos de senha
console.log('\n📋 STEP 4: Testando diferentes formatos de senha');
console.log('-'.repeat(50));

const testPasswords = [
    process.env.DB_PASSWORD, // Como está
    process.env.DB_PASSWORD?.replace(/"/g, ''), // Sem aspas duplas
    'skinalogindb', // Valor direto
    '"skinalogindb"' // Com aspas duplas
];

for (let i = 0; i < testPasswords.length; i++) {
    const testPassword = testPasswords[i];
    if (!testPassword) continue;
    
    console.log(`\n🧪 Teste ${i + 1}: ${JSON.stringify(testPassword)}`);
    
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: testPassword,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    });
    
    try {
        await client.connect();
        console.log('✅ CONEXÃO BEM-SUCEDIDA!');
        await client.end();
        
        console.log('\n🎯 SOLUÇÃO ENCONTRADA!');
        console.log(`A senha correta é: ${JSON.stringify(testPassword)}`);
        console.log(`Tipo: ${typeof testPassword}`);
        break;
    } catch (error) {
        console.log(`❌ Falhou: ${error.message}`);
        await client.end().catch(() => {});
    }
}

console.log('\n📋 DIAGNÓSTICO CONCLUÍDO');
console.log('=' .repeat(60));