import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProductCard from '@/components/ProductCard';
import { Search, AlertCircle } from 'lucide-react';
import { useProductSearch } from '@/hooks/useApi';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { results, isLoading, error, hasResults } = useProductSearch(query);



  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-32 lg:pt-36">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Resultados da busca
            </h1>
          </div>
          
          {query && (
            <p className="text-muted-foreground">
              Mostrando resultados para: <span className="font-semibold text-foreground">"{query}"</span>
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Erro na busca</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Ocorreu um erro ao buscar os produtos. Tente novamente.
            </p>
          </div>
        )}



        {/* Results */}
        {!isLoading && !error && hasResults && (
          <div>
            <p className="text-sm text-muted-foreground mb-6">
              {results.length} produto{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>
            

            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && !hasResults && query && (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum produto encontrado</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Não encontramos produtos que correspondam à sua busca por "{query}".
              Tente usar termos diferentes ou mais gerais.
            </p>
          </div>
        )}
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default SearchResults;