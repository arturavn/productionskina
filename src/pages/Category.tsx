
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProductCard from '@/components/ProductCard';
import { Checkbox } from '@/components/ui/checkbox';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Car, Filter } from 'lucide-react';
import { useBrands, useProductsByCategory } from '@/hooks/useApi';
import { useSEO, generateCategorySEO } from '@/hooks/useSEO';

const Category = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  // Integração com API
  const { data: brandsData, isLoading: brandsLoading, error: brandsError } = useBrands();
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProductsByCategory(
    categoryName || '', 
    { page: currentPage, limit: productsPerPage }
  );
  
  const brands = brandsData?.data?.brands?.map(brand => brand.name) || [];
  
  // Usar produtos da API - corrigindo acesso aos dados aninhados
  const products = (productsData && 'products' in productsData) ? productsData.products : [];
  const pagination = (productsData && 'pagination' in productsData) ? productsData.pagination : null;

  // Dados agora vêm da API - função getProductsByCategory removida

  const handleBrandChange = (brand: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brand]);
    } else {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    }
    // Reset para primeira página quando filtro muda
    setCurrentPage(1);
  };

  const getCategoryTitle = (category: string) => {
    const titles: { [key: string]: string } = {
      'motores': 'Motores',
      'suspensao': 'Suspensão',
      'freios': 'Freios',
      'acessorios': 'Acessórios',
      'transmissao': 'Transmissão',
      'farois-eletrica': 'Faróis e Elétrica'
    };
    return titles[category || ''] || 'Produtos';
  };

  const getCategoryDescription = (category: string) => {
    const descriptions: { [key: string]: string } = {
      'motores': 'Encontre os melhores motores para o seu veículo com qualidade e preço justo.',
      'suspensao': 'Amortecedores e componentes de suspensão com garantia.',
      'freios': 'Sistema de freios completo para sua segurança.',
      'acessorios': 'Peças e componentes diversos para seu veículo.',
      'transmissao': 'Câmbio e sistema de transmissão de qualidade.',
      'farois-eletrica': 'Encontre as melhores peças para o sistema elétrico do seu veículo com qualidade e preço justo.'
    };
    return descriptions[category || ''] || 'Produtos de qualidade para seu veículo.';
  };

  // SEO dinâmico para a categoria
  useSEO(
    categoryName ? generateCategorySEO(getCategoryTitle(categoryName)) : null
  );

  // Filtrar produtos baseado nas seleções
  const filteredProducts = products.filter(product => {
    const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    return brandMatch;
  });

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Filtro por Marca */}
      <div>
        <h4 className="font-medium mb-3 flex items-center text-skina-green">
          <Car className="w-4 h-4 mr-2" />
          Marca
        </h4>
        {brandsLoading ? (
          <div className="text-sm text-muted-foreground">Carregando marcas...</div>
        ) : brandsError ? (
          <div className="text-sm text-red-500">Erro ao carregar marcas</div>
        ) : brands.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma marca encontrada</div>
        ) : (
          <div className="space-y-2">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={brand}
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={(checked) => 
                    handleBrandChange(brand, checked as boolean)
                  }
                />
                <label
                  htmlFor={brand}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-32 lg:pt-36">
        {/* Header da Categoria - Texto bem descido para mobile */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg px-4 md:px-6 py-8 md:py-12 shadow-sm border dark:border-gray-700">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 md:mb-6">
              {getCategoryTitle(categoryName || '')}
            </h1>
            <div className="w-16 h-1 bg-skina-green mb-4 md:mb-6"></div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {getCategoryDescription(categoryName || '')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de Filtros - Desktop */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-skina-green">
                <ChevronDown className="w-5 h-5 mr-2" />
                Filtros
              </h3>
              <FilterContent />
            </div>
          </div>

          {/* Filtros Mobile - Collapsible */}
          <div className="lg:hidden mb-6">
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                  <FilterContent />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Área de Produtos - Uma coluna no mobile */}
          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <p className="text-muted-foreground">
                    {pagination ? `${pagination.totalProducts} produto(s) encontrado(s)` : `${filteredProducts.length} produto(s) encontrado(s)`}
                  </p>
                </div>
                {/* Grid responsivo: 1 coluna no mobile para evitar scroll horizontal */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
                
                {/* Paginação */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8">
                    <div className="text-sm text-muted-foreground">
                      Página {pagination.currentPage} de {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={pagination.currentPage <= 1}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                        disabled={pagination.currentPage >= pagination.totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {selectedBrands.length > 0 ? 
                    'Nenhum produto encontrado com os filtros selecionados' : 
                    `Nenhum produto encontrado na categoria ${getCategoryTitle(categoryName || '')}`
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {selectedBrands.length > 0 ? 
                    'Tente remover alguns filtros ou navegar para outra categoria.' :
                    'Tente navegar para outra categoria ou voltar à página inicial.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Category;
