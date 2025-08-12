import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// GET /api/test/external-reference - Testar busca por external_reference
router.get('/external-reference/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    console.log('🔍 Testando busca por external_reference:', reference);
    
    const order = await Order.findByExternalReference(reference);
    
    if (order) {
      console.log('✅ Pedido encontrado:', {
        id: order.id,
        externalReference: order.externalReference,
        status: order.status
      });
      
      res.json({
        success: true,
        message: 'Pedido encontrado',
        data: {
          id: order.id,
          externalReference: order.externalReference,
          status: order.status,
          mercadoPagoStatus: order.mercadoPagoStatus
        }
      });
    } else {
      console.log('❌ Pedido não encontrado para external_reference:', reference);
      
      res.status(404).json({
        success: false,
        message: 'Pedido não encontrado',
        externalReference: reference
      });
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// GET /api/test/orders - Listar todos os pedidos com external_reference
router.get('/orders', async (req, res) => {
  try {
    const sql = `
      SELECT id, external_reference, status, mercado_pago_status, created_at
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    const { query } = await import('../config/database.js');
    const result = await query(sql);
    
    console.log('Pedidos encontrados:', result.rows.length);
    
    res.json({
      success: true,
      message: 'Pedidos listados',
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router; 