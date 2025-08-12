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
        {/* Header da Busca */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg px-4 md:px-6 py-8 md:py-12 shadow-sm border dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Search className="w-6 h-6 mr-3 text-skina-green" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              Resultados da Busca
            </h1>
          </div>
          <div className="w-16 h-1 bg-skina-green mb-4 md:mb-6"></div>
          {query && (
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Você pesquisou por: <span className="font-semibold text-foreground">"{
                query
              }"</span>
            </p>
          )}
        </div>

        {/* Conteúdo dos Resultados */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-skina-green mx-auto mb-4"></div>
              <p className="text-muted-foreground dark:text-gray-300">Buscando produtos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                Erro na busca
              </h3>
              <p className="text-muted-foreground dark:text-gray-300">
                Ocorreu um erro ao buscar os produtos. Tente novamente.
              </p>
            </div>
          ) : !query ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                Digite algo para buscar
              </h3>
              <p className="text-muted-foreground dark:text-gray-300">
                Use a barra de busca acima para encontrar produtos.
              </p>
            </div>
          ) : hasResults ? (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground dark:text-gray-300">
                  {results.length} produto(s) encontrado(s)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-muted-foreground dark:text-gray-300 mb-6">
                Não encontramos produtos que correspondam à sua busca por "{
                  query
                }".
              </p>
              <div className="text-left max-w-md mx-auto">
                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-2">
                  Dicas para melhorar sua busca:
                </p>
                <ul className="text-sm text-muted-foreground dark:text-gray-400 space-y-1">
                  <li>• Verifique a ortografia das palavras</li>
                  <li>• Use termos mais gerais</li>
                  <li>• Tente palavras-chave diferentes</li>
                  <li>• Use menos palavras na busca</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default SearchResults;