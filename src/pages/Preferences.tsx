import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useToast } from '../hooks/use-toast';
import { api } from '../services/api';

interface Preference {
  id: string;
  preferenceId: string;
  orderId: string;
  externalReference: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  payerCpf: string;
  payerAddress: any;
  items: any[];
  totalAmount: number;
  shippingCost: number;
  initPoint: string;
  sandboxInitPoint: string;
  paymentUrl: string;
  notificationUrl: string;
  backUrls: any;
  paymentMethods: any;
  statementDescriptor: string;
  binaryMode: boolean;
  expires: boolean;
  expirationDateFrom: string;
  expirationDateTo: string;
  environment: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
}

interface PreferencesResponse {
  preferences: Preference[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface Stats {
  total: number;
  totalAmount: number;
  averageAmount: number;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  };
  byEnvironment: {
    sandbox: number;
    production: number;
  };
}

const Preferences: React.FC = () => {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPreference, setSelectedPreference] = useState<Preference | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    environment: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const { toast } = useToast();

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await api.get<PreferencesResponse>(`/preferences?${params}`);
      
      if (response.data.success) {
        setPreferences(response.data.data.preferences);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as preferências",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get<{ success: boolean; data: Stats }>(`/preferences/stats?${params}`);
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  useEffect(() => {
    fetchPreferences();
    fetchStats();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset para primeira página
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pendente' },
      approved: { variant: 'default' as const, label: 'Aprovada' },
      rejected: { variant: 'destructive' as const, label: 'Rejeitada' },
      expired: { variant: 'outline' as const, label: 'Expirada' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEnvironmentBadge = (environment: string) => {
    const variant = environment === 'PRODUCTION' ? 'default' : 'secondary';
    const label = environment === 'PRODUCTION' ? 'Produção' : 'Sandbox';
    return <Badge variant={variant}>{label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Preferências de Pagamento</h1>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Preferências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageAmount)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ambiente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Sandbox:</span>
                  <span className="font-bold">{stats.byEnvironment.sandbox}</span>
                </div>
                <div className="flex justify-between">
                  <span>Produção:</span>
                  <span className="font-bold">{stats.byEnvironment.production}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="ID, pedido, cliente..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovada</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="environment">Ambiente</Label>
              <Select value={filters.environment} onValueChange={(value) => handleFilterChange('environment', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os ambientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="SANDBOX">Sandbox</SelectItem>
                  <SelectItem value="PRODUCTION">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Preferências */}
      <Card>
        <CardHeader>
          <CardTitle>Preferências ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Preferência</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preferences.map((preference) => (
                    <TableRow key={preference.id}>
                      <TableCell className="font-mono text-sm">
                        {preference.preferenceId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{preference.orderNumber || preference.orderId.substring(0, 8)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{preference.payerName || preference.customerName}</div>
                          <div className="text-sm text-muted-foreground">{preference.payerEmail || preference.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(preference.totalAmount)}</TableCell>
                      <TableCell>{getStatusBadge(preference.status)}</TableCell>
                      <TableCell>{getEnvironmentBadge(preference.environment)}</TableCell>
                      <TableCell>{formatDate(preference.createdAt)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPreference(preference)}
                            >
                              Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Preferência</DialogTitle>
                            </DialogHeader>
                            {selectedPreference && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>ID da Preferência</Label>
                                    <p className="font-mono text-sm">{selectedPreference.preferenceId}</p>
                                  </div>
                                  <div>
                                    <Label>ID do Pedido</Label>
                                    <p className="font-mono text-sm">{selectedPreference.orderId}</p>
                                  </div>
                                  <div>
                                    <Label>Referência Externa</Label>
                                    <p>{selectedPreference.externalReference}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <div>{getStatusBadge(selectedPreference.status)}</div>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Dados do Pagador</Label>
                                  <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                      <Label className="text-sm">Nome</Label>
                                      <p>{selectedPreference.payerName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm">Email</Label>
                                      <p>{selectedPreference.payerEmail}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm">Telefone</Label>
                                      <p>{selectedPreference.payerPhone}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm">CPF</Label>
                                      <p>{selectedPreference.payerCpf}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>Itens</Label>
                                  <div className="mt-2 space-y-2">
                                    {selectedPreference.items.map((item, index) => (
                                      <div key={index} className="flex justify-between p-2 border rounded">
                                        <span>{item.title}</span>
                                        <span>{formatCurrency(item.unit_price)} x {item.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Valor Total</Label>
                                    <p className="text-lg font-bold">{formatCurrency(selectedPreference.totalAmount)}</p>
                                  </div>
                                  <div>
                                    <Label>Custo de Envio</Label>
                                    <p>{formatCurrency(selectedPreference.shippingCost)}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label>URLs</Label>
                                  <div className="space-y-2 mt-2">
                                    <div>
                                      <Label className="text-sm">URL de Pagamento</Label>
                                      <p className="text-sm break-all">{selectedPreference.paymentUrl}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm">URL de Notificação</Label>
                                      <p className="text-sm break-all">{selectedPreference.notificationUrl}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Expira</Label>
                                    <p>{selectedPreference.expires ? 'Sim' : 'Não'}</p>
                                  </div>
                                  <div>
                                    <Label>Data de Expiração</Label>
                                    <p>{selectedPreference.expirationDateTo ? formatDate(selectedPreference.expirationDateTo) : 'Não definida'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {pagination.pages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(pagination.page - 1)}
                        className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={page === pagination.page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(pagination.page + 1)}
                        className={pagination.page >= pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Preferences; 