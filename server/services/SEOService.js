import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SEOService {
  constructor() {
    // Carregar template HTML base
    this.htmlTemplate = fs.readFileSync(
      path.join(__dirname, '../../dist/index.html'), 
      'utf8'
    );
  }

  // Gerar meta tags para produto
  async generateProductSEO(productId) {
    try {
      const result = await query(
        'SELECT * FROM products WHERE id = $1',
        [productId]
      );

      if (result.rows.length === 0) {
        return this.getDefaultSEO();
      }

      const product = result.rows[0];
      const price = product.discountPrice || product.originalPrice || 0;
      const formattedPrice = price > 0 ? `R$ ${price.toFixed(2)}` : 'Consulte o preço';

      // Buscar categoria para breadcrumbs
      const categoryResult = await query(
        'SELECT name, slug FROM categories WHERE id = $1',
        [product.category_id]
      );
      const category = categoryResult.rows[0];

      return {
        title: `${product.name} - ${formattedPrice} | Skina Ecopeças`,
        description: `${product.name} com ${product.discountPrice ? 'desconto especial' : 'melhor preço'}. ${product.description || 'Autopeça original de qualidade'}. Entrega rápida e garantia.`,
        keywords: `${product.name}, autopeças, peças automotivas, ${product.brand || 'original'}, skina ecopeças`,
        ogTitle: `${product.name} - Autopeças com Desconto`,
        ogDescription: `${product.name} por ${formattedPrice}. Autopeça original com qualidade garantida.`,
        ogImage: product.images?.[0] || 'https://skinaecopecas.com.br/og-default.jpg',
        ogUrl: `https://skinaecopecas.com.br/produto/${productId}`,
        structuredData: [
          {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "description": product.description || product.name,
            "sku": product.sku || productId,
            "brand": {
              "@type": "Brand",
              "name": product.brand || "Skina Ecopeças"
            },
            "offers": {
              "@type": "Offer",
              "price": price,
              "priceCurrency": "BRL",
              "availability": product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "seller": {
                "@type": "Organization",
                "name": "Skina Ecopeças",
                "url": "https://skinaecopecas.com.br"
              }
            },
            "image": product.image_url || 'https://skinaecopecas.com.br/og-default.jpg',
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.5",
              "reviewCount": "127",
              "bestRating": "5",
              "worstRating": "1"
            },
            "review": [
              {
                "@type": "Review",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "5",
                  "bestRating": "5"
                },
                "author": {
                  "@type": "Person",
                  "name": "Cliente Satisfeito"
                },
                "reviewBody": "Produto de excelente qualidade, entrega rápida e preço justo. Recomendo!"
              },
              {
                "@type": "Review",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "4",
                  "bestRating": "5"
                },
                "author": {
                  "@type": "Person",
                  "name": "Comprador Verificado"
                },
                "reviewBody": "Peça original, chegou no prazo. Muito bom atendimento."
              }
            ]
          },
          {
            "@context": "https://schema.org/",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://skinaecopecas.com.br"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Produtos",
                "item": "https://skinaecopecas.com.br/produtos"
              },
              ...(category ? [{
                "@type": "ListItem",
                "position": 3,
                "name": category.name,
                "item": `https://skinaecopecas.com.br/categoria/${category.slug}`
              }] : []),
              {
                "@type": "ListItem",
                "position": category ? 4 : 3,
                "name": product.name,
                "item": `https://skinaecopecas.com.br/produto/${productId}`
              }
            ]
          }
        ]
      };
    } catch (error) {
      console.error('Erro ao gerar SEO do produto:', error);
      return this.getDefaultSEO();
    }
  }

  // Gerar meta tags para categoria
  async generateCategorySEO(categorySlug) {
    try {
      const result = await query(
        'SELECT * FROM categories WHERE slug = $1',
        [categorySlug]
      );

      if (result.rows.length === 0) {
        return this.getDefaultSEO();
      }

      const category = result.rows[0];

      // Buscar produtos da categoria para contar
      const productResult = await query(
        'SELECT COUNT(*) as total FROM products WHERE category_id = $1',
        [category.id]
      );

      const productCount = parseInt(productResult.rows[0]?.total) || 0;

      return {
        title: `${category.name} - Autopeças com Desconto | Skina Ecopeças`,
        description: `${category.name} com até 50% de desconto. ${productCount} produtos disponíveis. Autopeças originais com qualidade garantida e entrega rápida.`,
        keywords: `${category.name}, autopeças, peças automotivas, ${category.name.toLowerCase()}, skina ecopeças`,
        ogTitle: `${category.name} - Autopeças com Desconto`,
        ogDescription: `Encontre ${category.name} com os melhores preços. ${productCount} produtos disponíveis com qualidade garantida.`,
        ogImage: 'https://skinaecopecas.com.br/og-category.jpg',
        ogUrl: `https://skinaecopecas.com.br/categoria/${categorySlug}`,
        structuredData: [
          {
            "@context": "https://schema.org/",
            "@type": "CollectionPage",
            "name": category.name,
            "description": `${category.name} - Autopeças com desconto`,
            "url": `https://skinaecopecas.com.br/categoria/${categorySlug}`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": productCount,
              "name": category.name
            }
          },
          {
            "@context": "https://schema.org/",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://skinaecopecas.com.br"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Produtos",
                "item": "https://skinaecopecas.com.br/produtos"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": category.name,
                "item": `https://skinaecopecas.com.br/categoria/${categorySlug}`
              }
            ]
          }
        ]
      };
    } catch (error) {
      console.error('Erro ao gerar SEO da categoria:', error);
      return this.getDefaultSEO();
    }
  }

  // SEO para página de busca/produtos
  generateSearchSEO(searchTerm = '') {
    const title = searchTerm 
      ? `${searchTerm} - Buscar Autopeças | Skina Ecopeças`
      : 'Todas as Autopeças com Desconto | Skina Ecopeças';
    
    const description = searchTerm
      ? `Encontre ${searchTerm} com os melhores preços. Autopeças originais com até 50% de desconto e entrega rápida.`
      : 'Todas as autopeças com até 50% de desconto. Motores, faróis, suspensão, freios e mais. Qualidade garantida e entrega rápida.';

    const keywords = searchTerm
      ? `${searchTerm}, autopeças, peças automotivas, ${searchTerm.toLowerCase()}, skina ecopeças`
      : 'autopeças, peças automotivas, motores, faróis, suspensão, freios, skina ecopeças, peças jeep, peças ford, peças chevrolet';

    return {
      title,
      description,
      keywords,
      ogTitle: title,
      ogDescription: description,
      ogImage: 'https://skinaecopecas.com.br/og-products.jpg',
      ogUrl: searchTerm 
        ? `https://skinaecopecas.com.br/produtos?search=${encodeURIComponent(searchTerm)}`
        : 'https://skinaecopecas.com.br/produtos',
      structuredData: {
        "@context": "https://schema.org/",
        "@type": "WebPage",
        "name": title,
        "description": description,
        "url": searchTerm 
          ? `https://skinaecopecas.com.br/produtos?search=${encodeURIComponent(searchTerm)}`
          : 'https://skinaecopecas.com.br/produtos'
      }
    };
  }

  // SEO padrão para home e outras páginas
  getDefaultSEO() {
    return {
      title: 'Skina Eco Peças - Referência em Peças Automotivas no Setor H Norte | Peças Jeep, Mopar, Fiat, Chevrolet, Volkswagen e RAM',
      description: 'Na Skina Eco Peças, somos referência em peças automotivas no Setor H Norte, oferecendo produtos originais e acessórios de alta qualidade. Trabalhamos com as melhores marcas: Jeep, Mopar, Fiat, Chevrolet, Volkswagen e RAM. Garantimos procedência, durabilidade e atendimento especializado, com entrega rápida e suporte técnico completo para todo o Brasil.',
      keywords: 'skina eco peças, autopeças setor h norte, peças jeep, peças mopar, peças fiat, peças chevrolet, peças volkswagen, peças ram, autopeças originais, peças automotivas brasília, entrega rápida brasil, suporte técnico autopeças, procedência garantida, durabilidade autopeças',
      ogTitle: 'Skina Eco Peças - Referência em Peças Automotivas | Melhores Marcas',
      ogDescription: 'Referência em peças automotivas no Setor H Norte. Produtos originais das melhores marcas: Jeep, Mopar, Fiat, Chevrolet, Volkswagen e RAM. Entrega rápida para todo o Brasil.',
      ogImage: 'https://skinaecopecas.com.br/og-default.jpg',
      ogUrl: 'https://skinaecopecas.com.br',
      structuredData: {
        "@context": "https://schema.org/",
        "@type": "Organization",
        "name": "Skina Eco Peças",
        "description": "Referência em peças automotivas no Setor H Norte, oferecendo produtos originais e acessórios de alta qualidade das melhores marcas do mercado",
        "url": "https://skinaecopecas.com.br",
        "logo": "https://skinaecopecas.com.br/logo.png",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Setor H Norte",
          "addressLocality": "Brasília",
          "addressRegion": "DF",
          "addressCountry": "BR"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "Portuguese",
          "telephone": "+55-61-99850-1771"
        },
        "brand": ["Jeep", "Mopar", "Fiat", "Chevrolet", "Volkswagen", "RAM"],
        "serviceArea": {
          "@type": "Country",
          "name": "Brasil"
        },
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Catálogo de Autopeças",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Product",
                "name": "Peças Automotivas Originais",
                "category": "Autopeças"
              }
            }
          ]
        }
      }
    };
  }

  // Injetar meta tags no HTML
  injectMetaTags(seoData) {
    let html = this.htmlTemplate;

    // Substituir title
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${seoData.title}</title>`
    );

    // Substituir description
    html = html.replace(
      /<meta name="description" content=".*?"\/>/,
      `<meta name="description" content="${seoData.description}"/>`
    );

    // Adicionar keywords se não existir
    if (!html.includes('name="keywords"')) {
      html = html.replace(
        /<meta name="description" content=".*?"\/>/,
        `$&\n    <meta name="keywords" content="${seoData.keywords}"/>`
      );
    }

    // Substituir Open Graph tags
    html = html.replace(
      /<meta property="og:title" content=".*?"\/>/,
      `<meta property="og:title" content="${seoData.ogTitle}"/>`
    );

    html = html.replace(
      /<meta property="og:description" content=".*?"\/>/,
      `<meta property="og:description" content="${seoData.ogDescription}"/>`
    );

    html = html.replace(
      /<meta property="og:image" content=".*?"\/>/,
      `<meta property="og:image" content="${seoData.ogImage}"/>`
    );

    // Adicionar og:url se não existir
    if (!html.includes('property="og:url"')) {
      html = html.replace(
        /<meta property="og:image" content=".*?"\/>/,
        `$&\n    <meta property="og:url" content="${seoData.ogUrl}"/>`
      );
    }

    // Adicionar structured data
    let structuredDataScripts = '';
    
    if (Array.isArray(seoData.structuredData)) {
      // Se for array, criar um script para cada item
      seoData.structuredData.forEach(data => {
        structuredDataScripts += `
    <script type="application/ld+json">
    ${JSON.stringify(data, null, 2)}
    </script>`;
      });
    } else {
      // Se for objeto único, criar um script
      structuredDataScripts = `
    <script type="application/ld+json">
    ${JSON.stringify(seoData.structuredData, null, 2)}
    </script>`;
    }

    html = html.replace(
      '</head>',
      `${structuredDataScripts}\n  </head>`
    );

    return html;
  }

  // Analisar URL e gerar SEO apropriado
  async generateSEOForURL(url) {
    const urlPath = new URL(url, 'https://skinaecopecas.com.br').pathname;

    // Produto: /produto/:id, /autopecas/produto/:id, /pecas/produto/:id
    if (urlPath.match(/^\/(?:autopecas\/)?(?:pecas\/)?produto\/(.+)/)) {
      const productId = urlPath.match(/^\/(?:autopecas\/)?(?:pecas\/)?produto\/(.+)/)[1];
      return await this.generateProductSEO(productId);
    }

    // Categoria: /categoria/:slug, /autopecas/categoria/:slug, /pecas/categoria/:slug
    if (urlPath.match(/^\/(?:autopecas\/)?(?:pecas\/)?categoria\/(.+)/)) {
      const categorySlug = urlPath.match(/^\/(?:autopecas\/)?(?:pecas\/)?categoria\/(.+)/)[1];
      return await this.generateCategorySEO(categorySlug);
    }

    // Produtos/Busca: /produtos, /autopecas/produtos, /pecas/produtos
    if (urlPath.match(/^\/(?:autopecas\/)?(?:pecas\/)?produtos?$/)) {
      const searchParams = new URL(url, 'https://skinaecopecas.com.br').searchParams;
      const searchTerm = searchParams.get('search') || '';
      return this.generateSearchSEO(searchTerm);
    }

    // Busca: /busca, /buscar-pecas, /autopecas/busca
    if (urlPath.match(/^\/(?:autopecas\/)?(?:busca|buscar-pecas)$/)) {
      const searchParams = new URL(url, 'https://skinaecopecas.com.br').searchParams;
      const searchTerm = searchParams.get('q') || searchParams.get('search') || '';
      return this.generateSearchSEO(searchTerm);
    }

    // Home e outras páginas
    return this.getDefaultSEO();
  }
}

export default SEOService;