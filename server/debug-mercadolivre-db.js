#!/usr/bin/env node

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔍 DIAGNÓSTICO MERCADO LIVRE - CONEXÃO POSTGRESQL');
console.log('=' .repeat(60));

// 1. Verificar variáveis de ambiente
console.log('\n📋 VARIÁVEIS DE AMBIENTE:');
console.log('DB_USER:', process.env.DB_USER || 'undefined');
console.log('DB_HOST:', process.env.DB_HOST || 'undefined');
console.log('DB_NAME:', process.env.DB_NAME || 'undefined');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[DEFINIDA]' : 'undefined');
console.log('DB_PORT:', process.env.DB_PORT || 'undefined');

// 2. Testar conexão com as mesmas configurações do database.js
console.log('\n🔌 TESTANDO CONEXÃO POSTGRESQL:');

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

try {
  console.log('Tentando conectar...');
  const client = await pool.connect();
  console.log('✅ Conexão estabelecida com sucesso!');
  
  // 3. Testar query básica
  console.log('\n📊 TESTANDO QUERY BÁSICA:');
  const result = await client.query('SELECT NOW() as current_time');
  console.log('✅ Query executada:', result.rows[0]);
  
  // 4. Testar se a tabela ml_sync_config existe
  console.log('\n🔍 VERIFICANDO TABELA ML_SYNC_CONFIG:');
  try {
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ml_sync_config'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela ml_sync_config existe');
      
      // 5. Testar a query específica que está falhando
      console.log('\n🎯 TESTANDO QUERY ESPECÍFICA DO MERCADO LIVRE:');
      const configResult = await client.query('SELECT key, value FROM ml_sync_config');
      console.log('✅ Query ml_sync_config executada com sucesso!');
      console.log('📋 Registros encontrados:', configResult.rows.length);
      
      if (configResult.rows.length > 0) {
        console.log('📄 Dados:');
        configResult.rows.forEach(row => {
          console.log(`  ${row.key}: ${row.value}`);
        });
      }
    } else {
      console.log('❌ Tabela ml_sync_config NÃO existe!');
      console.log('💡 Isso pode ser a causa do problema.');
    }
  } catch (tableError) {
    console.log('❌ Erro ao verificar tabela ml_sync_config:', tableError.message);
  }
  
  client.release();
  
} catch (error) {
  console.log('❌ ERRO DE CONEXÃO:');
  console.log('Tipo do erro:', error.constructor.name);
  console.log('Mensagem:', error.message);
  console.log('Código:', error.code);
  
  // Diagnóstico específico para erro de senha
  if (error.message.includes('SASL') || error.message.includes('password')) {
    console.log('\n🔐 DIAGNÓSTICO DE SENHA:');
    console.log('- Tipo da senha:', typeof process.env.DB_PASSWORD);
    console.log('- Senha é string?', typeof process.env.DB_PASSWORD === 'string');
    console.log('- Senha tem conteúdo?', process.env.DB_PASSWORD && process.env.DB_PASSWORD.length > 0);
    
    if (process.env.DB_PASSWORD) {
      console.log('- Comprimento da senha:', process.env.DB_PASSWORD.length);
      console.log('- Primeiro caractere:', process.env.DB_PASSWORD.charAt(0));
      console.log('- Último caractere:', process.env.DB_PASSWORD.charAt(process.env.DB_PASSWORD.length - 1));
      console.log('- Contém aspas?', process.env.DB_PASSWORD.includes('"') || process.env.DB_PASSWORD.includes("'"));
    }
  }
  
} finally {
  await pool.end();
  console.log('\n🔌 Pool de conexões fechado');
}

console.log('\n' + '='.repeat(60));
console.log('🏁 DIAGNÓSTICO CONCLUÍDO');