
import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import InstitutionalSection from '@/components/InstitutionalSection';
import FeaturedProducts from '@/components/FeaturedProducts';
import CategoriesSection from '@/components/CategoriesSection';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { useSEO } from '@/hooks/useSEO';

const Index = () => {
  // Implementar SEO com structured data para rich snippets
  useSEO({
    title: 'Skina Ecopeças - Melhores Marcas do Mercado: Peças Jeep, Mopar, Fiat, Chevrolet, Volkswagen e RAM',
    description: 'Referência em peças automotivas no Setor H Norte, Brasília. Produtos originais das melhores marcas: Jeep, Mopar, Fiat, Chevrolet, Volkswagen e RAM. Entrega rápida para todo o Brasil.',
    keywords: 'autopeças, peças automotivas, Setor H Norte, Brasília, Jeep, Mopar, Fiat, Chevrolet, Volkswagen, RAM, peças originais',
    ogTitle: 'Skina Eco Peças - Referência em Peças Automotivas | Melhores Marcas',
    ogDescription: 'Referência em peças automotivas no Setor H Norte. Produtos originais das melhores marcas: Jeep, Mopar, Fiat, Chevrolet, Volkswagen e RAM. Entrega rápida para todo o Brasil.',
    ogImage: 'https://skinaecopecas.com.br/og-default.jpg',
    ogUrl: 'https://skinaecopecas.com.br',
    canonical: 'https://skinaecopecas.com.br',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AutoPartsStore",
      "name": "Skina Ecopeças",
      "description": "Referência em peças automotivas no Setor H Norte, Brasília. Produtos originais das melhores marcas.",
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
        "telephone": "+55-61-99999-9999",
        "contactType": "customer service",
        "areaServed": "BR",
        "availableLanguage": "Portuguese"
      },
      "brand": [
        { "@type": "Brand", "name": "Jeep" },
        { "@type": "Brand", "name": "Mopar" },
        { "@type": "Brand", "name": "Fiat" },
        { "@type": "Brand", "name": "Chevrolet" },
        { "@type": "Brand", "name": "Volkswagen" },
        { "@type": "Brand", "name": "RAM" }
      ],
      "areaServed": {
        "@type": "Country",
        "name": "Brasil"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Catálogo de Peças Automotivas",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "Peças Automotivas Originais",
              "category": "Automotive Parts"
            }
          }
        ]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "150",
        "bestRating": "5",
        "worstRating": "1"
      }
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturedProducts />
        <CategoriesSection />
        <InstitutionalSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
