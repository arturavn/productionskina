import { query, transaction } from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password; // Hash da senha
    this.phone = data.phone;
    this.cpf = data.cpf;
    this.role = data.role || 'user';
    this.status = data.status || 'active';
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
    this.lastName = data.last_name || '';
  }

  // Buscar todos os usuários com filtros
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Filtro por role
    if (filters.role) {
      paramCount++;
      sql += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }

    // Filtro por status
    if (filters.status) {
      paramCount++;
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    // Filtro por busca (nome ou email)
    if (filters.search) {
      paramCount++;
      sql += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    // Ordenação
    const validSortFields = ['name', 'email', 'role', 'status', 'created_at'];
    const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
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
    return result.rows.map(row => {
      const user = new User(row);
      delete user.password; // Não retornar senha
      return user;
    });
  }

  // Contar total de usuários
  static async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.role) {
      paramCount++;
      sql += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }

    if (filters.status) {
      paramCount++;
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.search) {
      paramCount++;
      sql += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].total);
  }

  // Buscar usuário por ID
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    
    const user = new User(result.rows[0]);
    delete user.password; // Não retornar senha
    return user;
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Criar novo usuário
  static async create(userData) {
    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const sql = `
      INSERT INTO users (name, last_name, email, password, phone, cpf, role, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    
    const params = [
      userData.name,
      userData.lastName || '',
      userData.email,
      hashedPassword,
      userData.phone || null,
      userData.cpf || null,
      'user', // Always set role as 'user' for new registrations
      userData.status || 'active'
    ];

    const result = await query(sql, params);
    const user = new User(result.rows[0]);
    delete user.password; // Não retornar senha
    return user;
  }

  // Atualizar usuário
  static async update(id, userData) {
    const fields = [];
    const params = [];
    let paramCount = 0;

    // Construir query dinamicamente
    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined && key !== 'password') {
        paramCount++;
        const fieldMap = { lastName: 'last_name' };
        fields.push(`${fieldMap[key] || key} = $${paramCount}`);
        params.push(userData[key]);
      }
    });

    // Tratar senha separadamente
    if (userData.password) {
      paramCount++;
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      fields.push(`password = $${paramCount}`);
      params.push(hashedPassword);
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    paramCount++;
    const sql = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramCount} 
      RETURNING *
    `;
    params.push(id);

    const result = await query(sql, params);
    if (result.rows.length === 0) return null;
    
    const user = new User(result.rows[0]);
    delete user.password; // Não retornar senha
    return user;
  }

  // Deletar usuário (soft delete - inativar)
  static async delete(id) {
    const sql = `
      UPDATE users 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  }

  // Deletar usuário permanentemente (hard delete)
  static async deletePermanently(id) {
    const sql = `
      DELETE FROM users 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  }

  // Inativar usuário
  static async deactivate(id) {
    const sql = `
      UPDATE users 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  }

  // Ativar usuário
  static async activate(id) {
    const sql = `
      UPDATE users 
      SET status = 'active', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  }

  // Verificar senha
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Alterar senha
  async changePassword(newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const sql = `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await query(sql, [hashedPassword, this.id]);
    return result.rows.length > 0;
  }

  // Buscar estatísticas de usuários
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
        COUNT(*) FILTER (WHERE role = 'user') as total_customers,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days
      FROM users
    `;
    const result = await query(sql);
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total_users) || 0,
      customers: parseInt(stats.total_customers) || 0, // Adicionado para compatibilidade com dashboard
      byRole: {
        admin: parseInt(stats.total_admins) || 0,
        user: parseInt(stats.total_customers) || 0
      },
      byStatus: {
        active: parseInt(stats.active_users) || 0,
        inactive: parseInt(stats.inactive_users) || 0
      },
      newUsersLast30Days: parseInt(stats.new_users_last_30_days) || 0
    };
  }

  // Buscar usuários mais ativos (com mais pedidos)
  static async findMostActive(limit = 10) {
    const sql = `
      SELECT u.*, COUNT(o.id) as total_orders, 
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'user' AND u.status = 'active'
      GROUP BY u.id
      ORDER BY total_orders DESC, total_spent DESC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows.map(row => {
      const user = new User(row);
      delete user.password;
      user.totalOrders = parseInt(row.total_orders);
      user.totalSpent = parseFloat(row.total_spent);
      return user;
    });
  }

  // Definir token de reset de senha
  static async setResetToken(userId, token, expiresAt) {
    const sql = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING *
    `;
    const result = await query(sql, [token, expiresAt, userId]);
    return result.rows.length > 0;
  }

  // Buscar usuário por token de reset válido
  static async findByResetToken(token) {
    const sql = `
      SELECT * FROM users 
      WHERE reset_token = $1 
        AND reset_token_expires > CURRENT_TIMESTAMP 
        AND status = 'active'
    `;
    const result = await query(sql, [token]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Limpar token de reset
  static async clearResetToken(userId) {
    const sql = `
      UPDATE users 
      SET reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await query(sql, [userId]);
    return result.rows.length > 0;
  }

  // Converter para JSON (para APIs)
  toJSON() {
    const json = {
      id: this.id,
      name: this.name,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      cpf: this.cpf,
      role: this.role,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    
    // Nunca incluir senha no JSON
    return json;
  }
}

export default User;