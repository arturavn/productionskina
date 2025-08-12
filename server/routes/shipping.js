import express from 'express';
import { body, validationResult } from 'express-validator';
import melhorEnvioService from '../services/melhorEnvioService.js';
import Cart from '../models/Cart.js';

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

/**
 * POST /api/shipping/calculate
 * Calcula frete para itens do carrinho
 */
router.post('/calculate', [
  body('sessionId').notEmpty().withMessage('Session ID é obrigatório'),
  body('fromCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de origem inválido'),
  body('toCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de destino inválido'),
  body('token').optional().isString().withMessage('Token deve ser uma string')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId, fromCep, toCep, token } = req.body;
    
    // Buscar carrinho
    const cart = await Cart.findBySessionId(sessionId);
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Carrinho vazio ou não encontrado'
      });
    }

    // Usar token do ambiente se não fornecido
    const authToken = token || process.env.MELHOR_ENVIO_TOKEN;
    if (!authToken) {
      return res.status(500).json({
        success: false,
        message: 'Token de autenticação não configurado'
      });
    }

    // Calcular frete
    const shippingResult = await melhorEnvioService.getShippingOptions(fromCep, toCep, cart.items, authToken);

    if (!shippingResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao calcular frete',
        error: shippingResult.error
      });
    }

    res.json({
      success: true,
      message: 'Frete calculado com sucesso',
      data: {
        options: shippingResult.options,
        cartSummary: {
          totalItems: cart.items.length,
          totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: cart.items.reduce((sum, item) => {
            const price = item.discountPrice || item.originalPrice;
            return sum + (price * item.quantity);
          }, 0)
        }
      }
    });

  } catch (error) {
    console.error('Erro na rota de cálculo de frete:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/shipping/calculate-direct
 * Calcula frete diretamente com produtos fornecidos
 */
router.post('/calculate-direct', [
  body('fromCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de origem inválido'),
  body('toCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de destino inválido'),
  body('products').isArray({ min: 1 }).withMessage('Lista de produtos é obrigatória'),
  body('products.*.id').notEmpty().withMessage('ID do produto é obrigatório'),
  body('products.*.width').isNumeric().withMessage('Largura deve ser numérica'),
  body('products.*.height').isNumeric().withMessage('Altura deve ser numérica'),
  body('products.*.length').isNumeric().withMessage('Comprimento deve ser numérico'),
  body('products.*.weight').isNumeric().withMessage('Peso deve ser numérico'),
  body('products.*.insurance_value').isNumeric().withMessage('Valor do seguro deve ser numérico'),
  body('products.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser um inteiro positivo'),
  body('token').optional().isString().withMessage('Token deve ser uma string')
], handleValidationErrors, async (req, res) => {
  try {
    const { fromCep, toCep, products, token } = req.body;
    
    // Usar token do ambiente se não fornecido
    const authToken = token || process.env.MELHOR_ENVIO_TOKEN;
    if (!authToken) {
      return res.status(500).json({
        success: false,
        message: 'Token de autenticação não configurado'
      });
    }

    // Parâmetros para API
    const apiParams = {
      from: { postal_code: fromCep.replace(/\D/g, '') },
      to: { postal_code: toCep.replace(/\D/g, '') },
      products: products
    };

    // Headers de autenticação
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'User-Agent': 'Skina-Ecopecas-API/1.0'
    };

    // Calcular frete
    const result = await melhorEnvioService.calculoDeFretesPorProdutos(apiParams, headers);
    const formattedOptions = melhorEnvioService.formatShippingOptions(result);

    res.json({
      success: true,
      message: 'Frete calculado com sucesso',
      data: {
        options: formattedOptions,
        raw: result
      }
    });

  } catch (error) {
    console.error('Erro na rota de cálculo direto de frete:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular frete',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/shipping/calculate-individual
 * Calcula frete para um produto individual
 * Segue exatamente a documentação do Melhor Envio
 */
router.post('/calculate-individual', [
  body('fromCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de origem inválido'),
  body('toCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de destino inválido'),
  body('product.id').notEmpty().withMessage('ID do produto é obrigatório'),
  body('product.width').isNumeric().withMessage('Largura deve ser numérica'),
  body('product.height').isNumeric().withMessage('Altura deve ser numérica'),
  body('product.length').isNumeric().withMessage('Comprimento deve ser numérico'),
  body('product.weight').isNumeric().withMessage('Peso deve ser numérico'),
  body('product.insurance_value').isNumeric().withMessage('Valor do seguro deve ser numérico'),
  body('product.quantity').optional().isInt({ min: 1 }).withMessage('Quantidade deve ser um inteiro positivo'),
  body('token').optional().isString().withMessage('Token deve ser uma string')
], handleValidationErrors, async (req, res) => {
  try {
    const { fromCep, toCep, product, token } = req.body;
    
    // Usar token do ambiente se não fornecido
    const authToken = token || process.env.MELHOR_ENVIO_TOKEN;
    if (!authToken) {
      return res.status(500).json({
        success: false,
        message: 'Token de autenticação não configurado'
      });
    }

    // Calcular frete individual
    const result = await melhorEnvioService.calculateIndividualProductShipping(
      product,
      fromCep,
      toCep,
      authToken
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao calcular frete individual',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Frete individual calculado com sucesso',
      data: {
        product: product,
        options: result.options,
        raw: result.data
      }
    });

  } catch (error) {
    console.error('Erro na rota de cálculo individual de frete:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular frete individual',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/shipping/test
 * Rota de teste para verificar se o serviço está funcionando
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Serviço de frete funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * POST /api/shipping/test-individual
 * Rota de teste para cálculo individual seguindo a documentação
 */
router.post('/test-individual', [
  body('fromCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de origem inválido'),
  body('toCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de destino inválido'),
], async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { fromCep, toCep } = req.body;

    // Exemplo da documentação
    const testProduct = {
      id: 'x',
      width: 11,
      height: 17,
      length: 11,
      weight: 0.3,
      insurance_value: 10.1,
      quantity: 1
    };

    const result = await melhorEnvioService.calculateIndividualProductShipping(
      testProduct,
      fromCep, // CEP de origem do usuário
      toCep, // CEP de destino do usuário
      process.env.MELHOR_ENVIO_TOKEN
    );

    res.json({
      success: true,
      message: 'Teste de frete individual executado',
      testProduct,
      result
    });

  } catch (error) {
    console.error('Erro no teste individual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste individual',
      error: error.message
    });
  }
});

/**
 * POST /api/shipping/calculate-by-product-id
 * Calcula frete baseado no ID do produto (busca dimensões do banco)
 */
router.post('/calculate-by-product-id', [
  body('fromCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de origem inválido'),
  body('toCep').matches(/^\d{5}-?\d{3}$/).withMessage('CEP de destino inválido'),
  body('productId').notEmpty().withMessage('ID do produto é obrigatório'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantidade deve ser um inteiro positivo'),
  body('token').optional().isString().withMessage('Token deve ser uma string')
], handleValidationErrors, async (req, res) => {
  try {
    const { fromCep, toCep, productId, quantity = 1, token } = req.body;
    
    // Usar token do ambiente se não fornecido
    const authToken = token || process.env.MELHOR_ENVIO_TOKEN;
    if (!authToken) {
      return res.status(500).json({
        success: false,
        message: 'Token de autenticação não configurado'
      });
    }

    // Buscar produto no banco de dados
    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Extrair dimensões do produto
    let dimensions = {
      width: 10,
      height: 10, 
      length: 10,
      weight: 0.3
    };

    // Priorizar campos específicos de dimensões físicas
    if (product.widthCm || product.heightCm || product.lengthCm || product.weightKg) {
      dimensions = {
        width: product.widthCm || dimensions.width,
        height: product.heightCm || dimensions.height,
        length: product.lengthCm || dimensions.length,
        weight: product.weightKg || dimensions.weight
      };
    } else if (product.dimensions) {
      // Fallback para campo dimensions JSONB
      try {
        const parsedDimensions = typeof product.dimensions === 'string' 
          ? JSON.parse(product.dimensions) 
          : product.dimensions;
        
        dimensions = {
          width: parsedDimensions.width || dimensions.width,
          height: parsedDimensions.height || dimensions.height,
          length: parsedDimensions.length || dimensions.length,
          weight: product.weight || parsedDimensions.weight || dimensions.weight
        };
      } catch (e) {
        console.warn(`Erro ao parsear dimensões do produto ${productId}:`, e);
      }
    }

    // Usar preço com desconto se disponível, senão preço original
    const price = product.discountPrice && product.discountPrice > 0 
      ? product.discountPrice 
      : product.originalPrice;

    // Montar dados do produto para API
    const productData = {
      id: productId,
      width: Math.max(1, Math.round(dimensions.width)),
      height: Math.max(1, Math.round(dimensions.height)),
      length: Math.max(1, Math.round(dimensions.length)),
      weight: Math.max(0.1, dimensions.weight),
      insurance_value: price,
      quantity: quantity
    };

    // Calcular frete individual
    const result = await melhorEnvioService.calculateIndividualProductShipping(
      productData,
      fromCep,
      toCep,
      authToken
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Erro ao calcular frete para o produto',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Frete calculado com sucesso para o produto',
      data: {
        product: {
          id: product.id,
          name: product.name,
          price: price,
          dimensions: productData
        },
        options: result.options,
        raw: result.data
      }
    });

  } catch (error) {
    console.error('Erro na rota de cálculo de frete por ID do produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao calcular frete para o produto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;