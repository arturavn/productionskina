import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { RefreshCw, Download, ExternalLink, Package, AlertCircle } from 'lucide-react';

interface MLProduct {
  id: string;
  title: string;
  price: number;
  available_quantity: number;
  status: string;
  condition: string;
  thumbnail: string;
  permalink: string;
  category_id: string;
  listing_type_id: string;
  currency_id: string;
  sold_quantity: number;
  is_imported?: boolean;
  imported_product_id?: number;
  imported_product_name?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
}

const MercadoLivreMLProducts: React.FC = () => {
  const [products, setProducts] = useState<MLProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (searchTerm = '', page = 1) => {
    try {
      setLoading(true);
      const response = await api.getMercadoLivreProducts({
          search: searchTerm,
          offset: (page - 1) * 50,
          limit: 50
        });
      
      if (response.success) {
         setProducts(response.products as MLProduct[] || []);
         setPagination(response.pagination || null);
       } else {
         throw new Error('Erro ao carregar produtos');
       }
    } catch (error) {
      console.error('Erro ao carregar produtos do ML:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar produtos do Mercado Livre',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadProducts(value);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
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
      const availableProducts = products.filter(p => !p.is_imported);
      setSelectedProducts(new Set(availableProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const importProduct = async (productId: string) => {
    try {
      setImporting(prev => new Set([...prev, productId]));
      
      const response = await api.importMercadoLivreProduct(productId);
      
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: `Produto importado com sucesso!`
        });
        
        // Atualizar lista de produtos
        await loadProducts(search);
      } else {
         throw new Error(response.message || 'Erro ao importar produto');
       }
    } catch (error) {
      console.error('Erro ao importar produto:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao importar produto',
        variant: 'destructive'
      });
    } finally {
      setImporting(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const importSelectedProducts = async () => {
    if (selectedProducts.size === 0) return;
    
    try {
      setImporting(new Set(selectedProducts));
      
      const promises = Array.from(selectedProducts).map(productId => 
        api.importMercadoLivreProduct(productId)
      );
      
      const results = await Promise.allSettled(promises);
      
      let successCount = 0;
      let errorCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });
      
      if (successCount > 0) {
        toast({
          title: 'Importação Concluída',
          description: `${successCount} produto(s) importado(s) com sucesso${errorCount > 0 ? `, ${errorCount} erro(s)` : ''}`
        });
      }
      
      if (errorCount > 0 && successCount === 0) {
        toast({
          title: 'Erro na Importação',
          description: `Falha ao importar ${errorCount} produto(s)`,
          variant: 'destructive'
        });
      }
      
      // Limpar seleção e recarregar produtos
      setSelectedProducts(new Set());
      await loadProducts(search);
      
    } catch (error) {
      console.error('Erro na importação em lote:', error);
      toast({
        title: 'Erro',
        description: 'Falha na importação em lote',
        variant: 'destructive'
      });
    } finally {
      setImporting(new Set());
    }
  };

  const formatPrice = (price: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'BRL'
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      active: { label: 'Ativo', variant: 'default' },
      paused: { label: 'Pausado', variant: 'secondary' },
      closed: { label: 'Finalizado', variant: 'destructive' },
      under_review: { label: 'Em Revisão', variant: 'outline' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const availableProducts = products.filter(p => !p.is_imported);
  const importedProducts = products.filter(p => p.is_imported);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos do Mercado Livre
            </CardTitle>
            <CardDescription>
              Visualize e importe produtos da sua conta do Mercado Livre
            </CardDescription>
          </div>
          <Button
            onClick={() => loadProducts(search)}
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
            {products.length > 0 && (
              <span>
                Exibindo {products.length} produtos ativos
                {pagination && pagination.total > products.length && (
                  <span className="text-orange-600">
                    {' '}({pagination.total - products.length} inativos encontrados)
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
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedProducts.size} produto(s) selecionado(s)
                </span>
              </div>
              <Button
                onClick={importSelectedProducts}
                disabled={importing.size > 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {importing.size > 0 ? 'Importando...' : 'Importar Selecionados'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando produtos...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mb-4">
              Não foram encontrados produtos ativos na sua conta do Mercado Livre.
            </p>
            <Button
              onClick={() => loadProducts()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Produtos Disponíveis para Importação */}
            {availableProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Produtos Disponíveis ({availableProducts.length})</h3>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={availableProducts.length > 0 && selectedProducts.size === availableProducts.length}
                      onCheckedChange={handleSelectAll}
                      disabled={importing.size > 0}
                    />
                    <span className="text-sm text-muted-foreground">Selecionar todos</span>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Selecionar</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Condição</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                              disabled={importing.has(product.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.thumbnail && (
                                <img
                                  src={product.thumbnail}
                                  alt={product.title}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium line-clamp-2">{product.title}</div>
                                <div className="text-sm text-muted-foreground">ID: {product.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatPrice(product.price, product.currency_id)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                product.available_quantity > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.available_quantity}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(product.status)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {product.condition === 'new' ? 'Novo' : 'Usado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => importProduct(product.id)}
                                disabled={importing.has(product.id)}
                                size="sm"
                                variant="outline"
                              >
                                {importing.has(product.id) ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                onClick={() => window.open(product.permalink, '_blank')}
                                size="sm"
                                variant="ghost"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Produtos Já Importados */}
            {importedProducts.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Produtos Já Importados ({importedProducts.length})</h3>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto ML</TableHead>
                        <TableHead>Produto Importado</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.thumbnail && (
                                <img
                                  src={product.thumbnail}
                                  alt={product.title}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium line-clamp-2">{product.title}</div>
                                <div className="text-sm text-muted-foreground">ID: {product.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.imported_product_name}</div>
                              <div className="text-sm text-muted-foreground">ID: {product.imported_product_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatPrice(product.price, product.currency_id)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(product.status)}
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => window.open(product.permalink, '_blank')}
                              size="sm"
                              variant="ghost"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MercadoLivreMLProducts;