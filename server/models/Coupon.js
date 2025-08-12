import { query, pool } from '../config/database.js';

class Coupon {
  constructor(data = {}) {
    this.id = data.id;
    this.code = data.code;
    this.userId = data.user_id;
    this.discountPercentage = parseFloat(data.discount_percentage) || 0;
    this.isUsed = data.is_used || false;
    this.usedAt = data.used_at;
    this.orderId = data.order_id;
    this.expiresAt = data.expires_at;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.createdBy = data.created_by;
    
    // Campos adicionais para joins
    this.userName = data.user_name;
    this.userEmail = data.user_email;
    this.orderNumber = data.order_number;
  }

  // Criar novo cupom
  static async create(couponData) {
    const {
      userId,
      discountPercentage,
      expiresAt,
      createdBy
    } = couponData;

    const sql = `
      INSERT INTO coupons (code, user_id, discount_percentage, expires_at, created_by)
      VALUES (generate_coupon_code(), $1, $2, $3, $4)
      RETURNING *
    `;

    try {
      const result = await query(sql, [userId, discountPercentage, expiresAt, createdBy]);
      return new Coupon(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      throw error;
    }
  }

  // Buscar cupom por código
  static async findByCode(code) {
    const sql = `
      SELECT c.*, u.name as user_name, u.email as user_email, o.order_number
      FROM coupons c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN orders o ON c.order_id = o.id
      WHERE c.code = $1
    `;

    try {
      const result = await query(sql, [code]);
      return result.rows.length > 0 ? new Coupon(result.rows[0]) : null;
    } catch (error) {
      console.error('Erro ao buscar cupom por código:', error);
      throw error;
    }
  }

  // Buscar cupons por usuário
  static async findByUserId(userId, filters = {}) {
    let sql = `
      SELECT c.*, u.name as user_name, u.email as user_email, o.order_number
      FROM coupons c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN orders o ON c.order_id = o.id
      WHERE c.user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    // Filtro por status de uso
    if (filters.isUsed !== undefined) {
      paramCount++;
      sql += ` AND c.is_used = $${paramCount}`;
      params.push(filters.isUsed);
    }

    // Filtro por expiração
    if (filters.includeExpired === false) {
      sql += ` AND c.expires_at > CURRENT_TIMESTAMP`;
    }

    sql += ` ORDER BY c.created_at DESC`;

    try {
      const result = await query(sql, params);
      return result.rows.map(row => new Coupon(row));
    } catch (error) {
      console.error('Erro ao buscar cupons por usuário:', error);
      throw error;
    }
  }

  // Buscar todos os cupons (admin)
  static async findAll(filters = {}) {
    let sql = `
      SELECT c.*, u.name as user_name, u.email as user_email, o.order_number,
             cb.name as created_by_name
      FROM coupons c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN orders o ON c.order_id = o.id
      LEFT JOIN users cb ON c.created_by = cb.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filtro por usuário
    if (filters.userId) {
      paramCount++;
      sql += ` AND c.user_id = $${paramCount}`;
      params.push(filters.userId);
    }

    // Filtro por status de uso
    if (filters.isUsed !== undefined) {
      paramCount++;
      sql += ` AND c.is_used = $${paramCount}`;
      params.push(filters.isUsed);
    }

    // Filtro por expiração
    if (filters.includeExpired === false) {
      sql += ` AND c.expires_at > CURRENT_TIMESTAMP`;
    }

    // Paginação
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    sql += ` ORDER BY c.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    try {
      const result = await query(sql, params);
      return result.rows.map(row => new Coupon(row));
    } catch (error) {
      console.error('Erro ao buscar todos os cupons:', error);
      throw error;
    }
  }

  // Validar cupom
  static async validateCoupon(code, userId) {
    const coupon = await this.findByCode(code);
    
    if (!coupon) {
      return { valid: false, message: 'Cupom não encontrado' };
    }

    if (coupon.userId !== userId) {
      return { valid: false, message: 'Este cupom não pertence a você' };
    }

    if (coupon.isUsed) {
      return { valid: false, message: 'Cupom já foi utilizado' };
    }

    if (new Date(coupon.expiresAt) < new Date()) {
      return { valid: false, message: 'Cupom expirado' };
    }

    return { valid: true, coupon };
  }

  // Usar cupom
  static async useCoupon(code, orderId) {
    const sql = `
      UPDATE coupons 
      SET is_used = true, used_at = CURRENT_TIMESTAMP, order_id = $2
      WHERE code = $1 AND is_used = false
      RETURNING *
    `;

    try {
      const result = await query(sql, [code, orderId]);
      return result.rows.length > 0 ? new Coupon(result.rows[0]) : null;
    } catch (error) {
      console.error('Erro ao usar cupom:', error);
      throw error;
    }
  }

  // Calcular desconto
  static calculateDiscount(subtotal, discountPercentage) {
    const discount = (subtotal * discountPercentage) / 100;
    return Math.round(discount * 100) / 100; // Arredondar para 2 casas decimais
  }

  // Deletar cupom
  static async delete(id) {
    const sql = 'DELETE FROM coupons WHERE id = $1 RETURNING *';
    
    try {
      const result = await query(sql, [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
      throw error;
    }
  }

  // Contar cupons
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as total FROM coupons WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.userId) {
      paramCount++;
      sql += ` AND user_id = $${paramCount}`;
      params.push(filters.userId);
    }

    if (filters.isUsed !== undefined) {
      paramCount++;
      sql += ` AND is_used = $${paramCount}`;
      params.push(filters.isUsed);
    }

    if (filters.includeExpired === false) {
      sql += ` AND expires_at > CURRENT_TIMESTAMP`;
    }

    try {
      const result = await query(sql, params);
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error('Erro ao contar cupons:', error);
      throw error;
    }
  }
}

export { Coupon };