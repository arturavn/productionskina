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

async function cleanupFinalCategories() {
  try {
    console.log('🔍 Limpando categorias desnecessárias...');
    
    // Categorias que devem ser mantidas
    const keepCategories = [
      'acessorios',
      'farois-eletrica', 
      'freios',
      'motores',
      'suspensao',
      'transmissao'
    ];
    
    // Buscar todas as categorias atuais
    const allCategories = await pool.query(`
      SELECT id, name, description, width_cm, height_cm, length_cm, weight_kg 
      FROM categories 
      ORDER BY name
    `);
    
    console.log('📋 Categorias atuais:');
    const categoriesToKeep = [];
    const categoriesToRemove = [];
    
    allCategories.rows.forEach(cat => {
      if (keepCategories.includes(cat.name.toLowerCase())) {
        categoriesToKeep.push(cat);
        console.log(`  ✅ MANTER: ${cat.name} (${cat.width_cm || 'null'}x${cat.height_cm || 'null'}x${cat.length_cm || 'null'}cm, ${cat.weight_kg || 'null'}kg)`);
      } else {
        categoriesToRemove.push(cat);
        console.log(`  ❌ REMOVER: ${cat.name} (${cat.width_cm || 'null'}x${cat.height_cm || 'null'}x${cat.length_cm || 'null'}cm, ${cat.weight_kg || 'null'}kg)`);
      }
    });
    
    if (categoriesToRemove.length > 0) {
      console.log(`\n🔍 Verificando produtos associados às ${categoriesToRemove.length} categorias a serem removidas...`);
      
      const removeIds = categoriesToRemove.map(cat => cat.id);
      
      // Verificar produtos associados
      const productsCheck = await pool.query(`
        SELECT category_id, COUNT(*) as product_count 
        FROM products 
        WHERE category_id = ANY($1)
        GROUP BY category_id
      `, [removeIds]);
      
      if (productsCheck.rows.length > 0) {
        console.log('⚠️ Encontrados produtos associados às categorias a serem removidas:');
        
        for (const productGroup of productsCheck.rows) {
          const categoryToRemove = categoriesToRemove.find(cat => cat.id === productGroup.category_id);
          console.log(`  - ${categoryToRemove.name}: ${productGroup.product_count} produtos`);
          
          // Tentar encontrar uma categoria similar para mover os produtos
          let targetCategory = null;
          const categoryName = categoryToRemove.name.toLowerCase();
          
          if (categoryName.includes('freio') || categoryName.includes('brake')) {
            targetCategory = categoriesToKeep.find(cat => cat.name === 'freios');
          } else if (categoryName.includes('motor') || categoryName.includes('engine')) {
            targetCategory = categoriesToKeep.find(cat => cat.name === 'motores');
          } else if (categoryName.includes('suspens') || categoryName.includes('suspension')) {
            targetCategory = categoriesToKeep.find(cat => cat.name === 'suspensao');
          } else if (categoryName.includes('transmiss') || categoryName.includes('transmission')) {
            targetCategory = categoriesToKeep.find(cat => cat.name === 'transmissao');
          } else if (categoryName.includes('eletric') || categoryName.includes('farol') || categoryName.includes('light')) {
            targetCategory = categoriesToKeep.find(cat => cat.name === 'farois-eletrica');
          } else {
            // Categoria padrão para itens não categorizados
            targetCategory = categoriesToKeep.find(cat => cat.name === 'acessorios');
          }
          
          if (targetCategory) {
            console.log(`    📦 Movendo produtos para: ${targetCategory.name}`);
            
            const updateResult = await pool.query(`
              UPDATE products 
              SET category_id = $1 
              WHERE category_id = $2
            `, [targetCategory.id, categoryToRemove.id]);
            
            console.log(`    ✅ ${updateResult.rowCount} produtos movidos`);
          }
        }
      }
      
      // Remover as categorias desnecessárias
      console.log(`\n🗑️ Removendo ${categoriesToRemove.length} categorias desnecessárias...`);
      
      const deleteResult = await pool.query(`
        DELETE FROM categories 
        WHERE id = ANY($1)
      `, [removeIds]);
      
      console.log(`✅ ${deleteResult.rowCount} categorias removidas`);
    } else {
      console.log('✅ Nenhuma categoria desnecessária encontrada');
    }
    
    // Mostrar resultado final
    const finalCategories = await pool.query(`
      SELECT id, name, description, width_cm, height_cm, length_cm, weight_kg 
      FROM categories 
      ORDER BY name
    `);
    
    console.log(`\n📊 Resultado final: ${finalCategories.rows.length} categorias`);
    finalCategories.rows.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.width_cm || 'null'}x${cat.height_cm || 'null'}x${cat.length_cm || 'null'}cm, ${cat.weight_kg || 'null'}kg)`);
    });
    
    if (finalCategories.rows.length === 6) {
      console.log('\n🎉 Limpeza concluída! Agora você tem exatamente 6 categorias.');
    } else {
      console.log(`\n⚠️ Atenção: Esperado 6 categorias, mas encontradas ${finalCategories.rows.length}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar categorias:', error);
  } finally {
    await pool.end();
  }
}

cleanupFinalCategories();