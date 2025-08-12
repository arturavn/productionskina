import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'skina_ecopecas',
  user: 'arturnunes',
  password: ''
});

async function checkFeaturedProducts() {
  try {
    const result = await pool.query('SELECT id, name, featured FROM products WHERE featured = true');
    console.log('Produtos em destaque encontrados:', result.rows.length);
    console.log('Produtos:', result.rows);
    
    const allProducts = await pool.query('SELECT id, name, featured FROM products LIMIT 10');
    console.log('\nTodos os produtos (primeiros 10):');
    allProducts.rows.forEach(p => {
      console.log(`- ${p.name} (featured: ${p.featured})`);
    });
  } catch (error) {
    console.error('Erro ao consultar produtos:', error);
  } finally {
    await pool.end();
  }
}

checkFeaturedProducts();