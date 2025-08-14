import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import { Coupon } from '../models/Coupon.js';
import { sendOrderStatusUpdateEmail, sendCouponEmail } from '../services/emailService.js';

const router = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
    files: 10 // Máximo 10 arquivos por vez
  },
  fileFilter: (req, file, cb) => {
    // Aceitar formatos de imagem comuns
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos (JPEG, PNG, GIF, WebP, SVG)'), false);
    }
  }
});

// Middleware para tratar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Middleware para tratar erros do multer
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Arquivo muito grande. Tamanho máximo: 10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Muitos arquivos. Máximo: 10 arquivos'
      });
    }
  }
  if (err.message === 'Apenas arquivos JPEG são permitidos') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next(err);
};

// Middleware de autenticação admin
// Middleware para verificar se o usuário está autenticado
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso requerido',
      message: 'Você precisa estar logado para acessar esta funcionalidade'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skina-ecopecas-secret-key-2024');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'Token de acesso inválido ou expirado'
    });
  }
};

// Middleware para verificar se o usuário tem acesso administrativo (admin ou colaborador)
const requireAdminAccess = (req, res, next) => {
  if (!req.user || !['admin', 'colaborador'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Você não tem permissão para acessar esta funcionalidade'
    });
  }
  next();
};

// Middleware para verificar se o usuário é admin completo
const requireFullAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Apenas administradores completos podem acessar esta funcionalidade'
    });
  }
  next();
};

// Middleware combinado para autenticação + acesso administrativo
const requireAdmin = [requireAuth, requireAdminAccess];

// Middleware combinado para autenticação + admin completo
const requireFullAdminAccess = [requireAuth, requireFullAdmin];



// ===== ROTAS DE PRODUTOS =====

// POST /api/admin/products - Criar novo produto
router.post('/products', requireAdmin, [
  body('name').notEmpty().withMessage('Nome do produto é obrigatório'),
  body('originalPrice').isFloat({ min: 0 }).withMessage('Preço original deve ser um número positivo'),
  body('category').notEmpty().withMessage('Categoria é obrigatória'),
  body('brand').notEmpty().withMessage('Marca é obrigatória'),
  body('inStock').isBoolean().withMessage('inStock deve ser um valor booleano'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Quantidade em estoque deve ser um número inteiro positivo'),
  body('useCategoryDimensions').optional().isBoolean().withMessage('useCategoryDimensions deve ser um valor booleano'),
  body('widthCm').optional().isFloat({ min: 0 }).withMessage('Largura deve ser um número positivo'),
  body('heightCm').optional().isFloat({ min: 0 }).withMessage('Altura deve ser um número positivo'),
  body('lengthCm').optional().isFloat({ min: 0 }).withMessage('Comprimento deve ser um número positivo'),
  body('weightKg').optional().isFloat({ min: 0 }).withMessage('Peso deve ser um número positivo')
], handleValidationErrors, async (req, res) => {
  try {
    // Converter nome da categoria para ID
    let categoryId = req.body.categoryId;
    if (req.body.category && !categoryId) {
      const category = await Category.findByName(req.body.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: `Categoria '${req.body.category}' não encontrada`
        });
      }
      categoryId = category.id;
    }

    // Preparar dados do produto com categoryId
    const productData = {
      ...req.body,
      categoryId: categoryId
    };
    
    const newProduct = await Product.create(productData);
    
    res.status(201).json({
      success: true,
      message: 'Produto criado com sucesso',
      product: newProduct
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    
    // Verificar se é erro de violação de chave única (SKU duplicado)
    if (error.code === '23505' && error.constraint === 'products_sku_key') {
      return res.status(400).json({
        success: false,
        error: 'SKU já existe. Por favor, use um SKU diferente.'
      });
    }
    
    // Outros erros de violação de constraint
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Dados duplicados. Verifique se todos os campos únicos são diferentes.'
      });
    }
    
    // Erro de chave estrangeira (categoria não existe)
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Categoria inválida. Verifique se a categoria selecionada existe.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/products/:id - Atualizar produto
router.put('/products/:id', requireAdmin, [
  param('id').notEmpty().withMessage('ID do produto é obrigatório'),
  body('name').optional().notEmpty().withMessage('Nome do produto não pode estar vazio'),
  body('originalPrice').optional().isFloat({ min: 0 }).withMessage('Preço original deve ser um número positivo'),
  body('category').optional().notEmpty().withMessage('Categoria não pode estar vazia'),
  body('brand').optional().notEmpty().withMessage('Marca não pode estar vazia'),
  body('inStock').optional().isBoolean().withMessage('inStock deve ser um valor booleano'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Quantidade em estoque deve ser um número inteiro positivo')
], handleValidationErrors, async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdForAdmin(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }
    
    // Converter nome da categoria para ID se necessário
    let updateData = { ...req.body };
    if (req.body.category && !req.body.categoryId) {
      const category = await Category.findByName(req.body.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: `Categoria '${req.body.category}' não encontrada`
        });
      }
      updateData.categoryId = category.id;
      delete updateData.category; // Remove o campo category para evitar conflitos
    }
    
    const updatedProduct = await Product.update(productId, updateData);
    
    res.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/products/:id/images - Upload de imagens para produto
router.post('/products/:id/images', requireAdmin, upload.array('images', 10), handleMulterErrors, [
  param('id').isUUID().withMessage('ID do produto deve ser um UUID válido')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: productId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi enviada'
      });
    }

    // Verificar se o produto existe
    const product = await Product.findByIdForAdmin(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }

    // Verificar se é a primeira imagem (será marcada como principal)
    const existingImages = await Product.getImages(productId);
    const isFirstImage = existingImages.length === 0;

    // Salvar cada imagem
    const savedImages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPrimary = isFirstImage && i === 0; // Primeira imagem do primeiro upload é principal
      
      const savedImage = await Product.addImage(
        productId,
        file.buffer,
        file.originalname,
        file.size,
        isPrimary,
        file.mimetype
      );
      
      savedImages.push(savedImage);
    }

    res.status(201).json({
      success: true,
      message: `${files.length} imagem(ns) adicionada(s) com sucesso`,
      images: savedImages
    });
  } catch (error) {
    console.error('Erro ao fazer upload de imagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/products/:id/images - Listar imagens do produto
router.get('/products/:id/images', requireAdmin, [
  param('id').isUUID().withMessage('ID do produto deve ser um UUID válido')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: productId } = req.params;
    
    const images = await Product.getImages(productId);
    
    res.json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('Erro ao buscar imagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/images/:imageId - Buscar dados da imagem
router.get('/images/:imageId', [
  param('imageId').isUUID().withMessage('ID da imagem deve ser um UUID válido')
], handleValidationErrors, async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const imageData = await Product.getImageData(imageId);
    
    if (!imageData) {
      return res.status(404).json({
        success: false,
        error: 'Imagem não encontrada'
      });
    }

    res.set({
      'Content-Type': imageData.mime_type || 'image/jpeg',
      'Content-Disposition': `inline; filename="${imageData.image_name}"`,
      'Cache-Control': 'public, max-age=31536000' // Cache por 1 ano
    });
    
    res.send(imageData.image_data);
  } catch (error) {
    console.error('Erro ao buscar dados da imagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/products/:id/images/:imageId/primary - Definir imagem como principal
router.put('/products/:id/images/:imageId/primary', requireAdmin, [
  param('id').isUUID().withMessage('ID do produto deve ser um UUID válido'),
  param('imageId').isUUID().withMessage('ID da imagem deve ser um UUID válido')
], handleValidationErrors, async (req, res) => {
  try {
    const { id: productId, imageId } = req.params;
    
    const result = await Product.setPrimaryImage(productId, imageId);
    
    res.json({
      success: true,
      message: 'Imagem principal definida com sucesso',
      images: result
    });
  } catch (error) {
    console.error('Erro ao definir imagem principal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/admin/images/:imageId - Deletar imagem
router.delete('/images/:imageId', requireAdmin, [
  param('imageId').isUUID().withMessage('ID da imagem deve ser um UUID válido')
], handleValidationErrors, async (req, res) => {
  try {
    const { imageId } = req.params;
    
    const deletedImage = await Product.deleteImage(imageId);
    
    if (!deletedImage) {
      return res.status(404).json({
        success: false,
        error: 'Imagem não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Imagem deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/admin/products/:id - Deletar produto
router.delete('/products/:id', requireAdmin, [
  param('id').notEmpty().withMessage('ID do produto é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByIdForAdmin(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      });
    }
    
    const deleted = await Product.deletePermanently(productId);
    
    // Verificar se o produto ainda existe (soft delete) ou foi removido permanentemente
    const productAfterDelete = await Product.findByIdForAdmin(productId);
    const isPermanentDelete = !productAfterDelete;
    
    res.json({
      success: true,
      message: isPermanentDelete 
        ? 'Produto removido permanentemente com sucesso'
        : 'Produto desativado com sucesso (estava em pedidos)',
      product: product,
      permanentDelete: isPermanentDelete
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/products/reset-views - Resetar todas as visitas dos produtos
router.post('/products/reset-views', requireAdmin, async (req, res) => {
  try {
    const result = await Product.resetAllViewCounts();
    
    res.json({
      success: true,
      message: 'Todas as visitas dos produtos foram resetadas com sucesso',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Erro ao resetar visitas dos produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/products - Listar todos os produtos (incluindo inativos)
router.get('/products', requireAdmin, [
  query('category').optional().isString().withMessage('Categoria deve ser uma string'),
  query('brand').optional().isString().withMessage('Marca deve ser uma string'),
  query('search').optional().isString().withMessage('Busca deve ser uma string'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Preço mínimo deve ser um número positivo'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Preço máximo deve ser um número positivo'),
  query('inStock').optional().isBoolean().withMessage('inStock deve ser um booleano'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('sortBy').optional().isIn(['name', 'price', 'created_at', 'updated_at']).withMessage('Ordenação inválida'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Ordem de classificação inválida')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      inStock,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      category,
      brand,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock !== undefined ? inStock === 'true' : undefined
    };

    // Remover filtros undefined
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const [products, total] = await Promise.all([
      Product.findAllForAdmin(filters, options),
      Product.countForAdmin(filters)
    ]);

    console.log('🔍 DEBUG ADMIN PRODUCTS:');
    console.log('Filtros aplicados:', filters);
    console.log('Opções de paginação:', options);
    console.log('Total de produtos encontrados:', total);
    console.log('Produtos retornados:', products.length);
    console.log('Produtos:', products.map(p => ({ id: p.id, name: p.name, active: p.active })));

    const totalPages = Math.ceil(total / options.limit);

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

    // Desabilitar cache para debug
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
          currentPage: options.page,
          totalPages,
          totalProducts: total,
          hasNext: options.page < totalPages,
          hasPrev: options.page > 1
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos para admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ===== ROTAS DE PEDIDOS =====

// GET /api/admin/orders - Listar todos os pedidos
router.get('/orders', requireAdmin, [
  query('status').optional().isIn(['pending', 'processing', 'shipped', 'completed', 'cancelled']).withMessage('Status inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100')
], handleValidationErrors, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'created_at',
      sortOrder: 'DESC'
    };
    
    if (status) {
      filters.status = status;
    }
    
    // Buscar pedidos com paginação já aplicada no SQL
    const orders = await Order.findAll(filters);
    
    // Buscar total de pedidos para paginação
    const totalOrders = await Order.count(filters);
    
    res.json({
      orders: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / parseInt(limit)),
        totalOrders: totalOrders,
        hasNext: parseInt(page) * parseInt(limit) < totalOrders,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível listar os pedidos'
    });
  }
});

// GET /api/admin/orders/:id - Obter detalhes de um pedido específico
router.get('/orders/:id', requireAdmin, [
  param('id').notEmpty().withMessage('ID do pedido é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.id;
    let order;
    
    // Primeiro tenta buscar por UUID
    try {
      order = await Order.findById(orderId);
    } catch (error) {
      // Se falhar (não é UUID), tenta buscar por número do pedido
      if (error.code === '22P02') { // Invalid UUID format
        order = await Order.findByOrderNumber(orderId);
      } else {
        throw error;
      }
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado'
      });
    }
    
    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/orders/:id/status - Atualizar status do pedido
router.put('/orders/:id/status', requireAdmin, [
  param('id').notEmpty().withMessage('ID do pedido é obrigatório'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Status inválido'),
  body('trackingCode').optional().isString().withMessage('Código de rastreio deve ser uma string')
], handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, trackingCode } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado'
      });
    }

    // Validar se código de rastreio é obrigatório para status 'shipped'
    if (status === 'shipped' && !trackingCode) {
      return res.status(400).json({
        success: false,
        error: 'Código de rastreio é obrigatório para pedidos enviados'
      });
    }

    const previousStatus = order.status;
    const updatedOrder = await Order.updateStatus(orderId, status, trackingCode);
    
    // Se o status foi alterado para 'confirmed' e não estava confirmado antes, dar baixa no estoque
    if (status === 'confirmed' && previousStatus !== 'confirmed') {
      try {
        // Buscar itens do pedido
        const orderItems = await Order.getOrderItems(orderId);
        
        // Dar baixa no estoque de cada produto
        for (const item of orderItems) {
          await Product.updateStock(
            item.product_id, 
            -item.quantity, 
            `Baixa automática - Pedido ${order.orderNumber} confirmado`,
            req.user.userId || null
          );
        }
        
        console.log(`✅ Estoque atualizado para pedido ${order.orderNumber} - Status: ${status}`);
      } catch (stockError) {
        console.error('Erro ao atualizar estoque:', stockError);
        // Não falhar a atualização do status por erro no estoque
        // mas registrar o erro para investigação
      }
    }
    
    // Enviar e-mail de atualização de status se o status mudou e há e-mail do cliente
    if (status !== previousStatus && (order.customerEmail || order.userEmail)) {
      try {
        // Buscar itens do pedido para incluir no e-mail
        const orderItems = await Order.getOrderItems(orderId);
        
        const orderData = {
          ...updatedOrder,
          items: orderItems
        };
        
        const customerEmail = order.customerEmail || order.userEmail;
        // Adicionar o e-mail do cliente aos dados do pedido
        orderData.customerEmail = customerEmail;
        
        // Mapear status 'confirmed' para 'processing' para o template de e-mail
        const emailStatus = status === 'confirmed' ? 'processing' : status;
        await sendOrderStatusUpdateEmail(orderData, emailStatus, previousStatus);
        
        console.log(`✅ E-mail de atualização de status enviado para ${customerEmail} - Pedido: ${order.orderNumber}`);
      } catch (emailError) {
        console.error('Erro ao enviar e-mail de atualização de status:', emailError);
        // Não falhar a atualização do status por erro no e-mail
      }
    }
    
    res.json({
      success: true,
      message: 'Status do pedido atualizado com sucesso',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/admin/orders/:id - Excluir pedido
router.delete('/orders/:id', requireAdmin, [
  param('id').notEmpty().withMessage('ID do pedido é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado'
      });
    }
    
    // Verificar se o pedido pode ser excluído (apenas pedidos cancelados ou pendentes)
    if (!['cancelled', 'pending'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Apenas pedidos cancelados ou pendentes podem ser excluídos'
      });
    }
    
    await Order.delete(orderId);
    
    res.json({
      success: true,
      message: 'Pedido excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ===== ROTAS DE USUÁRIOS =====

// GET /api/admin/users - Listar todos os usuários
router.get('/users', requireFullAdminAccess, [
  query('role').optional().isIn(['user', 'admin', 'colaborador']).withMessage('Role inválida'),
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100')
], handleValidationErrors, async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (role) {
      filters.role = role;
    }
    
    const users = await User.findAll(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
    
    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    res.json({
      users: paginatedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.length / limit),
        totalUsers: users.length,
        hasNext: endIndex < users.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível listar os usuários'
    });
  }
});

// GET /api/admin/users/:id - Buscar usuário por ID
router.get('/users/:id', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone,
        role: user.role,
        isActive: user.status === 'active',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/users/:id/status - Ativar/Desativar usuário
router.put('/users/:id/status', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório'),
  body('isActive').isBoolean().withMessage('Status deve ser verdadeiro ou falso')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    const updatedUser = await User.update(userId, { status: isActive ? 'active' : 'inactive' });
    
    res.json({
      success: true,
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/users/:id - Editar usuário
router.put('/users/:id', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório'),
  body('name').optional().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('role').optional().isIn(['user', 'admin', 'colaborador']).withMessage('Role deve ser user, admin ou colaborador')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    // Verificar se o email já existe (se foi alterado)
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Este email já está em uso'
        });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    const updatedUser = await User.update(userId, updateData);
    
    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/admin/users/:id - Deletar usuário (soft delete)
router.delete('/users/:id', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    // Não permitir que o admin delete a si mesmo
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode deletar sua própria conta'
      });
    }
    
    const deleted = await User.deletePermanently(userId);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Usuário deletado com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao deletar usuário'
      });
    }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/users/:id/deactivate - Inativar usuário
router.put('/users/:id/deactivate', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    // Não permitir que o admin inative a si mesmo
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode inativar sua própria conta'
      });
    }
    
    const deactivated = await User.deactivate(userId);
    
    if (deactivated) {
      res.json({
        success: true,
        message: 'Usuário inativado com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao inativar usuário'
      });
    }
  } catch (error) {
    console.error('Erro ao inativar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/users/:id/activate - Ativar usuário
router.put('/users/:id/activate', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    const activated = await User.activate(userId);
    
    if (activated) {
      res.json({
        success: true,
        message: 'Usuário ativado com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao ativar usuário'
      });
    }
  } catch (error) {
    console.error('Erro ao ativar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/users/:id/promote - Promover usuário para admin
router.put('/users/:id/promote', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Usuário já é administrador'
      });
    }
    
    const updatedUser = await User.update(userId, { role: 'admin' });
    
    res.json({
      success: true,
      message: 'Usuário promovido para administrador com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao promover usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/users/:id/demote - Rebaixar admin para usuário comum
router.put('/users/:id/demote', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    if (user.role === 'user') {
      return res.status(400).json({
        success: false,
        error: 'Usuário já é um usuário comum'
      });
    }
    
    // Não permitir que o admin rebaixe a si mesmo
    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Você não pode rebaixar sua própria conta'
      });
    }
    
    const updatedUser = await User.update(userId, { role: 'user' });
    
    res.json({
      success: true,
      message: 'Administrador rebaixado para usuário comum com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao rebaixar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/users/:id/promote-collaborator - Promover usuário para colaborador
router.put('/users/:id/promote-collaborator', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    if (user.role === 'colaborador') {
      return res.status(400).json({
        success: false,
        error: 'Usuário já é colaborador'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Administrador não pode ser rebaixado para colaborador'
      });
    }
    
    const updatedUser = await User.update(userId, { role: 'colaborador' });
    
    res.json({
      success: true,
      message: 'Usuário promovido para colaborador com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao promover usuário para colaborador:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// PUT /api/admin/users/:id/demote-collaborator - Rebaixar colaborador para usuário comum
router.put('/users/:id/demote-collaborator', requireFullAdminAccess, [
  param('id').notEmpty().withMessage('ID do usuário é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }
    
    if (user.role === 'user') {
      return res.status(400).json({
        success: false,
        error: 'Usuário já é um usuário comum'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Administrador não pode ser rebaixado através desta rota'
      });
    }
    
    if (user.role !== 'colaborador') {
      return res.status(400).json({
        success: false,
        error: 'Usuário não é colaborador'
      });
    }
    
    const updatedUser = await User.update(userId, { role: 'user' });
    
    res.json({
      success: true,
      message: 'Colaborador rebaixado para usuário comum com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao rebaixar colaborador:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ===== ROTAS DE CATEGORIAS =====

// PUT /api/admin/categories/:id - Atualizar dimensões da categoria
router.put('/categories/:id', requireAdmin, [
  param('id').notEmpty().withMessage('ID da categoria é obrigatório'),
  body('widthCm').optional().isFloat({ min: 0 }).withMessage('Largura deve ser um número positivo'),
  body('heightCm').optional().isFloat({ min: 0 }).withMessage('Altura deve ser um número positivo'),
  body('lengthCm').optional().isFloat({ min: 0 }).withMessage('Comprimento deve ser um número positivo'),
  body('weightKg').optional().isFloat({ min: 0 }).withMessage('Peso deve ser um número positivo')
], handleValidationErrors, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { widthCm, heightCm, lengthCm, weightKg } = req.body;
    
    // Verificar se a categoria existe
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Categoria não encontrada'
      });
    }
    
    // Preparar dados para atualização (apenas dimensões)
    const updateData = {};
    if (widthCm !== undefined) updateData.widthCm = widthCm;
    if (heightCm !== undefined) updateData.heightCm = heightCm;
    if (lengthCm !== undefined) updateData.lengthCm = lengthCm;
    if (weightKg !== undefined) updateData.weightKg = weightKg;
    
    const updatedCategory = await Category.update(categoryId, updateData);
    
    if (updatedCategory) {
      res.json({
        success: true,
        message: 'Dimensões da categoria atualizadas com sucesso',
        category: updatedCategory.toJSON()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar categoria'
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ===== ROTAS DE CUPONS =====

// POST /api/admin/coupons - Criar cupom (apenas admin)
router.post('/coupons', requireFullAdminAccess, [
  body('userId').notEmpty().withMessage('ID do usuário é obrigatório'),
  body('discountPercentage').isFloat({ min: 1, max: 100 }).withMessage('Porcentagem de desconto deve ser entre 1 e 100'),
  body('expiresAt').optional().isISO8601().withMessage('Data de expiração deve ser uma data válida')
], handleValidationErrors, async (req, res) => {
  try {
    const { userId, discountPercentage, expiresAt } = req.body;

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Criar cupom
    const couponData = {
      userId,
      discountPercentage,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias por padrão
      createdBy: req.user.userId
    };

    const coupon = await Coupon.create(couponData);

    // Enviar email para o usuário
    try {
      await sendCouponEmail(user.email, user.name, coupon.code, coupon.discountPercentage, coupon.expiresAt);
    } catch (emailError) {
      console.error('Erro ao enviar email do cupom:', emailError);
      // Não falha a criação do cupom se o email falhar
    }

    res.status(201).json({
      success: true,
      message: 'Cupom criado e enviado por email com sucesso',
      coupon
    });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ===== ROTAS DE RELATÓRIOS =====

// GET /api/admin/dashboard - Obter dados do dashboard
router.get('/dashboard', requireFullAdminAccess, async (req, res) => {
  try {
    // Buscar estatísticas do banco de dados
    const [productStats, userStats, orderStats, salesByCategory, bestSellers, conversionMetrics] = await Promise.all([
      Product.getStats(),
      User.getStats(),
      Order.getStats(),
      Order.getSalesByCategory(),
      Product.findBestSellers(10),
      Order.getConversionMetrics()
    ]);
    
    // Buscar produtos com baixo estoque
    const lowStockProducts = await Product.findLowStock(5);
    
    // Buscar vendas dos últimos 7 dias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    
    const salesData = await Order.getSalesByPeriod(startDate, endDate);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalProducts: productStats.total,
          totalUsers: userStats.total,
          totalOrders: orderStats.total,
          totalRevenue: parseFloat(orderStats.totalRevenue || 0)
        },
        ordersByStatus: orderStats.byStatus,
        lowStockProducts: lowStockProducts.map(p => p.toJSON()),
        salesChart: salesData,
        salesByCategory: salesByCategory,
        bestSellers: bestSellers.map(p => p.toJSON()),
        conversionMetrics: conversionMetrics
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;