import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import Preference from '../models/Preference.js';

const router = express.Router();

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

// Middleware de autenticação
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Middleware de autorização para administradores
const requireAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar esta rota.'
      });
    }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado'
    });
  }
};

// GET /api/preferences - Listar preferências (PROTEGIDO)
router.get('/', requireAuth, requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'expired']).withMessage('Status inválido'),
  query('environment').optional().isIn(['SANDBOX', 'PRODUCTION']).withMessage('Ambiente inválido'),
  query('startDate').optional().isISO8601().withMessage('Data inicial inválida'),
  query('endDate').optional().isISO8601().withMessage('Data final inválida'),
  query('search').optional().isString().withMessage('Busca deve ser uma string')
], handleValidationErrors, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      environment: req.query.environment,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const preferences = await Preference.findAll(filters);
    const total = await Preference.count(filters);

    res.json({
      success: true,
      data: {
        preferences: preferences.map(p => p.toJSON()),
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          pages: Math.ceil(total / filters.limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar preferências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/preferences/stats - Estatísticas das preferências (PROTEGIDO)
router.get('/stats', requireAuth, requireAdmin, [
  query('startDate').optional().isISO8601().withMessage('Data inicial inválida'),
  query('endDate').optional().isISO8601().withMessage('Data final inválida')
], handleValidationErrors, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const stats = await Preference.getStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas das preferências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/preferences/:id - Obter detalhes de uma preferência (PROTEGIDO)
router.get('/:id', requireAuth, requireAdmin, [
  param('id').isUUID().withMessage('ID deve ser um UUID válido')
], handleValidationErrors, async (req, res) => {
  try {
    const preference = await Preference.findById(req.params.id);
    
    if (!preference) {
      return res.status(404).json({
        success: false,
        message: 'Preferência não encontrada'
      });
    }

    res.json({
      success: true,
      data: preference.toJSON()
    });
  } catch (error) {
    console.error('Erro ao buscar preferência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/preferences/preference/:preferenceId - Buscar por preference_id do MP (PROTEGIDO)
router.get('/preference/:preferenceId', requireAuth, requireAdmin, [
  param('preferenceId').notEmpty().withMessage('ID da preferência é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const preference = await Preference.findByPreferenceId(req.params.preferenceId);
    
    if (!preference) {
      return res.status(404).json({
        success: false,
        message: 'Preferência não encontrada'
      });
    }

    res.json({
      success: true,
      data: preference.toJSON()
    });
  } catch (error) {
    console.error('Erro ao buscar preferência por preference_id:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/preferences/order/:orderId - Buscar por order_id (PROTEGIDO)
router.get('/order/:orderId', requireAuth, requireAdmin, [
  param('orderId').isUUID().withMessage('ID do pedido deve ser um UUID válido')
], handleValidationErrors, async (req, res) => {
  try {
    const preference = await Preference.findByOrderId(req.params.orderId);
    
    if (!preference) {
      return res.status(404).json({
        success: false,
        message: 'Preferência não encontrada para este pedido'
      });
    }

    res.json({
      success: true,
      data: preference.toJSON()
    });
  } catch (error) {
    console.error('Erro ao buscar preferência por order_id:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/preferences/:id/status - Atualizar status da preferência (PROTEGIDO)
router.put('/:id/status', requireAuth, requireAdmin, [
  param('id').isUUID().withMessage('ID deve ser um UUID válido'),
  body('status').isIn(['pending', 'approved', 'rejected', 'expired']).withMessage('Status inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const { status } = req.body;
    
    const updatedPreference = await Preference.updateStatus(req.params.id, status);
    
    if (!updatedPreference) {
      return res.status(404).json({
        success: false,
        message: 'Preferência não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Status da preferência atualizado com sucesso',
      data: updatedPreference.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar status da preferência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// PUT /api/preferences/:id - Atualizar preferência (PROTEGIDO)
router.put('/:id', requireAuth, requireAdmin, [
  param('id').isUUID().withMessage('ID deve ser um UUID válido'),
  body('status').optional().isIn(['pending', 'approved', 'rejected', 'expired']).withMessage('Status inválido'),
  body('environment').optional().isIn(['SANDBOX', 'PRODUCTION']).withMessage('Ambiente inválido'),
  body('paymentUrl').optional().isURL().withMessage('URL de pagamento inválida'),
  body('expires').optional().isBoolean().withMessage('Expires deve ser um valor booleano'),
  body('expirationDateTo').optional().isISO8601().withMessage('Data de expiração inválida')
], handleValidationErrors, async (req, res) => {
  try {
    const updateData = req.body;
    
    const updatedPreference = await Preference.update(req.params.id, updateData);
    
    if (!updatedPreference) {
      return res.status(404).json({
        success: false,
        message: 'Preferência não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Preferência atualizada com sucesso',
      data: updatedPreference.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar preferência:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router; 