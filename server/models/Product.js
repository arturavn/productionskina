import { query, transaction } from '../config/database.js';

class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.originalPrice = data.original_price || data.originalPrice;
    this.discountPrice = data.discount_price || data.discountPrice;
    this.imageUrl = data.image_url || data.imageUrl;
    this.brand = data.brand;
    this.categoryId = data.category_id || data.categoryId;
    this.category = data.category_name || data.category; // Adicionar mapeamento do nome da categoria
    this.stockQuantity = data.stock_quantity || data.stockQuantity;
    this.inStock = data.in_stock !== undefined ? data.in_stock : data.inStock;
    this.specifications = data.specifications;
    this.compatibility = data.compatibility;
    this.sku = data.sku;
    this.weight = data.weight;
    this.dimensions = data.dimensions;
    // Dimensões físicas agora vêm da categoria (com fallback para o produto)
    this.widthCm = data.category_width_cm || data.width_cm || data.widthCm;
    this.heightCm = data.category_height_cm || data.height_cm || data.heightCm;
    this.lengthCm = data.category_length_cm || data.length_cm || data.lengthCm;
    this.weightKg = data.category_weight_kg || data.weight_kg || data.weightKg;
    this.featured = data.is_featured !== undefined ? data.is_featured : (data.featured !== undefined ? data.featured : false);
    this.viewCount = data.view_count || data.viewCount || 0;
    this.active = data.active;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Buscar todos os produtos com filtros
  static async findAll(filters = {}) {
    let sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.active = true
    `;
    const params = [];
    let paramCount = 0;

    // Aplicar filtros...
     return this._applyFiltersAndExecute(sql, params, paramCount, filters);
   }

   // Buscar todos os produtos para admin (por padrão apenas ativos, mas pode incluir inativos)
   static async findAllForAdmin(filters = {}, options = {}) {
     // Por padrão, mostrar apenas produtos ativos, a menos que explicitamente solicitado incluir inativos
     const includeInactive = filters.includeInactive === true;
     
     let sql = `
       SELECT p.*, c.name as category_name,
              c.width_cm as category_width_cm, c.height_cm as category_height_cm,
              c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE ${includeInactive ? '1=1' : 'p.active = true'}
     `;
     const params = [];
     let paramCount = 0;

     // Combinar filtros e opções para passar para o método auxiliar
     const combinedFilters = { ...filters, ...options };
     return this._applyFiltersAndExecute(sql, params, paramCount, combinedFilters);
   }

   // Método auxiliar para aplicar filtros e executar query
   static async _applyFiltersAndExecute(sql, params, paramCount, filters) {
     // Filtro por categoria
    if (filters.category) {
      paramCount++;
      sql += ` AND c.name ILIKE $${paramCount}`;
      params.push(`%${filters.category}%`);
    }

    // Filtro por marca
    if (filters.brand) {
      paramCount++;
      sql += ` AND p.brand ILIKE $${paramCount}`;
      params.push(`%${filters.brand}%`);
    }

    // Filtro por busca (nome, descrição, marca)
    if (filters.search) {
      paramCount++;
      sql += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.brand ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    // Filtro por preço mínimo
    if (filters.minPrice) {
      paramCount++;
      sql += ` AND COALESCE(p.discount_price, p.original_price) >= $${paramCount}`;
      params.push(parseFloat(filters.minPrice));
    }

    // Filtro por preço máximo
    if (filters.maxPrice) {
      paramCount++;
      sql += ` AND COALESCE(p.discount_price, p.original_price) <= $${paramCount}`;
      params.push(parseFloat(filters.maxPrice));
    }

    // Filtro por disponibilidade
    if (filters.inStock !== undefined) {
      paramCount++;
      sql += ` AND p.in_stock = $${paramCount}`;
      params.push(filters.inStock);
    }

    // Ordenação
    const validSortFields = ['name', 'original_price', 'discount_price', 'created_at', 'brand'];
    const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'created_at';
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
    return result.rows.map(row => new Product(row));
  }

  // Contar total de produtos com filtros
  static async count(filters = {}) {
    let sql = `
      SELECT COUNT(*) as total 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.active = true
    `;
    const params = [];
    let paramCount = 0;

    return this._applyCountFilters(sql, params, paramCount, filters);
   }

   // Contar total de produtos para admin (incluindo inativos)
   static async countForAdmin(filters = {}) {
     // Por padrão, contar apenas produtos ativos, a menos que explicitamente solicitado incluir inativos
     const includeInactive = filters.includeInactive === true;
     
     let sql = `
       SELECT COUNT(*) as total 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE ${includeInactive ? '1=1' : 'p.active = true'}
     `;
     const params = [];
     let paramCount = 0;

     return this._applyCountFilters(sql, params, paramCount, filters);
   }

   // Método auxiliar para aplicar filtros de contagem
    static async _applyCountFilters(sql, params, paramCount, filters) {
      // Aplicar os mesmos filtros da busca
      if (filters.category) {
        paramCount++;
        sql += ` AND c.name ILIKE $${paramCount}`;
        params.push(`%${filters.category}%`);
      }

      if (filters.brand) {
        paramCount++;
        sql += ` AND p.brand ILIKE $${paramCount}`;
        params.push(`%${filters.brand}%`);
      }

      if (filters.search) {
        paramCount++;
        sql += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.brand ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
      }

      if (filters.minPrice) {
        paramCount++;
        sql += ` AND COALESCE(p.discount_price, p.original_price) >= $${paramCount}`;
        params.push(parseFloat(filters.minPrice));
      }

      if (filters.maxPrice) {
        paramCount++;
        sql += ` AND COALESCE(p.discount_price, p.original_price) <= $${paramCount}`;
        params.push(parseFloat(filters.maxPrice));
      }

      if (filters.inStock !== undefined) {
        paramCount++;
        sql += ` AND p.in_stock = $${paramCount}`;
        params.push(filters.inStock);
      }

      const result = await query(sql, params);
      return parseInt(result.rows[0].total);
    }

  // Buscar produto por ID
  static async findById(id) {
    const sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = $1 AND p.active = true
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  // Buscar produto por ID para admin (incluindo inativos)
  static async findByIdForAdmin(id) {
    const sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  // Buscar produto por SKU
  static async findBySku(sku) {
    const sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.sku = $1 AND p.active = true
    `;
    const result = await query(sql, [sku]);
    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  // Buscar produto por nome (busca aproximada)
  static async findByName(name) {
    const sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.name ILIKE $1 AND p.active = true
      ORDER BY 
        CASE 
          WHEN p.name ILIKE $1 THEN 1
          WHEN p.name ILIKE $2 THEN 2
          ELSE 3
        END,
        p.name
      LIMIT 1
    `;
    const exactMatch = name;
    const startsWith = `${name}%`;
    const result = await query(sql, [exactMatch, startsWith]);
    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  // Gerar SKU único
  static async generateUniqueSku(baseSku = null) {
    let sku = baseSku;
    
    // Se não foi fornecido um SKU base, gerar um baseado no timestamp
    if (!sku || sku.trim() === '') {
      sku = `SKU-${Date.now()}`;
    }
    
    // Verificar se o SKU já existe
    let counter = 0;
    let finalSku = sku;
    
    while (true) {
      const checkSql = 'SELECT id FROM products WHERE sku = $1';
      const checkResult = await query(checkSql, [finalSku]);
      
      if (checkResult.rows.length === 0) {
        break; // SKU é único
      }
      
      counter++;
      finalSku = `${sku}-${counter}`;
    }
    
    return finalSku;
  }

  // Criar novo produto
  static async create(productData) {
    // Gerar SKU único se não fornecido ou vazio
    let sku = productData.sku;
    if (!sku || sku.trim() === '') {
      sku = await Product.generateUniqueSku();
    } else {
      // Verificar se o SKU fornecido já existe e gerar um único se necessário
      sku = await Product.generateUniqueSku(sku);
    }
    
    const sql = `
      INSERT INTO products (
        name, description, original_price, discount_price, image_url, 
        brand, category_id, stock_quantity, in_stock, specifications, 
        compatibility, sku, weight, dimensions, width_cm, height_cm, 
        length_cm, weight_kg, featured, active, use_category_dimensions
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *
    `;
    
    const params = [
      productData.name,
      productData.description,
      productData.originalPrice,
      productData.discountPrice,
      productData.imageUrl,
      productData.brand,
      productData.categoryId,
      productData.stockQuantity || 0,
      productData.inStock !== undefined ? productData.inStock : true,
      JSON.stringify(productData.specifications || {}),
      productData.compatibility || [],
      sku, // Usar o SKU gerado/validado
      productData.weight,
      JSON.stringify(productData.dimensions || {}),
      productData.widthCm,
      productData.heightCm,
      productData.lengthCm,
      productData.weightKg,
      productData.featured || false,
      productData.active !== undefined ? productData.active : true,
      productData.useCategoryDimensions !== undefined ? productData.useCategoryDimensions : true
    ];

    const result = await query(sql, params);
    return new Product(result.rows[0]);
  }

  // Atualizar produto
  static async update(id, productData) {
    const fields = [];
    const params = [];
    let paramCount = 0;

    // Construir query dinamicamente baseada nos campos fornecidos
    Object.keys(productData).forEach(key => {
      if (productData[key] !== undefined) {
        paramCount++;
        
        // Mapear nomes de campos do JavaScript para SQL
        const fieldMap = {
          originalPrice: 'original_price',
          discountPrice: 'discount_price',
          imageUrl: 'image_url',
          categoryId: 'category_id',
          stockQuantity: 'stock_quantity',
          inStock: 'in_stock',
          widthCm: 'width_cm',
          heightCm: 'height_cm',
          lengthCm: 'length_cm',
          weightKg: 'weight_kg',
          useCategoryDimensions: 'use_category_dimensions',
          price: null // Ignorar campo 'price' - usar originalPrice ou discountPrice
        };
        
        const sqlField = fieldMap[key] || key;
        
        // Ignorar campos que não devem ser atualizados
        if (sqlField === null) {
          paramCount--; // Decrementar porque não vamos usar este parâmetro
          return;
        }
        
        fields.push(`${sqlField} = $${paramCount}`);
        
        // Tratar campos JSON
        if (key === 'specifications' || key === 'dimensions') {
          params.push(JSON.stringify(productData[key]));
        } else {
          params.push(productData[key]);
        }
      }
    });

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    paramCount++;
    const sql = `
      UPDATE products 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramCount} AND active = true 
      RETURNING *
    `;
    params.push(id);

    const result = await query(sql, params);
    
    if (result.rows.length > 0) {
      // Buscar o produto atualizado com o nome da categoria e dimensões
      const productWithCategory = await query(`
        SELECT p.*, c.name as category_name,
               c.width_cm as category_width_cm, c.height_cm as category_height_cm,
               c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = $1
      `, [id]);
      
      return productWithCategory.rows.length > 0 ? new Product(productWithCategory.rows[0]) : new Product(result.rows[0]);
    }
    
    return null;
  }

  // Deletar produto (soft delete)
  static async delete(id) {
    const sql = `
      UPDATE products 
      SET active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  }

  // Deletar produto permanentemente
  static async deletePermanently(id) {
    try {
      console.log(`🗑️ Iniciando exclusão do produto: ${id}`);
      
      // Verificar se o produto está sendo usado em pedidos
      const orderItemsCheck = await query(
        'SELECT COUNT(*) as count FROM order_items WHERE product_id = $1',
        [id]
      );
      
      const hasOrderItems = parseInt(orderItemsCheck.rows[0].count) > 0;
      console.log(`📊 Produto ${id} tem ${orderItemsCheck.rows[0].count} itens em pedidos`);
      
      if (hasOrderItems) {
        // Se o produto está em pedidos, fazer apenas soft delete
        console.log(`⚠️ Produto ${id} está em pedidos, fazendo soft delete`);
        const softDeleteResult = await this.delete(id);
        console.log(`✅ Soft delete concluído para produto ${id}:`, softDeleteResult);
        return softDeleteResult;
      }
      
      // Se não está em pedidos, pode deletar permanentemente
      console.log(`🔥 Produto ${id} não está em pedidos, deletando permanentemente`);
      
      // Primeiro, deletar todas as imagens associadas
      const imagesResult = await query('DELETE FROM product_images WHERE product_id = $1', [id]);
      console.log(`🖼️ Deletadas ${imagesResult.rowCount} imagens do produto ${id}`);
      
      // Depois, deletar o produto
      const sql = `
        DELETE FROM products 
        WHERE id = $1 
        RETURNING *
      `;
      const result = await query(sql, [id]);
      console.log(`🗑️ Resultado da exclusão permanente do produto ${id}:`, {
        rowCount: result.rowCount,
        deletedProduct: result.rows[0] ? 'Sim' : 'Não'
      });
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erro ao deletar produto permanentemente:', error);
      throw error;
    }
  }

  // Métodos para gerenciar imagens de produtos
  
  // Adicionar imagem ao produto
  static async addImage(productId, imageData, imageName, imageSize, isPrimary = false, mimeType = 'image/jpeg') {
    const sql = `
      INSERT INTO product_images (product_id, image_data, image_name, image_size, is_primary, mime_type, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE((SELECT MAX(display_order) + 1 FROM product_images WHERE product_id = $1), 0))
      RETURNING id, product_id, image_name, image_size, is_primary, mime_type, display_order, created_at
    `;
    const result = await query(sql, [productId, imageData, imageName, imageSize, isPrimary, mimeType]);
    return result.rows[0];
  }

  // Buscar imagens do produto
  static async getImages(productId) {
    const sql = `
      SELECT id, image_name, image_size, is_primary, display_order, created_at
      FROM product_images 
      WHERE product_id = $1 
      ORDER BY is_primary DESC, display_order ASC
    `;
    const result = await query(sql, [productId]);
    return result.rows;
  }

  // Buscar dados da imagem (binário)
  static async getImageData(imageId) {
    const sql = 'SELECT image_data, image_name, mime_type FROM product_images WHERE id = $1';
    const result = await query(sql, [imageId]);
    return result.rows[0];
  }

  // Definir imagem como principal
  static async setPrimaryImage(productId, imageId) {
    const sql = `
      UPDATE product_images 
      SET is_primary = CASE WHEN id = $2 THEN true ELSE false END
      WHERE product_id = $1
      RETURNING id, is_primary
    `;
    const result = await query(sql, [productId, imageId]);
    return result.rows;
  }

  // Deletar imagem
  static async deleteImage(imageId) {
    const sql = 'DELETE FROM product_images WHERE id = $1 RETURNING *';
    const result = await query(sql, [imageId]);
    return result.rows[0];
  }

  // Reordenar imagens
  static async reorderImages(productId, imageOrders) {
    const promises = imageOrders.map(({ imageId, order }) => {
      const sql = 'UPDATE product_images SET display_order = $1 WHERE id = $2 AND product_id = $3';
      return query(sql, [order, imageId, productId]);
    });
    await Promise.all(promises);
    return true;
  }

  // Atualizar estoque
  static async updateStock(id, quantity, reason = 'Manual adjustment', userId = null) {
    return await transaction(async (client) => {
      // Buscar produto atual
      const productResult = await client.query(
        'SELECT stock_quantity FROM products WHERE id = $1',
        [id]
      );
      
      if (productResult.rows.length === 0) {
        throw new Error('Produto não encontrado');
      }
      
      const currentStock = productResult.rows[0].stock_quantity;
      const newStock = currentStock + quantity;
      
      if (newStock < 0) {
        throw new Error('Estoque não pode ser negativo');
      }
      
      // Atualizar estoque
      await client.query(
        `UPDATE products 
         SET stock_quantity = $1, in_stock = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [newStock, newStock > 0, id]
      );
      
      // Registrar no histórico
      await client.query(
        `INSERT INTO stock_history 
         (product_id, change_type, quantity_change, previous_quantity, new_quantity, reason, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          quantity > 0 ? 'increase' : 'decrease',
          quantity,
          currentStock,
          newStock,
          reason,
          userId
        ]
      );
      
      return newStock;
    });
  }

  // Buscar produtos com baixo estoque
  static async findLowStock(threshold = 10) {
    const sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.active = true AND p.stock_quantity <= $1 
      ORDER BY p.stock_quantity ASC
    `;
    const result = await query(sql, [threshold]);
    return result.rows.map(row => new Product(row));
  }

  // Buscar produtos mais vendidos
  static async findBestSellers(limit = 10) {
    const sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg,
             COALESCE(SUM(oi.quantity), 0) as total_sold
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE p.active = true
      GROUP BY p.id, p.name, p.description, p.original_price, p.discount_price, p.image_url, 
               p.brand, p.category_id, p.stock_quantity, p.in_stock, p.specifications, 
               p.compatibility, p.sku, p.weight, p.dimensions, p.active, p.created_at, 
               p.updated_at, p.width_cm, p.height_cm, p.length_cm, p.weight_kg, p.featured, 
               p.use_category_dimensions, p.view_count, c.name, c.width_cm, c.height_cm, 
               c.length_cm, c.weight_kg
      ORDER BY total_sold DESC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows.map(row => {
      const product = new Product(row);
      product.totalSold = parseInt(row.total_sold);
      return product;
    });
  }

  // Buscar produtos em destaque
  static async getFeatured(limit = 8) {
    const sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.active = true AND p.in_stock = true AND p.featured = true
      ORDER BY p.created_at DESC
      LIMIT $1
    `;
    
    const result = await query(sql, [limit]);
    return result.rows.map(row => new Product(row));
  }

  // Buscar todas as marcas disponíveis
  static async getAllBrands() {
    const sql = `
      SELECT brand, COUNT(*) as count
      FROM products 
      WHERE active = true AND brand IS NOT NULL AND brand != ''
      GROUP BY brand
      ORDER BY brand ASC
    `;
    
    const result = await query(sql);
    return result.rows;
  }

  // Obter estatísticas dos produtos
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN in_stock = true THEN 1 END) as in_stock,
        COUNT(CASE WHEN stock_quantity <= 5 THEN 1 END) as low_stock,
        AVG(original_price) as avg_price
      FROM products 
      WHERE active = true
    `;
    
    const result = await query(sql);
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total) || 0,
      inStock: parseInt(stats.in_stock) || 0,
      lowStock: parseInt(stats.low_stock) || 0,
      avgPrice: parseFloat(stats.avg_price) || 0
    };
  }

  // Buscar produtos com baixo estoque
  static async findLowStock(threshold = 5) {
    const sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.active = true AND p.stock_quantity <= $1
      ORDER BY p.stock_quantity ASC
    `;
    
    const result = await query(sql, [threshold]);
    return result.rows.map(row => new Product(row));
  }

  // Incrementar contador de visitas
  static async incrementViewCount(id) {
    const sql = `
      UPDATE products 
      SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND active = true 
      RETURNING view_count
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? result.rows[0].view_count : null;
  }

  // Buscar produtos mais visitados
  static async findMostViewed(limit = 10) {
    const sql = `
      SELECT p.*, c.name as category_name,
             c.width_cm as category_width_cm, c.height_cm as category_height_cm,
             c.length_cm as category_length_cm, c.weight_kg as category_weight_kg
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.active = true 
      ORDER BY p.view_count DESC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows.map(row => new Product(row));
  }

  // Resetar todas as visitas dos produtos
  static async resetAllViewCounts() {
    const sql = `
      UPDATE products 
      SET view_count = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE active = true
    `;
    const result = await query(sql);
    return {
      affectedRows: result.rowCount
    };
  }

  // Converter para JSON (para APIs)
  toJSON() {
    const json = {
      id: this.id,
      name: this.name,
      description: this.description,
      originalPrice: this.originalPrice,
      discountPrice: this.discountPrice,
      imageUrl: this.imageUrl,
      brand: this.brand,
      categoryId: this.categoryId,
      category: this.category,
      stockQuantity: this.stockQuantity,
      inStock: this.inStock,
      specifications: this.specifications,
      compatibility: this.compatibility,
      sku: this.sku,
      weight: this.weight,
      dimensions: this.dimensions,
      viewCount: this.viewCount,
      featured: this.featured,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    
    // Incluir totalSold se existir
    if (this.totalSold !== undefined) {
      json.totalSold = this.totalSold;
    }
    
    return json;
  }
}

export default Product;