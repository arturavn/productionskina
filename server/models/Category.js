import { query } from '../config/database.js';

class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    // this.slug = data.slug; // Coluna não existe na tabela
    this.description = data.description;
    this.imageUrl = data.image_url || data.imageUrl;
    // this.parentId = data.parent_id || data.parentId; // Coluna não existe na tabela
    this.isActive = data.active !== undefined ? data.active : data.isActive;
    // this.sortOrder = data.sort_order || data.sortOrder || 0; // Coluna não existe na tabela
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
    
    // Campos de dimensões para cálculo de frete
    this.widthCm = data.width_cm || data.widthCm;
    this.heightCm = data.height_cm || data.heightCm;
    this.lengthCm = data.length_cm || data.lengthCm;
    this.weightKg = data.weight_kg || data.weightKg;
    
    // Campos adicionais que podem vir de JOINs
    this.productCount = data.product_count ? parseInt(data.product_count) : 0;
  }

  // Buscar todas as categorias com filtros
  static async findAll(filters = {}) {
    let sql = `
      SELECT c.id, c.name, c.description, c.image_url, c.active, c.created_at, c.updated_at,
             c.width_cm, c.height_cm, c.length_cm, c.weight_kg,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      WHERE c.active = true
    `;
    const params = [];
    let paramCount = 0;

    // Filtro por status ativo
    if (filters.isActive !== undefined) {
      paramCount++;
      sql += ` AND c.active = $${paramCount}`;
      params.push(filters.isActive);
    }

    // Filtro por busca (nome ou descrição)
    if (filters.search) {
      paramCount++;
      sql += ` AND (c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    sql += ` GROUP BY c.id`;

    // Filtro por categorias em destaque (com produtos)
    if (filters.featured) {
      sql += ` HAVING COUNT(p.id) > 0`;
    }

    // Ordenação
    const validSortFields = ['name', 'created_at', 'product_count'];
    const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'name';
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    if (sortBy === 'product_count') {
      sql += ` ORDER BY COUNT(p.id) ${sortOrder}, c.name ASC`;
    } else {
      sql += ` ORDER BY c.${sortBy} ${sortOrder}`;
    }

    // Paginação (opcional)
    if (filters.limit) {
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit);
      const offset = (page - 1) * limit;

      paramCount++;
      sql += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      sql += ` OFFSET $${paramCount}`;
      params.push(offset);
    }

    const result = await query(sql, params);
    return result.rows.map(row => new Category(row));
  }

  // Contar total de categorias
  static async count(filters = {}) {
    if (filters.featured) {
      // Para categorias em destaque, usar a mesma query com COUNT
      let sql = `
        SELECT COUNT(*) as total
        FROM (
          SELECT c.id
          FROM categories c
           LEFT JOIN products p ON c.id = p.category_id AND p.active = true
           WHERE c.active = true
      `;
      const params = [];
      let paramCount = 0;

      // Aplicar os mesmos filtros
      if (filters.isActive !== undefined) {
        paramCount++;
        sql += ` AND c.active = $${paramCount}`;
        params.push(filters.isActive);
      }

      if (filters.search) {
        paramCount++;
        sql += ` AND (c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
      }

      sql += ` GROUP BY c.id HAVING COUNT(p.id) > 0
        ) as featured_categories`;

      const result = await query(sql, params);
      return parseInt(result.rows[0].total);
    } else {
      let sql = `
        SELECT COUNT(*) as total
        FROM categories c
         WHERE c.active = true
      `;
      const params = [];
      let paramCount = 0;

      // Aplicar os mesmos filtros
      if (filters.isActive !== undefined) {
        paramCount++;
        sql += ` AND c.active = $${paramCount}`;
        params.push(filters.isActive);
      }

      if (filters.search) {
        paramCount++;
        sql += ` AND (c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
        params.push(`%${filters.search}%`);
      }

      const result = await query(sql, params);
      return parseInt(result.rows[0].total);
    }
  }

  // Buscar categoria por ID
  static async findById(id) {
    const sql = `
      SELECT c.id, c.name, c.description, c.image_url, c.active, c.created_at, c.updated_at,
             c.width_cm, c.height_cm, c.length_cm, c.weight_kg,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      WHERE c.id = $1 AND c.active = true
      GROUP BY c.id
    `;
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? new Category(result.rows[0]) : null;
  }

  // Buscar categoria por slug
  static async findBySlug(slug) {
    const sql = `
      SELECT c.id, c.name, c.description, c.image_url, c.active, c.created_at, c.updated_at,
             c.width_cm, c.height_cm, c.length_cm, c.weight_kg,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      WHERE c.slug = $1 AND c.active = true
      GROUP BY c.id
    `;
    const result = await query(sql, [slug]);
    return result.rows.length > 0 ? new Category(result.rows[0]) : null;
  }

  // Buscar categoria por nome
  static async findByName(name) {
    const sql = `
      SELECT c.id, c.name, c.description, c.image_url, c.active, c.created_at, c.updated_at,
             c.width_cm, c.height_cm, c.length_cm, c.weight_kg,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      WHERE c.name = $1 AND c.active = true
      GROUP BY c.id
    `;
    const result = await query(sql, [name]);
    return result.rows.length > 0 ? new Category(result.rows[0]) : null;
  }

  // Buscar todas as categorias (sem hierarquia)
  static async findTree() {
    const sql = `
      SELECT c.id, c.name, c.description, c.image_url, c.active, c.created_at, c.updated_at,
             c.width_cm, c.height_cm, c.length_cm, c.weight_kg,
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      WHERE c.active = true
      GROUP BY c.id
      ORDER BY c.name
    `;
    
    const result = await query(sql);
    return result.rows.map(row => new Category(row));
  }

  // Buscar todas as categorias (sem hierarquia)
  static async findChildren(parentId) {
    const sql = `
      SELECT c.*, 
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      WHERE c.active = true
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    const result = await query(sql);
    return result.rows.map(row => new Category(row));
  }

  // Criar nova categoria
  static async create(categoryData) {
    // Gerar slug se não fornecido
    if (!categoryData.slug) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim('-'); // Remove hífens do início/fim
    }

    // Verificar se slug já existe
    const existingCategory = await Category.findBySlug(categoryData.slug);
    if (existingCategory) {
      throw new Error('Já existe uma categoria com este slug');
    }

    const sql = `
      INSERT INTO categories (
        name, slug, description, image_url, 
        active
      ) VALUES (
        $1, $2, $3, $4, $5
      ) RETURNING *
    `;
    
    const params = [
      categoryData.name,
      categoryData.slug,
      categoryData.description,
      categoryData.imageUrl,
      categoryData.isActive !== undefined ? categoryData.isActive : true
    ];
    
    const result = await query(sql, params);
    return new Category(result.rows[0]);
  }

  // Atualizar categoria
  static async update(id, categoryData) {
    const fields = [];
    const params = [];
    let paramCount = 0;

    // Construir query dinamicamente
    Object.keys(categoryData).forEach(key => {
      if (categoryData[key] !== undefined) {
        paramCount++;
        
        // Mapear nomes de campos
        const fieldMap = {
          imageUrl: 'image_url',
          isActive: 'active',
          widthCm: 'width_cm',
          heightCm: 'height_cm',
          lengthCm: 'length_cm',
          weightKg: 'weight_kg'
        };
        
        const sqlField = fieldMap[key] || key;
        fields.push(`${sqlField} = $${paramCount}`);
        params.push(categoryData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    // Verificar se slug já existe (se estiver sendo atualizado)
    if (categoryData.slug) {
      const existingCategory = await Category.findBySlug(categoryData.slug);
      if (existingCategory && existingCategory.id !== parseInt(id)) {
        throw new Error('Já existe uma categoria com este slug');
      }
    }

    paramCount++;
    const sql = `
      UPDATE categories 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramCount}
      RETURNING *
    `;
    params.push(id);

    const result = await query(sql, params);
    return result.rows.length > 0 ? new Category(result.rows[0]) : null;
  }

  // Deletar categoria (desativar)
  static async delete(id) {
    // Verificar se há produtos associados
    const productCheck = await query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND active = true',
      [id]
    );
    
    if (parseInt(productCheck.rows[0].count) > 0) {
      throw new Error('Não é possível deletar categoria que possui produtos associados');
    }

    const sql = `
      UPDATE categories 
      SET active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? new Category(result.rows[0]) : null;
  }

  // Reordenar categorias
  static async reorder(categoryOrders) {
    const promises = categoryOrders.map(({ id, sortOrder }) => {
      return query(
        'UPDATE categories SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [sortOrder, id]
      );
    });
    
    await Promise.all(promises);
    return true;
  }

  // Buscar categorias mais populares (com mais produtos)
  static async findPopular(limit = 10) {
    const sql = `
      SELECT c.*, 
             COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      WHERE c.active = true
      GROUP BY c.id
      HAVING COUNT(p.id) > 0
      ORDER BY COUNT(p.id) DESC, c.name ASC
      LIMIT $1
    `;
    
    const result = await query(sql, [limit]);
    return result.rows.map(row => new Category(row));
  }

  // Buscar estatísticas de categorias
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_categories,
        COUNT(*) FILTER (WHERE active = true) as active_categories
      FROM categories
    `;
    
    const result = await query(sql);
    return result.rows[0];
  }

  // Converter para JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      imageUrl: this.imageUrl,
      isActive: this.isActive,
      widthCm: this.widthCm,
      heightCm: this.heightCm,
      lengthCm: this.lengthCm,
      weightKg: this.weightKg,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      productCount: this.productCount
    };
  }
}

export default Category;