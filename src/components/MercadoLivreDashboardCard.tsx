import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, Loader2, Link } from 'lucide-react';
import { api } from '@/services/api';

interface MercadoLivreStats {
  connected: boolean;
  syncedProducts: number;
  lastSync: any; 
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
  const [tokenStatus, setTokenStatus] = useState<any>(null);

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
      
      // Log das informações recebidas
      console.log('Status da conexão:', statusData);
      console.log('Produtos sincronizados encontrados:', syncedProductsCount);
      console.log('🔄 Última sincronização:', lastSyncInfo);
      
      if (statusData.connected && statusData.account) {
        //console.log('Usuário conectado:', statusData.account);
        
        // Se estiver conectado, buscar status do token
        //console.log('Buscando status do token...');
        await fetchTokenStatus();
      } else {
        console.log('❌ Usuário não conectado ou sem conta');
        setTokenStatus(null);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar status:', error);
      // Se não conseguir buscar status, manter estado desconectado
      setStats({
        connected: false,
        syncedProducts: 0,
        lastSync: null
      });
      setTokenStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTokenStatus = async () => {
    try {
      //console.log('Iniciando busca do status do token...');
      const tokenData = await api.getMercadoLivreTokenStatus();
      //console.log('Resposta da API de status do token:', tokenData);
      
      if (tokenData.success) {
        // Estrutura esperada: { success: true, tokenStatus: {...}, account: {...} }
        const tokenInfo = {
          valid: tokenData.tokenStatus?.valid || false,
          needsRefresh: tokenData.tokenStatus?.needsRefresh || false,
          account: tokenData.account || null
        };
        
        setTokenStatus(tokenInfo);
        console.log('✅ Status do token definido:', tokenInfo);
      } else {
        console.log('❌ API retornou erro:', tokenData);
        setTokenStatus(null);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar status do token:', error);
      setTokenStatus(null);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setIsRefreshingToken(true);
      setConnectionMessage('Renovando token...');
      
      const result = await api.refreshMercadoLivreToken();
      
      if (result.success) {
        setConnectionMessage('Token renovado com sucesso!');
        // Atualizar status
        await fetchStats();
      } else {
        setConnectionMessage('Erro ao renovar token');
      }
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      setConnectionMessage('Erro ao renovar token');
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionMessage('Iniciando conexão...');
      
      // Debug: verificar token
      const token = localStorage.getItem('auth_token');
      console.log('Token encontrado:', token ? 'Sim' : 'Não');
      console.log('Token:', token);
      
      // Chamada real para API do Mercado Livre
      const data = await api.authenticateMercadoLivre();
      
      console.log('Response data:', data);
      
      if (data.success && data.authUrl) {
        setConnectionMessage('Redirecionando para autorização...');
        
        // Abrir janela de autorização do Mercado Livre
        const authWindow = window.open(
          data.authUrl, 
          'MercadoLivreAuth', 
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        // Verificar se a janela foi aberta
        if (authWindow) {
          // Listener para detectar quando a janela é fechada
          const checkWindowClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkWindowClosed);
              
              // Verificar se a conexão foi bem-sucedida
              setTimeout(async () => {
                try {
                  await fetchStats(); // Recarregar estatísticas
                  
                  if (stats.connected) {
                    setConnectionMessage('Conexão estabelecida com sucesso!');
                  } else {
                    setConnectionMessage('Autorização cancelada ou falhou');
                  }
                  
                  setTimeout(() => {
                    setConnectionMessage('');
                    setIsConnecting(false);
                  }, 3000);
                  
                } catch (error) {
                  console.error('Erro ao verificar status:', error);
                  setConnectionMessage('Erro ao verificar status da conexão');
                  setTimeout(() => {
                    setConnectionMessage('');
                    setIsConnecting(false);
                  }, 3000);
                }
              }, 1000);
            }
          }, 1000);
          
          // Timeout para evitar verificação infinita
          setTimeout(() => {
            clearInterval(checkWindowClosed);
            if (!authWindow.closed) {
              authWindow.close();
              setConnectionMessage('Tempo limite excedido. Tente novamente.');
              setIsConnecting(false);
            }
          }, 300000); // 5 minutos
          
        } else {
          throw new Error('Não foi possível abrir a janela de autorização');
        }
        
      } else {
        throw new Error(data.error || 'Erro desconhecido na API');
      }
      
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setConnectionMessage(`Erro ao conectar: ${error.message}`);
      
      // Limpar mensagem de erro após 5 segundos
      setTimeout(() => {
        setConnectionMessage('');
        setIsConnecting(false);
      }, 5000);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setConnectionMessage('Desconectando conta...');
      
      const data = await api.disconnectMercadoLivre();
      
      if (data.success) {
        setConnectionMessage('Conta desconectada com sucesso!');
        // Recarregar estatísticas
        await fetchStats();
        
        setTimeout(() => {
          setConnectionMessage('');
        }, 3000);
      } else {
        throw new Error(data.message || 'Erro ao desconectar');
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      setConnectionMessage(`Erro ao desconectar: ${error.message}`);
      
      setTimeout(() => {
        setConnectionMessage('');
      }, 5000);
    } finally {
      setIsDisconnecting(false);
    }
  };



  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Mercado Livre</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-muted-foreground">Carregando estatísticas...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <img 
              src="/images/mercado-livre.png" 
              alt="Mercado Livre" 
              className="w-10 h-8 object-contain" 
            />
            Mercado Livre
          </CardTitle>
          <div className="flex items-center gap-3">
            {stats.connected ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Badge variant="default">Conectado</Badge>
                <Button 
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
                </Button>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                <Badge variant="destructive">Desconectado</Badge>
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-skina-green hover:bg-skina-green/90 text-white"
                  size="sm"
                >
                  <Link className="h-4 w-4 mr-2" />
                  {isConnecting ? 'Conectando...' : 'Conectar Conta'}
                </Button>
              </>
            )}
            

          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.syncedProducts}</div>
            <div className="text-sm text-muted-foreground">Produtos Importados</div>
            <Button
              onClick={fetchStats}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="mt-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
          <div className="text-center p-4 border rounded-lg flex flex-col justify-center items-center min-h-[120px]">
            <div className="text-sm font-medium text-center">
              {stats.lastSync ? new Date(stats.lastSync.timestamp).toLocaleString('pt-BR') : 'Nunca'}
            </div>
            <div className="text-sm text-muted-foreground text-center">Última Sincronização</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-sm font-medium">
              {tokenStatus ? (
                <div className="space-y-2">
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    tokenStatus.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tokenStatus.valid ? 'Token Válido' : 'Token Inválido'}
                  </div>
                  {tokenStatus.account?.expiresAt && (
                    <div className="text-xs text-gray-600">
                      Expira: {new Date(tokenStatus.account.expiresAt).toLocaleString('pt-BR')}
                    </div>
                  )}
                  {tokenStatus.needsRefresh && (
                    <div className="text-xs text-orange-600">Expira em breve</div>
                  )}
                  {/* Botão de renovação sempre visível quando conectado */}
                  {stats.connected && (
                    <Button
                      onClick={handleRefreshToken}
                      disabled={isRefreshingToken}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 w-full mt-2"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingToken ? 'animate-spin' : ''}`} />
                      {isRefreshingToken ? 'Renovando...' : 'Renovar Token'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500">Verificando...</div>
              )}
            </div>
            
          </div>
        </div>


        
        {/* Mensagens de conexão */}
        {connectionMessage && (
          <div className="text-center py-3 px-4 border rounded-lg bg-gray-50">
            <p className={`text-sm font-medium ${
              connectionMessage.includes('Erro') 
                ? 'text-red-600' 
                : connectionMessage.includes('sucesso') 
                  ? 'text-green-600' 
                  : 'text-blue-600'
            }`}>
              {connectionMessage}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
