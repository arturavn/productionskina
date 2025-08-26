import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { AlertTriangle } from 'lucide-react';

interface SyncConfig {
  auto_sync_enabled: string;
  sync_interval_minutes: string;
  max_concurrent_requests: string;
  batch_size: string;
  retry_attempts: string;
  rate_limit_delay_ms: string;
}

const MercadoLivreSyncConfig: React.FC = () => {
  const [config, setConfig] = useState<SyncConfig>({
    auto_sync_enabled: 'false',
    sync_interval_minutes: '60',
    max_concurrent_requests: '4',
    batch_size: '200',
    retry_attempts: '',
    rate_limit_delay_ms: '500'
  });
  
  const [loading, setLoading] = useState(false);
  const [syncRunning, setSyncRunning] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.getMercadoLivreSyncConfig();
      if (response.success) {
        setConfig(prev => ({ ...prev, ...response.config }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configurações de sincronização',
        variant: 'destructive'
      });
    }
  };

  const updateConfig = async (key: keyof SyncConfig, value: string) => {
    try {
      setLoading(true);
      const response = await api.updateMercadoLivreSyncConfig(key, value);
      
      if (response.success) {
        setConfig(prev => ({ ...prev, [key]: value }));
        toast({
          title: 'Sucesso',
          description: 'Configuração atualizada com sucesso'
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar configuração',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runSync = async (type: 'delta' | 'full_import') => {
    try {
      setSyncRunning(true);
      const response = await api.runMercadoLivreSync(type);
      
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: `Sincronização ${type === 'delta' ? 'delta' : 'completa'} iniciada com sucesso`
        });
      }
    } catch (error) {
      console.error('Erro ao iniciar sincronização:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao iniciar sincronização',
        variant: 'destructive'
      });
    } finally {
      setSyncRunning(false);
    }
  };



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Sincronização</CardTitle>
          <CardDescription>
            Configure como a sincronização automática com o Mercado Livre deve funcionar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sincronização Automática */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sync">Sincronização Automática</Label>
              <p className="text-sm text-muted-foreground">
                Habilita sincronização automática em intervalos regulares
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={config.auto_sync_enabled === 'true'}
              onCheckedChange={(checked) => 
                updateConfig('auto_sync_enabled', checked.toString())
              }
              disabled={loading}
            />
          </div>

          {/* Intervalo de Sincronização */}
          <div className="space-y-2">
            <Label htmlFor="sync-interval">Intervalo de Sincronização</Label>
            <Select
              value={config.sync_interval_minutes}
              onValueChange={(value) => updateConfig('sync_interval_minutes', value)}
              disabled={loading || config.auto_sync_enabled !== 'true'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="240">4 horas</SelectItem>
                <SelectItem value="480">8 horas</SelectItem>
                <SelectItem value="1440">1 dia</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Só aplicável quando sincronização automática estiver habilitada
            </p>
          </div>

          {/* Configurações Avançadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-concurrent">Máximo de Requisições Concorrentes</Label>
              <Input
                id="max-concurrent"
                type="number"
                min="1"
                max="20"
                value={config.max_concurrent_requests}
                onChange={(e) => updateConfig('max_concurrent_requests', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 3-5 para evitar bloqueios
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-size">Tamanho do Lote</Label>
              <Input
                id="batch-size"
                type="number"
                min="50"
                max="1000"
                value={config.batch_size}
                onChange={(e) => updateConfig('batch_size', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 100-200 produtos por lote
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retry-attempts">Tentativas de Retry</Label>
              <Input
                id="retry-attempts"
                type="number"
                min="1"
                max="10"
                value={config.retry_attempts}
                onChange={(e) => updateConfig('retry_attempts', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 3-5 tentativas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate-limit-delay">Delay entre Requisições (ms)</Label>
              <Input
                id="rate-limit-delay"
                type="number"
                min="100"
                max="2000"
                step="100"
                value={config.rate_limit_delay_ms}
                onChange={(e) => updateConfig('rate_limit_delay_ms', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: 500-1000ms para evitar bloqueios
              </p>
            </div>
          </div>


        </CardContent>
      </Card>

      {/* Ações de Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle>Ações de Sincronização</CardTitle>
          <CardDescription>
            Execute sincronizações manuais quando necessário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Button
              onClick={() => runSync('delta')}
              disabled={syncRunning}
              className="w-full max-w-md"
            >
              {syncRunning ? 'Executando...' : 'Sincronizar Agora (Delta)'}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground text-center">
            <p><strong>Delta:</strong> Atualiza apenas produtos existentes com mudanças</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MercadoLivreSyncConfig;
