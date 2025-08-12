
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useFeaturedProducts } from '@/hooks/useApi';

const FeaturedProducts = () => {
  const navigate = useNavigate();

  // Integração com API para produtos em destaque
  const { data: featuredData, isLoading } = useFeaturedProducts();
  const featuredProducts = featuredData?.data?.products || [];

  return (
    <section className="relative py-20 gradient-hero floating-elements overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-skina-blue rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-skina-green rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-skina-dark dark:text-white mb-6 leading-tight">
            Produtos em 
            <span className="text-skina-green"> Destaque</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Peças originais com garantia e os melhores preços do mercado. 
            Qualidade que você pode confiar.
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skina-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground dark:text-gray-300">Carregando produtos...</p>
            </div>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground dark:text-gray-300 text-lg">Nenhum produto em destaque encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-16">
            {featuredProducts.slice(0, 6).map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}


      </div>
    </section>
  );
};

export default FeaturedProducts;
