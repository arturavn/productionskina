import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { api, MercadoLivreProduct } from '@/services/api';
import { CheckCircle, XCircle, RefreshCw, Loader2, Link, ExternalLink } from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  account?: {
    id: string;
    nickname: string;
    email: string;
    productStats?: {
      total: number;
      active: number;
      inactive: number;
    };
    expiresAt?: string;
  };
}

const MercadoLivreIntegration: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [products, setProducts] = useState<MercadoLivreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Carregamento inicial do status
  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.getMercadoLivreStatus();
      setConnectionStatus({
        connected: response.connected,
        account: response.account
      });
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar status da conexão',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await api.authenticateMercadoLivre();
      
      if (response.success && response.authUrl) {
        // Redirecionar para a URL de autenticação do Mercado Livre
        window.location.href = response.authUrl;
      } else {
        throw new Error(response.error || 'Falha na autenticação');
      }
    } catch (error) {
      console.error('Erro na conexão:', error);
      toast({
        title: 'Erro na conexão',
        description: 'Não foi possível conectar ao Mercado Livre.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      const response = await api.disconnectMercadoLivre();
      
      if (response.success) {
        setConnectionStatus({ connected: false });
        setProducts([]);
        toast({
          title: 'Desconectado',
          description: 'Conta do Mercado Livre desconectada com sucesso.',
        });
      } else {
        throw new Error('Falha ao desconectar');
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desconectar a conta.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.getMercadoLivreProducts({ limit: 10 });
      
      if (response.success && response.products) {
        setProducts(response.products);
        toast({
          title: 'Produtos carregados',
          description: `${response.products.length} produtos encontrados`,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: 'Erro ao buscar produtos',
        description: 'Não foi possível carregar os produtos do Mercado Livre.',
        variant: 'destructive',
      });
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
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const },
      paused: { label: 'Pausado', variant: 'secondary' as const },
      closed: { label: 'Finalizado', variant: 'destructive' as const },
      under_review: { label: 'Em Revisão', variant: 'secondary' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, variant: 'secondary' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading && !connectionStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando status da integração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img 
              src="/images/mercado-livre.png" 
              alt="Mercado Livre" 
              className="w-10 h-8 object-contain"
            />
            Integração com Mercado Livre
          </CardTitle>
          <CardDescription>
            Conecte sua conta do Mercado Livre para sincronizar produtos automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connectionStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-5 w-5 text-red-500" />
                <p>Conta não conectada</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Para começar a sincronizar seus produtos, conecte sua conta do Mercado Livre.
              </p>
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center gap-2"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
                {isConnecting ? 'Conectando...' : 'Conectar conta'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <p>Conta conectada com sucesso</p>
              </div>
              
              {connectionStatus.account && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Usuário:</span>
                    <span className="text-sm">{connectionStatus.account.nickname}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm">{connectionStatus.account.email}</span>
                  </div>
                  {connectionStatus.account.productStats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total de produtos:</span>
                        <span className="text-sm">{connectionStatus.account.productStats.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Produtos ativos:</span>
                        <span className="text-sm text-green-600">{connectionStatus.account.productStats.active}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={fetchProducts}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isLoading ? 'Carregando...' : 'Buscar produtos'}
                </Button>
                
                <Button 
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos do Mercado Livre</CardTitle>
            <CardDescription>
              Últimos produtos encontrados na sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Preço</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
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
                            ID: {product.ml_id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{formatPrice(product.price)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.available_quantity > 0 ? 'default' : 'secondary'}>
                        {product.available_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(product.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(product.permalink, '_blank')}
                        title="Ver no Mercado Livre"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MercadoLivreIntegration;