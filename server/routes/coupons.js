import express from 'express';
import { Coupon } from '../models/Coupon.js';
import User from '../models/User.js';
import { authenticateToken } from './auth.js';

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar este recurso.'
    });
  }
};
import { sendCouponEmail } from '../services/emailService.js';

const router = express.Router();

// Criar cupom (apenas admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, discountPercentage, expiresAt } = req.body;

    // Validações
    if (!userId || !discountPercentage) {
      return res.status(400).json({
        success: false,
        message: 'userId e discountPercentage são obrigatórios'
      });
    }

    if (discountPercentage <= 0 || discountPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Porcentagem de desconto deve ser entre 1 e 100'
      });
    }

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

// Listar cupons (admin vê todos, usuário vê apenas os seus)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page, limit, isUsed, includeExpired } = req.query;
    const filters = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      includeExpired: includeExpired === 'true'
    };

    if (isUsed !== undefined) {
      filters.isUsed = isUsed === 'true';
    }

    let coupons;
    let total;

    if (req.user.role === 'admin') {
      // Admin vê todos os cupons
      if (req.query.userId) {
        filters.userId = req.query.userId;
      }
      coupons = await Coupon.findAll(filters);
      total = await Coupon.count(filters);
    } else {
      // Usuário vê apenas seus cupons
      filters.userId = req.user.userId;
      coupons = await Coupon.findByUserId(req.user.userId, filters);
      total = await Coupon.count(filters);
    }

    res.json({
      success: true,
      coupons,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar cupons:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Validar cupom
router.post('/validate', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código do cupom é obrigatório'
      });
    }

    const validation = await Coupon.validateCoupon(code, req.user.userId);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    res.json({
      success: true,
      message: 'Cupom válido',
      coupon: validation.coupon
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Calcular desconto
router.post('/calculate-discount', authenticateToken, async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || !subtotal) {
      return res.status(400).json({
        success: false,
        message: 'Código do cupom e subtotal são obrigatórios'
      });
    }

    const validation = await Coupon.validateCoupon(code, req.user.userId);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const discountAmount = Coupon.calculateDiscount(subtotal, validation.coupon.discountPercentage);
    const finalTotal = subtotal - discountAmount;

    res.json({
      success: true,
      discount: {
        percentage: validation.coupon.discountPercentage,
        amount: discountAmount,
        originalTotal: subtotal,
        finalTotal: Math.max(0, finalTotal) // Não pode ser negativo
      }
    });
  } catch (error) {
    console.error('Erro ao calcular desconto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar cupom (apenas admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Coupon.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Cupom não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Cupom deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;