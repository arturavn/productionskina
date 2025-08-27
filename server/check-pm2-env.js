#!/usr/bin/env node

// Script para verificar especificamente como o PM2 está carregando as variáveis de ambiente
// Este script simula exatamente o que o MercadoLivreIntegrationService faz

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

console.log('🔍 === DIAGNÓSTICO ESPECÍFICO PM2 ===');
console.log('📅 Timestamp:', new Date().toISOString());

// 1. Carregar dotenv como no database.js
dotenv.config();

console.log('\n📋 === VARIÁVEIS DE AMBIENTE ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD (tipo):', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD (valor):', JSON.stringify(process.env.DB_PASSWORD));
console.log('DB_PASSWORD (length):', process.env.DB_PASSWORD?.length);

// 2. Verificar se há caracteres especiais ou problemas de encoding
if (process.env.DB_PASSWORD) {
  console.log('\n🔍 === ANÁLISE DA SENHA ===');
  const password = process.env.DB_PASSWORD;
  console.log('Primeiro char code:', password.charCodeAt(0));
  console.log('Último char code:', password.charCodeAt(password.length - 1));
  console.log('Contém aspas duplas:', password.includes('"'));
  console.log('Contém aspas simples:', password.includes("'"));
  console.log('Contém quebras de linha:', password.includes('\n') || password.includes('\r'));
  console.log('Senha trimmed:', JSON.stringify(password.trim()));
}

// 3. Tentar criar o pool exatamente como no database.js
console.log('\n🔧 === CRIANDO POOL DE CONEXÃO ===');
try {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'skina_ecopecas',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  console.log('✅ Pool criado com sucesso');
  
  // 4. Tentar a mesma query que o MercadoLivreIntegrationService executa
  console.log('\n🔍 === TESTANDO QUERY ESPECÍFICA ===');
  const { rows } = await pool.query('SELECT key, value FROM ml_sync_config LIMIT 1');
  console.log('✅ Query ml_sync_config executada com sucesso');
  console.log('Resultado:', rows);
  
  await pool.end();
  console.log('✅ Pool fechado com sucesso');
  
} catch (error) {
  console.error('❌ ERRO DETALHADO:');
  console.error('Tipo do erro:', error.constructor.name);
  console.error('Mensagem:', error.message);
  console.error('Stack:', error.stack);
  
  // Verificar se é especificamente o erro de senha
  if (error.message.includes('client password must be a string')) {
    console.error('\n🚨 === PROBLEMA IDENTIFICADO ===');
    console.error('O erro confirma que a senha não está sendo reconhecida como string');
    console.error('Tipo atual da senha:', typeof process.env.DB_PASSWORD);
    console.error('Valor da senha:', JSON.stringify(process.env.DB_PASSWORD));
    
    // Tentar forçar conversão para string
    console.log('\n🔧 === TENTATIVA DE CORREÇÃO ===');
    try {
      const forcedStringPassword = String(process.env.DB_PASSWORD || '');
      console.log('Senha forçada como string:', JSON.stringify(forcedStringPassword));
      
      const testPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'skina_ecopecas',
        password: forcedStringPassword,
        port: process.env.DB_PORT || 5432,
        max: 1,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 2000,
      });
      
      const testResult = await testPool.query('SELECT 1 as test');
      console.log('✅ Conexão com senha forçada funcionou!');
      await testPool.end();
      
    } catch (forceError) {
      console.error('❌ Mesmo com conversão forçada, erro persiste:', forceError.message);
    }
  }
}

console.log('\n🏁 === DIAGNÓSTICO CONCLUÍDO ===');
process.exit(0);