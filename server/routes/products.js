import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

// Middleware para validação de erros
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/products - Listar produtos com filtros
router.get('/', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      brand: req.query.brand,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      inStock: req.query.inStock === 'true' ? true : req.query.inStock === 'false' ? false : undefined,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || 'name',
      sortOrder: req.query.sortOrder || 'asc'
    };
    
    const [products, totalProducts] = await Promise.all([
      Product.findAll(filters),
      Product.count(filters)
    ]);
    
    const totalPages = Math.ceil(totalProducts / filters.limit);
    
    // Adicionar URLs das imagens aos produtos
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const productData = product.toJSON();
        const images = await Product.getImages(product.id);
        
        // Priorizar imagens do Mercado Livre se o produto tiver ml_id
        if (productData.ml_id) {
          const mlImages = await Product.getMercadoLivreImages(productData.ml_id);
          if (mlImages.length > 0) {
            // Usar a primeira imagem do ML como principal
            productData.image = mlImages[0].image_url;
            productData.imageUrl = mlImages[0].image_url;
            // Adicionar todas as imagens do ML
            productData.mlImages = mlImages.map(img => img.image_url);
          } else if (images.length > 0) {
            // Fallback para imagens da tabela product_images
            const primaryImage = images.find(img => img.is_primary) || images[0];
            productData.imageUrl = `/api/products/images/${primaryImage.id}`;
            productData.image = `/api/products/images/${primaryImage.id}`;
            productData.mlImages = null;
          } else {
            // Manter imageUrl original e mapear para o campo image também
            productData.image = productData.imageUrl;
            productData.mlImages = null;
          }
        } else if (images.length > 0) {
          // Para produtos sem ml_id, usar imagens da tabela product_images
          const primaryImage = images.find(img => img.is_primary) || images[0];
          productData.imageUrl = `/api/products/images/${primaryImage.id}`;
          productData.image = `/api/products/images/${primaryImage.id}`;
          productData.mlImages = null;
        } else {
          // Manter imageUrl original e mapear para o campo image também
          productData.image = productData.imageUrl;
          productData.mlImages = null;
        }
        
        return productData;
      })
    );
    
    // Desabilitar cache para evitar problemas com HTTP 304
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      data: {
        products: productsWithImages,
        pagination: {
          currentPage: filters.page,
          totalPages,
          totalProducts,
          hasNext: filters.page < totalPages,
          hasPrev: filters.page > 1
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/category/:category - Buscar produtos por categoria
router.get('/category/:category', [
  param('category').notEmpty().withMessage('Categoria é obrigatória'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('brand').optional()
], handleValidationErrors, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20, brand } = req.query;

    const filters = {
      category: category,
      brand: brand,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const [products, totalProducts] = await Promise.all([
      Product.findAll(filters),
      Product.count(filters)
    ]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Nenhum produto encontrado na categoria ${category}`
      });
    }

    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    // Adicionar URLs das imagens aos produtos
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const productData = product.toJSON();
        const images = await Product.getImages(product.id);
        
        if (images.length > 0) {
          const primaryImage = images.find(img => img.is_primary) || images[0];
          productData.imageUrl = `/api/products/images/${primaryImage.id}`;
        }
        
        return productData;
      })
    );

    res.json({
      success: true,
      data: {
        category,
        products: productsWithImages,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos por categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/featured - Produtos em destaque
router.get('/featured', async (req, res) => {
  try {
    const featuredProducts = await Product.getFeatured(8);

    // Adicionar URLs das imagens aos produtos
    const productsWithImages = await Promise.all(
      featuredProducts.map(async (product) => {
        const productData = product.toJSON();
        const images = await Product.getImages(product.id);
        
        if (images.length > 0) {
          const primaryImage = images.find(img => img.is_primary) || images[0];
          productData.imageUrl = `/api/products/images/${primaryImage.id}`;
        }
        
        return productData;
      })
    );

    res.json({
      success: true,
      data: {
        products: productsWithImages,
        total: productsWithImages.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos em destaque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/brands - Listar todas as marcas
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.getAllBrands();
    
    res.json({
      success: true,
      data: {
        brands: brands.map(brand => ({
          id: brand.brand,
          name: brand.brand,
          productCount: brand.count
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/:id/images - Buscar imagens do produto (rota pública)
router.get('/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    
    // Primeiro, tentar buscar por ID (UUID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      product = await Product.findById(id);
    } else {
      // Se não for UUID, tentar buscar por slug
      product = await Product.findBySlug(id);
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Produto com identificador ${id} não foi encontrado`
      });
    }
    
    const images = await Product.getImages(product.id);
    
    res.json({
      success: true,
      data: {
        images: images
      }
    });
  } catch (error) {
    console.error('Erro ao buscar imagens do produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/images/:imageId - Servir imagem do produto (rota pública)
router.get('/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const imageData = await Product.getImageData(imageId);
    
    if (!imageData) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }
    
    // Headers CORS específicos para imagens
    res.set({
      'Content-Type': imageData.mime_type || 'image/jpeg',
      'Content-Disposition': `inline; filename="${imageData.image_name}"`,
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*', // Permitir qualquer origem para imagens
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    
    res.send(imageData.image_data);
  } catch (error) {
    console.error('Erro ao servir imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/products/:id - Buscar produto por ID ou slug
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    
    // Primeiro, tentar buscar por ID (UUID)
    // UUIDs têm formato específico com hífens
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      product = await Product.findById(id);
      
      // Se encontrou o produto por UUID, redirecionar para a URL com slug (301 Redirect)
      if (product && product.slug) {
        return res.redirect(301, `/api/products/${product.slug}`);
      }
    } else {
      // Se não for UUID, tentar buscar por slug
      product = await Product.findBySlug(id);
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Produto com identificador ${id} não foi encontrado`
      });
    }
    
    // Incrementar contador de visitas (não bloquear a resposta se falhar)
    Product.incrementViewCount(product.id)
      .then(newCount => {
        console.log(`✅ Visitas incrementadas para produto ${product.id}: ${newCount}`);
      })
      .catch(error => {
        console.error('❌ Erro ao incrementar contador de visitas:', error);
      });
    
    // Buscar imagens do produto
    const images = await Product.getImages(product.id);
    const productData = product.toJSON();
    
    // Priorizar imagens do Mercado Livre se o produto tiver ml_id
    if (productData.ml_id) {
      const mlImages = await Product.getMercadoLivreImages(productData.ml_id);
      if (mlImages.length > 0) {
        // Usar a primeira imagem do ML como principal
        productData.image = mlImages[0].image_url;
        productData.imageUrl = mlImages[0].image_url;
        // Adicionar todas as imagens do ML
        productData.mlImages = mlImages.map(img => img.image_url);
      } else if (images.length > 0) {
        // Fallback para imagens da tabela product_images
        const primaryImage = images.find(img => img.is_primary) || images[0];
        productData.imageUrl = `/api/products/images/${primaryImage.id}`;
        productData.image = `/api/products/images/${primaryImage.id}`;
      } else {
        // Manter imageUrl original e mapear para o campo image também
        productData.image = productData.imageUrl;
      }
    } else if (images.length > 0) {
      // Para produtos sem ml_id, usar imagens da tabela product_images
      const primaryImage = images.find(img => img.is_primary) || images[0];
      productData.imageUrl = `/api/products/images/${primaryImage.id}`;
      productData.image = `/api/products/images/${primaryImage.id}`;
    } else {
      // Manter imageUrl original e mapear para o campo image também
      productData.image = productData.imageUrl;
    }
    
    res.json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Converter ID temporário para real
router.get('/temp/:tempId', async (req, res) => {
  try {
    console.log('Buscando produto com tempId:', req.params.tempId);
    
    // Opção 1: Buscar por tempId (se existir no modelo)
    // const product = await Product.findOne({ tempId: req.params.tempId });
    
    // Opção 2: Buscar diretamente pelo ID (se o ID temporário for o próprio _id)
    const product = await Product.findById(req.params.tempId);
    
    if (!product) {
      console.log('Produto não encontrado para tempId:', req.params.tempId);
      return res.status(404).json({ 
        success: false, 
        message: 'Produto não encontrado' 
      });
    }
    
    console.log('Produto encontrado:', product._id);
    res.json({ 
      success: true, 
      realId: product._id || product.id
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// Rota para validar produtos por múltiplos critérios
router.post('/validate', [
  body('items').isArray({ min: 1 }).withMessage('Deve haver pelo menos um item para validar'),
  body('items.*.id').notEmpty().withMessage('ID do produto é obrigatório'),
  body('items.*.name').notEmpty().withMessage('Nome do produto é obrigatório'),
  body('items.*.sku').optional(),
], handleValidationErrors, async (req, res) => {
  try {
    const { items } = req.body;
    const validatedItems = [];
    const errors = [];

    for (const item of items) {
      let product = null;
      
      // Tentar encontrar o produto por ID primeiro
      if (item.id) {
        product = await Product.findById(item.id);
      }
      
      // Se não encontrou por ID, tentar por SKU
      if (!product && item.sku) {
        product = await Product.findBySku(item.sku);
      }
      
      // Se ainda não encontrou, tentar por nome (busca aproximada)
      if (!product && item.name) {
        product = await Product.findByName(item.name);
      }
      
      if (product) {
        validatedItems.push({
          originalId: item.id,
          originalName: item.name,
          validatedId: product.id,
          validatedName: product.name,
          sku: product.sku,
          price: product.discountPrice || product.originalPrice,
          inStock: product.inStock,
          stockQuantity: product.stockQuantity
        });
      } else {
        errors.push({
          originalId: item.id,
          originalName: item.name,
          error: 'Produto não encontrado no banco de dados'
        });
      }
    }

    res.json({
      success: true,
      data: {
        validatedItems,
        errors,
        hasErrors: errors.length > 0
      }
    });
  } catch (error) {
    console.error('Erro ao validar produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;