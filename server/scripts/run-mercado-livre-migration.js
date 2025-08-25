import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'skina_ecommerce',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

async function runMigration() {
  let client;
  
  try {
    logInfo('🚀 Iniciando migração do Mercado Livre...');
    logInfo(`Conectando ao banco: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    client = new Client(dbConfig);
    await client.connect();
    logSuccess('Conectado ao banco de dados');
    
    const sqlPath = path.join(__dirname, '..', 'migrations', '015_mercado_livre.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo SQL não encontrado: ${sqlPath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    logInfo('Arquivo SQL carregado com sucesso');
    
    logInfo('🔄 Executando migração...');
    
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    logInfo(`Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.trim()) {
        try {
          await client.query(command);
          logSuccess(`Comando ${i + 1}/${commands.length} executado`);
        } catch (error) {
          // Ignorar erros de objetos duplicados (já existem)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate_object') ||
              error.message.includes('already exists')) {
            logWarning(`Comando ${i + 1}/${commands.length}: ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }
    
    logSuccess('🎉 Migração executada com sucesso!');
    
    logInfo('Verificando tabelas criadas...');
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'mercado_livre_accounts',
        'product_images_ml', 
        'product_sync_state',
        'sync_jobs',
        'sync_logs_ml',
        'ml_sync_config'
      )
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const createdTables = tablesResult.rows.map(row => row.table_name);
    
    logInfo(`Tabelas criadas (${createdTables.length}/6):`);
    createdTables.forEach(table => logSuccess(`  - ${table}`));
    
    if (createdTables.length === 6) {
      logSuccess('✅ Todas as tabelas foram criadas com sucesso!');
    } else {
      logWarning(`⚠️ Apenas ${createdTables.length}/6 tabelas foram criadas`);
    }
    
    logInfo('🔍 Verificando campos ML na tabela products...');
    
    const fieldsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN (
        'ml_id', 'ml_seller_id', 'ml_family_id', 'dimensions', 
        'weight_kg', 'width_cm', 'height_cm', 'length_cm', 
        'weight', 'brand', 'specifications'
      )
      ORDER BY column_name;
    `;
    
    const fieldsResult = await client.query(fieldsQuery);
    const createdFields = fieldsResult.rows.map(row => row.column_name);
    
    logInfo(`Campos ML criados (${createdFields.length}/11):`);
    createdFields.forEach(field => logSuccess(`  - ${field}`));
    
    if (createdFields.length === 11) {
      logSuccess('✅ Todos os campos ML foram criados com sucesso!');
    } else {
      logWarning(`⚠️ Apenas ${createdFields.length}/11 campos ML foram criados`);
    }
    
    logInfo('Verificando configurações padrão...');
    
    const configQuery = 'SELECT key, value FROM ml_sync_config ORDER BY key;';
    const configResult = await client.query(configQuery);
    
    logInfo(`Configurações criadas (${configResult.rows.length}):`);
    configResult.rows.forEach(config => {
      logSuccess(`  - ${config.key}: ${config.value}`);
    });
    
    logSuccess('Migração do Mercado Livre concluída com sucesso!');
    logInfo('Próximos passos:');
    logInfo('  1. Configurar variáveis de ambiente (ML_APP_ID, ML_APP_SECRET)');
    logInfo('  2. Reiniciar o servidor');
    logInfo('  3. Conectar conta do Mercado Livre via interface');
    
  } catch (error) {
    logError('Erro durante a migração:');
    logError(error.message);
    
    if (error.stack) {
      console.error(error.stack);
    }
    
    process.exit(1);
    
  } finally {
    if (client) {
      await client.end();
      logInfo('🔌 Conexão com banco fechada');
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(error => {
    logError('Erro fatal:');
    logError(error.message);
    process.exit(1);
  });
}

export default runMigration;