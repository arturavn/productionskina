
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useCategories } from '@/hooks/useApi';

const CategoriesSection = () => {
  const navigate = useNavigate();
  const { data: categoriesData } = useCategories();
  const apiCategories = categoriesData?.data?.categories || [];

  // Filtrar apenas as categorias válidas
  const adminCategoryNames = ['motores', 'suspensao', 'freios', 'acessorios', 'transmissao', 'farois-eletrica'];
  const filteredCategories = apiCategories.filter(cat => adminCategoryNames.includes(cat.name));

  // Configuração visual das categorias
  const categoryConfig: Record<string, { 
    displayName: string;
    description: string;
    icon: string;
    color: string;
  }> = {
    'motores': {
      displayName: 'Motores',
      description: 'Motores completos e recondicionados',
      icon: '/lovable-uploads/afea0e36-321a-45e3-a675-6172c5f638d0.png',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    'suspensao': {
      displayName: 'Suspensão',
      description: 'Amortecedores e componentes',
      icon: '/lovable-uploads/948624a5-574b-4a8f-9a66-483ca0ad0609.png',
      color: 'bg-gradient-to-br from-green-600 to-green-700'
    },
    'freios': {
      displayName: 'Freios',
      description: 'Discos, pastilhas e sistema',
      icon: '/lovable-uploads/682392c7-9c3b-4420-8c5a-dd82b1e10fbe.png',
      color: 'bg-gradient-to-br from-green-600 to-green-700'
    },
    'acessorios': {
      displayName: 'Acessórios',
      description: 'Peças e componentes diversos',
      icon: '/lovable-uploads/68231c1e-52fd-4069-bea9-a9ea852ee7e0.png',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    'transmissao': {
      displayName: 'Transmissão',
      description: 'Câmbio e sistema de transmissão',
      icon: '/lovable-uploads/223cae08-5df5-4280-b6a4-5fcb31ccedcc.png',
      color: 'bg-gradient-to-br from-green-700 to-green-800'
    },
    'farois-eletrica': {
      displayName: 'Faróis e Elétrica',
      description: 'Iluminação e sistema elétrico',
      icon: '/lovable-uploads/f96f210e-f609-40f5-aefd-730a65ee6a21.png',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    }
  };

  // Combinar dados da API com configuração visual
  const categories = filteredCategories.map(category => ({
    ...category,
    ...categoryConfig[category.name],
    slug: category.name,
    count: category.productCount || 0
  }));

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/categoria/${categorySlug}`);
    window.scrollTo(0, 0);
  };

  return (
    <section className="py-20 gradient-hero floating-elements">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-skina-dark dark:text-white mb-4">
            Categorias
          </h2>
          <p className="text-lg text-muted-foreground dark:text-gray-300">
            Encontre exatamente o que você precisa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group cursor-pointer card-hover"
              onClick={() => handleCategoryClick(category.slug)}
            >
              <div className={`${category.color} gradient-card-dynamic rounded-xl p-6 text-white relative overflow-hidden shimmer`}>
                <div className="absolute top-0 right-0 opacity-20 transform rotate-12 translate-x-4 -translate-y-2">
                  <img
                    src={category.icon}
                    alt={category.displayName}
                    className="w-16 h-16"
                  />
                </div>
                <div className="relative z-10">
                  <div className="mb-4">
                    <img
                      src={category.icon}
                      alt={category.displayName}
                      className="w-12 h-12"
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{category.displayName}</h3>
                  <p className="text-white/90 mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {category.count} produtos
                    </span>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/20 group-hover:translate-x-1 transition-transform"
                    >
                      Ver Produtos →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
