import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testCategories() {
  try {
    console.log('🔍 Testando categorias no banco de dados...');
    
    // Verificar se a tabela categories existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);
    console.log('📋 Tabela categories existe:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Verificar estrutura da tabela
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        ORDER BY ordinal_position;
      `);
      console.log('🏗️ Estrutura da tabela categories:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Contar categorias
      const count = await pool.query('SELECT COUNT(*) FROM categories');
      console.log('📊 Total de categorias:', count.rows[0].count);
      
      // Buscar todas as categorias
      const categories = await pool.query(`
        SELECT id, name, description, image_url, width_cm, height_cm, length_cm, weight_kg, created_at 
        FROM categories 
        ORDER BY name
      `);
      console.log('📋 Categorias encontradas:');
      categories.rows.forEach(cat => {
        console.log(`  - ID: ${cat.id}, Nome: ${cat.name}`);
        console.log(`    Dimensões: ${cat.width_cm}x${cat.height_cm}x${cat.length_cm}cm, ${cat.weight_kg}kg`);
        console.log(`    Descrição: ${cat.description || 'N/A'}`);
        console.log(`    Imagem: ${cat.image_url || 'N/A'}`);
        console.log('    ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar categorias:', error);
  } finally {
    await pool.end();
  }
}

testCategories();