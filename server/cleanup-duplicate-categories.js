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

async function cleanupCategories() {
  try {
    console.log('🔍 Analisando categorias duplicadas...');
    
    // Buscar todas as categorias
    const categories = await pool.query(`
      SELECT id, name, description, image_url, width_cm, height_cm, length_cm, weight_kg, created_at 
      FROM categories 
      ORDER BY name, created_at
    `);
    
    console.log('📋 Categorias encontradas:');
    const categoryGroups = {};
    
    categories.rows.forEach(cat => {
      const normalizedName = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!categoryGroups[normalizedName]) {
        categoryGroups[normalizedName] = [];
      }
      categoryGroups[normalizedName].push(cat);
    });
    
    console.log('\n🔍 Grupos de categorias similares:');
    const duplicateIds = [];
    
    for (const [normalizedName, group] of Object.entries(categoryGroups)) {
      if (group.length > 1) {
        console.log(`\n📂 Grupo "${normalizedName}" (${group.length} categorias):`);
        
        // Ordenar por: 1) tem dimensões, 2) data de criação
        group.sort((a, b) => {
          const aHasDimensions = a.width_cm !== null || a.height_cm !== null || a.length_cm !== null || a.weight_kg !== null;
          const bHasDimensions = b.width_cm !== null || b.height_cm !== null || b.length_cm !== null || b.weight_kg !== null;
          
          if (aHasDimensions && !bHasDimensions) return -1;
          if (!aHasDimensions && bHasDimensions) return 1;
          
          return new Date(a.created_at) - new Date(b.created_at);
        });
        
        const keepCategory = group[0];
        const removeCategories = group.slice(1);
        
        console.log(`  ✅ MANTER: ${keepCategory.name} (ID: ${keepCategory.id})`);
        console.log(`     Dimensões: ${keepCategory.width_cm || 'null'}x${keepCategory.height_cm || 'null'}x${keepCategory.length_cm || 'null'}cm, ${keepCategory.weight_kg || 'null'}kg`);
        
        removeCategories.forEach(cat => {
          console.log(`  ❌ REMOVER: ${cat.name} (ID: ${cat.id})`);
          console.log(`     Dimensões: ${cat.width_cm || 'null'}x${cat.height_cm || 'null'}x${cat.length_cm || 'null'}cm, ${cat.weight_kg || 'null'}kg`);
          duplicateIds.push(cat.id);
        });
      } else {
        console.log(`✅ "${group[0].name}" - única categoria`);
      }
    }
    
    if (duplicateIds.length > 0) {
      console.log(`\n🗑️ Removendo ${duplicateIds.length} categorias duplicadas...`);
      
      // Primeiro, verificar se há produtos associados às categorias duplicadas
      const productsCheck = await pool.query(`
        SELECT category_id, COUNT(*) as product_count 
        FROM products 
        WHERE category_id = ANY($1)
        GROUP BY category_id
      `, [duplicateIds]);
      
      if (productsCheck.rows.length > 0) {
        console.log('⚠️ Encontrados produtos associados às categorias duplicadas:');
        productsCheck.rows.forEach(row => {
          console.log(`  - Categoria ${row.category_id}: ${row.product_count} produtos`);
        });
        
        // Mover produtos para as categorias principais
        for (const [normalizedName, group] of Object.entries(categoryGroups)) {
          if (group.length > 1) {
            const keepCategory = group[0];
            const removeCategories = group.slice(1);
            
            for (const removeCategory of removeCategories) {
              const updateResult = await pool.query(`
                UPDATE products 
                SET category_id = $1 
                WHERE category_id = $2
              `, [keepCategory.id, removeCategory.id]);
              
              if (updateResult.rowCount > 0) {
                console.log(`📦 Movidos ${updateResult.rowCount} produtos da categoria ${removeCategory.name} para ${keepCategory.name}`);
              }
            }
          }
        }
      }
      
      // Remover as categorias duplicadas
      const deleteResult = await pool.query(`
        DELETE FROM categories 
        WHERE id = ANY($1)
      `, [duplicateIds]);
      
      console.log(`✅ Removidas ${deleteResult.rowCount} categorias duplicadas`);
    } else {
      console.log('✅ Nenhuma categoria duplicada encontrada');
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
    
  } catch (error) {
    console.error('❌ Erro ao limpar categorias:', error);
  } finally {
    await pool.end();
  }
}

cleanupCategories();