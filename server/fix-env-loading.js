#!/usr/bin/env node

// Script para diagnosticar e corrigir o carregamento de variáveis de ambiente

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 === DIAGNÓSTICO DE CARREGAMENTO .ENV ===');
console.log('📅 Timestamp:', new Date().toISOString());

// 1. Verificar localização atual
console.log('\n📂 === LOCALIZAÇÃO ATUAL ===');
console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);
console.log('Script filename:', __filename);

// 2. Verificar se o arquivo .env existe
const possibleEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env'),
  '/var/www/productionskina/.env',
  '/var/www/productionskina/server/.env'
];

console.log('\n📋 === VERIFICANDO ARQUIVOS .ENV ===');
possibleEnvPaths.forEach(envPath => {
  const exists = fs.existsSync(envPath);
  console.log(`${exists ? '✅' : '❌'} ${envPath}`);
  
  if (exists) {
    try {
      const stats = fs.statSync(envPath);
      console.log(`   📊 Tamanho: ${stats.size} bytes`);
      console.log(`   📅 Modificado: ${stats.mtime.toISOString()}`);
      
      // Ler conteúdo do arquivo
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      console.log(`   📝 Linhas de configuração: ${lines.length}`);
      
      // Mostrar variáveis DB_*
      const dbVars = lines.filter(line => line.startsWith('DB_'));
      console.log(`   🗄️  Variáveis DB_*: ${dbVars.length}`);
      dbVars.forEach(dbVar => {
        const [key, value] = dbVar.split('=');
        console.log(`      ${key}=${value ? '***' : '(vazio)'}`);
      });
    } catch (error) {
      console.log(`   ❌ Erro ao ler arquivo: ${error.message}`);
    }
  }
});

// 3. Tentar carregar dotenv de diferentes formas
console.log('\n🔧 === TESTANDO CARREGAMENTO DOTENV ===');

// Método 1: dotenv padrão
try {
  console.log('\n📋 Método 1: dotenv.config() padrão');
  const dotenv = await import('dotenv');
  const result = dotenv.config();
  console.log('Resultado:', result.error ? `❌ ${result.error.message}` : '✅ Sucesso');
  if (result.parsed) {
    console.log('Variáveis carregadas:', Object.keys(result.parsed).length);
    const dbKeys = Object.keys(result.parsed).filter(key => key.startsWith('DB_'));
    console.log('Variáveis DB_*:', dbKeys);
  }
} catch (error) {
  console.log('❌ Erro ao importar dotenv:', error.message);
}

// Método 2: dotenv com path específico
for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    try {
      console.log(`\n📋 Método 2: dotenv.config({ path: '${envPath}' })`);
      const dotenv = await import('dotenv');
      const result = dotenv.config({ path: envPath });
      console.log('Resultado:', result.error ? `❌ ${result.error.message}` : '✅ Sucesso');
      if (result.parsed) {
        console.log('Variáveis carregadas:', Object.keys(result.parsed).length);
        const dbKeys = Object.keys(result.parsed).filter(key => key.startsWith('DB_'));
        console.log('Variáveis DB_*:', dbKeys);
        
        // Verificar se as variáveis estão no process.env
        console.log('\n🔍 Verificando process.env após carregamento:');
        console.log('DB_HOST:', process.env.DB_HOST || 'undefined');
        console.log('DB_USER:', process.env.DB_USER || 'undefined');
        console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
        console.log('DB_NAME:', process.env.DB_NAME || 'undefined');
        console.log('DB_PORT:', process.env.DB_PORT || 'undefined');
        
        // Se encontrou variáveis, testar conexão
        if (process.env.DB_HOST && process.env.DB_PASSWORD) {
          console.log('\n🔧 === TESTANDO CONEXÃO COM VARIÁVEIS CARREGADAS ===');
          try {
            const pkg = await import('pg');
            const { Pool } = pkg;
            
            const pool = new Pool({
              user: process.env.DB_USER || 'postgres',
              host: process.env.DB_HOST || 'localhost',
              database: process.env.DB_NAME || 'skina_ecopecas',
              password: process.env.DB_PASSWORD || '',
              port: process.env.DB_PORT || 5432,
              max: 1,
              idleTimeoutMillis: 5000,
              connectionTimeoutMillis: 2000,
            });
            
            const { rows } = await pool.query('SELECT 1 as test');
            console.log('✅ Conexão PostgreSQL bem-sucedida!');
            await pool.end();
            break; // Sair do loop se a conexão funcionou
            
          } catch (dbError) {
            console.log('❌ Erro na conexão PostgreSQL:', dbError.message);
          }
        }
      }
    } catch (error) {
      console.log('❌ Erro ao carregar dotenv:', error.message);
    }
  }
}

// 4. Verificar variáveis de ambiente do sistema
console.log('\n🌍 === VARIÁVEIS DE AMBIENTE DO SISTEMA ===');
const envVars = Object.keys(process.env).filter(key => key.startsWith('DB_'));
if (envVars.length > 0) {
  console.log('Variáveis DB_* encontradas no sistema:');
  envVars.forEach(key => {
    console.log(`${key}=${process.env[key] ? '***' : '(vazio)'}`);
  });
} else {
  console.log('❌ Nenhuma variável DB_* encontrada no sistema');
}

console.log('\n🏁 === DIAGNÓSTICO CONCLUÍDO ===');
process.exit(0);