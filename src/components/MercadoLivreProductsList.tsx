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
  const [pageInput, setPageInput] = useState('');
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
          setProducts(response.products as Product[]);
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
        setProducts(response.products as Product[]);
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

  const loadProductsWithOffset = async (offset: number) => {
    try {
      setLoading(true);
      const response = await api.getMercadoLivreProducts({
        limit: pagination?.limit || 50,
        offset: offset,
        search
      });
      
      if (response.success) {
        console.log('🔍 Produtos recebidos da API:', response.products);
        setProducts(response.products as Product[]);
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
          description: `Produto ${response.result.action === 'update' ? 'atualizado' : 'sem mudanças'}`
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

  const formatPrice = (originalPrice?: number) => {
    //console.log('🔍 formatPrice chamado com:', { originalPrice, type: typeof originalPrice });
    
    if (!originalPrice || originalPrice === 0) {
      //console.log('🔍 Retornando N/A para preço:', originalPrice);
      return 'N/A';
    }
    
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(originalPrice);
    
   // console.log('🔍 Preço formatado:', formatted);
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
    loadProductsWithOffset(newOffset);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(pageInput);
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      toast({
        title: "Página inválida",
        description: `Digite um número entre 1 e ${totalPages}`,
        variant: "destructive",
      });
      return;
    }
    
    const newOffset = (pageNumber - 1) * (pagination?.limit || 50);
    handlePageChange(newOffset);
    setPageInput('');
  };

  const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
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
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca */}
          <div className="mb-6">
            <Input
              placeholder="Buscar por nome ou ML ID..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Tabela de Produtos */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">ML ID</TableHead>
                  <TableHead className="text-center">Preço</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Última Atualização</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando produtos...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    console.log('🔍 Renderizando produto:', {
                      id: product.id,
                      name: product.name,
                      original_price: product.original_price,
                      discount_price: product.discount_price
                    });
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                ID: {product.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {product.ml_id}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">
                            {formatPrice(product.original_price)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {product.stock_quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {formatDate(product.updated_at)}
                        </TableCell>
                        <TableCell className="text-center">
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
          {pagination && pagination.total > 0 && (
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
              
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} • {pagination?.total || 0} produtos no total
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ir para página:</span>
                  <Input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyPress={handlePageInputKeyPress}
                    placeholder="Nº"
                    className="w-16 h-8 text-center"
                  />
                  <Button
                    size="sm"
                    onClick={handleGoToPage}
                    disabled={!pageInput || loading}
                    className="h-8 px-3"
                  >
                    Ir
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MercadoLivreProductsList;
