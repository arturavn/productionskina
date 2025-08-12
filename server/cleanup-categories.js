import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'arturnunes',
  host: 'localhost',
  database: 'skina_ecopecas',
  password: process.env.DB_PASSWORD || '',
  port: 5432
});

async function cleanupCategories() {
  try {
    console.log('Removendo categorias antigas que não correspondem ao painel administrativo...');
    
    // Categorias antigas que devem ser removidas
    const oldCategories = ['Motor', 'Suspensão', 'Freios', 'Transmissão', 'Elétrica', 'Carroceria'];
    
    for (const categoryName of oldCategories) {
      const result = await pool.query(
        'DELETE FROM categories WHERE name = $1',
        [categoryName]
      );
      console.log(`Categoria '${categoryName}' removida (${result.rowCount} registros)`);
    }
    
    console.log('Limpeza concluída!');
    
    // Verificar categorias restantes
    const result = await pool.query('SELECT name FROM categories ORDER BY name');
    console.log('Categorias restantes:', result.rows.map(row => row.name));
    
  } catch (error) {
    console.error('Erro ao limpar categorias:', error);
  } finally {
    await pool.end();
  }
}

cleanupCategories();