import { query, transaction } from '../config/database.js';

class Cart {
  constructor(data) {
    this.id = data.id;
    this.sessionId = data.session_id || data.sessionId;
    this.userId = data.user_id || data.userId;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
    this.items = data.items || [];
  }

  // Buscar carrinho por session ID
  static async findBySessionId(sessionId) {
    const cartSql = `
      SELECT * FROM cart_sessions 
      WHERE session_id = $1
    `;
    const cartResult = await query(cartSql, [sessionId]);
    
    if (cartResult.rows.length === 0) {
      return null;
    }
    
    const cart = new Cart(cartResult.rows[0]);
    
    // Buscar itens do carrinho com dimensões da categoria quando necessário
    const itemsSql = `
      SELECT ci.*, p.name, p.original_price, p.discount_price, 
             p.image_url, p.in_stock, p.stock_quantity,
             p.width_cm, p.height_cm, p.length_cm, p.weight_kg,
             p.use_category_dimensions,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg,
             pi.id as primary_image_id
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE ci.cart_session_id = (SELECT id FROM cart_sessions WHERE session_id = $1) AND p.active = true
      ORDER BY p.created_at
    `;
    const itemsResult = await query(itemsSql, [sessionId]);
    
    cart.items = itemsResult.rows.map(item => {
      // Usar dimensões da categoria se use_category_dimensions for true
      const useCategoryDimensions = item.use_category_dimensions;
      const width_cm = useCategoryDimensions && item.category_width_cm ? 
        parseFloat(item.category_width_cm) : parseFloat(item.width_cm || 10);
      const height_cm = useCategoryDimensions && item.category_height_cm ? 
        parseFloat(item.category_height_cm) : parseFloat(item.height_cm || 10);
      const length_cm = useCategoryDimensions && item.category_length_cm ? 
        parseFloat(item.category_length_cm) : parseFloat(item.length_cm || 10);
      const weight_kg = useCategoryDimensions && item.category_weight_kg ? 
        parseFloat(item.category_weight_kg) : parseFloat(item.weight_kg || 0.3);
      
      return {
        id: item.id,
        productId: item.product_id,
        name: item.name,
        originalPrice: parseFloat(item.original_price || 0),
        discountPrice: parseFloat(item.discount_price || 0),
        imageUrl: item.primary_image_id ? `/api/products/images/${item.primary_image_id}` : item.image_url,
        quantity: item.quantity,
        inStock: item.in_stock,
        stockQuantity: item.stock_quantity,
        addedAt: item.added_at,
        width_cm,
        height_cm,
        length_cm,
        weight_kg,
        useCategoryDimensions
      };
    });
    
    return cart;
  }

  // Buscar carrinho por user ID
  static async findByUserId(userId) {
    const cartSql = `
      SELECT * FROM cart_sessions 
      WHERE user_id = $1
    `;
    const cartResult = await query(cartSql, [userId]);
    
    if (cartResult.rows.length === 0) {
      return null;
    }
    
    const cart = new Cart(cartResult.rows[0]);
    
    // Buscar itens do carrinho com dimensões da categoria quando necessário
    const itemsSql = `
      SELECT ci.*, p.name, p.original_price, p.discount_price, 
             p.image_url, p.in_stock, p.stock_quantity,
             p.width_cm, p.height_cm, p.length_cm, p.weight_kg,
             p.use_category_dimensions,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg,
             pi.id as primary_image_id
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      WHERE ci.cart_session_id = (SELECT id FROM cart_sessions WHERE session_id = $1) AND p.active = true
      ORDER BY p.created_at
    `;
    const itemsResult = await query(itemsSql, [cart.sessionId]);
    
    cart.items = itemsResult.rows.map(item => {
      // Usar dimensões da categoria se use_category_dimensions for true
      const useCategoryDimensions = item.use_category_dimensions;
      const width_cm = useCategoryDimensions && item.category_width_cm ? 
        parseFloat(item.category_width_cm) : parseFloat(item.width_cm || 10);
      const height_cm = useCategoryDimensions && item.category_height_cm ? 
        parseFloat(item.category_height_cm) : parseFloat(item.height_cm || 10);
      const length_cm = useCategoryDimensions && item.category_length_cm ? 
        parseFloat(item.category_length_cm) : parseFloat(item.length_cm || 10);
      const weight_kg = useCategoryDimensions && item.category_weight_kg ? 
        parseFloat(item.category_weight_kg) : parseFloat(item.weight_kg || 0.3);
      
      return {
        id: item.id,
        productId: item.product_id,
        name: item.name,
        originalPrice: parseFloat(item.original_price || 0),
        discountPrice: parseFloat(item.discount_price || 0),
        imageUrl: item.primary_image_id ? `/api/products/images/${item.primary_image_id}` : item.image_url,
        quantity: item.quantity,
        inStock: item.in_stock,
        stockQuantity: item.stock_quantity,
        width_cm,
        height_cm,
        length_cm,
        weight_kg,
        useCategoryDimensions,
        addedAt: item.created_at
      };
    });
    
    return cart;
  }

  // Criar nova sessão de carrinho
  static async create(sessionId, userId = null) {
    const sql = `
      INSERT INTO cart_sessions (session_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (session_id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await query(sql, [sessionId, userId]);
    return new Cart(result.rows[0]);
  }

  // Adicionar item ao carrinho
  static async addItem(sessionId, productId, quantity = 1) {
    return await transaction(async (client) => {
      // Verificar se o produto existe e está em estoque
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND active = true',
        [productId]
      );
      
      if (productResult.rows.length === 0) {
        throw new Error('Produto não encontrado');
      }
      
      const product = productResult.rows[0];
      
      if (!product.in_stock || product.stock_quantity < quantity) {
        throw new Error('Produto fora de estoque ou quantidade insuficiente');
      }
      
      // Criar sessão se não existir
      await client.query(
        `INSERT INTO cart_sessions (session_id) 
         VALUES ($1) 
         ON CONFLICT (session_id) DO NOTHING`,
        [sessionId]
      );
      
      // Obter o ID da sessão do carrinho
      const sessionResult = await client.query(
        'SELECT id FROM cart_sessions WHERE session_id = $1',
        [sessionId]
      );
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Sessão do carrinho não encontrada');
      }
      
      const cartSessionId = sessionResult.rows[0].id;
      
      // Verificar se o item já existe no carrinho
      const existingItemResult = await client.query(
        'SELECT * FROM cart_items WHERE cart_session_id = $1 AND product_id = $2',
        [cartSessionId, productId]
      );
      
      if (existingItemResult.rows.length > 0) {
        // Atualizar quantidade
        const newQuantity = existingItemResult.rows[0].quantity + quantity;
        
        if (product.stock_quantity < newQuantity) {
          throw new Error('Quantidade solicitada excede o estoque disponível');
        }
        
        await client.query(
          'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE cart_session_id = $2 AND product_id = $3',
          [newQuantity, cartSessionId, productId]
        );
      } else {
        // Adicionar novo item
        await client.query(
          'INSERT INTO cart_items (cart_session_id, product_id, quantity) VALUES ($1, $2, $3)',
          [cartSessionId, productId, quantity]
        );
      }
      
      // Atualizar timestamp da sessão
      console.log('🔍 Atualizando timestamp da sessão:', sessionId);
      await client.query(
        'UPDATE cart_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = $1',
        [sessionId]
      );
      
      console.log('🔍 Buscando carrinho atualizado');
      return await Cart.findBySessionId(sessionId);
    });
  }

  // Atualizar quantidade de um item
  static async updateItemQuantity(sessionId, productId, quantity) {
    return await transaction(async (client) => {
      // Obter o ID da sessão do carrinho
      const sessionResult = await client.query(
        'SELECT id FROM cart_sessions WHERE session_id = $1',
        [sessionId]
      );
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Sessão do carrinho não encontrada');
      }
      
      const cartSessionId = sessionResult.rows[0].id;
      
      if (quantity <= 0) {
        // Remover item se quantidade for 0 ou negativa
        await client.query(
          'DELETE FROM cart_items WHERE cart_session_id = $1 AND product_id = $2',
          [cartSessionId, productId]
        );
      } else {
        // Verificar estoque
        const productResult = await client.query(
          'SELECT stock_quantity FROM products WHERE id = $1 AND active = true',
          [productId]
        );
        
        if (productResult.rows.length === 0) {
          throw new Error('Produto não encontrado');
        }
        
        if (productResult.rows[0].stock_quantity < quantity) {
          throw new Error('Quantidade solicitada excede o estoque disponível');
        }
        
        // Verificar se o item já existe no carrinho
        const existingItemResult = await client.query(
          'SELECT id FROM cart_items WHERE cart_session_id = $1 AND product_id = $2',
          [cartSessionId, productId]
        );
        
        if (existingItemResult.rows.length > 0) {
          // Atualizar quantidade do item existente
          await client.query(
            'UPDATE cart_items SET quantity = $1 WHERE cart_session_id = $2 AND product_id = $3',
            [quantity, cartSessionId, productId]
          );
        } else {
          // Adicionar novo item ao carrinho
          await client.query(
            'INSERT INTO cart_items (cart_session_id, product_id, quantity, added_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
            [cartSessionId, productId, quantity]
          );
        }
      }
      
      // Atualizar timestamp da sessão
      await client.query(
        'UPDATE cart_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = $1',
        [sessionId]
      );
      
      return await Cart.findBySessionId(sessionId);
    });
  }

  // Remover item do carrinho
  static async removeItem(sessionId, productId) {
    return await transaction(async (client) => {
      // Obter o ID da sessão do carrinho
      const sessionResult = await client.query(
        'SELECT id FROM cart_sessions WHERE session_id = $1',
        [sessionId]
      );
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Sessão do carrinho não encontrada');
      }
      
      const cartSessionId = sessionResult.rows[0].id;
      
      await client.query(
        'DELETE FROM cart_items WHERE cart_session_id = $1 AND product_id = $2',
        [cartSessionId, productId]
      );
      
      // Atualizar timestamp da sessão
      await client.query(
        'UPDATE cart_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = $1',
        [sessionId]
      );
      
      return await Cart.findBySessionId(sessionId);
    });
  }

  // Limpar carrinho
  static async clear(sessionId) {
    return await transaction(async (client) => {
      // Obter o ID da sessão do carrinho
      const sessionResult = await client.query(
        'SELECT id FROM cart_sessions WHERE session_id = $1',
        [sessionId]
      );
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Sessão do carrinho não encontrada');
      }
      
      const cartSessionId = sessionResult.rows[0].id;
      
      await client.query(
        'DELETE FROM cart_items WHERE cart_session_id = $1',
        [cartSessionId]
      );
      
      // Atualizar timestamp da sessão
      await client.query(
        'UPDATE cart_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = $1',
        [sessionId]
      );
      
      return await Cart.findBySessionId(sessionId);
    });
  }

  // Associar carrinho a um usuário (quando faz login)
  static async associateWithUser(sessionId, userId) {
    return await transaction(async (client) => {
      // Verificar se o usuário já tem um carrinho
      const existingCartResult = await client.query(
        'SELECT session_id FROM cart_sessions WHERE user_id = $1',
        [userId]
      );
      
      if (existingCartResult.rows.length > 0) {
        const existingSessionId = existingCartResult.rows[0].session_id;
        
        if (existingSessionId !== sessionId) {
          // Obter IDs das sessões do carrinho
          const existingCartResult = await client.query(
            'SELECT id FROM cart_sessions WHERE session_id = $1',
            [existingSessionId]
          );
          const currentCartResult = await client.query(
            'SELECT id FROM cart_sessions WHERE session_id = $1',
            [sessionId]
          );
          
          if (existingCartResult.rows.length === 0 || currentCartResult.rows.length === 0) {
            throw new Error('Sessão do carrinho não encontrada');
          }
          
          const existingCartSessionId = existingCartResult.rows[0].id;
          const currentCartSessionId = currentCartResult.rows[0].id;
          
          // Mesclar carrinhos: mover itens do carrinho existente para o atual
          const existingItemsResult = await client.query(
            'SELECT * FROM cart_items WHERE cart_session_id = $1',
            [existingCartSessionId]
          );
          
          for (const item of existingItemsResult.rows) {
            // Verificar se o item já existe no carrinho atual
            const currentItemResult = await client.query(
              'SELECT quantity FROM cart_items WHERE cart_session_id = $1 AND product_id = $2',
              [currentCartSessionId, item.product_id]
            );
            
            if (currentItemResult.rows.length > 0) {
              // Somar quantidades
              const newQuantity = currentItemResult.rows[0].quantity + item.quantity;
              await client.query(
                'UPDATE cart_items SET quantity = $1 WHERE cart_session_id = $2 AND product_id = $3',
                [newQuantity, currentCartSessionId, item.product_id]
              );
            } else {
              // Mover item
              await client.query(
                'UPDATE cart_items SET cart_session_id = $1 WHERE cart_session_id = $2 AND product_id = $3',
                [currentCartSessionId, existingCartSessionId, item.product_id]
              );
            }
          }
          
          // Remover carrinho antigo
          await client.query(
            'DELETE FROM cart_sessions WHERE session_id = $1',
            [existingSessionId]
          );
        }
      }
      
      // Associar carrinho atual ao usuário
      await client.query(
        'UPDATE cart_sessions SET user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2',
        [userId, sessionId]
      );
      
      return await Cart.findBySessionId(sessionId);
    });
  }

  // Calcular totais do carrinho
  calculateTotals() {
    let subtotal = 0;
    let totalItems = 0;
    
    this.items.forEach(item => {
      const price = item.discountPrice || item.originalPrice;
      subtotal += price * item.quantity;
      totalItems += item.quantity;
    });
    
    // Calcular frete (lógica simples)
  //  const shippingCost = subtotal >= 200 ? 0 : 15; // Frete grátis acima de R$ 200
    const shippingCost = 0; 
    const total = subtotal + shippingCost;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      totalItems
    };
  }

  // Verificar disponibilidade dos itens
  async checkAvailability() {
    const unavailableItems = [];
    const updatedItems = [];
    
    for (const item of this.items) {
      if (!item.inStock) {
        unavailableItems.push({
          productId: item.productId,
          name: item.name,
          reason: 'Produto fora de estoque'
        });
      } else if (item.stockQuantity < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          name: item.name,
          reason: `Apenas ${item.stockQuantity} unidades disponíveis`,
          availableQuantity: item.stockQuantity
        });
      } else {
        updatedItems.push(item);
      }
    }
    
    return {
      isValid: unavailableItems.length === 0,
      unavailableItems,
      availableItems: updatedItems
    };
  }

  // Limpar carrinhos antigos (limpeza automática)
  static async cleanupOldCarts(daysOld = 30) {
    const sql = `
      DELETE FROM cart_sessions 
      WHERE updated_at < CURRENT_DATE - INTERVAL '${daysOld} days'
        AND user_id IS NULL
    `;
    
    const result = await query(sql);
    return result.rowCount;
  }

  // Buscar estatísticas de carrinho
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(DISTINCT cs.session_id) as total_carts,
        COUNT(DISTINCT cs.user_id) as user_carts,
        COUNT(DISTINCT CASE WHEN cs.user_id IS NULL THEN cs.session_id END) as anonymous_carts,
        COALESCE(AVG(cart_totals.item_count), 0) as avg_items_per_cart,
        COALESCE(AVG(cart_totals.total_value), 0) as avg_cart_value
      FROM cart_sessions cs
      LEFT JOIN (
        SELECT 
          cs.session_id,
          COUNT(*) as item_count,
          SUM(COALESCE(p.discount_price, p.original_price) * ci.quantity) as total_value
        FROM cart_items ci
        LEFT JOIN products p ON ci.product_id = p.id
        LEFT JOIN cart_sessions cs ON ci.cart_session_id = cs.id
        WHERE p.active = true
        GROUP BY cs.session_id
      ) cart_totals ON cs.session_id = cart_totals.session_id
      WHERE cs.updated_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const result = await query(sql);
    return result.rows[0];
  }

  // Converter para JSON
  toJSON() {
    const totals = this.calculateTotals();
    
    return {
      id: this.id,
      sessionId: this.sessionId,
      userId: this.userId,
      items: this.items,
      totals,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Cart;