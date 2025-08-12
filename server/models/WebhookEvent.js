import { query, pool } from '../config/database.js';

class WebhookEvent {
  constructor(data = {}) {
    this.id = data.id;
    this.eventType = data.event_type;
    this.method = data.method;
    this.url = data.url;
    this.headers = data.headers;
    this.body = data.body;
    this.queryParams = data.query_params;
    this.sourceIp = data.source_ip;
    this.userAgent = data.user_agent;
    this.statusCode = data.status_code;
    this.responseBody = data.response_body;
    this.processingTimeMs = data.processing_time_ms;
    this.errorMessage = data.error_message;
    this.orderId = data.order_id;
    this.externalReference = data.external_reference;
    this.paymentId = data.payment_id;
    this.status = data.status;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Criar novo evento de webhook
  static async create(eventData) {
    const {
      eventType,
      method,
      url,
      headers,
      body,
      queryParams,
      sourceIp,
      userAgent,
      statusCode,
      responseBody,
      processingTimeMs,
      errorMessage,
      orderId,
      externalReference,
      paymentId,
      status
    } = eventData;

    const sql = `
      INSERT INTO webhook_events (
        event_type, method, url, headers, body, query_params,
        source_ip, user_agent, status_code, response_body,
        processing_time_ms, error_message, order_id,
        external_reference, payment_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const params = [
      eventType,
      method,
      url,
      headers ? JSON.stringify(headers) : null,
      body ? JSON.stringify(body) : null,
      queryParams ? JSON.stringify(queryParams) : null,
      sourceIp,
      userAgent,
      statusCode,
      responseBody ? JSON.stringify(responseBody) : null,
      processingTimeMs,
      errorMessage,
      orderId,
      externalReference,
      paymentId,
      status || 'pending'
    ];

    const result = await query(sql, params);
    return new WebhookEvent(result.rows[0]);
  }

  // Buscar evento por ID
  static async findById(id) {
    const sql = `
      SELECT * FROM webhook_events WHERE id = $1
    `;
    
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? new WebhookEvent(result.rows[0]) : null;
  }

  // Buscar eventos por tipo
  static async findByEventType(eventType, limit = 50) {
    const sql = `
      SELECT * FROM webhook_events 
      WHERE event_type = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await query(sql, [eventType, limit]);
    return result.rows.map(row => new WebhookEvent(row));
  }

  // Buscar eventos por external_reference
  static async findByExternalReference(externalReference, limit = 50) {
    const sql = `
      SELECT * FROM webhook_events 
      WHERE external_reference = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await query(sql, [externalReference, limit]);
    return result.rows.map(row => new WebhookEvent(row));
  }

  // Buscar eventos por payment_id
  static async findByPaymentId(paymentId, limit = 50) {
    const sql = `
      SELECT * FROM webhook_events 
      WHERE payment_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await query(sql, [paymentId, limit]);
    return result.rows.map(row => new WebhookEvent(row));
  }

  // Buscar eventos por status
  static async findByStatus(status, limit = 50) {
    const sql = `
      SELECT * FROM webhook_events 
      WHERE status = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await query(sql, [status, limit]);
    return result.rows.map(row => new WebhookEvent(row));
  }

  // Buscar eventos falhados (status code != 200)
  static async findFailedEvents(limit = 50) {
    const sql = `
      SELECT * FROM webhook_events 
      WHERE status_code != 200 OR status_code IS NULL
      ORDER BY created_at DESC 
      LIMIT $1
    `;
    
    const result = await query(sql, [limit]);
    return result.rows.map(row => new WebhookEvent(row));
  }

  // Listar todos os eventos com paginação
  static async findAll(filters = {}) {
    let sql = `
      SELECT * FROM webhook_events 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filtro por tipo de evento
    if (filters.eventType) {
      paramCount++;
      sql += ` AND event_type = $${paramCount}`;
      params.push(filters.eventType);
    }

    // Filtro por método HTTP
    if (filters.method) {
      paramCount++;
      sql += ` AND method = $${paramCount}`;
      params.push(filters.method);
    }

    // Filtro por status code
    if (filters.statusCode) {
      paramCount++;
      sql += ` AND status_code = $${paramCount}`;
      params.push(filters.statusCode);
    }

    // Filtro por período
    if (filters.startDate) {
      paramCount++;
      sql += ` AND created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      sql += ` AND created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }

    // Ordenação
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

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
    return result.rows.map(row => new WebhookEvent(row));
  }

  // Atualizar status do webhook event por payment_id
  static async updateStatusByPaymentId(paymentId, newStatus) {
    const sql = `
      UPDATE webhook_events 
      SET status = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE payment_id = $1
    `;
    
    const result = await query(sql, [paymentId, newStatus]);
    return result.rowCount > 0;
  }

  // Contar total de eventos
  static async count(filters = {}) {
    let sql = `
      SELECT COUNT(*) as total FROM webhook_events 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Aplicar os mesmos filtros
    if (filters.eventType) {
      paramCount++;
      sql += ` AND event_type = $${paramCount}`;
      params.push(filters.eventType);
    }

    if (filters.method) {
      paramCount++;
      sql += ` AND method = $${paramCount}`;
      params.push(filters.method);
    }

    if (filters.statusCode) {
      paramCount++;
      sql += ` AND status_code = $${paramCount}`;
      params.push(filters.statusCode);
    }

    if (filters.startDate) {
      paramCount++;
      sql += ` AND created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      sql += ` AND created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].total);
  }

  // Obter estatísticas dos eventos
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
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status_code = 200) as successful_events,
        COUNT(*) FILTER (WHERE status_code != 200) as failed_events,
        COUNT(*) FILTER (WHERE event_type = 'mercado_pago') as mercado_pago_events,
        COUNT(*) FILTER (WHERE event_type = 'payment_success') as payment_success_events,
        COUNT(*) FILTER (WHERE event_type = 'payment_pending') as payment_pending_events,
        COUNT(*) FILTER (WHERE event_type = 'payment_failure') as payment_failure_events,
        AVG(processing_time_ms) as avg_processing_time,
        MAX(processing_time_ms) as max_processing_time,
        MIN(processing_time_ms) as min_processing_time
      FROM webhook_events ${whereClause}
    `;
    
    const result = await query(sql, params);
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total_events) || 0,
      successful: parseInt(stats.successful_events) || 0,
      failed: parseInt(stats.failed_events) || 0,
      byType: {
        mercadoPago: parseInt(stats.mercado_pago_events) || 0,
        paymentSuccess: parseInt(stats.payment_success_events) || 0,
        paymentPending: parseInt(stats.payment_pending_events) || 0,
        paymentFailure: parseInt(stats.payment_failure_events) || 0
      },
      processingTime: {
        average: parseFloat(stats.avg_processing_time) || 0,
        maximum: parseInt(stats.max_processing_time) || 0,
        minimum: parseInt(stats.min_processing_time) || 0
      }
    };
  }

  // Converter para JSON
  toJSON() {
    return {
      id: this.id,
      eventType: this.eventType,
      method: this.method,
      url: this.url,
      headers: this.headers,
      body: this.body,
      queryParams: this.queryParams,
      sourceIp: this.sourceIp,
      userAgent: this.userAgent,
      statusCode: this.statusCode,
      responseBody: this.responseBody,
      processingTimeMs: this.processingTimeMs,
      errorMessage: this.errorMessage,
      orderId: this.orderId,
      externalReference: this.externalReference,
      paymentId: this.paymentId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default WebhookEvent; 