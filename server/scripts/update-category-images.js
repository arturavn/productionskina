import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do diretório pai
dotenv.config({ path: path.join(__dirname, '../.env') });

import { query, closePool } from '../config/database.js';

const updateCategoryImages = async () => {
  console.log('🖼️ Atualizando imagens das categorias...');
  
  try {
    const updates = [
      { name: 'Motor', imageUrl: '/images/categories/motor.svg' },
      { name: 'Freios', imageUrl: '/images/categories/freios.svg' },
      { name: 'Suspensão', imageUrl: '/images/categories/suspensao.svg' },
      { name: 'Transmissão', imageUrl: '/images/categories/transmissao.svg' },
      { name: 'Elétrica', imageUrl: '/images/categories/eletrica.svg' },
      { name: 'Carroceria', imageUrl: '/images/categories/carroceria.svg' }
    ];

    for (const update of updates) {
      const result = await query(
        'UPDATE categories SET image_url = $1 WHERE name = $2',
        [update.imageUrl, update.name]
      );
      
      if (result.rowCount > 0) {
        console.log(`✅ ${update.name}: ${update.imageUrl}`);
      } else {
        console.log(`⚠️ Categoria '${update.name}' não encontrada`);
      }
    }
    
    console.log('🎉 Imagens das categorias atualizadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar imagens:', error.message);
  } finally {
    await closePool();
  }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updateCategoryImages();
}

export { updateCategoryImages };