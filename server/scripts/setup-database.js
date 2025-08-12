import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, query, closePool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para executar arquivo SQL
const executeSQLFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 Executando: ${path.basename(filePath)}`);
    
    // Executar o arquivo SQL inteiro de uma vez para preservar funções com $$ delimiters
    await query(sql);
    
    console.log(`✅ ${path.basename(filePath)} executado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao executar ${path.basename(filePath)}:`, error.message);
    throw error;
  }
};

// Função principal para configurar o banco
const setupDatabase = async () => {
  console.log('🚀 Iniciando configuração do banco de dados...');
  
  try {
    // Testar conexão
    console.log('🔌 Testando conexão com o banco...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Não foi possível conectar ao banco de dados.');
      console.log('📋 Verifique se:');
      console.log('   - PostgreSQL está instalado e rodando');
      console.log('   - As variáveis de ambiente estão configuradas corretamente');
      console.log('   - O banco de dados existe');
      process.exit(1);
    }
    
    // Executar migrações
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Executar em ordem alfabética
    
    console.log(`📁 Encontradas ${migrationFiles.length} migrações:`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      await executeSQLFile(filePath);
    }
    
    console.log('🎉 Banco de dados configurado com sucesso!');
    console.log('📊 Resumo:');
    
    // Mostrar estatísticas do banco
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM order_items) as total_order_items
    `);
    
    const { total_users, total_categories, total_products, total_orders, total_order_items } = stats.rows[0];
    
    console.log(`   👥 Usuários: ${total_users}`);
    console.log(`   📂 Categorias: ${total_categories}`);
    console.log(`   📦 Produtos: ${total_products}`);
    console.log(`   🛒 Pedidos: ${total_orders}`);
    console.log(`   📋 Itens de pedidos: ${total_order_items}`);
    
    // Mostrar usuário admin
    const adminUser = await query(`
      SELECT name, email, role FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    if (adminUser.rows.length > 0) {
      const admin = adminUser.rows[0];
      console.log(`\n👑 Usuário administrador criado:`);
      console.log(`   Nome: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Senha padrão: password (altere imediatamente!)`);
    }
    
  } catch (error) {
    console.error('💥 Erro durante a configuração:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
};

// Função para resetar o banco (CUIDADO!)
const resetDatabase = async () => {
  console.log('⚠️  ATENÇÃO: Esta operação irá APAGAR TODOS OS DADOS!');
  console.log('🔄 Resetando banco de dados...');
  
  try {
    await testConnection();
    
    // Dropar todas as tabelas
    const dropTables = `
      DROP TABLE IF EXISTS stock_history CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS cart_sessions CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      
      -- Dropar funções
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
      DROP FUNCTION IF EXISTS set_order_number() CASCADE;
      DROP FUNCTION IF EXISTS update_product_stock() CASCADE;
    `;
    
    await query(dropTables);
    console.log('🗑️  Tabelas removidas com sucesso!');
    
    // Recriar tudo
    await setupDatabase();
    
  } catch (error) {
    console.error('💥 Erro durante o reset:', error.message);
    process.exit(1);
  }
};

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--reset')) {
  resetDatabase();
} else if (args.includes('--help')) {
  console.log('🛠️  Script de configuração do banco de dados');
  console.log('');
  console.log('Uso:');
  console.log('  node setup-database.js          # Configurar banco (padrão)');
  console.log('  node setup-database.js --reset  # Resetar e reconfigurar');
  console.log('  node setup-database.js --help   # Mostrar esta ajuda');
  console.log('');
  console.log('Variáveis de ambiente necessárias:');
  console.log('  DB_HOST     # Host do PostgreSQL (padrão: localhost)');
  console.log('  DB_PORT     # Porta do PostgreSQL (padrão: 5432)');
  console.log('  DB_NAME     # Nome do banco (padrão: skina_ecopecas)');
  console.log('  DB_USER     # Usuário do banco (padrão: postgres)');
  console.log('  DB_PASSWORD # Senha do banco (padrão: password)');
} else {
  setupDatabase();
}

export { setupDatabase, resetDatabase, executeSQLFile };