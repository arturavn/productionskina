import { query } from '../config/database.js';

// Script para corrigir URLs duplicadas das imagens do Mercado Livre
async function fixMercadoLivreImageUrls() {
  try {
    console.log('🔧 Iniciando correção das URLs das imagens do Mercado Livre...');
    
    // Buscar todas as URLs com problema
    const problematicUrls = await query(
      "SELECT ml_id, image_url, position FROM product_images_ml WHERE image_url LIKE 'http://http2.mlstatic.com%'"
    );
    
    console.log(`📊 Encontradas ${problematicUrls.rows.length} URLs com problema`);
    
    if (problematicUrls.rows.length === 0) {
      console.log('✅ Nenhuma URL problemática encontrada!');
      return;
    }
    
    // Corrigir cada URL
    let corrected = 0;
    for (const row of problematicUrls.rows) {
      const oldUrl = row.image_url;
      const newUrl = oldUrl.replace('http://http2.mlstatic.com', 'https://http2.mlstatic.com');
      
      await query(
        'UPDATE product_images_ml SET image_url = $1 WHERE ml_id = $2 AND position = $3',
        [newUrl, row.ml_id, row.position]
      );
      
      console.log(`✅ Corrigida URL para ${row.ml_id} posição ${row.position}`);
      corrected++;
    }
    
    // Também corrigir URLs na tabela products
    const problematicProducts = await query(
      "SELECT id, image_url FROM products WHERE image_url LIKE 'http://http2.mlstatic.com%'"
    );
    
    console.log(`📊 Encontrados ${problematicProducts.rows.length} produtos com URLs problemáticas`);
    
    for (const product of problematicProducts.rows) {
      const oldUrl = product.image_url;
      const newUrl = oldUrl.replace('http://http2.mlstatic.com', 'https://http2.mlstatic.com');
      
      await query(
        'UPDATE products SET image_url = $1 WHERE id = $2',
        [newUrl, product.id]
      );
      
      console.log(`✅ Corrigida URL do produto ${product.id}`);
      corrected++;
    }
    
    console.log(`🎉 Correção concluída! ${corrected} URLs corrigidas.`);
    
  } catch (error) {
    console.error('❌ Erro ao corrigir URLs:', error);
    throw error;
  }
}

// Executar o script
fixMercadoLivreImageUrls()
  .then(() => {
    console.log('✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na execução do script:', error);
    process.exit(1);
  });