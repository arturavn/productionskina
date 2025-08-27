import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { ExternalLink, Calendar, Tag, Download, RefreshCw, CheckCircle } from 'lucide-react';

interface MercadoLivreProduct {
  id: string;
  title: string;
  price: number;
  available_quantity: number;
  thumbnail: string;
  status: string;
  category_id: string;
  listing_type_id: string;
  variations: unknown[];
  pictures: string[];
  description: string;
  permalink: string;
  seller_id: string;
  created: string;
  last_updated: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
}

const MercadoLivreMLProducts: React.FC = () => {
  const [products, setProducts] = useState<MercadoLivreProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<{
    total: number;
    limit: number;
    offset: number;
  } | null>(null);
  const [stats, setStats] = useState<{
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const { toast } = useToast();

  // Carregamento inicial
  useEffect(() => {
    loadProducts();
  }, []);



  const loadProducts = async (customOffset?: number) => {
    try {
      setLoading(true);
      setProgressMessage('');
      const currentOffset = customOffset !== undefined ? customOffset : (pagination?.offset || 0);
      const currentLimit = pagination?.limit || 100;
      
      console.log('🔄 Carregando produtos do ML...');
      setProgressMessage('🔄 Iniciando busca de produtos do Mercado Livre...');
      
      // Simular progresso durante o carregamento
      const progressInterval = setInterval(() => {
        const messages = [
          '🔍 Conectando com a API do Mercado Livre...',
          '📋 Buscando lista de produtos ativos...',
          '🔍 Carregando detalhes dos produtos...',
          '📊 Processando informações dos produtos...'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setProgressMessage(randomMessage);
      }, 1500);
      
      const response = await api.getMercadoLivreMLProducts({
        limit: currentLimit,
        offset: currentOffset,
        search: search || ''
      });

      clearInterval(progressInterval);
      
      if (response) {
          // Mapear produtos da API para o tipo esperado
          const mappedProducts: MercadoLivreProduct[] = response.products.map((product: {
            id: string;
            title: string;
            price: number;
            available_quantity: number;
            thumbnail: string;
            status: string;
            category_id?: string;
            listing_type_id?: string;
            description?: string;
            permalink?: string;
            created?: string;
            last_updated?: string;
            [key: string]: unknown;
          }) => ({
            id: product.id,
            title: product.title,
            price: product.price,
            available_quantity: product.available_quantity,
            thumbnail: product.thumbnail,
            status: product.status,
            category_id: product.category_id || '',
            listing_type_id: product.listing_type_id || '',
            variations: [],
            pictures: [],
            description: product.description || '',
            permalink: product.permalink || '',
            seller_id: '',
            created: product.created || '',
            last_updated: product.last_updated || ''
          }));
          
          setProducts(mappedProducts);
          setPagination(response.pagination);
          setStats(null); // API não retorna stats para ML products
          setProgressMessage(`✅ ${mappedProducts.length} produtos carregados com sucesso!`);
          console.log(`✅ Produtos carregados: ${mappedProducts.length}`);
          
          // Limpar mensagem de sucesso após 2 segundos
          setTimeout(() => setProgressMessage(''), 2000);
        }
    } catch (error: unknown) {
      const errorDetails = error as Error & { response?: { data?: unknown; status?: number; statusText?: string } };
      console.error('❌ Erro ao carregar produtos:', errorDetails);
      
      setProducts([]);
      setPagination(null);
      setStats(null);
      setProgressMessage('❌ Erro ao carregar produtos');
      
      toast({
        title: 'Erro ao carregar produtos',
        description: errorDetails.response?.status === 401 ? 'Não autorizado' : 'Erro interno do servidor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'paused': 'secondary',
      'closed': 'destructive'
    } as const;

    const labels = {
      'active': 'Ativo',
      'paused': 'Pausado',
      'closed': 'Fechado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination(prev => ({
      total: prev?.total || 0,
      limit: prev?.limit || 100,
      offset: 0
    }));
    setTimeout(() => {
      loadProducts(0);
    }, 500);
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({
      total: prev?.total || 0,
      limit: prev?.limit || 100,
      offset: newOffset
    }));
    loadProducts(newOffset);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    // Verificar se o produto está ativo antes de permitir seleção
    const product = products.find(p => p.id === productId);
    if (checked && product && product.status !== 'active') {
      toast({
        title: 'Aviso',
        description: 'Não é possível selecionar produtos inativos para importação',
        variant: 'destructive'
      });
      return;
    }

    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Selecionar apenas produtos ativos
      const activeProductIds = products.filter(p => p.status === 'active').map(p => p.id);
      setSelectedProducts(new Set(activeProductIds));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleImportSelected = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: 'Aviso',
        description: 'Selecione pelo menos um produto para importar',
        variant: 'destructive'
      });
      return;
    }

    // Verificar se todos os produtos selecionados estão ativos
    const selectedProductsData = products.filter(product => selectedProducts.has(product.id));
    const inactiveProducts = selectedProductsData.filter(product => product.status !== 'active');
    
    if (inactiveProducts.length > 0) {
      toast({
        title: 'Aviso',
        description: `Não é possível importar produtos inativos. ${inactiveProducts.length} produto(s) selecionado(s) não estão ativos.`,
        variant: 'destructive'
      });
      return;
    }

    setImporting(true);
    try {
      const selectedArray = Array.from(selectedProducts);
      let successCount = 0;
      let errorCount = 0;

      for (const productId of selectedArray) {
        try {
          const response = await api.importMercadoLivreProduct(productId);
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Erro ao importar produto ${productId}:`, error);
        }
      }

      toast({
        title: 'Importação concluída',
        description: `${successCount} produtos importados com sucesso${errorCount > 0 ? `, ${errorCount} com erro` : ''}`,
        variant: errorCount > 0 ? 'destructive' : 'default'
      });

      // Limpar seleção e recarregar produtos
      setSelectedProducts(new Set());
      await loadProducts();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha na importação dos produtos',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const totalPages = Math.ceil((pagination?.total || 0) / (pagination?.limit || 20));
  const currentPage = Math.floor((pagination?.offset || 0) / (pagination?.limit || 20)) + 1;

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">
            {progressMessage || 'Carregando produtos do Mercado Livre...'}
          </p>
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
              <CardTitle className="flex items-center gap-2">
                <img 
                  src="/images/mercado-livre.png" 
                  alt="Mercado Livre" 
                  className="w-10 h-8 object-contain"
                />
                Produtos do Mercado Livre
              </CardTitle>
              <CardDescription>
                Produtos listados diretamente da sua conta do Mercado Livre
              </CardDescription>
              <div className="text-sm text-muted-foreground mt-1">
                {stats ? (
                  `Exibindo ${stats.totalProducts} produtos (${stats.activeProducts} ativos, ${stats.inactiveProducts} inativos)`
                ) : (
                  'Produtos ativos e inativos são exibidos, mas apenas ativos podem ser importados'
                )}
              </div>
            </div>
            <Button
              onClick={() => loadProducts()}
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
          {/* Busca e Informações */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {products.length > 0 && stats && (
                <span>
                  Exibindo {products.length} produtos ({stats.activeProducts} ativos, {stats.inactiveProducts} inativos)
                  {pagination && (
                    <span className="ml-2 text-blue-600">
                      Página {Math.floor(pagination.offset / pagination.limit) + 1} de {Math.ceil(pagination.total / pagination.limit)}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {selectedProducts.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedProducts.size} produto(s) selecionado(s)
                  </span>
                </div>
                <Button
                  onClick={handleImportSelected}
                  disabled={importing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Importar Selecionados
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Tabela de Produtos */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.size === products.length && products.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Preço</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Última Atualização</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando produtos...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                          disabled={product.status !== 'active'}
                          title={product.status !== 'active' ? 'Produto não está ativo' : 'Selecionar para importação'}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {product.thumbnail && (
                            <img
                              src={product.thumbnail}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.title}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {product.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium">{formatPrice(product.price)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.available_quantity > 0 ? 'default' : 'secondary'}>
                          {product.available_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(product.status)}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(product.last_updated)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(product.permalink, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
                      onClick={() => handlePageChange(Math.max(0, (pagination?.offset || 0) - (pagination?.limit || 20)))}
                      className={(pagination?.offset || 0) === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {(() => {
                    const maxVisiblePages = 7;
                    const halfVisible = Math.floor(maxVisiblePages / 2);
                    let startPage = Math.max(1, currentPage - halfVisible);
                     const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                     
                     // Ajustar startPage se endPage atingiu o limite
                     if (endPage - startPage + 1 < maxVisiblePages) {
                       startPage = Math.max(1, endPage - maxVisiblePages + 1);
                     }
                    
                    const pages = [];
                    
                    // Primeira página
                    if (startPage > 1) {
                      pages.push(
                        <PaginationItem key={1}>
                          <PaginationLink
                            onClick={() => handlePageChange(0)}
                            isActive={currentPage === 1}
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      );
                      
                      if (startPage > 2) {
                        pages.push(
                          <PaginationItem key="ellipsis-start">
                            <span className="px-3 py-2">...</span>
                          </PaginationItem>
                        );
                      }
                    }
                    
                    // Páginas visíveis
                    for (let page = startPage; page <= endPage; page++) {
                      const offset = (page - 1) * (pagination?.limit || 20);
                      pages.push(
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(offset)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // Última página
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <PaginationItem key="ellipsis-end">
                            <span className="px-3 py-2">...</span>
                          </PaginationItem>
                        );
                      }
                      
                      const lastPageOffset = (totalPages - 1) * (pagination?.limit || 20);
                      pages.push(
                        <PaginationItem key={totalPages}>
                          <PaginationLink
                            onClick={() => handlePageChange(lastPageOffset)}
                            isActive={currentPage === totalPages}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange((pagination?.offset || 0) + (pagination?.limit || 20))}
                      className={(pagination?.offset || 0) + (pagination?.limit || 20) >= (pagination?.total || 0) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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

export default MercadoLivreMLProducts;
