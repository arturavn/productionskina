import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, query, closePool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para verificar se uma tabela existe
const tableExists = async (tableName) => {
  try {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
};

// Função para executar arquivo SQL
const executeSQLFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(`📄 Executando migração: ${fileName}`);
    
    // Executar o arquivo SQL inteiro de uma vez para preservar funções com $$ delimiters
    await query(sql);
    
    console.log(`✅ ${fileName} executado com sucesso!`);
  } catch (error) {
    const fileName = path.basename(filePath);
    
    // Se o erro for sobre objetos já existentes, considerar como sucesso
    if (error.message.includes('already exists') || 
        error.message.includes('já existe') ||
        error.message.includes('duplicate key')) {
      console.log(`⚠️  ${fileName} - Objetos já existem, pulando...`);
      return;
    }
    
    console.error(`❌ Erro ao executar ${fileName}:`, error.message);
    throw error;
  }
};

// Função principal para executar migrações
const runMigrations = async () => {
  console.log('🚀 Iniciando execução das migrações do banco de dados...');
  console.log('📋 Sistema: Skina Ecopeças - E-commerce de Auto Peças');
  console.log('');
  
  try {
    // Testar conexão
    console.log('🔌 Testando conexão com o banco de dados...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Não foi possível conectar ao banco de dados.');
      console.log('');
      console.log('📋 Verifique se:');
      console.log('   - PostgreSQL está instalado e rodando');
      console.log('   - As variáveis de ambiente estão configuradas no arquivo .env');
      console.log('   - O banco de dados existe');
      console.log('   - As credenciais estão corretas');
      process.exit(1);
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('');
    
    // Verificar status atual do banco
    console.log('🔍 Verificando status atual do banco de dados...');
    const tablesExist = await tableExists('users');
    
    if (tablesExist) {
      console.log('⚠️  Tabelas já existem no banco de dados.');
      console.log('📋 As migrações serão executadas de forma segura (objetos existentes serão ignorados).');
    } else {
      console.log('📋 Banco de dados vazio - executando configuração inicial.');
    }
    console.log('');
    
    // Buscar arquivos de migração
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.includes('README'))
      .sort(); // Executar em ordem alfabética/numérica
    
    console.log(`📁 Encontradas ${migrationFiles.length} migrações para executar:`);
    migrationFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');
    
    // Executar cada migração
    for (let i = 0; i < migrationFiles.length; i++) {
      const file = migrationFiles[i];
      const filePath = path.join(migrationsDir, file);
      
      console.log(`🔄 [${i + 1}/${migrationFiles.length}] Processando migração...`);
      await executeSQLFile(filePath);
      console.log('');
    }
    
    console.log('🎉 Todas as migrações foram executadas com sucesso!');
    console.log('');
    
    // Mostrar estatísticas do banco após migrações
    console.log('📊 Resumo do banco de dados:');
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders
    `);
    
    const { total_users, total_categories, total_products, total_orders } = stats.rows[0];
    
    console.log(`   👥 Usuários: ${total_users}`);
    console.log(`   📂 Categorias: ${total_categories}`);
    console.log(`   📦 Produtos: ${total_products}`);
    console.log(`   🛒 Pedidos: ${total_orders}`);
    console.log('');
    
    // Mostrar informações do usuário administrador
    const adminUser = await query(`
      SELECT name, email, role, status FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    if (adminUser.rows.length > 0) {
      const admin = adminUser.rows[0];
      console.log(`👑 Usuário administrador configurado:`);
      console.log(`   Nome: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Status: ${admin.status}`);
      console.log('');
      console.log('⚠️  Senha padrão: password');
      console.log('🔒 IMPORTANTE: Altere a senha do administrador após o primeiro login!');
    }
    
    console.log('');
    console.log('✨ Sistema pronto para uso!');
    console.log('🌐 Acesse o painel administrativo para cadastrar produtos.');
    
  } catch (error) {
    console.error('💥 Erro durante a execução das migrações:', error.message);
    console.log('');
    console.log('🔍 Possíveis soluções:');
    console.log('   - Verifique se o PostgreSQL está rodando');
    console.log('   - Confirme as configurações do arquivo .env');
    console.log('   - Verifique se o banco de dados existe');
    console.log('   - Execute as migrações uma por vez para identificar o problema');
    process.exit(1);
  } finally {
    await closePool();
  }
};

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('🛠️  Script de Execução de Migrações - Skina Ecopeças');
  console.log('');
  console.log('📋 Este script executa todas as migrações do banco de dados em ordem.');
  console.log('');
  console.log('Uso:');
  console.log('  node run-migrations.js          # Executar todas as migrações');
  console.log('  node run-migrations.js --help   # Mostrar esta ajuda');
  console.log('');
  console.log('📁 Migrações incluídas:');
  console.log('  001_create_tables.sql           # Criação das tabelas principais');
  console.log('  002_seed_data.sql               # Dados essenciais (admin + categorias)');
  console.log('  003_add_product_images.sql      # Suporte a múltiplas imagens');
  console.log('  003_create_user_addresses.sql   # Endereços de usuários');
  console.log('  004_add_featured_field.sql      # Campo de produtos em destaque');
  console.log('  005_add_password_reset_fields.sql # Reset de senha');
  console.log('  006_add_shipping_dimensions.sql # Dimensões para frete');
  console.log('  007_Integracao_MP.sql           # Integração Mercado Pago');
  console.log('  007_add_category_dimensions.sql # Dimensões de categorias');
  console.log('  008_add_use_category_dimensions.sql # Uso de dimensões');
  console.log('  008_webhook_events.sql          # Eventos de webhook');
  console.log('  009_fix_order_items_updated_at.sql # Correção de timestamps');
  console.log('  010_add_customer_fields.sql     # Campos de cliente');
  console.log('');
  console.log('🔧 Variáveis de ambiente necessárias (.env):');
  console.log('  DB_HOST     # Host do PostgreSQL (padrão: localhost)');
  console.log('  DB_PORT     # Porta do PostgreSQL (padrão: 5432)');
  console.log('  DB_NAME     # Nome do banco (padrão: skina_ecopecas)');
  console.log('  DB_USER     # Usuário do banco (padrão: postgres)');
  console.log('  DB_PASSWORD # Senha do banco');
  console.log('');
  console.log('📝 Nota: Este script NÃO insere dados fictícios.');
  console.log('   Apenas dados essenciais: 1 admin + 6 categorias funcionais.');
} else {
  runMigrations();
}

export { runMigrations, executeSQLFile };