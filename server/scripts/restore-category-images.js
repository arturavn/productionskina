import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as variáveis de ambiente do diretório pai
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { query } from '../config/database.js';

const restoreCategoryImages = async () => {
  console.log('🔄 Restaurando imagens originais das categorias...');
  
  // Mapeamento das categorias para as imagens originais do lovable-uploads
  // Baseado no padrão encontrado e nas imagens disponíveis
  const categoryImageMappings = [
    { name: 'Motor', imageUrl: '/lovable-uploads/948624a5-574b-4a8f-9a66-483ca0ad0609.png' },
    { name: 'Freios', imageUrl: '/lovable-uploads/223cae08-5df5-4280-b6a4-5fcb31ccedcc.png' },
    { name: 'Suspensão', imageUrl: '/lovable-uploads/68231c1e-52fd-4069-bea9-a9ea852ee7e0.png' },
    { name: 'Transmissão', imageUrl: '/lovable-uploads/25989ba3-557d-41ff-b96c-fb1b7a826c19.png' },
    { name: 'Elétrica', imageUrl: '/lovable-uploads/f857c4a9-64a8-42bd-a633-5002d3e485ce.png' },
    { name: 'Carroceria', imageUrl: '/lovable-uploads/de1a3a69-7f40-4318-b1fa-b8fe9ba24421.png' }
  ];

  try {
    for (const update of categoryImageMappings) {
      const result = await query(
        'UPDATE categories SET image_url = $1 WHERE name = $2 AND active = true',
        [update.imageUrl, update.name]
      );
      
      if (result.rowCount > 0) {
        console.log(`✅ ${update.name}: ${update.imageUrl}`);
      } else {
        console.log(`⚠️  Categoria '${update.name}' não encontrada ou não ativa`);
      }
    }
    
    console.log('\n🎉 Imagens das categorias restauradas com sucesso!');
    
    // Verificar o resultado
    const categories = await query(
      'SELECT name, image_url FROM categories WHERE active = true ORDER BY name'
    );
    
    console.log('\n📋 Categorias atualizadas:');
    categories.rows.forEach(cat => {
      console.log(`   ${cat.name}: ${cat.image_url}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao restaurar imagens das categorias:', error);
  }
};

restoreCategoryImages();

export { restoreCategoryImages };