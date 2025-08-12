import express from 'express';
import Order from '../models/Order.js';
import WebhookEvent from '../models/WebhookEvent.js';
//import { validateMercadoPagoWebhook, logWebhook } from '../middleware/webhookValidation.js';
import { mercadoPagoService } from '../services/MercadoPagoService.js';
import WebhookRetryService from '../services/WebhookRetryService.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

// Rate limiting simples para prevenir avbuso
const rateLimit = new Map();

const checkRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 20; 

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const userLimit = rateLimit.get(ip);
    
    if (now > userLimit.resetTime) {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    } else if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente em breve.'
      });
    } else {
      userLimit.count++;
    }
  }
  
  next();
};

const router = express.Router();

// Instanciar serviço de retry
const webhookRetryService = new WebhookRetryService();

// Middleware de autenticação para rotas protegidas
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
    // Verificar se o usuário é admin
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


const mercadoPagoApi = axios.create({
  baseURL: 'https://api.mercadopago.com',
  headers: {
    'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// GET /api/mercado_pago/events - Listar eventos de webhook (PROTEGIDO)
router.get('/events', requireAuth, requireAdmin, async (req, res) => {
  try {
    const filters = {
      eventType: req.query.eventType,
      method: req.query.method,
      statusCode: req.query.statusCode ? parseInt(req.query.statusCode) : null,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const events = await WebhookEvent.findAll(filters);
    const total = await WebhookEvent.count(filters);

    res.json({
      success: true,
      data: {
        events: events.map(event => event.toJSON()),
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          pages: Math.ceil(total / filters.limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar eventos de webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar eventos de webhook',
      error: error.message
    });
  }
});

// GET /api/mercado_pago/events/stats - Estatísticas dos eventos (PROTEGIDO)
router.get('/events/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const stats = await WebhookEvent.getStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas dos eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas dos eventos',
      error: error.message
    });
  }
});

// GET /api/mercado_pago/events/:id - Detalhes de um evento específico (PROTEGIDO)
router.get('/events/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const event = await WebhookEvent.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento não encontrado'
      });
    }

    res.json({
      success: true,
      data: event.toJSON()
    });
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar evento',
      error: error.message
    });
  }
});

// GET /api/mercado_pago/events/external/:reference - Eventos por external_reference (PROTEGIDO)
router.get('/events/external/:reference', requireAuth, requireAdmin, async (req, res) => {
  try {
    const events = await WebhookEvent.findByExternalReference(req.params.reference);
    
    res.json({
      success: true,
      data: {
        externalReference: req.params.reference,
        events: events.map(event => event.toJSON()),
        count: events.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar eventos por external_reference:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar eventos por external_reference',
      error: error.message
    });
  }
});

// GET /api/mercado_pago/events/payment/:paymentId - Eventos por payment_id (PROTEGIDO)
router.get('/events/payment/:paymentId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const events = await WebhookEvent.findByPaymentId(req.params.paymentId);
    
    res.json({
      success: true,
      data: {
        paymentId: req.params.paymentId,
        events: events.map(event => event.toJSON()),
        count: events.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar eventos por payment_id:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar eventos por payment_id',
      error: error.message
    });
  }
});

// GET /api/orders/external/:reference - Buscar dados completos do pedido
router.get('/orders/external/:reference', requireAuth, async (req, res) => {
  try {
    const externalReference = req.params.reference;
    
    if (!externalReference) {
      return res.status(400).json({
        success: false,
        message: 'External reference é obrigatório'
      });
    }

    console.log('🔍 Buscando pedido por external_reference:', externalReference);

    // Buscar pedido com itens
    const order = await Order.findByExternalReference(externalReference);
    
    if (!order) {
      console.log('❌ Pedido não encontrado:', externalReference);
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verificar se o pedido pertence ao usuário logado (ou se é admin)
    if (order.userId !== req.user.userId && req.user.role !== 'admin') {
      console.log('❌ Usuário não autorizado para acessar pedido:', {
        userId: req.user.userId,
        orderUserId: order.userId,
        externalReference
      });
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar este pedido'
      });
    }

    console.log('✅ Pedido encontrado:', order.id);

    res.json({
      success: true,
      order: order.toJSON()
    });
  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do pedido',
      error: error.message
    });
  }
});

// GET /api/orders/:externalReference/payment-url - Buscar link de pagamento do pedido (PROTEGIDO)
router.get('/orders/:externalReference/payment-url', requireAuth, async (req, res) => {
  try {
    const externalReference = req.params.externalReference;
    
    if (!externalReference) {
      return res.status(400).json({
        success: false,
        message: 'External reference é obrigatório'
      });
    }

    console.log('Buscando link de pagamento para external_reference:', externalReference);

    // Buscar pedido com link de pagamento
    const order = await Order.findByExternalReference(externalReference);
    
    if (!order) {
      console.log('❌ Pedido não encontrado:', externalReference);
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verificar se o pedido pertence ao usuário logado (ou se é admin)
    if (order.userId !== req.user.userId && req.user.role !== 'admin') {
      console.log('❌ Usuário não autorizado para acessar link de pagamento:', {
        userId: req.user.userId,
        orderUserId: order.userId,
        externalReference
      });
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar este link de pagamento'
      });
    }

    console.log('✅ Usuário autorizado para acessar link de pagamento');

    // Verificar se o link de pagamento existe
    if (!order.mercadoPagoPaymentUrl) {
      console.log('❌ Link de pagamento não encontrado para pedido:', order.id);
      return res.status(404).json({
        success: false,
        message: 'Link para pagamento não está mais disponível'
      });
    }

    console.log('✅ Link de pagamento encontrado:', order.mercadoPagoPaymentUrl);

    res.json({
      success: true,
      paymentUrl: order.mercadoPagoPaymentUrl,
      orderId: order.id,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error('❌ Erro ao buscar link de pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar link de pagamento',
      error: error.message
    });
  }
});

// GET /api/payments/:paymentId - Buscar informações do pagamento (PROTEGIDO)
router.get('/payments/:paymentId', checkRateLimit, requireAuth, async (req, res) => {
  try {
    const paymentId = req.params.paymentId;
    
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'ID do pagamento é obrigatório'
      });
    }

    // Validar formato do payment_id (apenas números)
    if (!/^\d+$/.test(paymentId)) {
      console.log('❌ Payment ID inválido:', paymentId);
      return res.status(400).json({
        success: false,
        message: 'ID do pagamento inválido'
      });
    }

    console.log('🔍 Buscando pagamento:', paymentId, 'por usuário:', req.user.userId);

    // Buscar na API do Mercado Pago
    const paymentResponse = await mercadoPagoApi.get(`/v1/payments/${paymentId}`);
    const paymentDetails = paymentResponse.data;

    console.log('📊 Detalhes do pagamento obtidos:', {
      id: paymentDetails.id,
      status: paymentDetails.status,
      external_reference: paymentDetails.external_reference,
      amount: paymentDetails.transaction_amount
    });

    // Verificar se o pagamento pertence ao usuário logado
    if (paymentDetails.external_reference) {
      const order = await Order.findByExternalReference(paymentDetails.external_reference);
      
      if (!order) {
        console.log('❌ Pedido não encontrado para external_reference:', paymentDetails.external_reference);
        return res.status(404).json({
          success: false,
          message: 'Pagamento não encontrado'
        });
      }

      // Verificar se o pedido pertence ao usuário logado (ou se é admin, se for admin ai tem acesso também)
      if (order.userId !== req.user.userId && req.user.role !== 'admin') {
        console.log('❌ Usuário não autorizado para acessar pagamento:', {
          userId: req.user.userId,
          orderUserId: order.userId,
          paymentId: paymentId
        });
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para acessar este pagamento'
        });
      }

      console.log('✅ Usuário autorizado para acessar pagamento');
    }

    // Retornar apenas informações seguras
    res.json({
      success: true,
      payment: {
        id: paymentDetails.id,
        status: paymentDetails.status,
        external_reference: paymentDetails.external_reference,
        transaction_amount: paymentDetails.transaction_amount,
        payment_method: paymentDetails.payment_method,
        date_created: paymentDetails.date_created,
        // Remover email do pagador por segurança
        // payer_email: paymentDetails.payer?.email
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar pagamento:', error);
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pagamento',
      error: error.message
    });
  }
});

// POST /api/webhooks/mercado_pago - Webhook para atualizações de pagamento
router.post('/mercado_pago/:token', 
  express.json({ type: 'application/json' }), 
  //logWebhook,
  // validateMercadoPagoWebhook, // Removido - método inviável pois MP muda assinatura
  async (req, res) => {
    try {
      // Validar token secreto na URL
      const urlToken = req.params.token;
      const expectedToken = process.env.WEBHOOK_SECRET_TOKEN;
      
      if (!expectedToken) {
        console.error('❌ Webhook: WEBHOOK_SECRET_TOKEN não configurado no .env');
        return res.status(500).json({
          success: false,
          message: 'Configuração de webhook inválida'
        });
      }
      
      if (urlToken !== expectedToken) {
        console.error('❌ Webhook: Token inválido na URL');
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
      
      console.log('✅ Webhook: Token válido na URL');
      console.log('🔄 Processando webhook do Mercado Pago...');
      
      // Registrar evento de webhook
      try {
        await WebhookEvent.create({
          eventType: 'mercado_pago_webhook',
          method: req.method,
          url: req.originalUrl,
          headers: req.headers,
          body: req.body,
          sourceIp: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          paymentId: req.body.data?.id?.toString(),
          externalReference: req.body.external_reference
        });
        console.log('✅ Evento de webhook registrado');
      } catch (logError) {
        console.log('⚠️ Erro ao registrar evento de webhook:', logError.message);
      }
      
      // Obter dados do pagamento
      const paymentId = req.body.data?.id;
      if (!paymentId) {
        console.error('❌ Webhook: ID de pagamento não fornecido');
        return res.status(400).json({
          success: false,
          message: 'ID de pagamento não fornecido'
        });
      }

      console.log('ID do pagamento recebido:', paymentId);

      // Buscar detalhes do pagamento na API do Mercado Pago
      try {
        console.log('🔍 Consultando API do Mercado Pago para obter detalhes do pagamento...');
      const paymentResponse = await mercadoPagoApi.get(`/v1/payments/${paymentId}`);
      const paymentDetails = paymentResponse.data;
      
        console.log('Detalhes do pagamento obtidos:', {
        id: paymentDetails.id,
        status: paymentDetails.status,
        external_reference: paymentDetails.external_reference,
          amount: paymentDetails.transaction_amount,
          payment_method: paymentDetails.payment_method?.type,
          created_date: paymentDetails.created_date
      });
      
      // Obter external_reference do pagamento
      const externalReference = paymentDetails.external_reference;
      if (!externalReference) {
        console.error('❌ Webhook: external_reference não encontrado no pagamento');
        return res.status(400).json({
          success: false,
            message: 'External reference não encontrado no pagamento'
        });
      }

        console.log('🔗 External Reference encontrado:', externalReference);

      // Buscar pedido no banco usando external_reference
      const order = await Order.findByExternalReference(externalReference);
      if (!order) {
        console.error('❌ Webhook: Pedido não encontrado no banco com external_reference:', externalReference);
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado no banco'
        });
      }

        console.log('Pedido encontrado no banco:', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          currentStatus: order.status,
          currentPaymentStatus: order.paymentStatus
        });

      // Mapear status do Mercado Pago para status do pedido
      let orderStatus = 'pending';
      let paymentStatus = 'pending';
      let mercadoPagoStatus = paymentDetails.status;

      switch (paymentDetails.status) {
        case 'approved':
          orderStatus = 'processing';
          paymentStatus = 'paid';
          break;
        case 'rejected':
        case 'cancelled':
          orderStatus = 'cancelled';
          paymentStatus = 'failed';
          break;
        case 'refunded':
          orderStatus = 'refunded';
          paymentStatus = 'refunded';
          break;
        case 'pending':
          orderStatus = 'pending';
          paymentStatus = 'pending';
          break;
        case 'in_process':
          orderStatus = 'processing';
          paymentStatus = 'processing';
          break;
        default:
          console.log('⚠️ Status não mapeado:', paymentDetails.status);
      }

      console.log('🔄 Atualizando pedido:', {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: orderStatus,
          oldPaymentStatus: order.paymentStatus,
          newPaymentStatus: paymentStatus,
        mercadoPagoStatus
      });

        // Atualizar pedido no banco com todos os dados do pagamento
        console.log('🔄 Iniciando atualização do pedido...');
        
        const updateData = {
          status: orderStatus,
          paymentStatus: paymentStatus,
          mercadoPagoStatus: mercadoPagoStatus,
          mercadoPagoPaymentId: paymentId,
          mercadoPagoPaymentMethod: paymentDetails.payment_method?.type || 'unknown',
          paymentMethod: paymentDetails.payment_method?.type || 'unknown',
          payment_details: paymentDetails,
          mercadoPagoApprovedAt: paymentDetails.status === 'approved' ? paymentDetails.date_approved || paymentDetails.date_created : null,
          statusDetail: paymentDetails.status_detail || null
        };

        console.log('Dados para atualização:', JSON.stringify(updateData, null, 2));
        console.log('ID do pedido:', order.id);

        try {
          // Usar método específico para atualizar dados do Mercado Pago
          const updatedOrder = await Order.update(order.id, updateData);
          
          if (updatedOrder) {
            console.log('✅ Pedido atualizado com sucesso!');
            console.log('✅ Dados atualizados:', {
              orderId: updatedOrder.id,
              newStatus: updatedOrder.status,
              newPaymentStatus: updatedOrder.paymentStatus,
              mercadoPagoPaymentId: updatedOrder.mercadoPagoPaymentId,
              mercadoPagoPaymentMethod: updatedOrder.mercadoPagoPaymentMethod,
              mercadoPagoStatus: updatedOrder.mercadoPagoStatus
            });
          } else {
            console.error('❌ ERRO: updateMercadoPagoData retornou null');
            throw new Error('Falha ao atualizar pedido - método retornou null');
          }
        } catch (updateError) {
          console.error('❌ ERRO ao atualizar pedido:', updateError.message);
          console.error('❌ Stack trace:', updateError.stack);
          throw updateError;
        }

      // Atualizar o status do webhook event para refletir o novo status do pedido
      try {
        await WebhookEvent.updateStatusByPaymentId(paymentId, orderStatus);
        console.log('✅ Status do webhook event atualizado');
      } catch (error) {
        console.log('⚠️ Erro ao atualizar status do webhook event:', error.message);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso',
        data: {
          orderId: order.id,
            orderNumber: order.orderNumber,
          status: orderStatus,
          paymentStatus,
            mercadoPagoStatus,
            paymentId: paymentId,
            externalReference: externalReference
        }
      });
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.error('❌ Webhook: Pagamento não encontrado na API do Mercado Pago:', paymentId);
          return res.status(400).json({
            success: false,
            message: 'Pagamento não encontrado na API do Mercado Pago'
          });
        }
        
        console.error('❌ Erro ao buscar pagamento na API do Mercado Pago:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Erro ao processar pagamento'
        });
      }
    } catch (error) {
      console.error('❌ Erro no webhook do Mercado Pago:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
);

// Rota para retorno de sucesso do Mercado Pago
router.get('/checkout/success', (req, res) => {
  console.log('✅ Retorno de sucesso do Mercado Pago:', req.query);
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?${new URLSearchParams(req.query)}`);
});

// Rota para retorno de pendente do Mercado Pago
router.get('/checkout/pending', (req, res) => {
  console.log('⏳ Retorno de pendente do Mercado Pago:', req.query);
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/pending?${new URLSearchParams(req.query)}`);
});

// Rota para retorno de falha do Mercado Pago
router.get('/checkout/failure', (req, res) => {
  console.log('❌ Retorno de falha do Mercado Pago:', req.query);
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/failure?${new URLSearchParams(req.query)}`);
});

// ===== ROTAS DE GERENCIAMENTO (PROTEGIDAS) =====

// GET /api/mercado_pago/cache/stats - Estatísticas do cache (PROTEGIDO)
router.get('/cache/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = mercadoPagoService.getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do cache',
      error: error.message
    });
  }
});

// POST /api/mercado_pago/cache/clear - Limpar cache (PROTEGIDO)
router.post('/cache/clear', requireAuth, requireAdmin, async (req, res) => {
  try {
    const clearedCount = mercadoPagoService.clearPaymentCache();
    res.json({
      success: true,
      message: `Cache limpo com sucesso`,
      data: {
        clearedItems: clearedCount
      }
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar cache',
      error: error.message
    });
  }
});

// POST /api/mercado_pago/retry/start - Iniciar serviço de retry (PROTEGIDO)
router.post('/retry/start', requireAuth, requireAdmin, async (req, res) => {
  try {
    await webhookRetryService.start();
    res.json({
      success: true,
      message: 'Serviço de retry iniciado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao iniciar serviço de retry:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao iniciar serviço de retry',
      error: error.message
    });
  }
});

// POST /api/mercado_pago/retry/stop - Parar serviço de retry (PROTEGIDO)
router.post('/retry/stop', requireAuth, requireAdmin, async (req, res) => {
  try {
    await webhookRetryService.stop();
    res.json({
      success: true,
      message: 'Serviço de retry parado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao parar serviço de retry:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao parar serviço de retry',
      error: error.message
    });
  }
});

// POST /api/mercado_pago/retry/process - Processar webhooks falhados manualmente (PROTEGIDO)
router.post('/retry/process', requireAuth, requireAdmin, async (req, res) => {
  try {
    await webhookRetryService.processFailedWebhooks();
    res.json({
      success: true,
      message: 'Processamento de webhooks falhados iniciado'
    });
  } catch (error) {
    console.error('Erro ao processar webhooks falhados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar webhooks falhados',
      error: error.message
    });
  }
});

// GET /api/mercado_pago/retry/stats - Estatísticas do serviço de retry (PROTEGIDO)
router.get('/retry/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await webhookRetryService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do retry service:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do retry service',
      error: error.message
    });
  }
});

export default router;
