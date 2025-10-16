import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// Gerar sitemap.xml dinâmico
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://skinaecopecas.com.br';
    
    // URLs estáticas
    const staticUrls = [
      { url: baseUrl, priority: '1.0', changefreq: 'daily' },
      { url: `${baseUrl}/produtos`, priority: '0.9', changefreq: 'daily' },
      { url: `${baseUrl}/sobre`, priority: '0.5', changefreq: 'monthly' },
      { url: `${baseUrl}/contato`, priority: '0.5', changefreq: 'monthly' }
    ];

    // Buscar todas as categorias
    const categoriesResult = await query(
      'SELECT id, slug, updated_at FROM categories WHERE active = true'
    );
    const categories = categoriesResult.rows;

    // Buscar todos os produtos
    const productsResult = await query(
      'SELECT id, updated_at FROM products WHERE active = true'
    );
    const products = productsResult.rows;

    // Construir XML do sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Adicionar URLs estáticas
    staticUrls.forEach(item => {
      sitemap += `
  <url>
    <loc>${item.url}</loc>
    <priority>${item.priority}</priority>
    <changefreq>${item.changefreq}</changefreq>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
    });

    // Adicionar categorias
    categories.forEach(category => {
      const lastmod = category.updated_at 
        ? new Date(category.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      sitemap += `
  <url>
    <loc>${baseUrl}/autopecas/categoria/${category.slug}</loc>
    <priority>0.8</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    });

    // Adicionar produtos
    products.forEach(product => {
      const lastmod = product.updated_at 
        ? new Date(product.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      sitemap += `
  <url>
    <loc>${baseUrl}/autopecas/produto/${product.id}</loc>
    <priority>0.7</priority>
    <changefreq>weekly</changefreq>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    });

    sitemap += `
</urlset>`;

    // Definir headers apropriados
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
    res.send(sitemap);

  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Gerar robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = 'https://skinaecopecas.com.br';
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin and API routes
Disallow: /admin
Disallow: /api/

# Allow important pages
Allow: /produtos
Allow: /categoria/
Allow: /produto/

# Crawl delay (optional)
Crawl-delay: 1`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
  res.send(robotsTxt);
});

export default router;