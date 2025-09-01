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
    this.ml_id = data.ml_id;
    this.ml_seller_id = data.ml_seller_id;
    this.ml_family_id = data.ml_family_id;
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

    // Filtro por busca (nome, descrição, marca) - busca flexível por palavras e insensível a acentos
    if (filters.search) {
      const searchTerms = filters.search.trim().split(/\s+/).filter(term => term.length > 0);
      if (searchTerms.length > 0) {
        const searchConditions = [];
        
        searchTerms.forEach(term => {
          paramCount++;
          // Usar UNACCENT para ignorar acentos, com fallback para ILIKE normal
          searchConditions.push(`(
            COALESCE(UNACCENT(p.name), p.name) ILIKE UNACCENT($${paramCount}) OR 
            COALESCE(UNACCENT(p.description), p.description) ILIKE UNACCENT($${paramCount}) OR 
            COALESCE(UNACCENT(p.brand), p.brand) ILIKE UNACCENT($${paramCount})
          )`);
          params.push(`%${term}%`);
        });
        
        sql += ` AND (${searchConditions.join(' AND ')})`;
      }
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
        const searchTerms = filters.search.trim().split(/\s+/).filter(term => term.length > 0);
        if (searchTerms.length > 0) {
          const searchConditions = [];
          
          searchTerms.forEach(term => {
            paramCount++;
            // Usar UNACCENT para ignorar acentos, com fallback para ILIKE normal
            searchConditions.push(`(
              COALESCE(UNACCENT(p.name), p.name) ILIKE UNACCENT($${paramCount}) OR 
              COALESCE(UNACCENT(p.description), p.description) ILIKE UNACCENT($${paramCount}) OR 
              COALESCE(UNACCENT(p.brand), p.brand) ILIKE UNACCENT($${paramCount})
            )`);
            params.push(`%${term}%`);
          });
          
          sql += ` AND (${searchConditions.join(' AND ')})`;
        }
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
    // Validar campos obrigatórios
    if (!productData.name) {
      throw new Error('Nome do produto é obrigatório');
    }
    
    if (productData.originalPrice === undefined || productData.originalPrice === null) {
      throw new Error('Preço original é obrigatório');
    }
    
    // Garantir que preços sejam números
    if (productData.originalPrice !== undefined && productData.originalPrice !== null) {
      productData.originalPrice = parseFloat(productData.originalPrice) || 0;
    }
    
    if (productData.discountPrice !== undefined && productData.discountPrice !== null) {
      productData.discountPrice = parseFloat(productData.discountPrice) || 0;
    }
    
    // Garantir que estoque seja número
    if (productData.stockQuantity !== undefined && productData.stockQuantity !== null) {
      productData.stockQuantity = parseInt(productData.stockQuantity) || 0;
    }
    
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
        length_cm, weight_kg, featured, active, use_category_dimensions, ml_id, ml_seller_id, ml_family_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
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
      productData.useCategoryDimensions !== undefined ? productData.useCategoryDimensions : true,
      productData.ml_id || null,
      productData.ml_seller_id || null,
      productData.ml_family_id || null
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
          ml_id: 'ml_id',
          ml_seller_id: 'ml_seller_id',
          ml_family_id: 'ml_family_id',
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

    // Criar ou atualizar produto a partir de dados do Mercado Livre
  static async createOrUpdateFromMercadoLivre(mlProduct) {
    try {
      console.log('🔄 Iniciando createOrUpdateFromMercadoLivre para ML ID:', mlProduct.ml_id);
      
      // Verificar se produto já existe pelo ID do Mercado Livre
      const existingProduct = await query(
        'SELECT * FROM products WHERE ml_id = $1',
        [mlProduct.ml_id]
      );

      // Se já existe, apenas atualizar (não criar duplicado)
      if (existingProduct.rows.length > 0) {
        console.log(`ℹ️ Produto ${mlProduct.ml_id} já existe, atualizando...`);
        
        // Extrair peso e dimensões dos atributos do ML
        const weightData = this.extractWeightAndDimensions(mlProduct.attributes || []);
        
        // Extrair brand separadamente das especificações
        let brand = null;
        let specifications = null;
        
        if (mlProduct.attributes && Array.isArray(mlProduct.attributes)) {
          const specs = {};
          
          console.log('🔍 ANALISANDO ATRIBUTOS PARA ATUALIZAÇÃO:');
          mlProduct.attributes.forEach((attr, index) => {
            if (attr.name && attr.value_name) {
              console.log(`  ${index + 1}. ${attr.name} (${attr.id}) = ${attr.value_name}`);
              
              // Detectar brand APENAS do atributo "Marca"
              const attrName = attr.name.toLowerCase();
              const attrId = attr.id?.toLowerCase() || '';
              
              if (attrName === 'marca' || attrId === 'brand') {
                // Extrair o valor para o campo brand
                brand = attr.value_name;
                console.log('✅ BRAND detectado para atualização:', { name: attr.name, value: attr.value_name });
                
                // IMPORTANTE: Manter "Marca" nas especificações também
                specs[attr.name] = attr.value_name;
              } else {
                // Incluir todos os outros atributos nas especificações
                specs[attr.name] = attr.value_name;
              }
            }
          });
          
          specifications = JSON.stringify(specs);
          if (brand) {
            console.log('✅ Brand válido para atualização:', brand);
          } else {
            console.log('⚠️ Nenhum brand válido encontrado para atualização');
          }
          console.log('✅ Especificações para atualização (INCLUINDO marca):', specifications);
        }
        
        // Atualizar produto existente com campos padrão + peso e dimensões
        await query(`
          UPDATE products 
          SET 
            name = COALESCE($1, name),
            description = COALESCE($2, description),
            original_price = COALESCE($3, original_price),
            discount_price = COALESCE($4, discount_price),
            image_url = COALESCE($5, image_url),
            stock_quantity = COALESCE($6, stock_quantity),
            specifications = COALESCE($7, specifications),
            brand = COALESCE($8, brand),
            weight = COALESCE($9, weight),
            width_cm = COALESCE($10, width_cm),
            height_cm = COALESCE($11, height_cm),
            length_cm = COALESCE($12, length_cm),
            weight_kg = COALESCE($13, weight_kg),
            updated_at = NOW()
          WHERE id = $14
        `, [
          mlProduct.title || null,
          mlProduct.description || null,
          mlProduct.price || null,
          mlProduct.price || null,
          mlProduct.first_image_url || null,
          mlProduct.available_quantity || null,
          specifications,
          brand,
          weightData.weight || null,
          weightData.width_cm || null,
          weightData.height_cm || null,
          weightData.length_cm || null,
          weightData.weight_kg || null,
          existingProduct.rows[0].id
        ]);
        
        // Sincronizar imagens do produto
        await this.syncProductImages(mlProduct.ml_id, mlProduct.pictures || []);
        
        console.log('✅ Produto atualizado com sucesso');
        return existingProduct.rows[0];
      }
      
      // Se não existe, criar novo produto
      console.log(`🆕 Criando novo produto para ML ID: ${mlProduct.ml_id}`);
      
      // Para importação, usar campos padrão SEM depender da tabela de mapeamentos
      const productData = {};
      
      // Mapear campos padrão do ML para campos locais
      console.log('🔍 Campos recebidos do ML:', Object.keys(mlProduct));
      
      // Mapear nome/título - SEMPRE criar com nome válido
      if (mlProduct.title && mlProduct.title.trim() !== '') {
        productData.name = mlProduct.title;
        console.log('✅ Nome mapeado de "title":', productData.name);
      } else if (mlProduct.name && mlProduct.name.trim() !== '') {
        productData.name = mlProduct.name;
        console.log('✅ Nome mapeado de "name":', productData.name);
      } else {
        productData.name = `Produto ML ${mlProduct.ml_id}`;
        console.log('⚠️ Usando nome de fallback:', productData.name);
      }
      
      // Mapear descrição
      if (mlProduct.description && mlProduct.description.trim() !== '') {
        productData.description = mlProduct.description;
        console.log('✅ Descrição mapeada:', productData.description);
      } else {
        productData.description = `Produto importado do Mercado Livre (ID: ${mlProduct.ml_id})`;
        console.log('⚠️ Usando descrição de fallback:', productData.description);
      }
      
      // Mapear preços - SEMPRE criar com preço válido
      if (mlProduct.price && parseFloat(mlProduct.price) > 0) {
        productData.originalPrice = parseFloat(mlProduct.price);
        productData.discountPrice = parseFloat(mlProduct.price);
        console.log('✅ Preços mapeados:', { original: productData.originalPrice, discount: productData.discountPrice });
      } else {
        productData.originalPrice = 0.01; // Preço mínimo para evitar erro
        productData.discountPrice = 0.01;
        console.log('⚠️ Usando preço de fallback: 0.01');
      }
      
      // Mapear estoque - SEMPRE criar com estoque válido
      if (mlProduct.available_quantity !== undefined && mlProduct.available_quantity !== null) {
        productData.stockQuantity = parseInt(mlProduct.available_quantity) || 0;
        console.log('✅ Estoque mapeado:', productData.stockQuantity);
      } else {
        productData.stockQuantity = 1; // Estoque mínimo para evitar erro
        console.log('⚠️ Usando estoque de fallback: 1');
      }
      
      // Mapear imagem - usar URL já processada
      if (mlProduct.first_image_url) {
        productData.imageUrl = mlProduct.first_image_url;
        console.log('✅ Imagem mapeada de "first_image_url":', productData.imageUrl);
      } else {
        productData.imageUrl = null;
        console.log('⚠️ Nenhuma imagem fornecida');
      }
      
      // Mapear especificações dos atributos
      if (mlProduct.attributes && Array.isArray(mlProduct.attributes) && mlProduct.attributes.length > 0) {
        // Converter atributos para especificações
        const specs = {};
        let brand = null;
        
        console.log('🔍 ANALISANDO ATRIBUTOS NO MODELO:');
        mlProduct.attributes.forEach((attr, index) => {
          if (attr.name && attr.value_name) {
            console.log(`  ${index + 1}. ${attr.name} (${attr.id}) = ${attr.value_name}`);
            
            // Detectar brand APENAS do atributo "Marca"
            const attrName = attr.name.toLowerCase();
            const attrId = attr.id?.toLowerCase() || '';
            
            if (attrName === 'marca' || attrId === 'brand') {
              // Extrair o valor para o campo brand
              brand = attr.value_name;
              console.log('✅ BRAND detectado no modelo:', { name: attr.name, value: attr.value_name });
              
              // IMPORTANTE: Manter "Marca" nas especificações também
              specs[attr.name] = attr.value_name;
            } else {
              // Incluir todos os outros atributos nas especificações
              specs[attr.name] = attr.value_name;
            }
          }
        });
        
        productData.specifications = JSON.stringify(specs);
        if (brand) {
          productData.brand = brand;
          console.log('✅ Brand mapeado para campo separado:', brand);
        } else {
          console.log('⚠️ Nenhum brand válido encontrado nos atributos');
        }
        console.log('✅ Especificações mapeadas (INCLUINDO marca):', productData.specifications);
      }
      
      // Mapear brand diretamente se fornecido
      if (mlProduct.brand && mlProduct.brand.trim() !== '') {
        productData.brand = mlProduct.brand;
        console.log('🏷️ Brand mapeado diretamente:', productData.brand);
      }
      
      // Extrair peso e dimensões dos atributos
      const weightData = this.extractWeightAndDimensions(mlProduct.attributes || []);
      if (weightData.weight) productData.weight = weightData.weight;
      if (weightData.width_cm) productData.widthCm = weightData.width_cm;
      if (weightData.height_cm) productData.heightCm = weightData.height_cm;
      if (weightData.length_cm) productData.lengthCm = weightData.length_cm;
      if (weightData.weight_kg) productData.weightKg = weightData.weight_kg;
      
      console.log('📏 Peso e dimensões extraídos:', weightData);
      
      // Adicionar family_id do ML
      if (mlProduct.category_id) {
        productData.ml_family_id = mlProduct.category_id;
        console.log('✅ Family ID mapeado:', productData.ml_family_id);
      }
      
      console.log('📝 Dados finais do produto para criação:', productData);
      console.log('🖼️ ImageUrl final:', productData.imageUrl);
      console.log('📝 Description final:', productData.description);
      
      // Adicionar campos obrigatórios
      productData.ml_id = mlProduct.ml_id;
      productData.ml_seller_id = mlProduct.seller_id;
      
      // Gerar SKU único (sem prefixo ML-)
      productData.sku = await this.generateUniqueSku(mlProduct.ml_id);
      productData.active = true;
      
      console.log('🔑 SKU gerado:', productData.sku);
      console.log('🔄 Chamando método create...');

      const result = await this.create(productData);
      
      // Sincronizar imagens do produto após criação
      await this.syncProductImages(mlProduct.ml_id, mlProduct.pictures || []);
      
      console.log('✅ Produto criado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro em createOrUpdateFromMercadoLivre:', error);
      throw error;
    }
  }

  // Método auxiliar para extrair peso e dimensões dos atributos do ML
  static extractWeightAndDimensions(attributes) {
    const result = {
      weight: null,
      width_cm: null,
      height_cm: null,
      length_cm: null,
      weight_kg: null
    };

    if (!Array.isArray(attributes)) return result;

    attributes.forEach(attr => {
      if (!attr.name || !attr.value_name) return;

      const attrName = attr.name.toLowerCase();
      const attrValue = attr.value_name.toLowerCase();

      // Peso
      if (attrName.includes('peso') || attrName.includes('weight')) {
        const weightMatch = attrValue.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramas?|quilos?)/i);
        if (weightMatch) {
          const value = parseFloat(weightMatch[1].replace(',', '.'));
          const unit = weightMatch[2].toLowerCase();
          
          if (unit === 'kg' || unit === 'quilos' || unit === 'quilo') {
            result.weight_kg = value;
            result.weight = value * 1000; // Converter para gramas
          } else if (unit === 'g' || unit === 'gr' || unit === 'gramas' || unit === 'grama') {
            result.weight = value;
            result.weight_kg = value / 1000; // Converter para kg
          }
        }
      }

      // Dimensões
      if (attrName.includes('largura') || attrName.includes('width')) {
        const widthMatch = attrValue.match(/(\d+(?:[.,]\d+)?)\s*(cm|mm|m)/i);
        if (widthMatch) {
          const value = parseFloat(widthMatch[1].replace(',', '.'));
          const unit = widthMatch[2].toLowerCase();
          
          if (unit === 'cm') {
            result.width_cm = value;
          } else if (unit === 'mm') {
            result.width_cm = value / 10;
          } else if (unit === 'm') {
            result.width_cm = value * 100;
          }
        }
      }

      if (attrName.includes('altura') || attrName.includes('height')) {
        const heightMatch = attrValue.match(/(\d+(?:[.,]\d+)?)\s*(cm|mm|m)/i);
        if (heightMatch) {
          const value = parseFloat(heightMatch[1].replace(',', '.'));
          const unit = heightMatch[2].toLowerCase();
          
          if (unit === 'cm') {
            result.height_cm = value;
          } else if (unit === 'mm') {
            result.height_cm = value / 10;
          } else if (unit === 'm') {
            result.height_cm = value * 100;
          }
        }
      }

      if (attrName.includes('comprimento') || attrName.includes('length') || attrName.includes('profundidade')) {
        const lengthMatch = attrValue.match(/(\d+(?:[.,]\d+)?)\s*(cm|mm|m)/i);
        if (lengthMatch) {
          const value = parseFloat(lengthMatch[1].replace(',', '.'));
          const unit = lengthMatch[2].toLowerCase();
          
          if (unit === 'cm') {
            result.length_cm = value;
          } else if (unit === 'mm') {
            result.length_cm = value / 10;
          } else if (unit === 'm') {
            result.length_cm = value * 100;
          }
        }
      }
    });

    return result;
  }

  // Buscar imagens do Mercado Livre por ML ID
  static async getMercadoLivreImages(mlId) {
    const sql = `
      SELECT image_url, position
      FROM product_images_ml 
      WHERE ml_id = $1 
      ORDER BY position ASC
    `;
    const result = await query(sql, [mlId]);
    return result.rows;
  }

  // Método auxiliar para sincronizar imagens do produto
  static async syncProductImages(mlId, pictures) {
    try {
      console.log(`🖼️ Sincronizando imagens para produto ML ID: ${mlId}`);
      console.log(`📊 Dados recebidos:`, {
        mlId,
        picturesType: typeof pictures,
        picturesIsArray: Array.isArray(pictures),
        picturesLength: pictures?.length || 0,
        pictures: pictures
      });
      
      if (!mlId) {
        console.log('❌ ML ID não fornecido para sincronização de imagens');
        return;
      }
      
      // Remover imagens antigas
      const deleteResult = await query('DELETE FROM product_images_ml WHERE ml_id = $1', [mlId]);
      console.log(`🗑️ Imagens antigas removidas: ${deleteResult.rowCount} linhas afetadas`);
      
      // Inserir novas imagens
      if (pictures && Array.isArray(pictures) && pictures.length > 0) {
        console.log(`📸 Processando ${pictures.length} imagens...`);
        
        for (let i = 0; i < pictures.length; i++) {
          const picture = pictures[i];
          console.log(`🖼️ Processando imagem ${i + 1}:`, picture);
          
          const imageUrl = picture.url || picture.secure_url;
          
          if (imageUrl) {
            try {
              const insertResult = await query(
                'INSERT INTO product_images_ml (ml_id, image_url, position) VALUES ($1, $2, $3)',
                [mlId, imageUrl, i]
              );
              console.log(`✅ Imagem ${i + 1} salva com sucesso:`, {
                url: imageUrl,
                position: i,
                rowCount: insertResult.rowCount
              });
            } catch (insertError) {
              console.error(`❌ Erro ao salvar imagem ${i + 1}:`, insertError);
            }
          } else {
            console.log(`⚠️ Imagem ${i + 1} sem URL válida:`, picture);
          }
        }
        
        // Verificar se as imagens foram salvas
        const verifyResult = await query('SELECT COUNT(*) as count FROM product_images_ml WHERE ml_id = $1', [mlId]);
        console.log(`🔍 Verificação: ${verifyResult.rows[0].count} imagens salvas na tabela para ML ID ${mlId}`);
        
      } else {
        console.log('⚠️ Nenhuma imagem para sincronizar ou formato inválido');
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar imagens:', error);
      console.error('❌ Stack trace:', error.stack);
      // Não interromper o fluxo principal por erro de imagem
    }
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
      ml_id: this.ml_id,
      ml_seller_id: this.ml_seller_id,
      ml_family_id: this.ml_family_id,
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