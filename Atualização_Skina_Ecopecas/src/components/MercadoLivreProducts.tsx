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
  variations?: any[];
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
        const mappedProducts: MercadoLivreProduct[] = data.products.map((product: any) => ({
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
          pictures: product.pictures?.map((p: any) => p.url) || [],
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
            body: JSON.stringify({
              productId: productId
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Produto ${productId} importado com sucesso:`, result);
            importResults.push({ productId, success: true, result });
          } else {
            const errorData = await response.json();
            console.error(`❌ Erro ao importar produto ${productId}:`, errorData);
            importResults.push({ productId, success: false, error: errorData });
          }
        } catch (error) {
          console.error(`❌ Erro na importação do produto ${productId}:`, error);
          importResults.push({ productId, success: false, error: error.message });
        }
      }
      
      // Mostrar resultados da importação
      const successCount = importResults.filter(r => r.success).length;
      const errorCount = importResults.filter(r => !r.success).length;
      
      //console.log(`Resultado da importação: ${successCount} sucessos, ${errorCount} erros`);
      
      if (successCount > 0) {
        // Mostrar mensagem de sucesso
        alert(`✅ ${successCount} produto(s) importado(s) com sucesso!${errorCount > 0 ? `\n❌ ${errorCount} erro(s) encontrado(s).` : ''}`);
      } else {
        // Mostrar mensagem de erro
        alert(`❌ Nenhum produto foi importado. Verifique o console para mais detalhes.`);
      }
      
      // Limpar seleção após importação
      setSelectedProducts(new Set());
      setIsSelectAll(false);
      
      // Recarregar produtos
      await fetchProducts();
      
    } catch (error) {
      console.error('❌ Erro geral na importação:', error);
      alert(`❌ Erro na importação: ${error.message}`);
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
    const statusMap = {
      active: { label: 'Ativo', variant: 'default' as const },
      paused: { label: 'Pausado', variant: 'secondary' as const },
      closed: { label: 'Fechado', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getConditionBadge = (condition: string) => {
    const conditionMap = {
      new: { label: 'Novo', variant: 'default' as const },
      used: { label: 'Usado', variant: 'secondary' as const }
    };
    
    const conditionInfo = conditionMap[condition as keyof typeof conditionMap] || conditionMap.new;
    return <Badge variant={conditionInfo.variant}>{conditionInfo.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Produtos do Mercado Livre</CardTitle>
            <CardDescription>
              Visualize e gerencie os produtos da sua conta do Mercado Livre
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchProducts}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={handleImportSelected}
              disabled={selectedProducts.size === 0 || isLoading}
              size="sm"
              className="bg-skina-green hover:bg-skina-green/90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Importar Selecionados ({selectedProducts.size})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar produtos por nome ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Seleção em lote */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isSelectAll}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">Selecionar Todos</span>
          </div>
          {selectedProducts.size > 0 && (
            <Badge variant="secondary">
              {selectedProducts.size} produto(s) selecionado(s)
            </Badge>
          )}
        </div>

        {/* Tabela de produtos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Carregando produtos...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum produto encontrado</p>
            <p className="text-sm">
              {products.length === 0 
                ? "Conecte sua conta do Mercado Livre para começar" 
                : "Nenhum produto corresponde à sua busca"
              }
            </p>
            {products.length === 0 && (
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  onClick={fetchProducts}
                  disabled={isLoading}
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <div className="text-xs text-gray-500">
                  <p>Se você já conectou sua conta, verifique:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Se a conexão está ativa na aba "Configurações"</li>
                    <li>• Se há produtos ativos na sua conta do Mercado Livre</li>
                    <li>• Se o token de acesso não expirou</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
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
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={(checked) => 
                          handleSelectProduct(product.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder.svg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.title}</p>
                          <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-skina-green">
                        {formatPrice(product.price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{product.available_quantity}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product.status)}
                    </TableCell>
                    <TableCell>
                      {getConditionBadge(product.condition)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(product.permalink, '_blank')}
                          title="Ver no Mercado Livre"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
