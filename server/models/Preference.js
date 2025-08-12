import { query, pool } from '../config/database.js';

class Preference {
  constructor(data = {}) {
    this.id = data.id;
    this.preferenceId = data.preference_id;
    this.orderId = data.order_id;
    this.externalReference = data.external_reference;
    
    // Dados do pagador
    this.payerName = data.payer_name;
    this.payerEmail = data.payer_email;
    this.payerPhone = data.payer_phone;
    this.payerCpf = data.payer_cpf;
    this.payerAddress = data.payer_address ? (typeof data.payer_address === 'string' ? JSON.parse(data.payer_address) : data.payer_address) : null;
    
    // Dados dos itens
    this.items = data.items ? (typeof data.items === 'string' ? JSON.parse(data.items) : data.items) : [];
    this.totalAmount = parseFloat(data.total_amount) || 0;
    this.shippingCost = parseFloat(data.shipping_cost) || 0;
    
    // URLs e configurações
    this.initPoint = data.init_point;
    this.sandboxInitPoint = data.sandbox_init_point;
    this.paymentUrl = data.payment_url;
    this.notificationUrl = data.notification_url;
    this.backUrls = data.back_urls ? (typeof data.back_urls === 'string' ? JSON.parse(data.back_urls) : data.back_urls) : null;
    
    // Configurações de pagamento
    this.paymentMethods = data.payment_methods ? (typeof data.payment_methods === 'string' ? JSON.parse(data.payment_methods) : data.payment_methods) : null;
    this.statementDescriptor = data.statement_descriptor;
    this.binaryMode = data.binary_mode || false;
    
    // Expiração
    this.expires = data.expires || false;
    this.expirationDateFrom = data.expiration_date_from;
    this.expirationDateTo = data.expiration_date_to;
    
    // Status e ambiente
    this.environment = data.environment || 'SANDBOX';
    this.status = data.status || 'pending';
    
    // Metadados
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Criar nova preferência
  static async create(preferenceData) {
    const {
      preferenceId,
      orderId,
      externalReference,
      payerName,
      payerEmail,
      payerPhone,
      payerCpf,
      payerAddress,
      items,
      totalAmount,
      shippingCost,
      initPoint,
      sandboxInitPoint,
      paymentUrl,
      notificationUrl,
      backUrls,
      paymentMethods,
      statementDescriptor,
      binaryMode,
      expires,
      expirationDateFrom,
      expirationDateTo,
      environment,
      status
    } = preferenceData;

    const sql = `
      INSERT INTO mercado_pago_preferences (
        preference_id, order_id, external_reference,
        payer_name, payer_email, payer_phone, payer_cpf, payer_address,
        items, total_amount, shipping_cost,
        init_point, sandbox_init_point, payment_url, notification_url, back_urls,
        payment_methods, statement_descriptor, binary_mode,
        expires, expiration_date_from, expiration_date_to,
        environment, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `;

    const params = [
      preferenceId,
      orderId,
      externalReference,
      payerName,
      payerEmail,
      payerPhone,
      payerCpf,
      payerAddress ? JSON.stringify(payerAddress) : null,
      JSON.stringify(items),
      totalAmount,
      shippingCost,
      initPoint,
      sandboxInitPoint,
      paymentUrl,
      notificationUrl,
      backUrls ? JSON.stringify(backUrls) : null,
      paymentMethods ? JSON.stringify(paymentMethods) : null,
      statementDescriptor,
      binaryMode,
      expires,
      expirationDateFrom,
      expirationDateTo,
      environment,
      status
    ];

    const result = await query(sql, params);
    return new Preference(result.rows[0]);
  }

  // Buscar preferência por ID
  static async findById(id) {
    const sql = `
      SELECT * FROM mercado_pago_preferences WHERE id = $1
    `;
    
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? new Preference(result.rows[0]) : null;
  }

  // Buscar preferência por preference_id do Mercado Pago
  static async findByPreferenceId(preferenceId) {
    const sql = `
      SELECT * FROM mercado_pago_preferences WHERE preference_id = $1
    `;
    
    const result = await query(sql, [preferenceId]);
    return result.rows.length > 0 ? new Preference(result.rows[0]) : null;
  }

  // Buscar preferência por order_id
  static async findByOrderId(orderId) {
    const sql = `
      SELECT * FROM mercado_pago_preferences WHERE order_id = $1
    `;
    
    const result = await query(sql, [orderId]);
    return result.rows.length > 0 ? new Preference(result.rows[0]) : null;
  }

  // Buscar preferência por external_reference
  static async findByExternalReference(externalReference) {
    const sql = `
      SELECT * FROM mercado_pago_preferences WHERE external_reference = $1
    `;
    
    const result = await query(sql, [externalReference]);
    return result.rows.length > 0 ? new Preference(result.rows[0]) : null;
  }

  // Listar todas as preferências com filtros
  static async findAll(filters = {}) {
    let sql = `
      SELECT p.*, o.order_number, u.name as customer_name, u.email as customer_email
      FROM mercado_pago_preferences p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filtro por status
    if (filters.status) {
      paramCount++;
      sql += ` AND p.status = $${paramCount}`;
      params.push(filters.status);
    }

    // Filtro por ambiente
    if (filters.environment) {
      paramCount++;
      sql += ` AND p.environment = $${paramCount}`;
      params.push(filters.environment);
    }

    // Filtro por período
    if (filters.startDate) {
      paramCount++;
      sql += ` AND p.created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      sql += ` AND p.created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }

    // Filtro por busca
    if (filters.search) {
      paramCount++;
      sql += ` AND (p.preference_id ILIKE $${paramCount} OR p.external_reference ILIKE $${paramCount} OR o.order_number ILIKE $${paramCount} OR u.name ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    // Ordenação
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY p.${sortBy} ${sortOrder}`;

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
    return result.rows.map(row => new Preference(row));
  }

  // Contar total de preferências
  static async count(filters = {}) {
    let sql = `
      SELECT COUNT(*) as total
      FROM mercado_pago_preferences p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Aplicar os mesmos filtros
    if (filters.status) {
      paramCount++;
      sql += ` AND p.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.environment) {
      paramCount++;
      sql += ` AND p.environment = $${paramCount}`;
      params.push(filters.environment);
    }

    if (filters.startDate) {
      paramCount++;
      sql += ` AND p.created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      sql += ` AND p.created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }

    if (filters.search) {
      paramCount++;
      sql += ` AND (p.preference_id ILIKE $${paramCount} OR p.external_reference ILIKE $${paramCount} OR o.order_number ILIKE $${paramCount} OR u.name ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].total);
  }

  // Atualizar preferência
  static async update(id, updateData) {
    const fields = [];
    const params = [];
    let paramCount = 0;

    // Construir query dinamicamente
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        paramCount++;
        
        // Mapear nomes de campos
        const fieldMap = {
          status: 'status',
          environment: 'environment',
          paymentUrl: 'payment_url',
          expires: 'expires',
          expirationDateTo: 'expiration_date_to'
        };
        
        const sqlField = fieldMap[key] || key;
        fields.push(`${sqlField} = $${paramCount}`);
        
        // Tratar campos JSON
        if (key === 'payerAddress' || key === 'items' || key === 'backUrls' || key === 'paymentMethods') {
          params.push(JSON.stringify(updateData[key]));
        } else {
          params.push(updateData[key]);
        }
      }
    });

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    paramCount++;
    const sql = `
      UPDATE mercado_pago_preferences 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramCount} 
      RETURNING *
    `;
    params.push(id);

    const result = await query(sql, params);
    return result.rows.length > 0 ? new Preference(result.rows[0]) : null;
  }

  // Atualizar status da preferência
  static async updateStatus(id, status) {
    const sql = `
      UPDATE mercado_pago_preferences 
      SET status = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await query(sql, [id, status]);
    return result.rows.length > 0 ? new Preference(result.rows[0]) : null;
  }

  // Obter estatísticas das preferências
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
        COUNT(*) as total_preferences,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_preferences,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_preferences,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_preferences,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_preferences,
        COUNT(*) FILTER (WHERE environment = 'SANDBOX') as sandbox_preferences,
        COUNT(*) FILTER (WHERE environment = 'PRODUCTION') as production_preferences,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(AVG(total_amount), 0) as average_amount
      FROM mercado_pago_preferences ${whereClause}
    `;
    
    const result = await query(sql, params);
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total_preferences) || 0,
      totalAmount: parseFloat(stats.total_amount) || 0,
      averageAmount: parseFloat(stats.average_amount) || 0,
      byStatus: {
        pending: parseInt(stats.pending_preferences) || 0,
        approved: parseInt(stats.approved_preferences) || 0,
        rejected: parseInt(stats.rejected_preferences) || 0,
        expired: parseInt(stats.expired_preferences) || 0
      },
      byEnvironment: {
        sandbox: parseInt(stats.sandbox_preferences) || 0,
        production: parseInt(stats.production_preferences) || 0
      }
    };
  }

  // Converter para JSON
  toJSON() {
    return {
      id: this.id,
      preferenceId: this.preferenceId,
      orderId: this.orderId,
      externalReference: this.externalReference,
      payerName: this.payerName,
      payerEmail: this.payerEmail,
      payerPhone: this.payerPhone,
      payerCpf: this.payerCpf,
      payerAddress: this.payerAddress,
      items: this.items,
      totalAmount: this.totalAmount,
      shippingCost: this.shippingCost,
      initPoint: this.initPoint,
      sandboxInitPoint: this.sandboxInitPoint,
      paymentUrl: this.paymentUrl,
      notificationUrl: this.notificationUrl,
      backUrls: this.backUrls,
      paymentMethods: this.paymentMethods,
      statementDescriptor: this.statementDescriptor,
      binaryMode: this.binaryMode,
      expires: this.expires,
      expirationDateFrom: this.expirationDateFrom,
      expirationDateTo: this.expirationDateTo,
      environment: this.environment,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Preference; 