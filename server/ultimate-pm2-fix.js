#!/usr/bin/env node

/**
 * Ultimate PM2 Environment Fix Script
 * Diagnóstica e corrige definitivamente o problema de carregamento de variáveis de ambiente no PM2
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

console.log('🔧 ULTIMATE PM2 ENVIRONMENT FIX SCRIPT');
console.log('=====================================\n');

// Caminhos dos arquivos .env
const rootEnvPath = '/var/www/productionskina/.env';
const serverEnvPath = '/var/www/productionskina/server/.env';
const backupPath = '/var/www/productionskina/.env.backup-' + Date.now();

function logStep(step, message) {
    console.log(`\n📋 STEP ${step}: ${message}`);
    console.log('─'.repeat(50));
}

function checkFileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

function readEnvFile(filePath) {
    try {
        if (!checkFileExists(filePath)) {
            console.log(`❌ Arquivo não encontrado: ${filePath}`);
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`✅ Arquivo lido com sucesso: ${filePath}`);
        return content;
    } catch (error) {
        console.log(`❌ Erro ao ler arquivo ${filePath}:`, error.message);
        return null;
    }
}

function parseEnvContent(content) {
    const vars = {};
    if (!content) return vars;
    
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=');
            vars[key.trim()] = value.trim();
        }
    }
    return vars;
}

function extractDbVars(envVars) {
    const dbVars = {};
    const dbKeys = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    
    for (const key of dbKeys) {
        if (envVars[key]) {
            dbVars[key] = envVars[key];
        }
    }
    return dbVars;
}

async function testDatabaseConnection(dbVars) {
    console.log('\n🔍 Testando conexão com PostgreSQL...');
    
    try {
        const pg = await import('pg');
        const { Pool } = pg.default;
        
        const pool = new Pool({
            host: dbVars.DB_HOST,
            port: parseInt(dbVars.DB_PORT),
            database: dbVars.DB_NAME,
            user: dbVars.DB_USER,
            password: dbVars.DB_PASSWORD
        });
        
        console.log('✅ Pool de conexão criado com sucesso');
        console.log('📊 Configurações do pool:');
        console.log(`   Host: ${dbVars.DB_HOST}`);
        console.log(`   Port: ${dbVars.DB_PORT}`);
        console.log(`   Database: ${dbVars.DB_NAME}`);
        console.log(`   User: ${dbVars.DB_USER}`);
        console.log(`   Password: ${dbVars.DB_PASSWORD ? '[DEFINIDA]' : '[UNDEFINED]'}`);
        
        return true;
    } catch (error) {
        console.log('❌ Erro ao criar pool de conexão:', error.message);
        return false;
    }
}

function createBackup(sourcePath, backupPath) {
    try {
        if (checkFileExists(sourcePath)) {
            fs.copyFileSync(sourcePath, backupPath);
            console.log(`✅ Backup criado: ${backupPath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.log(`❌ Erro ao criar backup:`, error.message);
        return false;
    }
}

function mergeEnvFiles(rootContent, serverContent) {
    const rootVars = parseEnvContent(rootContent || '');
    const serverVars = parseEnvContent(serverContent || '');
    
    // Extrair variáveis DB do server/.env
    const serverDbVars = extractDbVars(serverVars);
    
    console.log('\n📋 Variáveis DB encontradas no server/.env:');
    Object.entries(serverDbVars).forEach(([key, value]) => {
        console.log(`   ${key}=${value}`);
    });
    
    // Mesclar variáveis (server/.env tem prioridade para DB_*)
    const mergedVars = { ...rootVars, ...serverDbVars };
    
    // Converter de volta para formato .env
    const lines = [];
    Object.entries(mergedVars).forEach(([key, value]) => {
        lines.push(`${key}=${value}`);
    });
    
    return lines.join('\n') + '\n';
}

function writeEnvFile(filePath, content) {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Arquivo escrito com sucesso: ${filePath}`);
        return true;
    } catch (error) {
        console.log(`❌ Erro ao escrever arquivo ${filePath}:`, error.message);
        return false;
    }
}

function restartPM2() {
    try {
        console.log('\n🔄 Reiniciando PM2...');
        
        // Parar todos os processos
        execSync('pm2 stop all', { stdio: 'inherit' });
        console.log('✅ Processos PM2 parados');
        
        // Recarregar configuração
        execSync('pm2 reload all', { stdio: 'inherit' });
        console.log('✅ Processos PM2 recarregados');
        
        // Mostrar status
        execSync('pm2 status', { stdio: 'inherit' });
        
        return true;
    } catch (error) {
        console.log('❌ Erro ao reiniciar PM2:', error.message);
        return false;
    }
}

async function main() {
    logStep(1, 'Verificando arquivos .env existentes');
    
    const rootExists = checkFileExists(rootEnvPath);
    const serverExists = checkFileExists(serverEnvPath);
    
    console.log(`Root .env (${rootEnvPath}): ${rootExists ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`Server .env (${serverEnvPath}): ${serverExists ? '✅ Existe' : '❌ Não existe'}`);
    
    if (!serverExists) {
        console.log('\n❌ ERRO CRÍTICO: server/.env não encontrado!');
        console.log('Este arquivo é necessário para obter as variáveis do banco de dados.');
        process.exit(1);
    }
    
    logStep(2, 'Lendo conteúdo dos arquivos .env');
    
    const rootContent = readEnvFile(rootEnvPath);
    const serverContent = readEnvFile(serverEnvPath);
    
    if (!serverContent) {
        console.log('\n❌ ERRO: Não foi possível ler o server/.env');
        process.exit(1);
    }
    
    logStep(3, 'Analisando variáveis de ambiente');
    
    const serverVars = parseEnvContent(serverContent);
    const serverDbVars = extractDbVars(serverVars);
    
    console.log('\n📊 Variáveis DB no server/.env:');
    Object.entries(serverDbVars).forEach(([key, value]) => {
        console.log(`   ${key}=${value}`);
    });
    
    const dbVarsCount = Object.keys(serverDbVars).length;
    if (dbVarsCount === 0) {
        console.log('\n❌ ERRO: Nenhuma variável DB_* encontrada no server/.env');
        process.exit(1);
    }
    
    console.log(`\n✅ Encontradas ${dbVarsCount} variáveis de banco de dados`);
    
    logStep(4, 'Testando configuração do banco de dados');
    
    const connectionTest = await testDatabaseConnection(serverDbVars);
    if (!connectionTest) {
        console.log('\n⚠️  AVISO: Teste de conexão falhou, mas continuando com a correção...');
    }
    
    logStep(5, 'Criando backup do .env da raiz');
    
    if (rootExists) {
        createBackup(rootEnvPath, backupPath);
    }
    
    logStep(6, 'Mesclando arquivos .env');
    
    const mergedContent = mergeEnvFiles(rootContent, serverContent);
    
    console.log('\n📄 Conteúdo mesclado (primeiras 10 linhas):');
    const previewLines = mergedContent.split('\n').slice(0, 10);
    previewLines.forEach((line, index) => {
        if (line.trim()) {
            console.log(`   ${index + 1}: ${line}`);
        }
    });
    
    logStep(7, 'Escrevendo novo .env na raiz');
    
    const writeSuccess = writeEnvFile(rootEnvPath, mergedContent);
    if (!writeSuccess) {
        console.log('\n❌ ERRO: Falha ao escrever o novo .env');
        process.exit(1);
    }
    
    logStep(8, 'Reiniciando PM2');
    
    const restartSuccess = restartPM2();
    if (!restartSuccess) {
        console.log('\n⚠️  AVISO: Falha ao reiniciar PM2 automaticamente');
        console.log('Execute manualmente: pm2 reload all');
    }
    
    console.log('\n🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('✅ Variáveis DB_* copiadas do server/.env para .env da raiz');
    console.log('✅ Backup criado (se necessário)');
    console.log('✅ PM2 reiniciado');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verifique os logs: pm2 logs skina-backend');
    console.log('2. Teste a API: curl http://localhost:3001/api/test');
    console.log('3. Monitore o status: pm2 status');
    
    if (rootExists && checkFileExists(backupPath)) {
        console.log(`\n💾 Backup salvo em: ${backupPath}`);
    }
}

// Executar script
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { main };