import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import WebhookRetryService from './services/WebhookRetryService.js';
import MercadoLivreSyncService from './services/MercadoLivreSyncService.js';
import SEOService from './services/SEOService.js';

// Configurar variáveis de ambiente PRIMEIRO
// Carregar .env da raiz do projeto (../.env)
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

// Para usar __dirname com ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rotas
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import adminRoutes from './routes/admin.js';
import orderRoutes from './routes/orders.js';
import addressRoutes from './routes/addresses.js';
import shippingRoutes from './routes/shipping.js';
import webhooksRoutes from './routes/webhooks.js';
import preferencesRoutes from './routes/preferences.js';
import testRoutes from './routes/test.js';
import couponRoutes from './routes/coupons.js';
import slidesRoutes from './routes/slides.js';
import mercadoLivreRoutes from './routes/mercado_livre.js';
import sitemapRoutes from './routes/sitemap.js';


const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://http2.mlstatic.com"],
      connectSrc: ["'self'", "https://api.mercadopago.com", "https://api.mercadolibre.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// Middleware adicional para CORS preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Headers específicos para produção
  if (process.env.NODE_ENV === 'production') {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://skinaecopecas.com.br'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Content-Length', 'Content-Disposition']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (imagens)
app.use('/images', express.static('public/images'));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../dist')));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // Log especial para requisições de slides
  if (req.path.includes('/slides')) {
    console.log('🎯 REQUISIÇÃO SLIDES DETECTADA:', req.method, req.path);
    console.log('🎯 Headers:', req.headers);
  }
  
  // Log adicional para requisições POST/PUT com body
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  if (req.method === 'POST' && req.path.includes('/auth/register')) {
    console.log('🔍 DEBUG - Body recebido:', req.body);
    console.log('🔍 DEBUG - Content-Type:', req.headers['content-type']);
    console.log('🔍 DEBUG - Content-Length:', req.headers['content-length']);
  }
  next();
});

// Rotas da API
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api', webhooksRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/test', testRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/slides', slidesRoutes);
app.use('/api/mercado_livre', mercadoLivreRoutes);

// Rotas de SEO (sitemap e robots)
app.use('/', sitemapRoutes);


// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor Skina Ecopeças funcionando corretamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'API Skina Ecopeças - Backend do E-commerce',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para detectar acesso via ngrok e configurar headers apropriados
app.use((req, res, next) => {
  const host = req.get('host');
  if (host && (host.includes('ngrok') || host.includes('ngrok-free.app'))) {
    // Adicionar headers para ngrok
    res.header('ngrok-skip-browser-warning', 'true');
  }
  next();
});

// Servir o frontend para todas as rotas não-API com SEO dinâmico
app.get('*', async (req, res) => {
  // Se a rota começa com /api, retorna 404 JSON
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Rota não encontrada',
      message: `A rota ${req.originalUrl} não existe`
    });
  }
  
  try {
    // Gerar SEO dinâmico baseado na URL
    const seoService = new SEOService();
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const seoData = await seoService.generateSEOForURL(fullUrl);
    const htmlWithSEO = seoService.injectMetaTags(seoData);
    
    // Servir HTML com meta tags dinâmicas
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlWithSEO);
  } catch (error) {
    console.error('Erro ao gerar SEO:', error);
    // Fallback para HTML estático em caso de erro
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
  console.log(`🌐 URL Rede: http://192.168.100.226:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🛍️ API Skina Ecopeças iniciada com sucesso!`);

  // Iniciar serviços automáticos em produção
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🔄 Iniciando serviços automáticos...');
      
      // Iniciar WebhookRetryService automaticamente
      const webhookRetryService = new WebhookRetryService();
      await webhookRetryService.start();
      
      // Iniciar MercadoLivreSyncService automaticamente
      const mercadoLivreSyncService = new MercadoLivreSyncService();
      await mercadoLivreSyncService.start();
      
      console.log('✅ WebhookRetryService iniciado automaticamente');
      console.log('✅ MercadoLivreSyncService iniciado automaticamente');
      console.log('✅ Cache de pagamentos ativo');
      console.log('✅ Validações robustas ativas');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar serviços automáticos:', error);
    }
  } else {
    console.log('🔧 Modo desenvolvimento: serviços automáticos não iniciados');
    console.log('💡 Use as rotas de admin para iniciar manualmente se necessário');
  }
});

export default app;