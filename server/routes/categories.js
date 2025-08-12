import express from 'express';
import { query, validationResult } from 'express-validator';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

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



// GET /api/categories - Listar todas as categorias
router.get('/', async (req, res) => {
  try {
    const filters = {
      isActive: req.query.isActive === 'false' ? false : true,
      parentId: req.query.parentId || null,
      search: req.query.search,
      page: parseInt(req.query.page),
      limit: parseInt(req.query.limit),
      sortBy: req.query.sortBy || 'sort_order',
      sortOrder: req.query.sortOrder || 'asc',
      featured: req.query.featured === 'true'
    };
    
    const [categories, totalCategories] = await Promise.all([
      Category.findAll(filters),
      Category.count(filters)
    ]);
    
    res.json({
      success: true,
      data: {
        categories: categories.map(c => c.toJSON()),
        total: totalCategories
      }
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/categories/:slug - Buscar categoria por slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findBySlug(slug);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Categoria com slug '${slug}' não foi encontrada`
      });
    }
    
    res.json({
      success: true,
      data: category.toJSON()
    });
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/categories/:id/products - Buscar produtos de uma categoria
router.get('/:id/products', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('brand').optional().isString().trim(),
  query('minPrice').optional().isNumeric(),
  query('maxPrice').optional().isNumeric(),
  query('inStock').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, brand, minPrice, maxPrice, inStock } = req.query;

    // Verificar se a categoria existe
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada'
      });
    }

    // Buscar produtos da categoria
    const filters = {
      category: id,
      brand,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock !== undefined ? inStock === 'true' : undefined,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const [products, totalProducts, availableBrands, priceRange] = await Promise.all([
      Product.findAll(filters),
      Product.count(filters),
      Product.getBrandsByCategory(id),
      Product.getPriceRangeByCategory(id)
    ]);

    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      success: true,
      data: {
        category,
        products: products.map(p => p.toJSON()),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNext: parseInt(page) < totalPages,
hasPrev: parseInt(page) > 1
        },
        filters: {
          availableBrands,
          priceRange,
          applied: {
            brand,
            minPrice,
            maxPrice,
            inStock
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos da categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/categories/stats - Estatísticas gerais das categorias
router.get('/stats', async (req, res) => {
  try {
    const [categories, categoryStats, overallStats] = await Promise.all([
      Category.findAll({ isActive: true }),
      Category.getStats(),
      Product.getOverallStats()
    ]);

    res.json({
      success: true,
      data: {
        categoryStats,
        overallStats
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;