const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Dados para gerar produtos aleatórios
const categorias = [
  'Peças de Motor',
  'Sistema de Freios',
  'Suspensão',
  'Transmissão',
  'Sistema Elétrico',
  'Carroceria',
  'Pneus e Rodas',
  'Filtros',
  'Óleos e Fluidos',
  'Acessórios'
];

const marcas = [
  'Bosch', 'Continental', 'Delphi', 'Valeo', 'Mahle',
  'NGK', 'Denso', 'Sachs', 'Monroe', 'Brembo',
  'TRW', 'Febi', 'Lemförder', 'SKF', 'Gates'
];

const prefixosProdutos = [
  'Filtro', 'Vela', 'Pastilha', 'Disco', 'Amortecedor',
  'Mola', 'Correia', 'Bomba', 'Sensor', 'Cabo',
  'Junta', 'Retentor', 'Rolamento', 'Bucha', 'Terminal',
  'Braço', 'Pivô', 'Coifa', 'Reparo', 'Kit'
];

const sufixosProdutos = [
  'Dianteiro', 'Traseiro', 'Direito', 'Esquerdo', 'Superior',
  'Inferior', 'Interno', 'Externo', 'Completo', 'Original',
  'Reforçado', 'Esportivo', 'Premium', 'Standard', 'Heavy Duty'
];

const veiculos = [
  'Gol', 'Palio', 'Corsa', 'Civic', 'Corolla',
  'Fiesta', 'Focus', 'Uno', 'Celta', 'Ka',
  'HB20', 'Onix', 'Prisma', 'Sandero', 'Logan',
  'C3', 'Peugeot 206', '207', '208', 'Clio'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomPrice() {
  return (Math.random() * 500 + 10).toFixed(2);
}

function getRandomStock() {
  return Math.floor(Math.random() * 100) + 1;
}

function generateProductName() {
  const prefixo = getRandomElement(prefixosProdutos);
  const sufixo = getRandomElement(sufixosProdutos);
  const veiculo = getRandomElement(veiculos);
  return `${prefixo} ${sufixo} ${veiculo}`;
}

function generateDescription(name) {
  const marca = getRandomElement(marcas);
  return `${name} da marca ${marca}. Produto de alta qualidade, desenvolvido com tecnologia avançada para garantir máxima durabilidade e performance. Compatível com diversos modelos de veículos. Instalação recomendada por profissional qualificado.`;
}

function generateSpecifications() {
  const specs = [
    'Material: Aço carbono de alta resistência',
    'Tratamento: Galvanizado anticorrosão',
    'Garantia: 12 meses contra defeitos de fabricação',
    'Certificação: ISO 9001',
    'Origem: Nacional/Importado',
    'Peso: ' + (Math.random() * 5 + 0.1).toFixed(2) + 'kg'
  ];
  return specs.slice(0, Math.floor(Math.random() * 3) + 3).join('; ');
}

async function createTestProducts() {
  try {
    console.log('🚀 Iniciando criação de produtos de teste...');
    
    // Primeiro, vamos buscar as categorias existentes
    const categoriesResult = await pool.query('SELECT id, name FROM categories ORDER BY id');
    const existingCategories = categoriesResult.rows;
    
    if (existingCategories.length === 0) {
      console.log('❌ Nenhuma categoria encontrada. Criando categorias primeiro...');
      
      // Criar categorias se não existirem
      for (const categoria of categorias) {
        await pool.query(
          'INSERT INTO categories (name, description, image_url) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
          [categoria, `Categoria de ${categoria}`, '/images/categories/default.jpg']
        );
      }
      
      // Buscar categorias novamente
      const newCategoriesResult = await pool.query('SELECT id, name FROM categories ORDER BY id');
      existingCategories.push(...newCategoriesResult.rows);
    }
    
    console.log(`📂 Encontradas ${existingCategories.length} categorias`);
    
    // Verificar quantos produtos já existem
    const existingProductsResult = await pool.query('SELECT COUNT(*) FROM products');
    const existingCount = parseInt(existingProductsResult.rows[0].count);
    
    console.log(`📦 Produtos existentes: ${existingCount}`);
    
    // Criar 200 produtos
    const productsToCreate = 200;
    let createdCount = 0;
    
    for (let i = 0; i < productsToCreate; i++) {
      const name = generateProductName();
      const description = generateDescription(name);
      const specifications = generateSpecifications();
      const price = getRandomPrice();
      const stock = getRandomStock();
      const category = getRandomElement(existingCategories);
      const marca = getRandomElement(marcas);
      
      // Gerar código único
      const code = `SKU${String(existingCount + i + 1).padStart(6, '0')}`;
      
      try {
        await pool.query(`
          INSERT INTO products (
            name, description, original_price, stock_quantity, category_id, 
            image_url, specifications, brand, sku, active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          name,
          description,
          parseFloat(price),
          stock,
          category.id,
          '/images/products/default-product.jpg',
          JSON.stringify({ details: specifications }),
          marca,
          code,
          true
        ]);
        
        createdCount++;
        
        if (createdCount % 20 === 0) {
          console.log(`✅ Criados ${createdCount}/${productsToCreate} produtos...`);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao criar produto ${name}:`, error.message);
      }
    }
    
    console.log(`🎉 Processo concluído! ${createdCount} produtos criados com sucesso.`);
    
    // Mostrar estatísticas finais
    const finalCountResult = await pool.query('SELECT COUNT(*) FROM products');
    const finalCount = parseInt(finalCountResult.rows[0].count);
    
    const categoryStatsResult = await pool.query(`
      SELECT c.name, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id 
      GROUP BY c.id, c.name 
      ORDER BY product_count DESC
    `);
    
    console.log('\n📊 Estatísticas finais:');
    console.log(`Total de produtos: ${finalCount}`);
    console.log('\nProdutos por categoria:');
    categoryStatsResult.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.product_count} produtos`);
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
  }
}

// Executar o script
if (require.main === module) {
  createTestProducts();
}

module.exports = { createTestProducts };