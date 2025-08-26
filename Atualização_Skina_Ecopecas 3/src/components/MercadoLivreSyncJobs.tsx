import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface SyncJob {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'partial';
  total: number;
  processed: number;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  created_at: string;
  progress: string;
  isRunning: boolean;
  isCompleted: boolean;
}

const MercadoLivreSyncJobs: React.FC = () => {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [jobsPerPage] = useState(50); 
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
    
    // Atualizar a cada 10 segundos se houver jobs rodando
    const interval = setInterval(() => {
      const hasRunningJobs = jobs.some(job => job.isRunning);
      if (hasRunningJobs) {
        loadJobs();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentPage]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const response = await api.getMercadoLivreSyncJobs({
        limit: jobsPerPage,
        offset: currentPage * jobsPerPage
      });
      
      if (response.success) {
       
        
        setJobs(response.jobs);
        setTotalJobs(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar jobs:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar jobs de sincronização',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshJobs = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalJobs / jobsPerPage);
  
  

  const getStatusBadge = (status: string) => {
    const variants = {
      'queued': 'secondary',
      'running': 'default',
      'success': 'default',
      'failed': 'destructive',
      'partial': 'secondary'
    } as const;

    const labels = {
      'queued': 'Na Fila',
      'running': 'Executando',
      'success': 'Concluído',
      'failed': 'Falhou',
      'partial': 'Parcial'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'delta': 'Sincronização Delta',
      'full_import': 'Importação Completa',
      'single_item': 'Item Individual'
    };

    return labels[type] || type;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDuration = (startedAt: string | null, finishedAt: string | null) => {
    if (!startedAt) return 'N/A';
    
    const start = new Date(startedAt);
    const end = finishedAt ? new Date(finishedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getProgressPercentage = (processed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((processed / total) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Jobs de Sincronização</CardTitle>
              <CardDescription>
                Monitore o progresso das sincronizações em andamento
              </CardDescription>
            </div>
            <Button
              onClick={refreshJobs}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Totalizadores no início */}
          {jobs.length > 0 && (
            <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {totalJobs}
                </div>
                <div className="text-sm text-muted-foreground">Total de Jobs</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {jobs.filter(j => j.status === 'running').length}
                </div>
                <div className="text-sm text-muted-foreground">Executando</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {jobs.filter(j => j.status === 'success').length}
                </div>
                <div className="text-sm text-muted-foreground">Concluídos</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {jobs.filter(j => j.status === 'failed').length}
                </div>
                <div className="text-sm text-muted-foreground">Falharam</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {jobs.filter(j => j.status === 'partial').length}
                </div>
                <div className="text-sm text-muted-foreground">Parciais</div>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Progresso</TableHead>
                  <TableHead className="text-center">Processados</TableHead>
                  <TableHead className="text-center">Duração</TableHead>
                  <TableHead className="text-center">Iniciado</TableHead>
                  <TableHead className="text-center">Concluído</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando jobs...
                    </TableCell>
                  </TableRow>
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nenhum job encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="font-medium">{getTypeLabel(job.type)}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {job.id.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(job.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-2">
                          <Progress 
                            value={getProgressPercentage(job.processed, job.total)} 
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground">
                            {job.progress}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {job.processed} / {job.total || '?'}
                        </div>
                        {job.total > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {getProgressPercentage(job.processed, job.total)}%
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {formatDuration(job.started_at, job.finished_at)}
                        </div>
                        {job.isRunning && (
                          <div className="text-xs text-blue-600">
                            Em execução...
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {formatDate(job.started_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          {formatDate(job.finished_at)}
                        </div>
                        {job.error && (
                          <div className="text-xs text-red-600 mt-1">
                            Erro: {job.error}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {currentPage * jobsPerPage + 1} a {Math.min((currentPage + 1) * jobsPerPage, totalJobs)} de {totalJobs} jobs
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Anterior
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MercadoLivreSyncJobs;
