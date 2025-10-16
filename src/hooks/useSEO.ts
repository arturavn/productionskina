import { useEffect } from 'react';

interface StructuredData {
  "@context"?: string;
  "@type"?: string;
  [key: string]: unknown;
}

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterImage?: string;
  canonical?: string;
  structuredData?: StructuredData | StructuredData[]; // Para JSON-LD
}

const DEFAULT_SEO = {
  title: 'Skina Ecopeças - Autopeças Originais com Desconto',
  description: 'Autopeças originais com até 50% de desconto. Motores, faróis, suspensão, freios e mais. Qualidade garantida e entrega rápida.',
  keywords: 'autopeças, peças automotivas, motor, freios, suspensão, faróis, desconto',
  ogTitle: 'Skina Ecopeças - Autopeças Originais com Desconto',
  ogDescription: 'Autopeças originais com até 50% de desconto. Motores, faróis, suspensão, freios e mais.',
  ogImage: 'https://lovable.dev/opengraph-image-p98pqg.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://lovable.dev/opengraph-image-p98pqg.png'
};

// Structured Data padrão para a página inicial
const DEFAULT_STRUCTURED_DATA = {
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
          "name": "Peças Automotivas Originais"
        }
      }
    ]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  }
};

export const useSEO = (seoData: SEOData = {}) => {
  useEffect(() => {
    const finalSEOData = { ...DEFAULT_SEO, ...seoData };

    // Atualizar título da página
    if (finalSEOData.title) {
      document.title = finalSEOData.title;
    }

    // Função para atualizar ou criar meta tag
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let metaTag = document.querySelector(selector) as HTMLMetaElement;
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        if (property) {
          metaTag.setAttribute('property', name);
        } else {
          metaTag.setAttribute('name', name);
        }
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    };

    // Atualizar meta tags básicas
    if (finalSEOData.description) {
      updateMetaTag('description', finalSEOData.description);
    }
    if (finalSEOData.keywords) {
      updateMetaTag('keywords', finalSEOData.keywords);
    }

    // Atualizar Open Graph tags
    if (finalSEOData.ogTitle) {
      updateMetaTag('og:title', finalSEOData.ogTitle, true);
    }
    if (finalSEOData.ogDescription) {
      updateMetaTag('og:description', finalSEOData.ogDescription, true);
    }
    if (finalSEOData.ogImage) {
      updateMetaTag('og:image', finalSEOData.ogImage, true);
    }
    if (finalSEOData.ogUrl) {
      updateMetaTag('og:url', finalSEOData.ogUrl, true);
    }

    // Atualizar Twitter tags
    if (finalSEOData.twitterCard) {
      updateMetaTag('twitter:card', finalSEOData.twitterCard);
    }
    if (finalSEOData.twitterImage) {
      updateMetaTag('twitter:image', finalSEOData.twitterImage);
    }

    // Atualizar canonical URL
    if (finalSEOData.canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', finalSEOData.canonical);
    }

    // **NOVO: Implementar Structured Data (JSON-LD)**
    const updateStructuredData = (data: StructuredData | StructuredData[]) => {
      // Remover scripts JSON-LD existentes
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
      existingScripts.forEach(script => script.remove());

      // Adicionar novo structured data
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data, null, 2);
      document.head.appendChild(script);
    };

    // Usar structured data fornecido ou padrão
    const structuredData = finalSEOData.structuredData || DEFAULT_STRUCTURED_DATA;
    updateStructuredData(structuredData);

  }, [seoData]);
};

// Interfaces para tipos
interface Product {
  id: string;
  name: string;
  originalPrice?: number;
  discountPrice?: number;
  category?: string;
  slug?: string;
  mlImages?: string[];
  image?: string;
  imageUrl?: string;
}

interface Category {
  name: string;
}

// Funções utilitárias para gerar SEO data
export const generateProductSEO = (product: Product): SEOData => {
  const baseUrl = window.location.origin;
  const productUrl = `${baseUrl}/produto/${product.slug || product.id}`;
  const price = product.discountPrice || product.originalPrice;
  const productImage = product.mlImages?.[0] || product.imageUrl || product.image || DEFAULT_SEO.ogImage;
  
  // Safely format price with fallback
  const formatPrice = (price: number | undefined | null): string => {
    if (typeof price === 'number' && !isNaN(price)) {
      return `R$ ${price.toFixed(2)}`;
    }
    return 'Consulte o preço';
  };
  
  const formattedPrice = formatPrice(price);
  
  return {
    title: `${product.name} - Skina Ecopeças`,
    description: `Compre ${product.name} com melhor preço. ${product.category ? `Categoria: ${product.category}.` : ''} ${formattedPrice}. Entrega rápida e garantia.`,
    keywords: `${product.name}, ${product.category || 'autopeças'}, peças automotivas, skina ecopeças`,
    ogTitle: `${product.name} - Skina Ecopeças`,
    ogDescription: `Compre ${product.name} com melhor preço. ${formattedPrice}. Entrega rápida e garantia.`,
    ogImage: productImage,
    ogUrl: productUrl,
    canonical: productUrl,
    twitterCard: 'summary_large_image',
    twitterImage: productImage
  };
};

export const generateCategorySEO = (category: Category | string): SEOData => {
  const baseUrl = window.location.origin;
  const categoryName = typeof category === 'string' ? category : category.name;
  const categoryUrl = `${baseUrl}/categoria/${categoryName}`;
  
  return {
    title: `${categoryName} - Skina Ecopeças`,
    description: `Peças para ${categoryName} com qualidade garantida. Veja nossa seleção completa de autopeças com desconto.`,
    keywords: `${categoryName}, autopeças, peças automotivas, skina ecopeças`,
    ogTitle: `${categoryName} - Skina Ecopeças`,
    ogDescription: `Peças para ${categoryName} com qualidade garantida. Veja nossa seleção completa.`,
    ogUrl: categoryUrl,
    canonical: categoryUrl
  };
};

export const generateSearchSEO = (searchTerm: string): SEOData => {
  const baseUrl = window.location.origin;
  const searchUrl = `${baseUrl}/busca?q=${encodeURIComponent(searchTerm)}`;
  
  return {
    title: `Busca: ${searchTerm} - Skina Ecopeças`,
    description: `Resultados da busca por "${searchTerm}". Encontre as melhores autopeças com desconto na Skina Ecopeças.`,
    keywords: `${searchTerm}, busca, autopeças, peças automotivas, skina ecopeças`,
    ogTitle: `Busca: ${searchTerm} - Skina Ecopeças`,
    ogDescription: `Resultados da busca por "${searchTerm}". Encontre as melhores autopeças com desconto.`,
    ogUrl: searchUrl,
    canonical: searchUrl
  };
};