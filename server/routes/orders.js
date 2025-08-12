import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import { OrderItem } from '../models/OrderItemPostgres.js';
import { mercadoPagoService } from '../services/MercadoPagoService.js';
import { sendOrderConfirmationEmail, sendNewOrderNotificationToManagement } from '../services/emailService.js';

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

// Middleware de autenticação
const requireAuth = async (req, res, next) => {
  let userId = null;
  let userEmail = null;
  console.log('🔍 Verificando autenticação...');
  console.log('Headers:', req.headers.authorization ? 'Token presente' : 'Token ausente');
  
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decodificado:', decoded);
      userId = decoded.userId;
      userEmail = decoded.email;
      console.log('👤 User ID extraído:', userId);
      console.log('📧 User Email extraído:', userEmail);
    } catch (err) {
      console.log('❌ Token inválido, continuando sem usuário:', err.message);
    }
  }
  
  req.user = { userId, email: userEmail };
  console.log('🔧 req.user definido:', req.user);
  next();
};

// POST /api/orders - Criar novo pedido
router.post('/', requireAuth, [
  body('items').isArray({ min: 1 }).withMessage('Deve haver pelo menos um item no pedido'),
  body('items.*.productId').notEmpty().withMessage('ID do produto é obrigatório'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser um número inteiro positivo'),
  body('shippingAddress.street').notEmpty().withMessage('Endereço é obrigatório'),
  body('shippingAddress.number').notEmpty().withMessage('Número é obrigatório'),
  body('shippingAddress.neighborhood').notEmpty().withMessage('Bairro é obrigatório'),
  body('shippingAddress.city').notEmpty().withMessage('Cidade é obrigatória'),
  body('shippingAddress.state').notEmpty().withMessage('Estado é obrigatório'),
  body('shippingAddress.zipCode').notEmpty().withMessage('CEP é obrigatório'),
  body('customerName').notEmpty().withMessage('Nome do cliente é obrigatório'),
  body('customerEmail').isEmail().withMessage('Email válido é obrigatório'),
  body('customerPhone').notEmpty().withMessage('Telefone é obrigatório')
], handleValidationErrors, async (req, res) => {
  console.log('Iniciando criação de pedido', req.body);
  try {
    console.log('Itens recebidos:', req.body.items);
    
    // Validar IDs dos produtos
    const invalidItems = req.body.items.filter(item => !item.productId || typeof item.productId !== 'string');
    if (invalidItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Alguns produtos possuem IDs inválidos'
      });
    }

    // 1. Criar pedido principal primeiro
    console.log('📝 Criando pedido com dados:', {
      userId: req.user?.userId,
      reqUser: req.user,
      hasToken: !!req.headers.authorization
    });
    
    const orderData = {
      userId: req.user?.userId || null,
      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.shippingAddress, // Usar mesmo endereço para billing
      subtotal: 0, // Atualizado depois
      shippingCost: 0, // Atualizado depois
      total: 0, // Atualizado depois
      status: 'pending',
      paymentMethod: 'mercadopago',
      paymentStatus: 'pending',
      notes: req.body.notes || '', // Usar apenas as notas fornecidas pelo usuário
      // Informações do cliente
      customerName: req.body.customerName,
      customerLastName: req.body.customerLastName,
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone,
      // Informações da transportadora
      shippingMethod: req.body.shippingMethod || null
    };

    console.log('📋 OrderData:', orderData);
    const newOrder = await Order.create(orderData);
    console.log('✅ Pedido criado:', newOrder.id, 'User ID:', newOrder.userId);

    // 2. Processar itens com validação rigorosa
    const orderItems = [];
    let subtotal = 0;

    for (const item of req.body.items) {
      console.log('Processando item:', item);
      
      const product = await Product.findById(item.productId);
      if (!product) {
        console.error('Produto não encontrado:', item.productId);
        await Order.delete(newOrder.id);
        return res.status(400).json({
          success: false,
          message: `Produto não encontrado: ${item.productId}`
        });
      }

      console.log('Produto encontrado:', product.id);
      console.log('Order ID:', newOrder.id);

      // Verificar se os IDs existem
      if (!newOrder.id) {
        console.error('Order ID é undefined');
        await Order.delete(newOrder.id);
        return res.status(500).json({
          success: false,
          message: 'Erro interno: ID do pedido não foi gerado'
        });
      }

      if (!product.id) {
        console.error('Product ID é undefined');
        await Order.delete(newOrder.id);
        return res.status(500).json({
          success: false,
          message: 'Erro interno: ID do produto não foi encontrado'
        });
      }

      const orderItem = await OrderItem.create({
        order_id: newOrder.id,
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.discountPrice || product.originalPrice,
        total_price: (product.discountPrice || product.originalPrice) * item.quantity
      });

      orderItems.push(orderItem.id);
      subtotal += orderItem.totalPrice;
    }

    // 3. Atualizar pedido com valores calculados
    //const shipping = req.body.shippingCost || (subtotal > 200 ? 0 : 25);
    const shipping = req.body.shippingCost || 0;
    const total = subtotal + shipping;

    // Atualizar pedido com valores calculados
    await Order.update(newOrder.id, {
      subtotal: subtotal,
      shippingCost: shipping,
      totalAmount: total
    });
    
    // Criar preferência de pagamento no Mercado Pago
    console.log('📦 Dados dos itens para Mercado Pago:', req.body.items);
    
    // Buscar os produtos novamente para obter os preços corretos
    const mpItems = [];
    for (const item of req.body.items) {
      console.log('🔍 Buscando produto para MP:', item.productId);
      const product = await Product.findById(item.productId);
      console.log('📦 Produto retornado:', product ? 'Encontrado' : 'Não encontrado');
      if (product) {
        console.log('🔍 Produto encontrado:', {
          id: product.id,
          name: product.name,
          originalPrice: product.originalPrice,
          discountPrice: product.discountPrice,
          priceToUse: product.discountPrice || product.originalPrice
        });
        
        const price = parseFloat(product.discountPrice || product.originalPrice);
        console.log('💰 Preço calculado:', price);
        
        mpItems.push({
          productId: item.productId,
          name: product.name,
          price: price,
          quantity: parseInt(item.quantity || 1),
          imageUrl: product.imageUrl || null,
          description: product.name || 'Produto da Skina Ecopecas'
        });
      }
    }
    
    console.log('🛒 Itens processados para MP:', mpItems);
    
    const mpResponse = await mercadoPagoService.createPreference({
      orderId: newOrder.id.toString(),
      items: mpItems,
      customerName: req.body.customerName,
      customerLastName: req.body.customerLastName, // NOVO: sobrenome
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone,
      shippingCost: shipping,
      shippingAddress: req.body.shippingAddress,
      cpf: req.body.cpf || null
    });
    
    if (!mpResponse.success) {
      console.error('Erro ao criar pagamento no Mercado Pago:', mpResponse.error);
      await Order.delete(newOrder.id);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar pagamento no Mercado Pago',
        details: mpResponse.error
      });
    }
    
    // Atualizar pedido com dados do Mercado Pago
    const paymentUrl = mpResponse.payment_url || mpResponse.init_point || mpResponse.sandbox_init_point;
    console.log('🌍 Ambiente MP:', mpResponse.environment);
    console.log('🔗 URL de pagamento:', paymentUrl);
    
    // Usar o mesmo external_reference que foi enviado para o MP
    const externalReference = newOrder.id.toString();
    console.log('🔗 External Reference criado:', externalReference);
    console.log('🔗 Preference ID do MP:', mpResponse.id);
    
    await Order.update(newOrder.id, {
      mercadoPagoPaymentUrl: paymentUrl,
      mercadoPagoPreferenceId: mpResponse.id,
      mercadoPagoStatus: 'pending',
      externalReference: externalReference
    });
    
    // Buscar o pedido atualizado com todos os dados para o e-mail
    const updatedOrder = await Order.findById(newOrder.id);
    
    // Buscar os itens do pedido para incluir no e-mail
    const orderItemsForEmail = [];
    for (const item of req.body.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        orderItemsForEmail.push({
          productName: product.name,
          quantity: item.quantity,
          price: product.discountPrice || product.originalPrice
        });
      }
    }
    
    // Preparar dados do pedido para o e-mail
    const orderDataForEmail = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      customerName: updatedOrder.customerName,
      customerEmail: updatedOrder.customerEmail,
      total: total,
      createdAt: updatedOrder.createdAt,
      items: orderItemsForEmail
    };
    
    // Enviar e-mail de confirmação (não bloquear a resposta se falhar)
    try {
      await sendOrderConfirmationEmail(orderDataForEmail);
      console.log('✅ E-mail de confirmação enviado para:', updatedOrder.customerEmail);
    } catch (emailError) {
      console.error('❌ Erro ao enviar e-mail de confirmação:', emailError);
      // Não falhar a criação do pedido se o e-mail falhar
    }
    
    // Enviar notificação para a gestão (não bloquear a resposta se falhar)
    try {
      await sendNewOrderNotificationToManagement(orderDataForEmail);
      console.log('✅ Notificação de novo pedido enviada para gestão');
    } catch (emailError) {
      console.error('❌ Erro ao enviar notificação para gestão:', emailError);
      // Não falhar a criação do pedido se o e-mail falhar
    }
    
    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: { 
        order: newOrder,
        payment_url: paymentUrl,
        preference_id: mpResponse.id
      }
    });
  } catch (error) {
    console.error('Erro completo ao criar pedido:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// GET /api/orders - Listar pedidos do usuário
router.get('/', requireAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite deve ser entre 1 e 50')
], handleValidationErrors, async (req, res) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || (!req.user.userId && !req.user.email)) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    const { page = 1, limit = 10 } = req.query;
    
    // Usar o novo método que busca por userId OU email
    const result = await Order.findByUserIdOrEmail(req.user.userId, req.user.email, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    console.log(`🔍 Buscando pedidos para userId: ${req.user.userId}, email: ${req.user.email}`);
    console.log(`📦 Encontrados ${result.orders.length} pedidos`);
    
    res.json({
      success: true,
      data: {
        orders: result.orders,
        pagination: result.pagination
      }
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/orders/:id - Obter detalhes de um pedido específico
router.get('/:id', requireAuth, [
  param('id').notEmpty().withMessage('ID do pedido é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.id;
    let order;
    
    // Verificar se é um UUID (ID) ou order_number
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    
    if (isUUID) {
      order = await Order.findById(orderId);
    } else {
      // Buscar por order_number
      order = await Order.findByOrderNumber(orderId);
    }
    
    if (!order) {
      console.error('Pedido não encontrado para ID/OrderNumber:', orderId);
      return res.status(404).json({
        success: false,
        message: `Pedido ${orderId} não existe`
      });
    }
    
    // Verificar autorização
    console.log('🔍 Verificando autorização...');
    console.log('👤 req.user:', req.user);
    console.log('📦 order.userId:', order.userId);
    console.log('📧 order.customerEmail:', order.customerEmail);
    console.log('🔑 req.user.role:', req.user.role);
    console.log('🆔 Comparação userId:', order.userId, '===', req.user.userId, '=', order.userId === req.user.userId);
    console.log('📧 Comparação email:', order.customerEmail, '===', req.user.email, '=', order.customerEmail === req.user.email);
    
    // Permitir acesso se:
    // 1. O usuário é o dono do pedido (order.userId === req.user.userId)
    // 2. O pedido foi feito com o mesmo e-mail do usuário atual (order.customerEmail === req.user.email)
    // 3. O usuário é admin
    const isOwner = order.userId && order.userId === req.user.userId;
    const isEmailMatch = order.customerEmail && order.customerEmail === req.user.email;
    const isAdmin = req.user.role === 'admin';
    
    console.log('✅ Verificações de autorização:', { isOwner, isEmailMatch, isAdmin });
    
    if (!isOwner && !isEmailMatch && !isAdmin) {
      console.error('❌ Usuário não autorizado a acessar este pedido');
      return res.status(403).json({
        success: false,
        message: 'Usuário não autorizado a acessar este pedido'
      });
    }
    
    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/orders/:id/cancel - Cancelar pedido
router.put('/:id/cancel', requireAuth, [
  param('id').notEmpty().withMessage('ID do pedido é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error('Pedido não encontrado para ID:', orderId);
      return res.status(404).json({
        success: false,
        message: `Pedido com ID ${orderId} não existe`
      });
    }
    
    // Verificar se o pedido pertence ao usuário
    if (order.userId !== req.user.userId) {
      console.error('Usuário não autorizado para cancelar o pedido:', orderId);
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para cancelar este pedido'
      });
    }
    
    // Verificar se o pedido pode ser cancelado
    if (order.status === 'shipped' || order.status === 'completed' || order.status === 'cancelled') {
      console.error('Pedido não pode ser cancelado:', orderId);
      return res.status(400).json({
        success: false,
        message: `Pedidos com status '${order.status}' não podem ser cancelados`
      });
    }
    
    // Cancelar pedido usando o método do modelo
    const cancelledOrder = await Order.cancel(orderId);
    
    // Restaurar estoque dos produtos
    for (const item of order.items) {
      const product = await Product.findById(item.product_id);
      if (product) {
        await Product.updateStock(product.id, product.stock + item.quantity);
      }
    }
    
    res.json({
      success: true,
      message: 'Pedido cancelado com sucesso',
      data: { order: cancelledOrder }
    });
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/orders/last-purchase/:productId - Buscar última compra de um produto específico
router.get('/last-purchase/:productId', requireAuth, [
  param('productId').notEmpty().withMessage('ID do produto é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    // Se não há usuário autenticado, retornar que não há compra anterior
    if (!req.user.userId && !req.user.email) {
      return res.json({
        success: true,
        data: {
          lastPurchase: null
        }
      });
    }
    
    const productId = req.params.productId;
    let lastPurchase = null;
    
    if (req.user.userId) {
      // Buscar por userId se disponível
      lastPurchase = await Order.findLastPurchaseByUserAndProduct(req.user.userId, productId);
    } else if (req.user.email) {
      // Se não há userId mas há email, buscar diretamente por email
      lastPurchase = await Order.findLastPurchaseByUserEmail(req.user.email, productId);
    }
    
    res.json({
      success: true,
      data: {
        lastPurchase
      }
    });
  } catch (error) {
    console.error('Erro ao buscar última compra do produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/orders/any-purchase/:productId - Buscar qualquer pedido de um produto específico (independente do status)
router.get('/any-purchase/:productId', requireAuth, [
  param('productId').notEmpty().withMessage('ID do produto é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    // Se não há usuário autenticado, retornar que não há compra anterior
    if (!req.user.userId && !req.user.email) {
      return res.json({
        success: true,
        data: {
          anyPurchase: null
        }
      });
    }
    
    const productId = req.params.productId;
    let anyPurchase = null;
    
    if (req.user.userId) {
      // Buscar por userId se disponível
      anyPurchase = await Order.findAnyPurchaseByUserAndProduct(req.user.userId, productId);
    } else if (req.user.email) {
      // Se não há userId mas há email, buscar diretamente por email
      anyPurchase = await Order.findAnyPurchaseByUserEmail(req.user.email, productId);
    }
    
    res.json({
      success: true,
      data: {
        anyPurchase
      }
    });
  } catch (error) {
    console.error('Erro ao buscar qualquer pedido do produto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/orders/status/:orderNumber - Consultar status do pedido (rota pública)
router.get('/status/:orderNumber', [
  param('orderNumber').notEmpty().withMessage('Número do pedido é obrigatório')
], handleValidationErrors, async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber;
    const order = await Order.findByOrderNumber(orderNumber);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Pedido ${orderNumber} não encontrado`
      });
    }
    
    // Retornar informações básicas do status e dados do cliente
    res.json({
      success: true,
      data: {
        order_number: order.orderNumber,
        status: order.status,
        payment_status: order.paymentStatus,
        mercado_pago_status: order.mercadoPagoStatus,
        status_detail: order.statusDetail,
        customer_name: order.customerName,
        customer_last_name: order.customerLastName,
        customer_email: order.customerEmail,
        customer_phone: order.customerPhone,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao consultar status do pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;