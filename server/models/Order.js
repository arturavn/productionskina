import { query, pool, transaction } from '../config/database.js';

class Order {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.user_id;
    this.orderNumber = data.order_number;
    this.status = data.status || 'pending';
    this.subtotal = parseFloat(data.subtotal) || 0;
    this.shippingCost = parseFloat(data.shipping_cost) || 0;
    this.total = parseFloat(data.total_amount) || 0;
    this.paymentMethod = data.payment_method;
    this.paymentStatus = data.payment_status || 'pending';
    this.shippingAddress = data.shipping_address;
    this.billingAddress = data.billing_address;
    this.notes = data.notes;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    
    // Campos de cupom e desconto
    this.couponId = data.coupon_id;
    this.discountAmount = parseFloat(data.discount_amount) || 0;
    
    // Mercado Pago fields
    this.paymentId = data.mercado_pago_payment_id;
    this.paymentDetails = data.payment_details ? (typeof data.payment_details === 'string' ? JSON.parse(data.payment_details) : data.payment_details) : null;
    this.externalReference = data.external_reference;
    this.paymentCreatedAt = data.payment_created_at;
    this.paymentUpdatedAt = data.payment_updated_at;
    this.mercadoPagoPaymentUrl = data.mercado_pago_payment_url;
    this.mercadoPagoPreferenceId = data.mercado_pago_preference_id;
    this.mercadoPagoPaymentId = data.mercado_pago_payment_id;
    this.mercadoPagoStatus = data.mercado_pago_status;
    this.mercadoPagoPaymentMethod = data.mercado_pago_payment_method;
    this.mercadoPagoApprovedAt = data.mercado_pago_approved_at;
    this.statusDetail = data.status_detail;
    
    // Customer information fields
    this.customerName = data.customer_name;
    this.customerLastName = data.customer_last_name;
    this.customerEmail = data.customer_email;
    this.customerPhone = data.customer_phone;
    
    // Tracking information
    this.trackingCode = data.tracking_code;
    
    // Shipping method information
    this.shippingMethod = data.shipping_method ? (typeof data.shipping_method === 'string' ? JSON.parse(data.shipping_method) : data.shipping_method) : null;
    
    // Additional fields for joins
    this.userName = data.user_name;
    this.userEmail = data.user_email;
    this.items = data.items || [];
  }

  // Buscar todos os pedidos com filtros
  static async findAll(filters = {}) {
    let sql = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filtro por usuário
    if (filters.userId) {
      paramCount++;
      sql += ` AND o.user_id = $${paramCount}`;
      params.push(filters.userId);
    }

    // Filtro por status
    if (filters.status) {
      paramCount++;
      sql += ` AND o.status = $${paramCount}`;
      params.push(filters.status);
    }

    // Filtro por status de pagamento
    if (filters.paymentStatus) {
      paramCount++;
      sql += ` AND o.payment_status = $${paramCount}`;
      params.push(filters.paymentStatus);
    }

    // Filtro por período
    if (filters.startDate) {
      paramCount++;
      sql += ` AND o.created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      sql += ` AND o.created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }

    // Filtro por busca (número do pedido, nome ou email do usuário)
    if (filters.search) {
      paramCount++;
      sql += ` AND (o.order_number ILIKE $${paramCount} OR u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    // Ordenação
    const validSortFields = ['created_at', 'total_amount', 'status', 'order_number'];
    const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY o.${sortBy} ${sortOrder}`;

    // Paginação
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    paramCount++;
    sql += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    sql += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await query(sql, params);
    return result.rows.map(row => new Order(row));
  }

  // Contar total de pedidos
  static async count(filters = {}) {
    let sql = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Aplicar os mesmos filtros
    if (filters.userId) {
      paramCount++;
      sql += ` AND o.user_id = $${paramCount}`;
      params.push(filters.userId);
    }

    if (filters.status) {
      paramCount++;
      sql += ` AND o.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.paymentStatus) {
      paramCount++;
      sql += ` AND o.payment_status = $${paramCount}`;
      params.push(filters.paymentStatus);
    }

    if (filters.startDate) {
      paramCount++;
      sql += ` AND o.created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      sql += ` AND o.created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }

    if (filters.search) {
      paramCount++;
      sql += ` AND (o.order_number ILIKE $${paramCount} OR u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].total);
  }

  // Buscar pedido por ID com itens
  static async findById(id) {
    const orderSql = `
      SELECT o.*, u.name as user_name, u.email as user_email,
             o.customer_name, o.customer_last_name, o.customer_email, o.customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const orderResult = await query(orderSql, [id]);
    
    if (orderResult.rows.length === 0) return null;
    
    const order = new Order(orderResult.rows[0]);
    
    // Buscar itens do pedido
    const itemsSql = `
      SELECT oi.*, p.name as product_name, p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `;
    const itemsResult = await query(itemsSql, [id]);
    
    order.items = itemsResult.rows.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.product_image,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      totalPrice: parseFloat(item.total_price)
    }));
    
    return order;
  }

  // Buscar pedido por número
  static async findByOrderNumber(orderNumber) {
    const sql = `
      SELECT o.*, u.name as user_name, u.email as user_email,
             o.customer_name, o.customer_last_name, o.customer_email, o.customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.order_number = $1
    `;
    const result = await query(sql, [orderNumber]);
    return result.rows.length > 0 ? new Order(result.rows[0]) : null;
  }

  // Buscar pedidos por usuário com paginação
  static async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Query para buscar os pedidos
    const ordersSql = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    // Query para contar o total de pedidos
    const countSql = `
      SELECT COUNT(*) as total
      FROM orders o
      WHERE o.user_id = $1
    `;

    const [ordersResult, countResult] = await Promise.all([
      query(ordersSql, [userId, limit, offset]),
      query(countSql, [userId])
    ]);

    const orders = ordersResult.rows.map(row => new Order(row));
    const totalOrders = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalOrders / limit);

    return {
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Buscar pedidos por usuário ou email com paginação
  static async findByUserIdOrEmail(userId, userEmail, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    // Query para buscar os pedidos (por user_id OU por customer_email)
    const ordersSql = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE (o.user_id = $1 OR o.customer_email = $2)
      ORDER BY o.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    // Query para contar o total de pedidos
    const countSql = `
      SELECT COUNT(*) as total
      FROM orders o
      WHERE (o.user_id = $1 OR o.customer_email = $2)
    `;

    const [ordersResult, countResult] = await Promise.all([
      query(ordersSql, [userId, userEmail, limit, offset]),
      query(countSql, [userId, userEmail])
    ]);

    const orders = ordersResult.rows.map(row => new Order(row));
    const totalOrders = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalOrders / limit);

    return {
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // Criar novo pedido com itens
  static async create(orderData) {
    return await transaction(async (client) => {
      // Criar pedido
      const orderSql = `
        INSERT INTO orders (
          user_id, status, subtotal, shipping_cost, total_amount, 
          payment_method, payment_status, shipping_address, 
          billing_address, notes, external_reference,
          customer_name, customer_last_name, customer_email, customer_phone,
          coupon_id, discount_amount, shipping_method
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *
      `;
      
      console.log('🔍 Order.create - orderData:', orderData);
      console.log('👤 UserId sendo passado:', orderData.userId);
      console.log('👤 Customer info:', {
        name: orderData.customerName,
        lastName: orderData.customerLastName,
        email: orderData.customerEmail,
        phone: orderData.customerPhone
      });
      
      const orderParams = [
        orderData.userId,
        orderData.status || 'pending',
        orderData.subtotal,
        orderData.shippingCost || 0,
        orderData.total,
        orderData.paymentMethod,
        orderData.paymentStatus || 'pending',
        JSON.stringify(orderData.shippingAddress),
        JSON.stringify(orderData.billingAddress || orderData.shippingAddress),
        orderData.notes,
        orderData.externalReference || orderData.orderId?.toString() || null,
        orderData.customerName,
        orderData.customerLastName,
        orderData.customerEmail,
        orderData.customerPhone,
        orderData.couponId || null,
        orderData.discountAmount || 0,
        orderData.shippingMethod ? JSON.stringify(orderData.shippingMethod) : null
      ];
      
      console.log('📋 Parâmetros da query:', orderParams);
      
      const orderResult = await client.query(orderSql, orderParams);
      const order = new Order(orderResult.rows[0]);
      
      // Criar itens do pedido
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          const itemSql = `
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES ($1, $2, $3, $4, $5)
          `;
          
          await client.query(itemSql, [
            order.id,
            item.productId,
            item.quantity,
            item.unitPrice,
            item.totalPrice
          ]);
          
          // Atualizar estoque do produto
          await client.query(
            `UPDATE products 
             SET stock_quantity = stock_quantity - $1,
                 in_stock = CASE WHEN (stock_quantity - $1) > 0 THEN true ELSE false END
             WHERE id = $2`,
            [item.quantity, item.productId]
          );
        }
      }
      
      return order;
    });
  }

  // Atualizar pedido
  static async update(id, orderData) {
    const fields = [];
    const params = [];
    let paramCount = 0;

    // Construir query dinamicamente
    Object.keys(orderData).forEach(key => {
      if (orderData[key] !== undefined) {
        paramCount++;
        
        // Mapear nomes de campos
        const fieldMap = {
          userId: 'user_id',
          orderNumber: 'order_number',
          shippingCost: 'shipping_cost',
          totalAmount: 'total_amount',
          paymentMethod: 'payment_method',
          paymentStatus: 'payment_status',
          paymentDetails: 'payment_details',
          paymentId: 'mercado_pago_payment_id',
          shippingAddress: 'shipping_address',
          billingAddress: 'billing_address',
          externalReference: 'external_reference',
          mercadoPagoPaymentUrl: 'mercado_pago_payment_url',
          mercadoPagoPreferenceId: 'mercado_pago_preference_id',
          mercadoPagoPaymentId: 'mercado_pago_payment_id',
          mercadoPagoStatus: 'mercado_pago_status',
          mercadoPagoPaymentMethod: 'mercado_pago_payment_method',
          mercadoPagoApprovedAt: 'mercado_pago_approved_at',
          statusDetail: 'status_detail',
          customerName: 'customer_name',
          customerLastName: 'customer_last_name',
          customerEmail: 'customer_email',
          customerPhone: 'customer_phone'
        };
        
        const sqlField = fieldMap[key] || key;
        fields.push(`${sqlField} = $${paramCount}`);
        
        // Tratar campos JSON
        if (key === 'shippingAddress' || key === 'billingAddress' || key === 'paymentDetails') {
          params.push(JSON.stringify(orderData[key]));
        } else {
          params.push(orderData[key]);
        }
      }
    });

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    paramCount++;
    const sql = `
      UPDATE orders 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramCount} 
      RETURNING *
    `;
    params.push(id);

    const result = await query(sql, params);
    return result.rows.length > 0 ? new Order(result.rows[0]) : null;
  }

  // Atualizar status do pedido
  static async updateStatus(id, status, trackingCode = null) {
    let sql, params;
    
    if (trackingCode) {
      sql = `
        UPDATE orders 
        SET status = $2, tracking_code = $3, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 
        RETURNING *
      `;
      params = [id, status, trackingCode];
    } else {
      sql = `
        UPDATE orders 
        SET status = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 
        RETURNING *
      `;
      params = [id, status];
    }
    
    const result = await query(sql, params);
    return result.rows.length > 0 ? new Order(result.rows[0]) : null;
  }

  // Cancelar pedido
  static async cancel(id, reason = 'Cancelado pelo usuário') {
    return await transaction(async (client) => {
      // Atualizar status do pedido
      const orderResult = await client.query(
        `UPDATE orders 
         SET status = 'cancelled', notes = COALESCE(notes || ' | ', '') || $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND status IN ('pending', 'confirmed') 
         RETURNING *`,
        [id, `Cancelado: ${reason}`]
      );
      
      if (orderResult.rows.length === 0) {
        throw new Error('Pedido não encontrado ou não pode ser cancelado');
      }
      
      // Restaurar estoque dos produtos
      await client.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity + oi.quantity,
             in_stock = true
         FROM order_items oi 
         WHERE products.id = oi.product_id AND oi.order_id = $1`,
        [id]
      );
      
      return new Order(orderResult.rows[0]);
    });
  }

  // Buscar estatísticas de pedidos
  static async getStats(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.startDate) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }

    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
        COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
        COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value,
        COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_orders,
        COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_payments
      FROM orders ${whereClause}
    `;
    
    const result = await query(sql, params);
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total_orders) || 0,
      totalRevenue: parseFloat(stats.total_revenue) || 0,
      averageOrderValue: parseFloat(stats.average_order_value) || 0,
      byStatus: {
        pending: parseInt(stats.pending_orders) || 0,
        confirmed: parseInt(stats.confirmed_orders) || 0,
        processing: parseInt(stats.processing_orders) || 0,
        shipped: parseInt(stats.shipped_orders) || 0,
        delivered: parseInt(stats.delivered_orders) || 0,
        cancelled: parseInt(stats.cancelled_orders) || 0
      },
      byPaymentStatus: {
        paid: parseInt(stats.paid_orders) || 0,
        pending: parseInt(stats.pending_payments) || 0
      }
    };
  }

  // Buscar vendas por período
  static async getSalesByPeriod(startDate, endDate) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as sales
      FROM orders 
      WHERE created_at >= $1 AND created_at <= $2
        AND status IN ('confirmed', 'processing', 'shipped', 'delivered')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    const result = await query(sql, [startDate, endDate]);
    return result.rows;
  }

  // Buscar vendas por categoria
  static async getSalesByCategory() {
    const sql = `
      SELECT 
        c.name as category,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(oi.quantity), 0) as items_sold,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;
    
    const result = await query(sql);
    return result.rows;
  }

  // Buscar métricas de conversão
  static async getConversionMetrics() {
    const sql = `
      WITH order_stats AS (
        SELECT 
          COUNT(*) as total_orders,
          COUNT(DISTINCT user_id) as unique_customers,
          AVG(total_amount) as avg_order_value,
          SUM(total_amount) as total_revenue
        FROM orders
      ),
      product_stats AS (
        SELECT COUNT(*) as total_products FROM products WHERE active = true
      ),
      user_stats AS (
        SELECT COUNT(*) as total_users FROM users WHERE status = 'active'
      )
      SELECT 
        os.total_orders,
        os.unique_customers,
        os.avg_order_value,
        os.total_revenue,
        ps.total_products,
        us.total_users,
        CASE 
          WHEN us.total_users > 0 THEN ROUND((os.unique_customers::decimal / us.total_users) * 100, 2)
          ELSE 0
        END as customer_conversion_rate,
        CASE 
          WHEN os.unique_customers > 0 THEN ROUND(os.total_orders::decimal / os.unique_customers, 2)
          ELSE 0
        END as avg_orders_per_customer
      FROM order_stats os, product_stats ps, user_stats us
    `;
    
    const result = await query(sql);
    return result.rows[0] || {
      total_orders: 0,
      unique_customers: 0,
      avg_order_value: 0,
      total_revenue: 0,
      total_products: 0,
      total_users: 0,
      customer_conversion_rate: 0,
      avg_orders_per_customer: 0
    };
  }

  // Buscar pedido por payment_id
  static async findByPaymentId(paymentId) {
    const sql = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.mercado_pago_payment_id = $1
    `;
    const result = await query(sql, [paymentId]);
    
    if (result.rows.length === 0) return null;
    
    const order = new Order(result.rows[0]);
    
    // Buscar itens do pedido
    const itemsSql = `
      SELECT oi.*, p.name as product_name, p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `;
    const itemsResult = await query(itemsSql, [order.id]);
    
    order.items = itemsResult.rows.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.product_image,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      totalPrice: parseFloat(item.total_price)
    }));
    
    return order;
  }

  // Buscar pedido por external_reference
  static async findByExternalReference(externalReference) {
    const sql = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.external_reference = $1
    `;
    const result = await query(sql, [externalReference]);
    
    if (result.rows.length === 0) return null;
    
    const order = new Order(result.rows[0]);
    
    // Buscar itens do pedido
    const itemsSql = `
      SELECT oi.*, p.name as product_name, p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `;
    const itemsResult = await query(itemsSql, [order.id]);
    
    order.items = itemsResult.rows.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.product_image,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unit_price),
      totalPrice: parseFloat(item.total_price)
    }));
    
    return order;
  }

  // Atualizar dados de pagamento
  async updatePaymentData(paymentData) {
    const {
      payment_id,
      payment_status,
      payment_method,
      payment_details,
      external_reference
    } = paymentData;

    const sql = `
      UPDATE orders SET
        mercado_pago_payment_id = COALESCE($2, mercado_pago_payment_id),
        payment_status = COALESCE($3, payment_status),
        payment_method = COALESCE($4, payment_method),
        payment_details = COALESCE($5, payment_details),
        payment_updated_at = CURRENT_TIMESTAMP,
        external_reference = COALESCE($6, external_reference)
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [
      this.id,
      payment_id,
      payment_status,
      payment_method,
      payment_details ? JSON.stringify(payment_details) : null,
      paymentData.external_reference || this.id.toString() // external_reference
    ]);
    
    if (result.rows.length === 0) {
      throw new Error('Pedido não encontrado');
    }
    
    // Atualizar propriedades do objeto
    const updatedOrder = result.rows[0];
    this.paymentId = updatedOrder.mercado_pago_payment_id;
    this.paymentStatus = updatedOrder.payment_status;
    this.paymentMethod = updatedOrder.payment_method;
    this.paymentDetails = updatedOrder.payment_details ? (typeof updatedOrder.payment_details === 'string' ? JSON.parse(updatedOrder.payment_details) : updatedOrder.payment_details) : null;
    this.externalReference = updatedOrder.external_reference;
    this.paymentUpdatedAt = updatedOrder.payment_updated_at;
    
    return this;
  }

  // Método específico para atualizar dados do Mercado Pago
  static async updateMercadoPagoData(orderId, paymentData) {
    const {
      paymentId,
      paymentStatus,
      paymentMethod,
      mercadoPagoStatus,
      mercadoPagoPaymentMethod,
      paymentDetails,
      mercadoPagoApprovedAt
    } = paymentData;

    console.log('🔄 Atualizando dados do Mercado Pago:', {
      orderId,
      paymentId,
      paymentStatus,
      paymentMethod,
      mercadoPagoStatus,
      mercadoPagoPaymentMethod
    });

    const sql = `
      UPDATE orders SET
        status = $2,
        payment_status = $3,
        mercado_pago_payment_id = $4,
        mercado_pago_payment_method = $5,
        mercado_pago_status = $6,
        payment_method = $7,
        payment_details = $8,
        mercado_pago_approved_at = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [
      orderId,
      paymentStatus === 'paid' ? 'processing' : paymentStatus === 'failed' ? 'cancelled' : 'pending',
      paymentStatus,
      paymentId,
      mercadoPagoPaymentMethod,
      mercadoPagoStatus,
      paymentMethod,
      paymentDetails ? JSON.stringify(paymentDetails) : null,
      mercadoPagoApprovedAt
    ]);
    
    if (result.rows.length === 0) {
      throw new Error('Pedido não encontrado para atualização');
    }
    
    console.log('✅ Dados do Mercado Pago atualizados com sucesso');
    return new Order(result.rows[0]);
  }

  // Buscar itens do pedido
  static async getOrderItems(orderId) {
    const sql = `
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `;
    const result = await query(sql, [orderId]);
    
    return result.rows.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price)
    }));
  }

  // Buscar última compra de um produto específico por usuário
  static async findLastPurchaseByUserAndProduct(userId, productId) {
    const sql = `
      SELECT o.*, oi.quantity, oi.unit_price as item_unit_price, oi.total_price as item_total_price
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE (o.user_id = $1 OR o.customer_email = (
        SELECT email FROM users WHERE id = $1
      ))
      AND oi.product_id = $2
      AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    try {
      const result = await query(sql, [userId, productId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const orderData = result.rows[0];
      return {
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        purchaseDate: orderData.created_at,
        quantity: orderData.quantity,
        unitPrice: parseFloat(orderData.item_unit_price),
        totalPrice: parseFloat(orderData.item_total_price),
        orderStatus: orderData.status,
        paymentStatus: orderData.payment_status
      };
    } catch (error) {
      console.error('Erro ao buscar última compra do produto:', error);
      throw error;
    }
  }

  // Buscar última compra de um produto específico por email do usuário
  static async findLastPurchaseByUserEmail(userEmail, productId) {
    const sql = `
      SELECT o.*, oi.quantity, oi.unit_price as item_unit_price, oi.total_price as item_total_price
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_email = $1
      AND oi.product_id = $2
      AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    try {
      const result = await query(sql, [userEmail, productId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const orderData = result.rows[0];
      return {
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        purchaseDate: orderData.created_at,
        quantity: orderData.quantity,
        unitPrice: parseFloat(orderData.item_unit_price),
        totalPrice: parseFloat(orderData.item_total_price),
        orderStatus: orderData.status,
        paymentStatus: orderData.payment_status
      };
    } catch (error) {
      console.error('Erro ao buscar última compra do produto por email:', error);
      throw error;
    }
  }

  // Buscar qualquer pedido de um produto específico por usuário (independente do status)
  static async findAnyPurchaseByUserAndProduct(userId, productId) {
    const sql = `
      SELECT o.*, oi.quantity, oi.unit_price as item_unit_price, oi.total_price as item_total_price
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE (o.user_id = $1 OR o.customer_email = (
        SELECT email FROM users WHERE id = $1
      ))
      AND oi.product_id = $2
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    try {
      const result = await query(sql, [userId, productId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const orderData = result.rows[0];
      return {
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        purchaseDate: orderData.created_at,
        quantity: orderData.quantity,
        unitPrice: parseFloat(orderData.item_unit_price),
        totalPrice: parseFloat(orderData.item_total_price),
        orderStatus: orderData.status,
        paymentStatus: orderData.payment_status
      };
    } catch (error) {
      console.error('Erro ao buscar qualquer pedido do produto:', error);
      throw error;
    }
  }

  // Buscar qualquer pedido de um produto específico por email do usuário (independente do status)
  static async findAnyPurchaseByUserEmail(userEmail, productId) {
    const sql = `
      SELECT o.*, oi.quantity, oi.unit_price as item_unit_price, oi.total_price as item_total_price
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_email = $1
      AND oi.product_id = $2
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    try {
      const result = await query(sql, [userEmail, productId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const orderData = result.rows[0];
      return {
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        purchaseDate: orderData.created_at,
        quantity: orderData.quantity,
        unitPrice: parseFloat(orderData.item_unit_price),
        totalPrice: parseFloat(orderData.item_total_price),
        orderStatus: orderData.status,
        paymentStatus: orderData.payment_status
      };
    } catch (error) {
      console.error('Erro ao buscar qualquer pedido do produto por email:', error);
      throw error;
    }
  }

  // Excluir pedido
  static async delete(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Primeiro, excluir os itens do pedido
      await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
      
      // Depois, excluir o pedido
      const result = await client.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
      
      await client.query('COMMIT');
      
      if (result.rows.length === 0) {
        throw new Error('Pedido não encontrado');
      }
      
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }



  // Converter para JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      orderNumber: this.orderNumber,
      status: this.status,
      subtotal: this.subtotal,
      shippingCost: this.shippingCost,
      total: this.total,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      paymentId: this.paymentId,
      paymentDetails: this.paymentDetails ? (typeof this.paymentDetails === 'string' ? JSON.parse(this.paymentDetails) : this.paymentDetails) : null,
      externalReference: this.externalReference,
      paymentCreatedAt: this.paymentCreatedAt,
      paymentUpdatedAt: this.paymentUpdatedAt,
      mercadoPagoPaymentUrl: this.mercadoPagoPaymentUrl,
      mercadoPagoPreferenceId: this.mercadoPagoPreferenceId,
      mercadoPagoPaymentId: this.mercadoPagoPaymentId,
      mercadoPagoStatus: this.mercadoPagoStatus,
      mercadoPagoPaymentMethod: this.mercadoPagoPaymentMethod,
      mercadoPagoApprovedAt: this.mercadoPagoApprovedAt,
      statusDetail: this.statusDetail,
      customerName: this.customerName,
      customerLastName: this.customerLastName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      trackingCode: this.trackingCode,
      userName: this.userName,
      userEmail: this.userEmail,
      items: this.items
    };
  }
}

export default Order;