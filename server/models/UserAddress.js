import { query } from '../config/database.js';

class UserAddress {
  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.user_id || data.userId;
    this.title = data.title;
    this.recipientName = data.recipient_name || data.recipientName;
    this.street = data.street;
    this.number = data.number;
    this.complement = data.complement;
    this.neighborhood = data.neighborhood;
    this.city = data.city;
    this.state = data.state;
    this.zipCode = data.zip_code || data.zipCode;
    this.country = data.country || 'Brasil';
    this.isDefault = data.is_default || data.isDefault || false;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Criar novo endereço
  static async create(addressData) {
    try {
      const sql = `
        INSERT INTO user_addresses (
          user_id, title, recipient_name, street, number, complement,
          neighborhood, city, state, zip_code, country, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        addressData.userId,
        addressData.title,
        addressData.recipientName,
        addressData.street,
        addressData.number,
        addressData.complement,
        addressData.neighborhood,
        addressData.city,
        addressData.state,
        addressData.zipCode,
        addressData.country || 'Brasil',
        addressData.isDefault || false
      ];

      const result = await query(sql, values);
      return new UserAddress(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar endereço:', error);
      throw error;
    }
  }

  // Buscar endereços por usuário
  static async findByUserId(userId) {
    try {
      const sql = `
        SELECT * FROM user_addresses 
        WHERE user_id = $1 
        ORDER BY is_default DESC, created_at DESC
      `;
      
      const result = await query(sql, [userId]);
      return result.rows.map(row => new UserAddress(row));
    } catch (error) {
      console.error('Erro ao buscar endereços do usuário:', error);
      throw error;
    }
  }

  // Buscar endereço por ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM user_addresses WHERE id = $1';
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new UserAddress(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      throw error;
    }
  }

  // Atualizar endereço
  static async update(id, addressData) {
    try {
      const sql = `
        UPDATE user_addresses SET
          title = $2,
          recipient_name = $3,
          street = $4,
          number = $5,
          complement = $6,
          neighborhood = $7,
          city = $8,
          state = $9,
          zip_code = $10,
          country = $11,
          is_default = $12,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const values = [
        id,
        addressData.title,
        addressData.recipientName,
        addressData.street,
        addressData.number,
        addressData.complement,
        addressData.neighborhood,
        addressData.city,
        addressData.state,
        addressData.zipCode,
        addressData.country || 'Brasil',
        addressData.isDefault || false
      ];

      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new UserAddress(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      throw error;
    }
  }

  // Deletar endereço
  static async delete(id) {
    try {
      const sql = 'DELETE FROM user_addresses WHERE id = $1 RETURNING *';
      const result = await query(sql, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erro ao deletar endereço:', error);
      throw error;
    }
  }

  // Definir endereço como padrão
  static async setAsDefault(id, userId) {
    try {
      // Primeiro, remove o padrão de todos os endereços do usuário
      await query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
      
      // Depois, define o endereço específico como padrão
      const sql = `
        UPDATE user_addresses SET
          is_default = true,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await query(sql, [id, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new UserAddress(result.rows[0]);
    } catch (error) {
      console.error('Erro ao definir endereço como padrão:', error);
      throw error;
    }
  }

  // Buscar endereço padrão do usuário
  static async findDefaultByUserId(userId) {
    try {
      const sql = `
        SELECT * FROM user_addresses 
        WHERE user_id = $1 AND is_default = true
        LIMIT 1
      `;
      
      const result = await query(sql, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new UserAddress(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar endereço padrão:', error);
      throw error;
    }
  }

  // Converter para JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      recipientName: this.recipientName,
      street: this.street,
      number: this.number,
      complement: this.complement,
      neighborhood: this.neighborhood,
      city: this.city,
      state: this.state,
      zipCode: this.zipCode,
      country: this.country,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default UserAddress;