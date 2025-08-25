import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import WebhookEvent from '../models/WebhookEvent.js';
import MercadoLivreAccount from '../models/MercadoLivreAccount.js';
import Product from '../models/Product.js';
import MercadoLivreSyncService from '../services/MercadoLivreSyncService.js';
import { query, transaction } from '../config/database.js';

// Instanciar serviço de sincronização
const syncService = new MercadoLivreSyncService();

// Middleware for admin auth
const requireAdmin = (req, res, next) => {
  //console.log('requireAdmin middleware executado');
  //console.log('Headers recebidos:', req.headers);
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    //console.log('❌ Nenhum token encontrado nos headers');
    return res.status(401).json({
      error: 'Token de acesso requerido',
      message: 'Você precisa estar logado para acessar esta funcionalidade'
    });
  }
  
  //console.log('Token encontrado:', token.substring(0, 20) + '...');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'skina-ecopecas-secret-key-2024');
    //console.log('✅ Token decodificado:', decoded);
    
    if (!['admin', 'colaborador'].includes(decoded.role)) {
      //console.log('❌ Usuário não tem role adequado:', decoded.role);
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Apenas administradores podem acessar esta funcionalidade'
      });
    }
    
    //console.log('✅ Usuário autorizado com role:', decoded.role);
    req.user = decoded;
    next();
  } catch (error) {
    //console.error('❌ Erro ao verificar token:', error.message);
    return res.status(401).json({
      error: 'Token inválido',
      message: 'Token de acesso inválido ou expirado'
    });
  }
};

// Mercado Livre API client
    const mercadoLivreApi = axios.create({
      baseURL: 'https://api.mercadolibre.com',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

// Mapeamento de atributos comuns do Mercado Livre
const ML_ATTRIBUTE_MAP = {
  BRAND: { id: 'BRAND', name: 'Marca' },
  MODEL: { id: 'MODEL', name: 'Modelo' },
  YEAR: { id: 'YEAR', name: 'Ano' },
  COLOR: { id: 'COLOR', name: 'Cor' },
  SIZE: { id: 'SIZE', name: 'Tamanho' },
  WEIGHT: { id: 'WEIGHT', name: 'Peso' },
  MATERIAL: { id: 'MATERIAL', name: 'Material' },
  WARRANTY: { id: 'WARRANTY', name: 'Garantia' },
};

// Rotas do Mercado Livre
const router = express.Router();

// POST /api/mercado_livre/auth 
router.post('/auth', requireAdmin, async (req, res) => {
  try {
    
    //console.log('=== DEBUG VARIÁVEIS DE AMBIENTE ===');
    //console.log('BACKEND_URL:', process.env.BACKEND_URL);
    //console.log('ML_APP_ID:', process.env.ML_APP_ID);
    //console.log('User ID:', req.user.userId);
    //console.log('Todas as variáveis:', Object.keys(process.env).filter(key => key.includes('ML') || key.includes('BACKEND') || key.includes('FRONTEND')));
 
    
    // Verificar se ML_APP_ID está definido
    if (!process.env.ML_APP_ID) {
      throw new Error('ML_APP_ID não está definido nas variáveis de ambiente');
    }
    
    // Usar localhost diretamente se BACKEND_URL não estiver definida
    let baseUrl = process.env.BACKEND_URL;
    if (!baseUrl || baseUrl === 'undefined') {
      baseUrl = 'https://skinaecopecas.com.br';
      console.log('⚠️ BACKEND_URL não definida, usando fallback:', baseUrl);
    }
    
    const redirectUri = `${baseUrl}/api/mercado_livre/callback`;
    const state = `${req.user.userId}_${Date.now()}`;
    
    const authUrl = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${process.env.ML_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    console.log('🔗 URL de autorização gerada:', authUrl);
    
    res.json({
      success: true,
      authUrl,
      redirectUri,
      state
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar URL de autorização:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// GET /api/mercado_livre/callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    console.log('📥 Callback recebido:', { code: code?.substring(0, 20) + '...', state, error });
    
    if (error) {
      console.error('❌ Erro no callback:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/mercado-livre?error=${encodeURIComponent(error)}`);
    }
    
    if (!code || !state) {
      console.error('❌ Código ou state ausente no callback');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/mercado-livre?error=missing_params`);
    }
    
    // Extrair userId do state
    const [userId] = state.split('_');
    if (!userId) {
      console.error('❌ UserId não encontrado no state:', state);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/mercado-livre?error=invalid_state`);
    }
    
    console.log('👤 UserId extraído do state:', userId);
    
    // Trocar código por token
    const tokenData = await getMercadoLivreToken(code);
    console.log('🔑 Token obtido com sucesso');
    
    // Obter dados do usuário
    const userData = await getMercadoLivreData('/users/me', tokenData.access_token);
    console.log('👤 Dados do usuário obtidos:', userData.nickname);
    
    // Salvar ou atualizar conta
    await MercadoLivreAccount.createOrUpdate({
      userId: parseInt(userId),
      mlUserId: userData.id,
      nickname: userData.nickname,
      email: userData.email,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope
    });
    
    console.log('✅ Conta do Mercado Livre salva com sucesso');
    
    // Redirecionar para o frontend com sucesso
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/mercado-livre?success=connected`);
    
  } catch (error) {
    console.error('❌ Erro no callback do Mercado Livre:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/mercado-livre?error=${encodeURIComponent(error.message)}`);
  }
});

// Função para obter token do Mercado Livre
async function getMercadoLivreToken(code) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'https://skinaecopecas.com.br';
    const redirectUri = `${baseUrl}/api/mercado_livre/callback`;
    
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.ML_APP_ID,
      client_secret: process.env.ML_APP_SECRET,
      code,
      redirect_uri: redirectUri
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao obter token:', error.response?.data || error.message);
    throw new Error(`Erro ao obter token: ${error.response?.data?.message || error.message}`);
  }
}

// Função para fazer requisições à API do Mercado Livre
async function getMercadoLivreData(url, accessToken) {
  try {
    const response = await mercadoLivreApi.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do ML:', error.response?.data || error.message);
    throw new Error(`Erro na API do ML: ${error.response?.data?.message || error.message}`);
  }
}

// GET /api/mercado_livre/status
router.get('/status', requireAdmin, async (req, res) => {
  try {
    console.log('📊 Buscando status da integração para usuário:', req.user.userId);
    
    // Buscar conta do Mercado Livre
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    
    if (!account) {
      console.log('❌ Nenhuma conta encontrada');
      return res.json({
        connected: false,
        account: null,
        stats: {
          totalProducts: 0,
          syncedProducts: 0,
          lastSync: null
        }
      });
    }
    
    console.log('✅ Conta encontrada:', account.nickname);
    
    // Verificar se o token ainda é válido
    let tokenValid = true;
    try {
      await getMercadoLivreData('/users/me', account.accessToken);
    } catch (error) {
      console.log('⚠️ Token pode estar expirado, tentando refresh...');
      tokenValid = false;
      
      // Tentar renovar o token
      if (account.refreshToken) {
        try {
          const refreshResponse = await axios.post('https://api.mercadolibre.com/oauth/token', {
            grant_type: 'refresh_token',
            client_id: process.env.ML_APP_ID,
            client_secret: process.env.ML_APP_SECRET,
            refresh_token: account.refreshToken
          });
          
          // Atualizar tokens na base de dados
          await MercadoLivreAccount.refreshToken(
            account.id,
            refreshResponse.data.access_token,
            refreshResponse.data.refresh_token,
            refreshResponse.data.expires_in
          );
          
          account.accessToken = refreshResponse.data.access_token;
          tokenValid = true;
          console.log('✅ Token renovado com sucesso');
        } catch (refreshError) {
          console.error('❌ Erro ao renovar token:', refreshError.response?.data || refreshError.message);
        }
      }
    }
    
    // Buscar estatísticas de produtos
    const statsQuery = `
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN ml_id IS NOT NULL THEN 1 END) as synced_products
      FROM products 
      WHERE active = true
    `;
    
    const statsResult = await query(statsQuery);
    const stats = statsResult[0] || { total_products: 0, synced_products: 0 };
    
    // Buscar última sincronização
    const lastSyncQuery = `
      SELECT created_at 
      FROM sync_jobs 
      WHERE status = 'completed' 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const lastSyncResult = await query(lastSyncQuery);
    const lastSync = lastSyncResult[0]?.created_at || null;
    
    res.json({
      connected: tokenValid,
      account: {
        id: account.id,
        mlUserId: account.mlUserId,
        nickname: account.nickname,
        email: account.email,
        connectedAt: account.createdAt,
        lastTokenRefresh: account.updatedAt
      },
      stats: {
        totalProducts: parseInt(stats.total_products),
        syncedProducts: parseInt(stats.synced_products),
        lastSync
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar status:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// POST /api/mercado_livre/sync/run
router.post('/sync/run', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronização manual...');
    
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({ error: 'Conta do Mercado Livre não encontrada' });
    }
    
    const jobId = await syncService.startSync(account.id);
    
    res.json({
      success: true,
      jobId,
      message: 'Sincronização iniciada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar sincronização:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mercado_livre/sync/item/:ml_id
router.post('/sync/item/:ml_id', requireAdmin, async (req, res) => {
  try {
    const { ml_id } = req.params;
    
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({ error: 'Conta do Mercado Livre não encontrada' });
    }
    
    const result = await syncService.syncSingleItem(account.id, ml_id);
    
    res.json({
      success: true,
      result,
      message: 'Item sincronizado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao sincronizar item:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mercado_livre/sync/jobs/:id
router.get('/sync/jobs/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const jobQuery = `
      SELECT 
        id,
        account_id,
        status,
        total_items,
        processed_items,
        success_items,
        error_items,
        current_item,
        error_message,
        started_at,
        completed_at,
        created_at,
        updated_at
      FROM sync_jobs 
      WHERE id = $1
    `;
    
    const result = await query(jobQuery, [id]);
    const job = result[0];
    
    if (!job) {
      return res.status(404).json({ error: 'Job não encontrado' });
    }
    
    res.json({ job });
    
  } catch (error) {
    console.error('❌ Erro ao buscar job:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mercado_livre/sync/jobs
router.get('/sync/jobs', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const jobsQuery = `
      SELECT 
        id,
        account_id,
        status,
        total_items,
        processed_items,
        success_items,
        error_items,
        started_at,
        completed_at,
        created_at
      FROM sync_jobs 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const jobs = await query(jobsQuery, [parseInt(limit), parseInt(offset)]);
    
    res.json({ jobs });
    
  } catch (error) {
    console.error('❌ Erro ao buscar jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mercado_livre/webhook
router.post('/webhook', async (req, res) => {
  try {
    console.log('📨 Webhook recebido:', req.body);
    
    // Salvar evento do webhook
    await WebhookEvent.create({
      source: 'mercado_livre',
      event_type: req.body.topic || 'unknown',
      data: JSON.stringify(req.body)
    });
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mercado_livre/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({ error: 'Conta do Mercado Livre não encontrada' });
    }
    
    // Estatísticas gerais
    const generalStats = await query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN ml_id IS NOT NULL THEN 1 END) as synced_products,
        COUNT(CASE WHEN ml_id IS NOT NULL AND active = true THEN 1 END) as active_synced_products
      FROM products
    `);
    
    // Estatísticas de sincronização
    const syncStats = await query(`
      SELECT 
        COUNT(*) as total_syncs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_syncs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_syncs,
        MAX(created_at) as last_sync
      FROM sync_jobs
      WHERE account_id = $1
    `, [account.id]);
    
    res.json({
      general: generalStats[0],
      sync: syncStats[0]
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mercado_livre/products
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', synced_only = false } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE p.active = true';
    const queryParams = [];
    
    if (search) {
      whereClause += ' AND (p.name LIKE $' + (params.length + 1) + ' OR p.sku LIKE $' + (params.length + 2) + ')';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (synced_only === 'true') {
      whereClause += ' AND p.ml_id IS NOT NULL';
    }
    
    const productsQuery = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.original_price,
        p.discount_price,
        p.image_url,
        p.stock_quantity,
        p.ml_id,
        p.ml_seller_id,
        p.ml_family_id,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const products = await query(productsQuery, queryParams);
    
    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause.replace('LIMIT $1 OFFSET $2', '')}
    `;
    
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;
    
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mercado_livre/ml-products
router.get('/ml-products', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({ error: 'Conta do Mercado Livre não encontrada' });
    }
    
    // Buscar produtos do Mercado Livre
    let searchUrl = `/users/${account.mlUserId}/items/search?status=active&limit=${limit}&offset=${offset}`;
    
    if (search) {
      searchUrl += `&q=${encodeURIComponent(search)}`;
    }
    
    const searchResponse = await getMercadoLivreData(searchUrl, account.accessToken);
    
    if (!searchResponse.results || searchResponse.results.length === 0) {
      return res.json({
        products: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }
    
    // Buscar detalhes dos produtos
    const productIds = searchResponse.results;
    const productDetails = [];
    
    // Processar em lotes para evitar muitas requisições simultâneas
    const batchSize = 5;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (productId) => {
        try {
          const product = await getMercadoLivreData(`/items/${productId}`, account.accessToken);
          
          // Verificar se já existe no nosso banco
          const existingProduct = await query(
            'SELECT id, name FROM products WHERE ml_id = $1',
            [productId]
          );
          
          return {
            id: product.id,
            title: product.title,
            price: product.price,
            available_quantity: product.available_quantity,
            condition: product.condition,
            listing_type_id: product.listing_type_id,
            permalink: product.permalink,
            thumbnail: product.thumbnail,
            status: product.status,
            category_id: product.category_id,
            imported: existingProduct.length > 0,
            local_product: existingProduct[0] || null
          };
        } catch (error) {
          console.error(`❌ Erro ao buscar produto ${productId}:`, error.message);
          return {
            id: productId,
            title: 'Erro ao carregar',
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      productDetails.push(...batchResults);
    }
    
    res.json({
      products: productDetails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: searchResponse.paging?.total || productDetails.length,
        pages: Math.ceil((searchResponse.paging?.total || productDetails.length) / limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar produtos do ML:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mercado_livre/sync/config
router.get('/sync/config', requireAdmin, async (req, res) => {
  try {
    const config = {
      auto_sync_enabled: process.env.ML_AUTO_SYNC_ENABLED === 'true',
      sync_interval: parseInt(process.env.ML_SYNC_INTERVAL) || 3600000, // 1 hora em ms
      import_images: process.env.ML_IMPORT_IMAGES !== 'false',
      update_prices: process.env.ML_UPDATE_PRICES !== 'false',
      update_stock: process.env.ML_UPDATE_STOCK !== 'false'
    };
    
    res.json({ config });
  } catch (error) {
    console.error('❌ Erro ao buscar configuração:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mercado_livre/sync/config
router.post('/sync/config', requireAdmin, async (req, res) => {
  try {
    const { 
      auto_sync_enabled, 
      sync_interval, 
      import_images, 
      update_prices, 
      update_stock 
    } = req.body;
    
    // Aqui você salvaria as configurações no banco de dados
    // Por enquanto, apenas retornamos sucesso
    
    res.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      config: {
        auto_sync_enabled,
        sync_interval,
        import_images,
        update_prices,
        update_stock
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar configuração:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mercado_livre/sync/stats
router.get('/sync/stats', requireAdmin, async (req, res) => {
  try {
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({ error: 'Conta do Mercado Livre não encontrada' });
    }
    
    // Estatísticas dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stats = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_syncs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_syncs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_syncs,
        AVG(CASE WHEN status = 'completed' THEN processed END) as avg_success_items
      FROM sync_jobs
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [thirtyDaysAgo]);
    
    // Estatísticas gerais
    const generalStats = await query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running_jobs,
        MAX(created_at) as last_sync,
        AVG(CASE WHEN status = 'success' AND finished_at IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (finished_at - started_at)) END) as avg_duration_seconds
      FROM sync_jobs
    `);
    
    res.json({
      daily_stats: stats,
      general_stats: generalStats[0]
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de sync:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mercado_livre/import/:mlId
router.post('/import/:mlId', requireAdmin, async (req, res) => {
  try {
    const { mlId } = req.params;
    const { categoryId, customName, customPrice } = req.body;
    
    console.log(`🔄 Iniciando importação do produto ML: ${mlId}`);
    
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({ error: 'Conta do Mercado Livre não encontrada' });
    }
    
    // Verificar se o produto já foi importado
    const existingProduct = await query(
      'SELECT id, name FROM products WHERE ml_id = $1',
      [mlId]
    );
    
    if (existingProduct.length > 0) {
      return res.status(400).json({
        error: 'Produto já importado',
        product: existingProduct[0]
      });
    }
    
    // Buscar dados do produto no Mercado Livre
    const mlProduct = await getMercadoLivreData(`/items/${mlId}`, account.accessToken);
    
    if (!mlProduct) {
      return res.status(404).json({ error: 'Produto não encontrado no Mercado Livre' });
    }
    
    console.log(`📦 Produto encontrado: ${mlProduct.title}`);
    
    // Buscar categoria do produto no ML
    let mlCategory = null;
    try {
      mlCategory = await getMercadoLivreData(`/categories/${mlProduct.category_id}`, account.accessToken);
    } catch (error) {
      console.warn('⚠️ Não foi possível buscar categoria do ML:', error.message);
    }
    
    // Preparar dados do produto
    const productData = {
      name: customName || mlProduct.title,
      description: mlProduct.descriptions?.[0]?.plain_text || mlProduct.title,
      original_price: customPrice || mlProduct.price,
            discount_price: customPrice || mlProduct.price,
            image_url: mlProduct.pictures?.[0]?.secure_url || mlProduct.thumbnail,
      brand: null,
      category_id: categoryId || null,
      stock_quantity: mlProduct.available_quantity || 0,
            in_stock: (mlProduct.available_quantity || 0) > 0,
      specifications: JSON.stringify({
        condition: mlProduct.condition,
        listing_type: mlProduct.listing_type_id,
        ml_category: mlCategory?.name || mlProduct.category_id,
        warranty: mlProduct.warranty,
        attributes: mlProduct.attributes || []
      }),
      compatibility: JSON.stringify([]),
      sku: mlProduct.seller_custom_field || `ML-${mlId}`,
      weight: null,
      dimensions: JSON.stringify({}),
      view_count: 0,
      featured: false,
      active: true,
      ml_id: mlId,
      ml_seller_id: mlProduct.seller_id,
      ml_family_id: mlProduct.family_id
    };
    
    // Extrair marca dos atributos
    if (mlProduct.attributes) {
      const brandAttribute = mlProduct.attributes.find(attr => attr.id === 'BRAND');
      if (brandAttribute && brandAttribute.value_name) {
        productData.brand = brandAttribute.value_name;
      }
    }
    
    // Extrair peso e dimensões
    const { weight, dimensions } = Product.extractWeightAndDimensions(mlProduct.attributes || []);
    if (weight) productData.weight = weight;
    if (Object.keys(dimensions).length > 0) {
      productData.dimensions = JSON.stringify(dimensions);
    }
    
    console.log('💾 Salvando produto no banco de dados...');
    
    // Usar transação para garantir consistência
    const result = await transaction(async (connection) => {
      // Inserir produto
      const insertResult = await connection.query(
        `INSERT INTO products (
          name, description, original_price, discount_price, image_url, brand,
          category_id, stock_quantity, in_stock, specifications, compatibility,
          sku, weight, dimensions, view_count, featured, active,
          ml_id, ml_seller_id, ml_family_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          productData.name, productData.description, productData.original_price,
                productData.discount_price, productData.image_url, productData.brand,
                productData.category_id, productData.stock_quantity, productData.in_stock,
          productData.specifications, productData.compatibility, productData.sku,
          productData.weight, productData.dimensions, productData.view_count,
          productData.featured, productData.active, productData.ml_id,
          productData.ml_seller_id, productData.ml_family_id
        ]
      );
      
      const productId = insertResult.insertId;
      
      // Sincronizar imagens se existirem
      if (mlProduct.pictures && mlProduct.pictures.length > 0) {
        console.log(`🖼️ Sincronizando ${mlProduct.pictures.length} imagens...`);
        
        for (let i = 0; i < mlProduct.pictures.length; i++) {
          const picture = mlProduct.pictures[i];
          await connection.query(
            'INSERT INTO product_images_ml (product_id, image_url, image_order, created_at) VALUES (?, ?, ?, NOW())',
            [productId, picture.secure_url, i]
          );
        }
      }
      
      return productId;
    });
    
    console.log(`✅ Produto importado com sucesso! ID: ${result}`);
    
    // Buscar produto completo para retornar
    const importedProduct = await query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [result]
    );
    
    res.json({
      success: true,
      message: 'Produto importado com sucesso',
      product: importedProduct[0]
    });
    
  } catch (error) {
    console.error('❌ Erro ao importar produto:', error);
    res.status(500).json({
      error: 'Erro ao importar produto',
      message: error.message
    });
  }
});

// POST /api/mercado_livre/disconnect
router.post('/disconnect', requireAdmin, async (req, res) => {
  try {
    console.log('🔌 Desconectando conta do Mercado Livre para usuário:', req.user.userId);
    
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({ error: 'Nenhuma conta conectada encontrada' });
    }
    
    // Desconectar conta
    await MercadoLivreAccount.disconnect(account.id);
    
    console.log('✅ Conta desconectada com sucesso');
    
    res.json({
      success: true,
      message: 'Conta do Mercado Livre desconectada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao desconectar conta:', error);
    res.status(500).json({
      error: 'Erro ao desconectar conta',
      message: error.message
    });
  }
});

// POST /api/mercado_livre/refresh-token
router.post('/refresh-token', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Renovando token do Mercado Livre para usuário:', req.user.userId);
    
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({ error: 'Conta do Mercado Livre não encontrada' });
    }
    
    if (!account.refreshToken) {
      return res.status(400).json({ error: 'Refresh token não disponível' });
    }
    
    // Renovar token
    const refreshResponse = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'refresh_token',
      client_id: process.env.ML_APP_ID,
      client_secret: process.env.ML_APP_SECRET,
      refresh_token: account.refreshToken
    });
    
    // Atualizar tokens na base de dados
    await MercadoLivreAccount.refreshToken(
      account.id,
      refreshResponse.data.access_token,
      refreshResponse.data.refresh_token,
      refreshResponse.data.expires_in
    );
    
    console.log('✅ Token renovado com sucesso');
    
    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      expiresIn: refreshResponse.data.expires_in
    });
    
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);
    
    // Se o refresh token também expirou, desconectar a conta
    if (error.response?.status === 400 || error.response?.status === 401) {
      try {
        const account = await MercadoLivreAccount.findByUserId(req.user.userId);
        if (account) {
          await MercadoLivreAccount.disconnect(account.id);
          console.log('🔌 Conta desconectada devido a token expirado');
        }
      } catch (disconnectError) {
        console.error('❌ Erro ao desconectar conta:', disconnectError);
      }
      
      return res.status(401).json({
        error: 'Token expirado',
        message: 'É necessário reconectar sua conta do Mercado Livre',
        requiresReconnection: true
      });
    }
    
    res.status(500).json({
      error: 'Erro ao renovar token',
      message: error.message
    });
  }
});

// GET /api/mercado_livre/token-status
router.get('/token-status', requireAdmin, async (req, res) => {
  try {
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.json({
        connected: false,
        tokenValid: false
      });
    }
    
    // Testar se o token ainda é válido
    let tokenValid = true;
    try {
      await getMercadoLivreData('/users/me', account.accessToken);
    } catch (error) {
      tokenValid = false;
    }
    
    res.json({
      connected: true,
      tokenValid,
      account: {
        nickname: account.nickname,
        email: account.email,
        connectedAt: account.createdAt,
        lastTokenRefresh: account.updatedAt
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status do token:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mercado_livre/debug/products
router.get('/debug/products', requireAdmin, async (req, res) => {
  try {
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({ error: 'Conta do Mercado Livre não encontrada' });
    }
    
    // Buscar alguns produtos para debug
    const searchResponse = await getMercadoLivreData(
      `/users/${account.mlUserId}/items/search?status=active&limit=5`,
      account.accessToken
    );
    
    if (!searchResponse.results || searchResponse.results.length === 0) {
      return res.json({ message: 'Nenhum produto encontrado', products: [] });
    }
    
    // Buscar detalhes do primeiro produto
    const firstProductId = searchResponse.results[0];
    const productDetails = await getMercadoLivreData(
      `/items/${firstProductId}`,
      account.accessToken
    );
    
    res.json({
      total_products: searchResponse.paging?.total || 0,
      sample_product_ids: searchResponse.results.slice(0, 5),
      sample_product_details: productDetails
    });
    
  } catch (error) {
    console.error('❌ Erro no debug de produtos:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;