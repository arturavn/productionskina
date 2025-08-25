import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { RefreshCw } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  ml_id: string;
  original_price?: number;
  discount_price?: number;
  stock_quantity: number;
  updated_at: string;
  image_url: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  retry_count: number;
  sync_status: 'nunca_sincronizado' | 'erro' | 'desatualizado' | 'em_dia';
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
}

const MercadoLivreProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 50,
    offset: 0
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncingProducts, setSyncingProducts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Carregamento inicial com verificação
  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        const response = await api.getMercadoLivreProducts({
          limit: 50,
          offset: 0,
          search: ''
        });
        
        if (response.success) {
          setProducts(response.products);
          setPagination(response.pagination);
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar produtos',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    initialLoad();
  }, [toast]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getMercadoLivreProducts({
        limit: pagination?.limit || 50,
        offset: pagination?.offset || 0,
        search
      });
      
      if (response.success) {
        console.log('🔍 Produtos recebidos da API:', response.products);
        setProducts(response.products);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar produtos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const syncProduct = async (mlId: string) => {
    try {
      setSyncingProducts(prev => new Set(prev).add(mlId));
      
      const response = await api.syncMercadoLivreProduct(mlId);
      
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Produto sincronizado com sucesso'
        });
        
        // Recarregar produtos para atualizar status
        await loadProducts();
      }
    } catch (error) {
      console.error('Erro ao sincronizar produto:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao sincronizar produto',
        variant: 'destructive'
      });
    } finally {
      setSyncingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(mlId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) {
      return 'N/A';
    }
    
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
    
    return formatted;
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination(prev => prev ? { ...prev, offset: 0 } : { total: 0, limit: 50, offset: 0 });
    setTimeout(() => {
      loadProducts();
    }, 100);
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => prev ? { ...prev, offset: newOffset } : { total: 0, limit: 50, offset: newOffset });
    setTimeout(() => {
      loadProducts();
    }, 100);
  };

  const totalPages = Math.ceil((pagination?.total || 0) / (pagination?.limit || 50));
  const currentPage = Math.floor((pagination?.offset || 0) / (pagination?.limit || 50)) + 1;

  // Verificação de carregamento após todos os hooks
  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Produtos Importados</CardTitle>
              <CardDescription>
                Gerencie a importação dos produtos com o Mercado Livre
              </CardDescription>
            </div>
            <Button
              onClick={loadProducts}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de pesquisa */}
          <div className="mb-6">
            <Input
              placeholder="Pesquisar produtos..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Tabela de produtos */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                        Carregando produtos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const statusColors = {
                      'nunca_sincronizado': 'bg-gray-100 text-gray-800',
                      'erro': 'bg-red-100 text-red-800',
                      'desatualizado': 'bg-yellow-100 text-yellow-800',
                      'em_dia': 'bg-green-100 text-green-800'
                    };

                    const statusLabels = {
                      'nunca_sincronizado': 'Nunca Sincronizado',
                      'erro': 'Erro',
                      'desatualizado': 'Desatualizado',
                      'em_dia': 'Em Dia'
                    };

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          R$ {formatPrice(product.original_price)}
                          {product.discount_price && (
                            <div className="text-sm text-muted-foreground line-through">
                              R$ {formatPrice(product.discount_price)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              className="w-12 h-12 object-cover rounded" 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                              {product.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Atualizado: {formatDate(product.updated_at)}</div>
                            {product.last_synced_at && (
                              <div className="text-muted-foreground">
                                Sincronizado: {formatDate(product.last_synced_at)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[product.sync_status] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {statusLabels[product.sync_status] || product.sync_status}
                          </span>
                          {product.last_error && (
                            <div className="text-xs text-red-600 mt-1" title={product.last_error}>
                              Erro: {product.last_error.substring(0, 50)}...
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => syncProduct(product.ml_id)}
                            disabled={syncingProducts.has(product.ml_id)}
                          >
                            {syncingProducts.has(product.ml_id) ? 'Sincronizando...' : 'Sincronizar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(0, (pagination?.offset || 0) - (pagination?.limit || 50)))}
                      className={(pagination?.offset || 0) === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    const offset = (page - 1) * (pagination?.limit || 50);
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(offset)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange((pagination?.offset || 0) + (pagination?.limit || 50))}
                      className={(pagination?.offset || 0) + (pagination?.limit || 50) >= (pagination?.total || 0) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <div className="text-center text-sm text-muted-foreground mt-2">
                Página {currentPage} de {totalPages} • {pagination?.total || 0} produtos no total
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MercadoLivreProductsList;