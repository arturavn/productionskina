#!/usr/bin/env node

/**
 * Advanced PM2 Debug Script
 * Diagnóstica exatamente quais variáveis de ambiente o PM2 está usando
 * e compara com os arquivos .env disponíveis
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 ADVANCED PM2 DEBUG - Análise Completa de Variáveis de Ambiente\n');

// 1. Verificar arquivos .env disponíveis
console.log('📁 ARQUIVOS .ENV DISPONÍVEIS:');
const envFiles = [
    '/var/www/productionskina/.env',
    '/var/www/productionskina/server/.env',
    path.join(__dirname, '.env'),
    path.join(__dirname, '../.env')
];

envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
        console.log(`✅ ${envFile} - EXISTE`);
        try {
            const content = fs.readFileSync(envFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
            console.log(`   📋 ${lines.length} variáveis encontradas`);
            
            // Mostrar variáveis DB_*
            const dbVars = lines.filter(line => line.startsWith('DB_'));
            dbVars.forEach(dbVar => {
                console.log(`   🔑 ${dbVar}`);
            });
        } catch (error) {
            console.log(`   ❌ Erro ao ler: ${error.message}`);
        }
    } else {
        console.log(`❌ ${envFile} - NÃO EXISTE`);
    }
    console.log('');
});

// 2. Verificar variáveis de ambiente do processo atual
console.log('🌍 VARIÁVEIS DE AMBIENTE DO PROCESSO ATUAL:');
const currentEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT', 'NODE_ENV', 'PORT'];
currentEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        if (varName === 'DB_PASSWORD') {
            console.log(`✅ ${varName}=${value.substring(0, 3)}***`);
        } else {
            console.log(`✅ ${varName}=${value}`);
        }
    } else {
        console.log(`❌ ${varName}=undefined`);
    }
});
console.log('');

// 3. Carregar e testar diferentes arquivos .env
console.log('🧪 TESTANDO CARREGAMENTO DE DIFERENTES ARQUIVOS .ENV:\n');

for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
        console.log(`📂 Testando: ${envFile}`);
        
        try {
            // Limpar variáveis anteriores
            delete process.env.DB_HOST;
            delete process.env.DB_USER;
            delete process.env.DB_NAME;
            delete process.env.DB_PASSWORD;
            delete process.env.DB_PORT;
            
            // Carregar novo arquivo
            dotenv.config({ path: envFile });
            
            console.log('   🔍 Variáveis carregadas:');
            currentEnvVars.forEach(varName => {
                const value = process.env[varName];
                if (value) {
                    if (varName === 'DB_PASSWORD') {
                        console.log(`   ✅ ${varName}=${value.substring(0, 3)}***`);
                    } else {
                        console.log(`   ✅ ${varName}=${value}`);
                    }
                } else {
                    console.log(`   ❌ ${varName}=undefined`);
                }
            });
            
            // Testar conexão PostgreSQL
            if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME && process.env.DB_PASSWORD) {
                console.log('   🔌 Testando conexão PostgreSQL...');
                
                const pool = new Pool({
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    database: process.env.DB_NAME,
                    password: process.env.DB_PASSWORD,
                    port: process.env.DB_PORT || 5432,
                    ssl: false
                });
                
                try {
                    const client = await pool.connect();
                    const result = await client.query('SELECT NOW() as current_time');
                    console.log(`   ✅ CONEXÃO SUCESSO: ${result.rows[0].current_time}`);
                    
                    // Testar query específica do MercadoLivre
                    try {
                        const mlResult = await client.query('SELECT key, value FROM ml_sync_config LIMIT 1');
                        console.log(`   ✅ QUERY ML_SYNC_CONFIG SUCESSO: ${mlResult.rows.length} registros`);
                    } catch (mlError) {
                        console.log(`   ❌ QUERY ML_SYNC_CONFIG FALHOU: ${mlError.message}`);
                    }
                    
                    client.release();
                } catch (dbError) {
                    console.log(`   ❌ CONEXÃO FALHOU: ${dbError.message}`);
                    
                    // Diagnóstico específico para erro de senha
                    if (dbError.message.includes('SCRAM-SERVER-FIRST-MESSAGE')) {
                        console.log('   🔍 DIAGNÓSTICO ERRO SENHA:');
                        console.log(`   📝 Senha atual: '${process.env.DB_PASSWORD}'`);
                        console.log(`   📏 Tamanho da senha: ${process.env.DB_PASSWORD?.length || 0}`);
                        console.log(`   🔤 Tipo da senha: ${typeof process.env.DB_PASSWORD}`);
                        console.log(`   🎯 Senha é string: ${typeof process.env.DB_PASSWORD === 'string'}`);
                    }
                } finally {
                    await pool.end();
                }
            } else {
                console.log('   ⚠️  Variáveis PostgreSQL incompletas');
            }
            
        } catch (error) {
            console.log(`   ❌ Erro ao processar: ${error.message}`);
        }
        
        console.log('');
    }
}

// 4. Verificar status do PM2
console.log('🚀 STATUS DO PM2:');
try {
    const pm2Status = execSync('pm2 list', { encoding: 'utf8' });
    console.log(pm2Status);
} catch (error) {
    console.log(`❌ Erro ao verificar PM2: ${error.message}`);
}

// 5. Verificar variáveis de ambiente do processo PM2
console.log('🔍 VARIÁVEIS DE AMBIENTE DO PROCESSO PM2:');
try {
    const pm2Env = execSync('pm2 show skina-backend', { encoding: 'utf8' });
    console.log('📋 Informações do processo PM2:');
    console.log(pm2Env);
} catch (error) {
    console.log(`❌ Erro ao verificar processo PM2: ${error.message}`);
}

// 6. Verificar ecosystem.config.js
console.log('⚙️  VERIFICANDO ECOSYSTEM.CONFIG.JS:');
const ecosystemPath = '/var/www/productionskina/ecosystem.config.js';
if (fs.existsSync(ecosystemPath)) {
    try {
        const ecosystemContent = fs.readFileSync(ecosystemPath, 'utf8');
        console.log('📄 Conteúdo do ecosystem.config.js:');
        console.log(ecosystemContent);
    } catch (error) {
        console.log(`❌ Erro ao ler ecosystem.config.js: ${error.message}`);
    }
} else {
    console.log('❌ ecosystem.config.js não encontrado');
}

console.log('\n🏁 DIAGNÓSTICO COMPLETO FINALIZADO');
console.log('\n💡 PRÓXIMOS PASSOS RECOMENDADOS:');
console.log('1. Verificar qual arquivo .env está sendo usado pelo PM2');
console.log('2. Garantir que as variáveis DB_* estejam corretas no arquivo usado');
console.log('3. Reiniciar PM2 com o arquivo .env correto');
console.log('4. Verificar se o ecosystem.config.js está configurado corretamente');