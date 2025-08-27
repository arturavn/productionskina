import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Client } from 'pg';

console.log('🚀 CORREÇÃO FINAL - PM2 + POSTGRESQL');
console.log('=' .repeat(50));

// Função para ler e parsear arquivo .env
function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const envVars = {};
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const equalIndex = trimmedLine.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmedLine.substring(0, equalIndex).trim();
                let value = trimmedLine.substring(equalIndex + 1).trim();
                // Remove aspas duplas se existirem
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                envVars[key] = value;
            }
        }
    }
    return envVars;
}

async function runFinalFix() {
    console.log('\n📋 STEP 1: Lendo configurações dos arquivos .env');
    console.log('-'.repeat(40));
    
    const rootEnvPath = path.resolve(process.cwd(), '.env');
    const serverEnvPath = path.resolve(process.cwd(), 'server', '.env');
    
    const rootEnvVars = parseEnvFile(rootEnvPath);
    const serverEnvVars = parseEnvFile(serverEnvPath);
    
    console.log('✅ Arquivos .env lidos com sucesso');
    
    // Extrair variáveis DB do server/.env
    const dbVarsServer = Object.keys(serverEnvVars)
        .filter(key => key.startsWith('DB_'))
        .reduce((obj, key) => {
            obj[key] = serverEnvVars[key];
            return obj;
        }, {});
    
    console.log('\n📊 Variáveis DB encontradas no server/.env:');
    for (const [key, value] of Object.entries(dbVarsServer)) {
        console.log(`  ${key}=${value}`);
    }
    
    console.log('\n📋 STEP 2: Corrigindo usuário PostgreSQL');
    console.log('-'.repeat(40));
    
    // Corrigir DB_USER para 'postgres' se estiver como 'root'
    if (dbVarsServer.DB_USER === 'root' || !dbVarsServer.DB_USER) {
        console.log('🔧 Corrigindo DB_USER de "root" para "postgres"');
        dbVarsServer.DB_USER = 'postgres';
    }
    
    console.log('\n📋 STEP 3: Testando conexão com configurações corretas');
    console.log('-'.repeat(40));
    
    const dbConfig = {
        user: dbVarsServer.DB_USER,
        host: dbVarsServer.DB_HOST || 'localhost',
        database: dbVarsServer.DB_NAME,
        password: dbVarsServer.DB_PASSWORD,
        port: dbVarsServer.DB_PORT ? parseInt(dbVarsServer.DB_PORT) : 5432,
    };
    
    console.log('🔍 Testando conexão com:');
    console.log(`  Host: ${dbConfig.host}`);
    console.log(`  Port: ${dbConfig.port}`);
    console.log(`  Database: ${dbConfig.database}`);
    console.log(`  User: ${dbConfig.user}`);
    console.log(`  Password: ${dbConfig.password ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
    
    const client = new Client(dbConfig);
    try {
        await client.connect();
        console.log('✅ CONEXÃO POSTGRESQL BEM-SUCEDIDA!');
        await client.end();
    } catch (error) {
        console.log(`❌ Erro na conexão: ${error.message}`);
        await client.end().catch(() => {});
        
        // Se falhar, tentar com usuário 'postgres' explicitamente
        if (dbConfig.user !== 'postgres') {
            console.log('\n🔄 Tentando com usuário "postgres"...');
            dbConfig.user = 'postgres';
            dbVarsServer.DB_USER = 'postgres';
            
            const client2 = new Client(dbConfig);
            try {
                await client2.connect();
                console.log('✅ CONEXÃO BEM-SUCEDIDA COM USUÁRIO "postgres"!');
                await client2.end();
            } catch (error2) {
                console.log(`❌ Ainda falhou: ${error2.message}`);
                await client2.end().catch(() => {});
            }
        }
    }
    
    console.log('\n📋 STEP 4: Criando backup e atualizando .env da raiz');
    console.log('-'.repeat(40));
    
    // Backup do .env da raiz
    if (fs.existsSync(rootEnvPath)) {
        const backupPath = `${rootEnvPath}.backup-${Date.now()}`;
        fs.copyFileSync(rootEnvPath, backupPath);
        console.log(`✅ Backup criado: ${backupPath}`);
    }
    
    // Mesclar variáveis
    const mergedEnvVars = { ...rootEnvVars };
    for (const key in dbVarsServer) {
        mergedEnvVars[key] = dbVarsServer[key];
    }
    
    // Escrever novo .env da raiz
    let newRootEnvContent = '';
    for (const key in mergedEnvVars) {
        newRootEnvContent += `${key}=${mergedEnvVars[key]}\n`;
    }
    
    fs.writeFileSync(rootEnvPath, newRootEnvContent);
    console.log('✅ Arquivo .env da raiz atualizado');
    
    console.log('\n📋 STEP 5: Reiniciando PM2 com --update-env');
    console.log('-'.repeat(40));
    
    try {
        console.log('🔄 Parando PM2...');
        execSync('pm2 stop all', { stdio: 'inherit' });
        
        console.log('🔄 Reiniciando PM2 com --update-env...');
        execSync('pm2 start all --update-env', { stdio: 'inherit' });
        
        console.log('✅ PM2 reiniciado com variáveis atualizadas');
    } catch (error) {
        console.error('❌ Erro ao reiniciar PM2:', error.message);
        
        // Tentar método alternativo
        try {
            console.log('🔄 Tentando método alternativo...');
            execSync('pm2 reload all --update-env', { stdio: 'inherit' });
            console.log('✅ PM2 recarregado com sucesso');
        } catch (error2) {
            console.error('❌ Erro no método alternativo:', error2.message);
        }
    }
    
    console.log('\n🎉 CORREÇÃO FINAL CONCLUÍDA!');
    console.log('=' .repeat(50));
    console.log('\n📋 Próximos passos:');
    console.log('1. Verificar logs: pm2 logs skina-backend --lines 10');
    console.log('2. Verificar status: pm2 status');
    console.log('3. Testar API: curl http://localhost:3001/api/test');
}

runFinalFix().catch(console.error);