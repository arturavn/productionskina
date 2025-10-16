
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProductCard from '@/components/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts, useCategories } from '@/hooks/useApi';
import { useSEO } from '@/hooks/useSEO';

const AllProducts = () => {
  const [selectedCategory, setSelectedCategory] = useState('todos');

  // Integração com API para produtos por categoria
  const { data: allProductsData, isLoading } = useProducts({ limit: 100 });
  const { data: totalProductsData } = useProducts({ limit: 999999 }); // Para obter o total real
  const { data: categoriesData } = useCategories();
  
  // SEO dinâmico para a página de todos os produtos
  useSEO({
    title: 'Todos os Produtos - Skina Ecopeças',
    description: 'Navegue por todos os nossos produtos organizados por categoria. Encontre exatamente o que você precisa para seu veículo com qualidade e preço justo.',
    keywords: 'autopeças, peças automotivas, todos os produtos, skina ecopeças, motores, suspensão, freios, acessórios',
    ogTitle: 'Todos os Produtos - Skina Ecopeças',
    ogDescription: 'Navegue por todos os nossos produtos organizados por categoria. Encontre exatamente o que você precisa para seu veículo.',
    canonical: `${window.location.origin}/produtos`
  });

  // Organizar produtos por categoria
  const allProducts = allProductsData?.data?.products || [];
  const totalProducts = totalProductsData?.data?.products || [];
  const apiCategories = categoriesData?.data?.categories || [];
  
  // Filtrar apenas as categorias que correspondem ao painel administrativo
  const adminCategoryNames = ['motores', 'suspensao', 'freios', 'acessorios', 'transmissao', 'farois-eletrica'];
  const categories = apiCategories.filter(cat => adminCategoryNames.includes(cat.name));
  
  // Mapeamento dos nomes das categorias para nomes de exibição
  const categoryDisplayNames: Record<string, string> = {
    'motores': 'Motores',
    'suspensao': 'Suspensão',
    'freios': 'Freios',
    'acessorios': 'Acessórios',
    'transmissao': 'Transmissão',
    'farois-eletrica': 'Faróis e Elétrica'
  };
  
  const productsByCategory = categories.reduce((acc: any, category: any) => {
    acc[category.id] = allProducts.filter((product: any) => product.category === category.name);
    return acc;
  }, {});

  // Calcular totais reais por categoria usando todos os produtos
  const totalProductsByCategory = categories.reduce((acc: any, category: any) => {
    acc[category.id] = totalProducts.filter((product: any) => product.category === category.name);
    return acc;
  }, {});

  const getProductsToShow = () => {
    if (selectedCategory === 'todos') {
      return allProducts;
    }
    return productsByCategory[selectedCategory] || [];
  };

  // Criar labels dinâmicos baseados nas categorias da API
  const categoryLabels = {
    todos: 'Todos',
    ...categories.reduce((acc: any, category: any) => {
      acc[category.id] = categoryDisplayNames[category.name] || category.name;
      return acc;
    }, {})
  };

  // Calcular número de colunas dinamicamente
  const totalCategories = Object.keys(categoryLabels).length;
  const gridCols = Math.min(totalCategories, 8); // Máximo de 8 colunas

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-32 lg:pt-36">
        {/* Header da página */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg px-4 md:px-6 py-8 md:py-12 shadow-sm border dark:border-gray-700">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 md:mb-6">
              Todos os Produtos
            </h1>
            <div className="w-16 h-1 bg-skina-green mb-4 md:mb-6"></div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Navegue por todos os nossos produtos organizados por categoria. Encontre exatamente o que você precisa para seu veículo.
            </p>
          </div>
        </div>

        {/* Mobile: Select dropdown para categorias */}
        <div className="block lg:hidden mb-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs para categorias */}
        <div className="hidden lg:block">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className={`grid w-full mb-8`} style={{gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="text-sm">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Contador de produtos e grid */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {selectedCategory === 'todos' 
              ? `${totalProducts.length} produto(s) encontrado(s)` 
              : `${totalProductsByCategory[selectedCategory]?.length || 0} produto(s) encontrado(s) na categoria ${categoryLabels[selectedCategory] || 'Categoria'}`
            }
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getProductsToShow().map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default AllProducts;
