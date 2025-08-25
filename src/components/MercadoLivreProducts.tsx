import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, RefreshCw, Loader2, Package, Eye } from 'lucide-react';

interface MercadoLivreProduct {
  id: string;
  title: string;
  price: number;
  available_quantity: number;
  thumbnail: string;
  condition: string;
  status: string;
  category_id: string;
  listing_type_id: string;
  variations?: unknown[];
  pictures?: string[];
  description?: string;
  permalink?: string;
}

export default function MercadoLivreProducts() {
  const [products, setProducts] = useState<MercadoLivreProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<MercadoLivreProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelectAll, setIsSelectAll] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.includes(searchTerm)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      //console.log('🔄 Buscando produtos do Mercado Livre...');
      
      // Obter token de autenticação
      const token = localStorage.getItem('auth_token');
      if (!token) {
        //console.error('❌ Token de autenticação não encontrado');
        setProducts([]);
        setFilteredProducts([]);
        return;
      }
      
     // console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
      
      // Primeiro, verificar o status da conexão
      //console.log('Verificando status da conexão...');
      const statusResponse = await fetch('/api/mercado_livre/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
     //console.log('Status Response status:', statusResponse.status);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Status da conexão:', statusData);
        
        if (!statusData.connected) {
          console.warn('⚠️ Conta não está conectada');
          setProducts([]);
          setFilteredProducts([]);
          return;
        }
      } else {
        console.warn('⚠️ Não foi possível verificar o status da conexão');
      }
      
      // Fazer chamada real para a API de produtos
      console.log('🔄 Fazendo chamada para API de produtos...');
      const response = await fetch('/api/mercado_livre/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      
      
      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ Erro na resposta:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse da resposta de erro:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      //console.log('Dados recebidos da API:', data);
      
      if (data.success && data.products) {
        //console.log('✅ Produtos encontrados:', data.products.length);
        
        // Mapear produtos para o formato esperado pelo componente
        const mappedProducts: MercadoLivreProduct[] = data.products.map((product: Record<string, unknown>) => ({
          id: product.id,
          title: product.title,
          price: product.price,
          available_quantity: product.available_quantity,
          thumbnail: product.pictures?.[0]?.url || '/images/placeholder.svg',
          condition: product.condition,
          status: product.status,
          category_id: product.category_id,
          listing_type_id: product.listing_type_id,
          variations: product.variations,
          pictures: Array.isArray(product.pictures) ? product.pictures.map((p: Record<string, unknown>) => p.url as string) : [],
          description: product.description,
          permalink: product.permalink
        }));
        
        setProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
        console.log('✅ Produtos mapeados e definidos no estado:', mappedProducts.length);
      } else {
        console.warn('⚠️ Resposta da API não contém produtos válidos:', data);
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoading(false);
    }
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
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
      setIsSelectAll(true);
    } else {
      setSelectedProducts(new Set());
      setIsSelectAll(false);
    }
  };

  const handleImportSelected = async () => {
    if (selectedProducts.size === 0) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 Iniciando importação de produtos:', Array.from(selectedProducts));
      
      // Obter token de autenticação
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      // Importar cada produto selecionado
      const importResults = [];
      const selectedProductIds = Array.from(selectedProducts);
      
      for (const productId of selectedProductIds) {
        try {
          console.log(`Importando produto: ${productId}`);
          
          const response = await fetch('/api/mercado_livre/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ product_id: productId })
          });
          
          const result = await response.json();
          
          if (response.ok && result.success) {
            console.log(`✅ Produto ${productId} importado com sucesso`);
            importResults.push({ productId, success: true, message: result.message });
          } else {
            console.error(`❌ Erro ao importar produto ${productId}:`, result.error || result.message);
            importResults.push({ productId, success: false, message: result.error || result.message || 'Erro desconhecido' });
          }
        } catch (error) {
          console.error(`❌ Erro ao importar produto ${productId}:`, error);
          importResults.push({ productId, success: false, message: error instanceof Error ? error.message : 'Erro desconhecido' });
        }
      }
      
      // Mostrar resultados
      const successCount = importResults.filter(r => r.success).length;
      const errorCount = importResults.filter(r => !r.success).length;
      
      console.log(`✅ Importação concluída: ${successCount} sucessos, ${errorCount} erros`);
      
      if (successCount > 0) {
        alert(`${successCount} produto(s) importado(s) com sucesso!`);
      }
      
      if (errorCount > 0) {
        const errorMessages = importResults
          .filter(r => !r.success)
          .map(r => `${r.productId}: ${r.message}`)
          .join('\n');
        alert(`Erro ao importar ${errorCount} produto(s):\n${errorMessages}`);
      }
      
      // Limpar seleção
      setSelectedProducts(new Set());
      setIsSelectAll(false);
      
    } catch (error) {
      console.error('❌ Erro geral na importação:', error);
      alert('Erro ao importar produtos: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      'active': { label: 'Ativo', variant: 'default' },
      'paused': { label: 'Pausado', variant: 'secondary' },
      'closed': { label: 'Fechado', variant: 'destructive' },
      'under_review': { label: 'Em Revisão', variant: 'outline' }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos do Mercado Livre
          </CardTitle>
          <CardDescription>
            Visualize e importe produtos da sua conta do Mercado Livre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchProducts}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar
              </Button>
              <Button
                onClick={handleImportSelected}
                disabled={isLoading || selectedProducts.size === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Importar Selecionados ({selectedProducts.size})
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando produtos...</span>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isSelectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-16">Imagem</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead className="w-16">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Nenhum produto encontrado com os critérios de busca.' : 'Nenhum produto encontrado.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder.svg';
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium truncate" title={product.title}>
                              {product.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {product.id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(product.price)}
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            product.available_quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {product.available_quantity}
                          </span>
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
                          {product.permalink && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(product.permalink, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Mostrando {filteredProducts.length} de {products.length} produtos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}