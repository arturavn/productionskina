import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

// Carregar variáveis de ambiente
dotenv.config();

console.log('=== DIAGNÓSTICO COMPLETO DAS VARIÁVEIS DE AMBIENTE ===');
console.log('');

// 1. Verificar todas as variáveis DB_*
console.log('1. VARIÁVEIS DE AMBIENTE DO BANCO:');
const dbVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
dbVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}:`);
  console.log(`  - Valor: '${value}'`);
  console.log(`  - Tipo: ${typeof value}`);
  console.log(`  - Comprimento: ${value ? value.length : 'undefined'}`);
  console.log(`  - É string: ${typeof value === 'string'}`);
  console.log(`  - Tem aspas: ${value && (value.startsWith('"') || value.startsWith("'"))}`);
  console.log('');
});

// 2. Verificar configuração do Pool
console.log('2. CONFIGURAÇÃO DO POOL:');
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'skina_ecopecas',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432
};

Object.entries(poolConfig).forEach(([key, value]) => {
  console.log(`${key}:`);
  console.log(`  - Valor: '${value}'`);
  console.log(`  - Tipo: ${typeof value}`);
  console.log(`  - É string: ${typeof value === 'string'}`);
  console.log('');
});

// 3. Tentar criar pool e testar conexão
console.log('3. TESTE DE CONEXÃO:');
try {
  const pool = new Pool(poolConfig);
  console.log('✅ Pool criado com sucesso');
  
  // Tentar conectar
  const client = await pool.connect();
  console.log('✅ Conexão estabelecida com sucesso!');
  
  const result = await client.query('SELECT NOW()');
  console.log('✅ Query executada:', result.rows[0]);
  
  client.release();
  await pool.end();
  
} catch (error) {
  console.error('❌ Erro na conexão:', error.message);
  console.error('❌ Stack trace:', error.stack);
}

console.log('');
console.log('=== FIM DO DIAGNÓSTICO ===');