import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = express.Router();

// Middleware para validação de erros
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  next();
};



// GET /api/cart/:sessionId? - Obter carrinho
router.get('/:sessionId?', async (req, res) => {
  try {
    let { sessionId } = req.params;
    
    // Se não foi fornecido sessionId, gerar um novo
    if (!sessionId) {
      sessionId = uuidv4();
    }
    
    // Obter ou criar carrinho
    let cart = await Cart.findBySessionId(sessionId);
    if (!cart) {
      cart = await Cart.create(sessionId);
    }
    
    res.json({
      success: true,
      data: cart.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/cart/:sessionId/items - Adicionar item ao carrinho
router.post('/:sessionId?/items', [
  body('productId').notEmpty().withMessage('ID do produto é obrigatório'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser um número inteiro positivo')
], handleValidationErrors, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let { sessionId } = req.params;
    
    // Se não foi fornecido sessionId, gerar um novo
    if (!sessionId) {
      sessionId = uuidv4();
    }
    
    // Adicionar item ao carrinho
    const cart = await Cart.addItem(sessionId, productId, quantity);
    
    res.status(201).json({
      success: true,
      message: 'Item adicionado ao carrinho com sucesso',
      data: cart.toJSON()
    });
  } catch (error) {
    console.error('Erro ao adicionar item ao carrinho:', error);
    
    if (error.message.includes('não encontrado') || error.message.includes('estoque')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/cart/:sessionId/items/:productId - Atualizar quantidade do item
router.put('/:sessionId/items/:productId', [
  param('sessionId').notEmpty().withMessage('ID de sessão inválido'),
  param('productId').notEmpty().withMessage('ID do produto inválido'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser um número inteiro positivo')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId, productId } = req.params;
    const { quantity } = req.body;
    
    // Atualizar item no carrinho
    const cart = await Cart.updateItemQuantity(sessionId, productId, quantity);
    
    res.json({
      success: true,
      message: 'Quantidade atualizada com sucesso',
      data: cart.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar item do carrinho:', error);
    
    if (error.message.includes('não encontrado') || error.message.includes('estoque')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/cart/:sessionId/items/:productId - Remover item do carrinho
router.delete('/:sessionId/items/:productId', [
  param('sessionId').notEmpty().withMessage('ID de sessão inválido'),
  param('productId').notEmpty().withMessage('ID do produto inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId, productId } = req.params;
    
    // Remover item do carrinho
    const cart = await Cart.removeItem(sessionId, productId);
    
    res.json({
      success: true,
      message: 'Item removido do carrinho com sucesso',
      data: cart.toJSON()
    });
  } catch (error) {
    console.error('Erro ao remover item do carrinho:', error);
    
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/cart/:sessionId - Limpar carrinho
router.delete('/:sessionId', [
  param('sessionId').notEmpty().withMessage('ID de sessão inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Limpar carrinho
    await Cart.clear(sessionId);
    
    res.json({
      success: true,
      message: 'Carrinho limpo com sucesso',
      sessionId
    });
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/cart/clear - Limpar carrinho (rota simplificada)
router.post('/clear', async (req, res) => {
  try {
    // Obter sessionId do localStorage ou cookie se disponível
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    if (sessionId) {
      // Limpar carrinho específico
      await Cart.clear(sessionId);
      console.log('🧹 Carrinho limpo para sessionId:', sessionId);
    } else {
      // Se não há sessionId, apenas retornar sucesso
      console.log('🧹 Tentativa de limpar carrinho sem sessionId');
    }
    
    res.json({
      success: true,
      message: 'Carrinho limpo com sucesso'
    });
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    
    // Não retornar erro, apenas log
    res.json({
      success: true,
      message: 'Carrinho limpo com sucesso'
    });
  }
});

export default router;