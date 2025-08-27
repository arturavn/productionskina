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
    
    // Incluir userId no state para identificação no callback
    const state = Buffer.from(JSON.stringify({ userId: req.user.userId })).toString('base64');
    
    //console.log('Base URL:', baseUrl);
    //console.log('Redirect URI:', redirectUri);
    //console.log('State:', state);
    
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${process.env.ML_APP_ID}&redirect_uri=${redirectUri}&state=${state}&scope=read write`;
    
    console.log('Final Auth URL:', authUrl);
    
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate OAuth flow',
      details: error.message
    });
  }
});

// GET /api/mercado_livre/callback - OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    console.log('🔍 Callback recebido - code:', code ? '✅ Presente' : '❌ Ausente');
    console.log('🔍 State recebido:', state ? '✅ Presente' : '❌ Ausente');
    
    // Processa o retorno de autenticação
    if (code && state) {
      console.log('🔄 Processando código de autorização...');
      
      // Decodifica o state para obter o userId
      let userId;
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = stateData.userId;
       // console.log('User ID do state:', userId);
      } catch (error) {
        //console.error('❌ Erro ao decodificar state:', error);
        throw new Error('State inválido');
      }
      
      // Troca código por token
      const tokenData = await getMercadoLivreToken(code);
      
      if (tokenData && tokenData.access_token) {
        console.log('✅ Token obtido com sucesso');
        
        // Obtém informações do vendedor primeiro
        const sellerInfo = await getMercadoLivreData('https://api.mercadolibre.com/users/me', tokenData.access_token);
        
        if (sellerInfo && sellerInfo.id) {
          console.log('Informações do vendedor obtidas:', {
            id: sellerInfo.id,
            nickname: sellerInfo.nickname || 'Vendedor ML'
          });
          
          // Cria/atualiza a conta com todos os dados corretos
          const accountData = {
            userId: userId, // User ID real do sistema
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            scope: tokenData.scope || 'read write',
            sellerId: parseInt(sellerInfo.id), 
            nickname: sellerInfo.nickname 
          };
          
         /* console.log('Dados da conta que serão salvos:', {
            userId: accountData.userId,
            sellerId: accountData.sellerId,
            nickname: accountData.nickname,
            sellerIdType: typeof accountData.sellerId
          });*/
          
          console.log('🔄 Chamando MercadoLivreAccount.createOrUpdate...');
          
          try {
          // Salva no banco
          const savedAccount = await MercadoLivreAccount.createOrUpdate(accountData);
          console.log('Conta salva no banco:', savedAccount.id);
            console.log('Seller ID salvo:', savedAccount.seller_id, 'Tipo:', typeof savedAccount.seller_id);
            console.log('Nickname salvo:', savedAccount.nickname);
            console.log('Conta completa salva:', savedAccount);
          } catch (dbError) {
            console.error('❌ Erro ao salvar no banco:', dbError.message);
            console.error('❌ Stack trace:', dbError.stack);
            throw new Error(`Erro ao salvar conta: ${dbError.message}`);
          }
          
          // Redireciona para o frontend com sucesso
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const redirectUrl = `${frontendUrl}/admin/mercado-livre?success=true&seller=${encodeURIComponent(sellerInfo.nickname)}&status_updated=true`;
          
          console.log('🔄 Redirecionando para:', redirectUrl);
          res.redirect(redirectUrl);
          return;
        } else {
          console.error('❌ Dados do vendedor inválidos:', sellerInfo);
          throw new Error('Não foi possível obter informações do vendedor');
        }
      } else {
        throw new Error('Token não foi obtido do Mercado Livre');
      }
    } else {
      throw new Error('Código de autorização ou state não recebido');
    }
    
  } catch (error) {
    console.error('❌ Erro no callback:', error.message);
    
    // Redireciona com erro
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const errorUrl = `${frontendUrl}/admin/mercado-livre?success=false&error=${encodeURIComponent(error.message)}`;
    
    console.log('🔄 Redirecionando para erro:', errorUrl);
    res.redirect(errorUrl);
  }
});

// Função para obter token (equivalente a getMercadoLivreToken do PHP)
async function getMercadoLivreToken(code) {
  try {
    //console.log('🔄 Fazendo requisição para trocar código por token...');
    //console.log('Código recebido:', code ? '✅ Presente' : '❌ Ausente');
    //console.log('ML_APP_ID:', process.env.ML_APP_ID ? '✅ Configurado' : '❌ Não configurado');
    //console.log('ML_APP_SECRET:', process.env.ML_APP_SECRET ? '✅ Configurado' : '❌ Não configurado');
    //console.log('BACKEND_URL:', process.env.BACKEND_URL ? '✅ Configurado' : '❌ Não configurado');
    
    const response = await axios.post('https://api.mercadolibre.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.ML_APP_ID,
      client_secret: process.env.ML_APP_SECRET,
      code: code,
      redirect_uri: `${process.env.BACKEND_URL}/api/mercado_livre/callback`
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    /*console.log('✅ Resposta da API:', {
      access_token: response.data.access_token ? '✅ Presente' : '❌ Ausente',
      refresh_token: response.data.refresh_token ? '✅ Presente' : '❌ Ausente',
      expires_in: response.data.expires_in,
      scope: response.data.scope
    });*/
    
    //console.log('🔑 Token completo recebido:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao obter token:', error.response?.data || error.message);
    console.error('❌ Status da resposta:', error.response?.status);
    console.error('❌ Headers da resposta:', error.response?.headers);
    throw error;
  }
}

// Função para obter dados do Mercado Livre (equivalente a getMercadoLivreData do PHP)
async function getMercadoLivreData(url, accessToken) {
  try {
    console.log('🔄 Fazendo requisição para:', url);
    console.log('🔑 Access Token:', accessToken ? '✅ Presente' : '❌ Ausente');
    
    const response = await axios.get(url, {
      params: {
        access_token: accessToken
      }
    });
    
    console.log('✅ Dados obtidos da API:', {
      id: response.data.id,
      nickname: response.data.nickname,
      email: response.data.email,
      fullResponse: response.data
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao obter dados:', error.response?.data || error.message);
    console.error('❌ Status da resposta:', error.response?.status);
    console.error('❌ Headers da resposta:', error.response?.headers);
    throw error;
  }
}

// GET /api/mercado_livre/status - Check connection status
router.get('/status', requireAdmin, async (req, res) => {
  try {
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    
    if (!account) {
      return res.json({
        success: true,
        connected: false,
        message: 'Nenhuma conta conectada'
      });
    }

    console.log('🔍 Verificando status da conta:', {
      accountId: account.id,
      userId: account.user_id,
      sellerId: account.seller_id,
      nickname: account.nickname
    });

    // Testar se o token ainda é válido
    let tokenValid = false;
    let userInfo = null;
    
    try {
      const userResponse = await axios.get('https://api.mercadolibre.com/users/me', {
        params: {
          access_token: account.access_token
        }
      });
      
      tokenValid = true;
      userInfo = {
        id: userResponse.data.id,
        nickname: userResponse.data.nickname,
        email: userResponse.data.email,
        country: userResponse.data.country_id
      };
      
      console.log('✅ Token válido para usuário:', userInfo.nickname);
    } catch (error) {
      console.log('❌ Token expirado ou inválido:', error.response?.data?.message || error.message);
      tokenValid = false;
    }

    // Buscar estatísticas de produtos
    let productStats = { total: 0, active: 0, inactive: 0 };
    let lastSync = null;
    
    if (tokenValid && account.seller_id) {
      try {
        console.log('🔍 Buscando produtos para seller_id:', account.seller_id);
        
        const productsResponse = await axios.get(`https://api.mercadolibre.com/users/${account.seller_id}/items/search`, {
          params: {
            access_token: account.access_token,
            limit: 100,
            offset: 0
          }
        });
        
        const productIds = productsResponse.data.results || [];
        productStats.total = productIds.length;
        
        // Remover contagem de produtos ativos/inativos
        productStats.active = 0;
        productStats.inactive = 0;
        
        //console.log('Estatísticas de produtos:', productStats);
        
        // Buscar última sincronização (usando a mesma lógica do endpoint de stats)
        try {
          const { rows: [lastSyncRow] } = await query(`
            SELECT MAX(last_synced_at) as last_sync 
            FROM product_sync_state
          `);
          
          if (lastSyncRow && lastSyncRow.last_sync) {
            // Garantir que a data seja uma string ISO válida
            const timestamp = new Date(lastSyncRow.last_sync).toISOString();
            lastSync = {
              timestamp: timestamp,
              details: 'sync'
            };
            console.log('Última sincronização:', lastSync);
          }
        } catch (syncLogError) {
          console.log('⚠️ Erro ao buscar logs de sincronização:', syncLogError.message);
        }
        
      } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error.response?.data || error.message);
      }
    } else if (!account.seller_id) {
      console.log('⚠️ Conta não possui seller_id configurado');
    }

    res.json({
      success: true,
      connected: tokenValid,
      account: {
        id: account.id,
        userId: account.user_id,
        accessToken: account.access_token ? '✅ Configurado' : '❌ Não configurado',
        refreshToken: account.refresh_token ? '✅ Configurado' : '❌ Não configurado',
        expiresAt: account.expires_at,
        scope: account.scope,
        sellerId: account.seller_id,
        nickname: account.nickname,
        updatedAt: account.updated_at
      },
      userInfo: userInfo,
      productStats: productStats,
      lastSync: lastSync,
      message: tokenValid ? 'Conta conectada e funcionando' : 'Token expirado, precisa renovar'
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check connection status',
      details: error.message
    });
  }
});

// POST /api/mercado_livre/sync/run - Disparar sincronização manual
router.post('/sync/run', requireAdmin, async (req, res) => {
  try {
    const { type = 'delta' } = req.body; // 'delta' ou 'full_import'
    
    console.log(`🔄 Iniciando sincronização manual do tipo: ${type}`);
    
    let result;
    if (type === 'full_import') {
      result = await syncService.runFullImport(req.user.userId);
    } else {
      result = await syncService.runDeltaSync();
    }
    
    res.json({
        success: true,
      message: `Sincronização ${type} iniciada com sucesso`,
      type,
      result
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao iniciar sincronização',
      message: error.message
    });
  }
});

// POST /api/mercado_livre/sync/item/:ml_id - Sincronizar produto individual
router.post('/sync/item/:ml_id', requireAdmin, async (req, res) => {
  try {
    const { ml_id } = req.params;
    
    console.log(`🔄 Sincronizando produto individual: ${ml_id}`);
    
    const result = await syncService.syncSingleProduct(ml_id, req.user.userId);
    
    res.json({
      success: true,
      message: 'Produto sincronizado com sucesso',
      ml_id,
      result
    });

  } catch (error) {
    console.error('❌ Erro na sincronização individual:', error);
    res.status(500).json({
      success: false,
      error: 'Falha na sincronização individual',
      message: error.message
    });
  }
});

// GET /api/mercado_livre/sync/jobs/:id - Status/progresso do job
router.get('/sync/jobs/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await query(`
      SELECT id, type, status, total, processed, started_at, finished_at, error, created_at
      FROM sync_jobs 
      WHERE id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job não encontrado'
      });
    }
    
    const job = rows[0];
    
    // Calcular progresso
    const progress = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
    
    res.json({
      success: true,
      job: {
        ...job,
        progress: `${progress}%`,
        isRunning: job.status === 'running',
        isCompleted: ['success', 'failed', 'partial'].includes(job.status)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar job:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao buscar job',
      message: error.message
    });
  }
});

// GET /api/mercado_livre/sync/jobs - Listar jobs de sincronização
router.get('/sync/jobs', requireAdmin, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const { rows } = await query(`
      SELECT id, type, status, total, processed, started_at, finished_at, error, created_at
      FROM sync_jobs 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);
    
    // Contar total
    const { rows: [countResult] } = await query('SELECT COUNT(*) FROM sync_jobs');
    const total = parseInt(countResult.count);
    
    res.json({
      success: true,
      jobs: rows.map(job => ({
        ...job,
        progress: job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao listar jobs',
      message: error.message
    });
  }
});

// POST /api/mercado_livre/webhook - Webhook handler
router.post('/webhook', async (req, res) => {
  try {
    // Validate webhook signature
    
    // Log event
    await WebhookEvent.create({
      eventType: 'mercado_livre_webhook',
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      sourceIp: req.ip
    });

    // TODO: Handle different webhook events
    
    res.status(200).end();
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).end();
  }
});





// Obter estatísticas para o dashboard
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Contar produtos sincronizados
    const { rows: [productCount] } = await query(
      'SELECT COUNT(*) FROM products WHERE ml_id IS NOT NULL'
    );
    
    // Verificar conta conectada
    const { rows: [account] } = await query(
      'SELECT COUNT(*) FROM mercado_livre_accounts LIMIT 1'
    );
    
    // Obter última sincronização
    const { rows: [lastSync] } = await query(
      `SELECT MAX(created_at) as last_sync 
       FROM sync_logs_ml 
       WHERE action IN ('insert', 'update')`
    );
    
    // Obter receita (simplificado - implementar lógica real)
    const revenue = 0; // TODO: Implementar cálculo real
    
    res.json({
      success: true,
      data: {
        syncedProducts: parseInt(productCount.count),
        revenue,
        connected: !!account,
        lastSync: lastSync?.last_sync 
          ? new Date(lastSync.last_sync).toLocaleString() 
          : null
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get stats',
      details: error.message 
    });
  }
});

// GET /api/mercado_livre/products - Listar produtos com status de sync
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, search = '' } = req.query;
    
    // Query simplificada para produtos básicos
    let sql = `
      SELECT p.id, p.name, p.ml_id, p.original_price, p.discount_price, p.stock_quantity, p.updated_at, p.image_url
      FROM products p
      WHERE p.ml_id IS NOT NULL AND p.ml_id != ''
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      sql += ` AND (p.name ILIKE $${paramCount} OR p.ml_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    sql += ` ORDER BY p.updated_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const { rows } = await query(sql, params);
    
    // Contar total
    let countSql = `
      SELECT COUNT(*) FROM products p
      WHERE p.ml_id IS NOT NULL AND p.ml_id != ''
    `;
    
    if (search) {
      countSql += ` AND (p.name ILIKE $1 OR p.ml_id ILIKE $1)`;
      params.splice(-2); // Remover limit e offset
    }
    
    const { rows: [countResult] } = await query(countSql, search ? params : []);
    const total = parseInt(countResult.count);
    
    console.log('📊 Total de produtos:', total);
    
    res.json({
      success: true,
      products: rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar produtos:', error);
    res.status(500).json({
        success: false,
      error: 'Falha ao listar produtos',
      message: error.message
    });
  }
});

// GET /api/mercado_livre/ml-products - Listar produtos diretamente do Mercado Livre

router.get('/ml-products', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 [ML-PRODUCTS] Iniciando busca de produtos ML');
    const { limit = 100, offset = 0, search = '' } = req.query;
    const userId = req.user.userId;
    
    console.log('📋 [ML-PRODUCTS] Parâmetros:', { limit, offset, search, userId });
    console.log('🔍 [ML-PRODUCTS] Buscando produtos do Mercado Livre com parâmetros:', { limit, offset, search });
    
    // Buscar configurações de rate limiting do banco
    const { rows: configRows } = await query('SELECT key, value FROM ml_sync_config WHERE key = $1', ['rate_limit_delay_ms']);
    const rateLimitDelay = configRows.length > 0 ? parseInt(configRows[0].value) : 500; // fallback para 500ms
    
    console.log('Usando rate limit delay:', rateLimitDelay, 'ms');
    
    // Buscar conta do usuário
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'Conta do Mercado Livre não encontrada'
      });
    }
    
    if (!account.access_token) {
      return res.status(400).json({
        success: false,
        error: 'Token de acesso não encontrado'
      });
    }
    
    // Primeiro, buscar o total de produtos ATIVOS para calcular paginação correta
    const totalSearchParams = {
      access_token: account.access_token,
      limit: 1, // Buscar apenas 1 produto para obter o total
      offset: 0,
      status: 'active' // Filtrar apenas produtos ativos
    };
    
    // Adicionar filtro de busca se fornecido
    if (search && search.trim()) {
      totalSearchParams.q = search.trim();
    }
    
    let totalResponse;
    try {
      totalResponse = await axios.get(`https://api.mercadolibre.com/users/${account.seller_id}/items/search`, {
        params: totalSearchParams
      });
    } catch (searchError) {
      if (searchError.response?.status === 429) {
        const retryDelay = rateLimitDelay * 6;
        console.log(`⚠️ Rate limiting na busca de total, aguardando ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        totalResponse = await axios.get(`https://api.mercadolibre.com/users/${account.seller_id}/items/search`, {
          params: totalSearchParams
        });
      } else {
        throw searchError;
      }
    }
    
    const totalProducts = totalResponse.data.paging?.total || 0;
    console.log(`📊 Total de produtos disponíveis: ${totalProducts}`);
    
    // Agora buscar os produtos ATIVOS da página atual
    const searchParams = {
      access_token: account.access_token,
      limit: parseInt(limit),
      offset: parseInt(offset),
      status: 'active' // Filtrar apenas produtos ativos
    };
    
    if (search && search.trim()) {
      searchParams.q = search.trim();
    }
    
    let productsResponse;
    try {
      productsResponse = await axios.get(`https://api.mercadolibre.com/users/${account.seller_id}/items/search`, {
        params: searchParams
      });
    } catch (searchError) {
      if (searchError.response?.status === 429) {
        const retryDelay = rateLimitDelay * 6;
        console.log(`⚠️ Rate limiting na busca de produtos, aguardando ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        productsResponse = await axios.get(`https://api.mercadolibre.com/users/${account.seller_id}/items/search`, {
           params: searchParams
         });
      } else {
        throw searchError;
      }
    }
    
    const productIds = productsResponse.data.results || [];
    console.log(`IDs de produtos encontrados: ${productIds.length}`);
    
    // Buscar detalhes de cada produto (todos serão ativos devido ao filtro)
    const activeProducts = [];
    
    for (let i = 0; i < productIds.length; i++) {
      try {
        const productId = productIds[i];
        console.log(`🔍 Buscando detalhes do produto ativo ${productId} (${i + 1}/${productIds.length})`);
        
        const productResponse = await axios.get(`https://api.mercadolibre.com/items/${productId}`, {
          params: {
            access_token: account.access_token
          }
        });
        
        const productData = productResponse.data;
        
        // Buscar descrição do produto
        let description = '';
        try {
          const descResponse = await axios.get(`https://api.mercadolibre.com/items/${productId}/description`, {
            params: {
              access_token: account.access_token
            }
          });
          description = descResponse.data.plain_text || '';
        } catch (descError) {
          console.log(`⚠️ Erro ao buscar descrição do produto ${productId}:`, descError.message);
        }
        
        // Mapear dados do produto
        const mappedProduct = {
          id: productData.id,
          title: productData.title,
          price: productData.price,
          available_quantity: productData.available_quantity,
          thumbnail: productData.thumbnail,
          status: productData.status,
          category_id: productData.category_id,
          listing_type_id: productData.listing_type_id,
          variations: productData.variations || [],
          pictures: productData.pictures || [],
          description: description,
          permalink: productData.permalink,
          seller_id: productData.seller_id,
          created: productData.date_created,
          last_updated: productData.last_updated
        };
        
        activeProducts.push(mappedProduct);
        
        // Pausa configurável para evitar rate limiting da API do Mercado Livre
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        
      } catch (productError) {
        console.error(`❌ Erro ao buscar produto ${productIds[i]}:`, productError.message);
        
        // Se for rate limiting, aguardar mais tempo
        if (productError.response?.status === 429) {
          const retryDelay = rateLimitDelay * 4; // 4x o delay normal para retry
          console.log(`⚠️ Rate limiting detectado, aguardando ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // Produtos já vêm filtrados como ativos da API do ML
    const requestedLimit = parseInt(limit);
    const requestedOffset = parseInt(offset);
    
    console.log(`✅ Produtos ativos processados com sucesso: ${activeProducts.length} produtos`);
    console.log(`📄 Página atual: produtos ${requestedOffset + 1} a ${requestedOffset + activeProducts.length} de ${totalProducts} total (apenas ativos)`);
    
    res.json({
      success: true,
      products: activeProducts,
      pagination: {
        total: totalProducts,
        limit: requestedLimit,
        offset: requestedOffset,
        totalPages: Math.ceil(totalProducts / requestedLimit),
        currentPage: Math.floor(requestedOffset / requestedLimit) + 1,
        hasNextPage: requestedOffset + requestedLimit < totalProducts,
        hasPrevPage: requestedOffset > 0
      },
      stats: {
        totalProducts: activeProducts.length,
        activeProducts: activeProducts.length,
        inactiveProducts: 0,
        currentPageType: 'active'
      }
    });
    
  } catch (error) {
    console.error('❌ [ML-PRODUCTS] Erro geral na rota /ml-products:', {
      message: error.message,
      stack: error.stack,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Determinar código de status baseado no erro
    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor ao buscar produtos do Mercado Livre';
    
    if (error.response?.status === 401) {
      statusCode = 401;
      errorMessage = 'Token de acesso do Mercado Livre inválido ou expirado';
    } else if (error.response?.status === 403) {
      statusCode = 403;
      errorMessage = 'Acesso negado pela API do Mercado Livre';
    } else if (error.response?.status === 429) {
      statusCode = 429;
      errorMessage = 'Limite de requisições excedido. Tente novamente em alguns minutos';
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/mercado_livre/sync/config - Obter configurações de sincronização
router.get('/sync/config', requireAdmin, async (req, res) => {
  try {
    const config = await syncService.getSyncConfig();
    
    res.json({
        success: true,
      config
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao buscar configurações',
      message: error.message
    });
  }
});

// POST /api/mercado_livre/sync/config - Atualizar configurações de sincronização
router.post('/sync/config', requireAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Chave e valor são obrigatórios'
      });
    }
    
    const success = await syncService.updateSyncConfig(key, value);
    
    if (success) {
      // Se for auto_sync_enabled, reiniciar o serviço
      if (key === 'auto_sync_enabled') {
        await syncService.stop();
        await syncService.start();
      }
    
    res.json({
      success: true,
        message: 'Configuração atualizada com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Falha ao atualizar configuração'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao atualizar configuração:', error);
    res.status(500).json({
        success: false,
      error: 'Falha ao atualizar configuração',
      message: error.message
    });
  }
});

// GET /api/mercado_livre/sync/stats - Estatísticas de sincronização
router.get('/sync/stats', requireAdmin, async (req, res) => {
  try {
    // Contar produtos sincronizados
    const { rows: [productCount] } = await query(
      'SELECT COUNT(*) FROM products WHERE ml_id IS NOT NULL'
    );
    
    // Contar produtos por status de sync
    const { rows: statusCounts } = await query(`
      SELECT 
        CASE 
          WHEN pss.last_synced_at IS NULL THEN 'nunca_sincronizado'
          WHEN pss.last_error IS NOT NULL THEN 'erro'
          WHEN pss.last_synced_at < NOW() - INTERVAL '24 hours' THEN 'desatualizado'
          ELSE 'em_dia'
        END as status,
        COUNT(*) as count
      FROM products p
      LEFT JOIN product_sync_state pss ON p.ml_id = pss.ml_id
      WHERE p.ml_id IS NOT NULL AND p.ml_id != ''
      GROUP BY 
        CASE 
          WHEN pss.last_synced_at IS NULL THEN 'nunca_sincronizado'
          WHEN pss.last_error IS NOT NULL THEN 'erro'
          WHEN pss.last_synced_at < NOW() - INTERVAL '24 hours' THEN 'desatualizado'
          ELSE 'em_dia'
        END
    `);
    
    // Última sincronização
    const { rows: [lastSync] } = await query(`
      SELECT MAX(last_synced_at) as last_sync 
      FROM product_sync_state
    `);
    
    // Jobs recentes
    const { rows: recentJobs } = await query(`
      SELECT type, status, COUNT(*) as count
      FROM sync_jobs 
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY type, status
    `);
    
    res.json({
      success: true,
      stats: {
        totalProducts: parseInt(productCount.count),
        statusBreakdown: statusCounts,
        lastSync: lastSync?.last_sync,
        recentJobs
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao buscar estatísticas',
      message: error.message
    });
  }
});

// POST /api/mercado_livre/import/:mlId - Importar produto específico por ID do ML
router.post('/import/:mlId', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Iniciando importação de produto...');
    const { mlId } = req.params;
    
    console.log('ML ID recebido:', mlId);
    
    if (!mlId) {
      console.log('❌ ML ID não fornecido');
      return res.status(400).json({
        success: false,
        error: 'ML ID is required'
      });
    }

    // Buscar configurações de rate limiting do banco
    const { rows: configRows } = await query('SELECT key, value FROM ml_sync_config WHERE key = $1', ['rate_limit_delay_ms']);
    const rateLimitDelay = configRows.length > 0 ? parseInt(configRows[0].value) : 500; // fallback para 500ms
    
    console.log('Usando rate limit delay:', rateLimitDelay, 'ms');
    console.log('🔍 Buscando conta do usuário:', req.user.userId);
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      console.log('❌ Conta não encontrada para usuário:', req.user.userId);
      return res.status(400).json({
        success: false,
        error: 'Account not connected'
      });
    }
    
    console.log('✅ Conta encontrada:', account.seller_id);

    // Get product details from ML
    console.log('Buscando detalhes do produto no ML:', mlId);
    let response;
    try {
      response = await mercadoLivreApi.get(`/items/${mlId}`, {
        params: { access_token: account.access_token }
      });
    } catch (productError) {
      if (productError.response?.status === 429) {
        const retryDelay = rateLimitDelay * 4; // 4x o delay normal para retry
        console.log(`⚠️ Rate limiting na busca do produto, aguardando ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Tentar novamente
        response = await mercadoLivreApi.get(`/items/${mlId}`, {
          params: { access_token: account.access_token }
        });
      } else {
        throw productError;
      }
    }

    const mlProduct = response.data;
    //console.log('📊 Dados completos do produto ML:', mlProduct);
    console.log('📊 Dados específicos do produto ML:', {
      id: mlProduct.id,
      title: mlProduct.title,
      price: mlProduct.price,
      category_id: mlProduct.category_id,
      available_quantity: mlProduct.available_quantity,
      pictures: mlProduct.pictures?.length || 0,
      attributes: mlProduct.attributes?.length || 0
    });
    
    // Get product description from ML using specific API endpoint
    console.log('Buscando descrição do produto no ML:', mlId);
    let productDescription = 'Descrição indisponível';
    try {
      let descriptionResponse;
      try {
        descriptionResponse = await mercadoLivreApi.get(`/items/${mlId}/description`, {
          params: { access_token: account.access_token }
        });
      } catch (descError) {
        if (descError.response?.status === 429) {
          const retryDelay = rateLimitDelay * 4; // 4x o delay normal para retry
          console.log(`⚠️ Rate limiting na busca da descrição, aguardando ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Tentar novamente
          descriptionResponse = await mercadoLivreApi.get(`/items/${mlId}/description`, {
            params: { access_token: account.access_token }
          });
        } else {
          throw descError;
        }
      }
      
      console.log('Resposta da API de descrição:', descriptionResponse.data);
      
      if (descriptionResponse.data && descriptionResponse.data.plain_text) {
        productDescription = descriptionResponse.data.plain_text;
        console.log('✅ Descrição obtida de "plain_text":', productDescription.substring(0, 100) + '...');
      } else if (descriptionResponse.data && descriptionResponse.data.text) {
        productDescription = descriptionResponse.data.text;
        console.log('✅ Descrição obtida de "text":', productDescription.substring(0, 100) + '...');
      } else if (descriptionResponse.data && descriptionResponse.data.content) {
        productDescription = descriptionResponse.data.content;
        console.log('✅ Descrição obtida de "content":', productDescription.substring(0, 100) + '...');
      } else {
        console.log('⚠️ Descrição não encontrada na API de descrição');
        console.log('🔍 Campos disponíveis na resposta:', Object.keys(descriptionResponse.data || {}));
        productDescription = 'Descrição indisponível';
      }
    } catch (descriptionError) {
      console.log('⚠️ Erro ao buscar descrição, usando fallback:', descriptionError.message);
      productDescription = 'Descrição indisponível';
    }
    
    // Processar primeira imagem
    let firstImageUrl = null;
    if (mlProduct.pictures && Array.isArray(mlProduct.pictures) && mlProduct.pictures.length > 0) {
      const firstPicture = mlProduct.pictures[0];
      console.log('🖼️ Primeira imagem encontrada:', firstPicture);
      
      if (firstPicture.url) {
        firstImageUrl = firstPicture.url;
        console.log('✅ URL da primeira imagem:', firstImageUrl);
      } else if (firstPicture.secure_url) {
        firstImageUrl = firstPicture.secure_url;
        console.log('✅ URL segura da primeira imagem:', firstImageUrl);
      }
    }
    
    // Preparar dados para importação
    const importData = {
      ml_id: mlProduct.id,
      title: mlProduct.title,
      description: productDescription,
      price: mlProduct.price,
      available_quantity: mlProduct.available_quantity,
      condition: mlProduct.condition,
      status: mlProduct.status,
      first_image_url: firstImageUrl,
      pictures: mlProduct.pictures || [], 
      attributes: mlProduct.attributes || [],
      category_id: mlProduct.category_id,
      seller_id: account.seller_id
    };

    // Extrair brand dos atributos
    if (mlProduct.attributes && Array.isArray(mlProduct.attributes)) {
      //console.log('🔍 ANALISANDO ATRIBUTOS PARA BRAND:');
      //console.log('📊 Atributos completos:', JSON.stringify(mlProduct.attributes, null, 2));
      
      // Procurar especificamente pelo atributo "Marca"
      const brandAttr = mlProduct.attributes.find(attr => {
        const attrName = attr.name?.toLowerCase() || '';
        const attrId = attr.id?.toLowerCase() || '';
        
        //console.log(`🔍 Verificando atributo: ${attr.name} (ID: ${attr.id}) = ${attr.value_name}`);
        
       
        return attrName === 'marca' || attrId === 'brand';
      });
      
      if (brandAttr && brandAttr.value_name) {
        importData.brand = brandAttr.value_name;
        //.log('✅ BRAND ENCONTRADO E DEFINIDO:', importData.brand);
        console.log('🔍 Detalhes do atributo:', { 
          id: brandAttr.id, 
          name: brandAttr.name, 
          value: brandAttr.value_name,
          value_id: brandAttr.value_id 
        });
      } else {
        //console.log('❌ BRAND NÃO ENCONTRADO NOS ATRIBUTOS');
        console.log('🔍 Todos os atributos disponíveis:');
        mlProduct.attributes.forEach((attr, index) => {
          console.log(`  ${index + 1}. ${attr.name} (${attr.id}) = ${attr.value_name}`);
        });
        
        // Tentar buscar em outros campos possíveis
        if (mlProduct.brand) {
          importData.brand = mlProduct.brand;
          //console.log('✅ BRAND encontrado em mlProduct.brand:', importData.brand);
        } else if (mlProduct.seller_custom_field) {
          importData.brand = mlProduct.seller_custom_field;
          //console.log('✅ BRAND encontrado em seller_custom_field:', importData.brand);
        } else {
          console.log('⚠️ Nenhum brand encontrado em nenhum campo');
        }
      }
    } else {
      console.log('⚠️ Nenhum atributo disponível para análise');
    }
    
    console.log('Dados preparados para importação:', {
      ml_id: importData.ml_id,
      title: importData.title,
      description: importData.description?.substring(0, 100) + '...',
      price: importData.price,
      brand: importData.brand || 'N/A',
      first_image_url: importData.first_image_url || 'N/A',
      pictures_count: importData.pictures?.length || 0,
      pictures: importData.pictures?.slice(0, 3) || [] // Mostrar primeiras 3 imagens
    });
    
    // Log detalhado das imagens
    if (importData.pictures && importData.pictures.length > 0) {
      console.log('🖼️ Imagens recebidas para importação:');
      importData.pictures.forEach((pic, index) => {
        console.log(`  Imagem ${index + 1}:`, {
          url: pic.url,
          secure_url: pic.secure_url,
          size: pic.size,
          max_size: pic.max_size
        });
      });
    } else {
      console.log('⚠️ Nenhuma imagem recebida para importação');
    }
    
    // Import product using existing method
    console.log('🔄 Chamando método de importação...');
    const result = await Product.createOrUpdateFromMercadoLivre(importData);
    
    console.log('✅ Produto importado com sucesso:', result);
    
    res.json({
      success: true,
      message: 'Product imported successfully',
      productId: mlProduct.id,
      result: result
    });
  } catch (error) {
    console.error('❌ Erro na importação do produto:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import product',
      message: error.message
    });
  }
});



// POST /api/mercado_livre/disconnect - Desconectar conta
router.post('/disconnect', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Tentando desconectar conta para usuário:', req.user.userId);
    //console.log('Headers de autorização:', req.headers.authorization);
    
    // Verificar se a conta existe antes de tentar desconectar
    const existingAccount = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!existingAccount) {
      console.log('⚠️ Nenhuma conta encontrada para desconectar');
      return res.status(404).json({
        success: false,
        error: 'Conta não encontrada para desconectar'
      });
    }
    
    console.log('✅ Conta encontrada, desconectando...');
    await MercadoLivreAccount.disconnect(req.user.userId);
    
    console.log('✅ Conta desconectada com sucesso');
    res.json({
      success: true,
      message: 'Conta desconectada com sucesso',
      status_updated: true
    });
  } catch (error) {
    console.error('❌ Erro ao desconectar conta:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao desconectar conta',
      message: error.message
    });
  }
});

// POST /api/mercado_livre/refresh-token - Renovar token manualmente
router.post('/refresh-token', requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Tentando renovar token para usuário:', req.user.userId);
    
    // Buscar conta do usuário
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Conta do Mercado Livre não encontrada'
      });
    }

    if (!account.refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token não encontrado'
      });
    }

    // Verificar validade atual do token
    const tokenValidity = await syncService.checkTokenValidity(account.id);
    console.log('🔍 Status do token:', tokenValidity);

    if (tokenValidity.valid && !tokenValidity.needsRefresh) {
      return res.json({
        success: true,
        message: 'Token ainda é válido',
        expiresAt: account.expires_at,
        needsRefresh: false
      });
    }

    // Renovar token
    console.log('🔄 Renovando token...');
    const success = await syncService.refreshAccountToken(account);
    
    if (success) {
      // Buscar dados atualizados
      const updatedAccount = await MercadoLivreAccount.findByUserId(req.user.userId);
      
      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        expiresAt: updatedAccount.expires_at,
        needsRefresh: false
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Falha ao renovar token'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
      message: error.message
    });
  }
});

// GET /api/mercado_livre/token-status - Verificar status do token
router.get('/token-status', requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Verificando status do token para usuário:', req.user.userId);
    
    // Buscar conta do usuário
    const account = await MercadoLivreAccount.findByUserId(req.user.userId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Conta do Mercado Livre não encontrada'
      });
    }

    // Verificar validade do token
    const tokenValidity = await syncService.checkTokenValidity(account.id);
    
    res.json({
      success: true,
      tokenStatus: tokenValidity,
      account: {
        id: account.id,
        sellerId: account.seller_id,
        nickname: account.nickname,
        expiresAt: account.expires_at,
        hasRefreshToken: !!account.refresh_token
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status do token:', error);
    res.status(500).json({
      success: false,
      error: 'Falha ao verificar status do token',
      message: error.message
    });
  }
});

// GET /api/mercado_livre/debug/products - Debug: verificar produtos no banco
router.get('/debug/products', requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Debug: Verificando produtos no banco...');
    
    // Verificar total de produtos
    const { rows: [totalResult] } = await query('SELECT COUNT(*) as total FROM products');
    const totalProducts = parseInt(totalResult.total);
    
    // Verificar produtos com ml_id
    const { rows: [mlResult] } = await query('SELECT COUNT(*) as total FROM products WHERE ml_id IS NOT NULL AND ml_id != \'\'');
    const totalWithML = parseInt(mlResult.total);
    
    // Verificar alguns produtos de exemplo
    const { rows: sampleProducts } = await query(`
      SELECT id, name, ml_id, created_at, updated_at 
      FROM products 
      WHERE ml_id IS NOT NULL AND ml_id != '' 
      LIMIT 5
    `);
    
    // Verificar estrutura da tabela
    const { rows: tableInfo } = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    // Verificar se as tabelas de sync foram criadas
    const syncTables = ['product_sync_state', 'sync_jobs', 'sync_logs_ml', 'ml_sync_config'];
    const tableStatus = {};
    
    for (const table of syncTables) {
      try {
        const { rows: [tableResult] } = await query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        tableStatus[table] = tableResult.count > 0 ? '✅ Criada' : '❌ Não criada';
      } catch (error) {
        tableStatus[table] = `❌ Erro: ${error.message}`;
      }
    }
    
    res.json({
      success: true,
      debug: {
        totalProducts,
        totalWithML,
        sampleProducts,
        tableStructure: tableInfo,
        syncTablesStatus: tableStatus,
        message: 'Debug info para produtos e tabelas de sync'
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    res.status(500).json({
      success: false,
      error: 'Falha no debug',
      message: error.message
    });
  }
});



export default router;
