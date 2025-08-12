import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migração 012 - Criando tabela de preferências...');
    
    // Ler arquivo de migração
    const migrationPath = join(__dirname, '../migrations/012_create_preferences_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Executar migração
    await client.query(migrationSQL);
    
    console.log('✅ Migração 012 executada com sucesso!');
    console.log('📋 Tabela mercado_pago_preferences criada');
    console.log('📊 Índices criados para otimização');
    console.log('🔗 Trigger de updated_at configurado');
    
    // Verificar se a tabela foi criada
    const checkTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'mercado_pago_preferences'
    `);
    
    if (checkTable.rows.length > 0) {
      console.log('✅ Tabela mercado_pago_preferences verificada com sucesso');
      
      // Verificar estrutura da tabela
      const tableStructure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'mercado_pago_preferences'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Estrutura da tabela:');
      tableStructure.rows.forEach(column => {
        console.log(`  - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
    } else {
      console.error('❌ Erro: Tabela não foi criada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar migração se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('🎉 Migração concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

export default runMigration; 