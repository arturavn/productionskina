import { query, pool } from '../config/database.js';

class OrderItem {
  constructor(data = {}) {
    this.id = data.id;
    this.orderId = data.order_id;
    this.productId = data.product_id;
    this.quantity = data.quantity;
    this.unitPrice = parseFloat(data.unit_price) || 0;
    this.totalPrice = parseFloat(data.total_price) || 0;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Criar novo item de pedido
  static async create(itemData) {
    const sql = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const params = [
      itemData.order_id,
      itemData.product_id,
      itemData.quantity,
      itemData.unit_price,
      itemData.total_price
    ];
    
    const result = await query(sql, params);
    return new OrderItem(result.rows[0]);
  }

  // Buscar itens por order_id
  static async findByOrderId(orderId) {
    const sql = `
      SELECT oi.*, p.name as product_name, p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `;
    
    const result = await query(sql, [orderId]);
    return result.rows.map(row => new OrderItem(row));
  }

  // Buscar item por ID
  static async findById(id) {
    const sql = `
      SELECT oi.*, p.name as product_name, p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.id = $1
    `;
    
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? new OrderItem(result.rows[0]) : null;
  }

  // Atualizar item
  static async update(id, itemData) {
    const sql = `
      UPDATE order_items SET
        quantity = $2,
        unit_price = $3,
        total_price = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const params = [
      id,
      itemData.quantity,
      itemData.unit_price,
      itemData.total_price
    ];
    
    const result = await query(sql, params);
    return result.rows.length > 0 ? new OrderItem(result.rows[0]) : null;
  }

  // Excluir item
  static async delete(id) {
    const sql = 'DELETE FROM order_items WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  }

  // Excluir todos os itens de um pedido
  static async deleteByOrderId(orderId) {
    const sql = 'DELETE FROM order_items WHERE order_id = $1';
    await query(sql, [orderId]);
  }

  // Converter para JSON
  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      productId: this.productId,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      totalPrice: this.totalPrice,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export { OrderItem }; 