import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, Loader2, Link } from 'lucide-react';
import { api } from '@/services/api';

interface MercadoLivreStats {
  connected: boolean;
  syncedProducts: number;
  lastSync: {
    timestamp: string;
    details: null;
  } | null; 
  account?: {
    productStats?: {
      total: number;
      active: number;
      inactive: number;
    };
  };
}

export default function MercadoLivreDashboardCard() {
  const [stats, setStats] = useState<MercadoLivreStats>({
    connected: false,
    syncedProducts: 0,
    lastSync: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [tokenStatus, setTokenStatus] = useState<{
    isValid: boolean;
    expiresIn: number;
    willExpireSoon: boolean;
  } | null>(null);

  useEffect(() => {
    fetchStats();
    
    // Verificar se há mensagens de sucesso/erro na URL
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const message = urlParams.get('message');
    const error = urlParams.get('error');
    const statusUpdated = urlParams.get('status_updated');
    
    if (success === 'true' && message) {
      setConnectionMessage(message);
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'false' && error) {
      setConnectionMessage(`Erro: ${error}`);
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Se o status foi atualizado, notificar outras telas
    if (statusUpdated === 'true') {
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      // Buscar status real da conexão
      const statusData = await api.getMercadoLivreStatus();
      
      // Buscar produtos sincronizados separadamente
      let syncedProductsCount = 0;
      try {
        const productsResponse = await api.getMercadoLivreProducts({ limit: 1, offset: 0 });
        if (productsResponse.success) {
          syncedProductsCount = productsResponse.pagination.total;
        }
      } catch (productsError) {
        //console.log('⚠️ Erro ao buscar produtos sincronizados:', productsError);
        syncedProductsCount = 0;
      }
      
      // Buscar estatísticas de sincronização para obter a última sincronização
      let lastSyncInfo = null;
      try {
        const syncStatsResponse = await api.getMercadoLivreSyncStats();
        if (syncStatsResponse.success) {
          lastSyncInfo = {
            timestamp: syncStatsResponse.stats.lastSync,
            details: null 
          };
          //console.log('Estatísticas de sincronização:', syncStatsResponse.stats);
        }
      } catch (syncStatsError) {
        console.log('⚠️ Erro ao buscar estatísticas de sincronização:', syncStatsError);
        lastSyncInfo = null;
      }
      
      setStats({
        connected: statusData.connected || false,
        syncedProducts: syncedProductsCount,
        lastSync: lastSyncInfo,
        account: statusData.account
      });
      
      // Buscar status do token se conectado
        if (statusData.connected) {
          try {
            const tokenData = await api.getMercadoLivreTokenStatus();
            if (tokenData.success && tokenData.tokenStatus) {
              setTokenStatus({
                isValid: tokenData.tokenStatus.valid || false,
                expiresIn: 0, // Valor padrão
                willExpireSoon: tokenData.tokenStatus.needsRefresh || false
              });
            } else {
              setTokenStatus(null);
            }
          } catch (tokenError) {
            console.log('⚠️ Erro ao buscar status do token:', tokenError);
            setTokenStatus(null);
          }
        }
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas do Mercado Livre:', error);
      setStats({
        connected: false,
        syncedProducts: 0,
        lastSync: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionMessage('');
      
      // Redirecionar para a URL de autorização
      const authResponse = await api.authenticateMercadoLivre();
      if (authResponse.success && authResponse.authUrl) {
        window.location.href = authResponse.authUrl;
      } else {
        throw new Error(authResponse.error || 'Não foi possível obter a URL de autorização');
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setConnectionMessage(`Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setConnectionMessage('');
      
      const result = await api.disconnectMercadoLivre();
      
      if (result.success) {
        setConnectionMessage('Conta desconectada com sucesso!');
        await fetchStats(); // Atualizar estatísticas
      } else {
        throw new Error(result.message || 'Erro ao desconectar');
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      setConnectionMessage(`Erro ao desconectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setIsRefreshingToken(true);
      setConnectionMessage('');
      
      const result = await api.refreshMercadoLivreToken();
      
      if (result.success) {
        setConnectionMessage('Token atualizado com sucesso!');
        await fetchStats(); // Atualizar estatísticas
      } else {
        throw new Error(result.message || 'Erro ao atualizar token');
      }
    } catch (error) {
      console.error('Erro ao atualizar token:', error);
      setConnectionMessage(`Erro ao atualizar token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const formatLastSync = (lastSync: { timestamp: string; details: null } | null) => {
    if (!lastSync || !lastSync.timestamp) {
      return 'Nunca';
    }
    
    try {
      const date = new Date(lastSync.timestamp);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getTokenStatusBadge = () => {
    if (!tokenStatus) return null;
    
    const { isValid, expiresIn, willExpireSoon } = tokenStatus;
    
    if (!isValid) {
      return <Badge variant="destructive">Token Expirado</Badge>;
    }
    
    if (willExpireSoon) {
      return <Badge variant="secondary">Expira em breve</Badge>;
    }
    
    return <Badge variant="default">Token Válido</Badge>;
  };

  const getTokenExpirationText = () => {
    if (!tokenStatus || !tokenStatus.isValid) return null;
    
    const { expiresIn } = tokenStatus;
    
    if (expiresIn > 24 * 60 * 60) {
      const days = Math.floor(expiresIn / (24 * 60 * 60));
      return `Expira em ${days} dia${days > 1 ? 's' : ''}`;
    } else if (expiresIn > 60 * 60) {
      const hours = Math.floor(expiresIn / (60 * 60));
      return `Expira em ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (expiresIn > 60) {
      const minutes = Math.floor(expiresIn / 60);
      return `Expira em ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return 'Expira em menos de 1 minuto';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Mercado Livre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Mercado Livre
          </div>
          <div className="flex items-center gap-2">
            {stats.connected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <Badge variant={stats.connected ? 'default' : 'secondary'}>
              {stats.connected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mensagem de conexão */}
        {connectionMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            connectionMessage.includes('Erro') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {connectionMessage}
          </div>
        )}

        {/* Status do Token */}
        {stats.connected && tokenStatus && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status do Token:</span>
              {getTokenStatusBadge()}
            </div>
            {tokenStatus.isValid && (
              <p className="text-xs text-gray-600">
                {getTokenExpirationText()}
              </p>
            )}
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.syncedProducts}
            </div>
            <div className="text-sm text-gray-600">Produtos Sincronizados</div>
          </div>
          
          {stats.account?.productStats && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.account.productStats.total}
              </div>
              <div className="text-sm text-gray-600">Total no ML</div>
            </div>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Última Sincronização:</span>
            <span className="font-medium">{formatLastSync(stats.lastSync)}</span>
          </div>
          
          {stats.account?.productStats && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Produtos Ativos:</span>
                <span className="font-medium text-green-600">
                  {stats.account.productStats.active}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Produtos Inativos:</span>
                <span className="font-medium text-gray-500">
                  {stats.account.productStats.inactive}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2">
          {!stats.connected ? (
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Conectando...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Conectar Conta
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={fetchStats}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                
                {tokenStatus && !tokenStatus.isValid && (
                  <Button 
                    onClick={handleRefreshToken}
                    disabled={isRefreshingToken}
                    size="sm"
                    className="flex-1"
                  >
                    {isRefreshingToken ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renovar Token
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <Button 
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Desconectar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}