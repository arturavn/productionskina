import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useProductSearch } from '@/hooks/useApi';

interface SearchDropdownProps {
  className?: string;
  placeholder?: string;
  onClose?: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ 
  className = '', 
  placeholder = 'Buscar produtos...', 
  onClose 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { results, isLoading, hasResults } = useProductSearch(searchQuery, 300);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(value.length > 0);
  };

  const handleProductClick = (productId: number) => {
    navigate(`/produto/${productId}`);
    setIsOpen(false);
    setSearchQuery('');
    if (onClose) onClose();
  };

  const handleViewAllResults = () => {
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setSearchQuery('');
      if (onClose) onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleViewAllResults();
  };

  const handleInputFocus = () => {
    if (searchQuery.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full group">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-full pl-4 pr-12 py-3 rounded-full border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-skina-blue focus:ring-2 focus:ring-skina-blue/20 shadow-sm transition-all duration-300 group-hover:shadow-md text-base"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-2 bg-skina-blue hover:bg-skina-blue/90 text-white rounded-full transition-all duration-300 hover:scale-105"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Dropdown de Resultados */}
      {isOpen && searchQuery.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-skina-blue" />
              <p className="text-sm text-muted-foreground dark:text-gray-300">Buscando produtos...</p>
            </div>
          ) : hasResults ? (
            <>
              <div className="p-2">
                <p className="text-xs text-muted-foreground dark:text-gray-400 px-3 py-2">
                  {results.length} produto(s) encontrado(s)
                </p>
                {results.slice(0, 5).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 flex items-center space-x-3"
                  >
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-md flex-shrink-0 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                        {product.brand} • {product.category_name}
                      </p>
                      <p className="text-sm font-semibold text-skina-green">
                        R$ {(() => {
                          const originalPrice = Number(product.originalPrice || 0);
                          const discountPrice = Number(product.discountPrice || 0) || originalPrice;
                          return discountPrice.toFixed(2);
                        })()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              
              {results.length > 5 && (
                <div className="border-t border-gray-100 dark:border-gray-600 p-2">
                  <button
                    onClick={handleViewAllResults}
                    className="w-full p-3 text-center text-sm text-skina-blue hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 font-medium"
                  >
                    Ver todos os {results.length} resultados
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground dark:text-gray-300">
                Nenhum produto encontrado para "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;