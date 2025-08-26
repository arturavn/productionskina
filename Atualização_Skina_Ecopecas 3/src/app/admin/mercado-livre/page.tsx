import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MercadoLivreDashboardCard from '@/components/MercadoLivreDashboardCard';
import MercadoLivreSyncConfig from '@/components/MercadoLivreSyncConfig';
import MercadoLivreProductsList from '@/components/MercadoLivreProductsList';
import MercadoLivreMLProducts from '@/components/MercadoLivreMLProducts';
import MercadoLivreSyncJobs from '@/components/MercadoLivreSyncJobs';

export default function MercadoLivreAdminPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Implementar logout
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={handleBackToAdmin}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold font-montserrat">
                <span className="text-skina-blue">SKINA</span> <span className="text-skina-green">ECOPEÇAS</span>
              </h1>
              <Badge variant="secondary" className="ml-3">Admin</Badge>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mercado Livre</h1>
            <p className="text-muted-foreground">
              Gerencie a integração e sincronização com o Mercado Livre
            </p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="produtos">Produtos Importados</TabsTrigger>
            <TabsTrigger value="ml-produtos">Produtos do Mercado Livre</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <MercadoLivreDashboardCard />
          </TabsContent>

          <TabsContent value="produtos">
            <MercadoLivreProductsList />
          </TabsContent>

          <TabsContent value="ml-produtos">
            <MercadoLivreMLProducts />
          </TabsContent>

          <TabsContent value="jobs">
            <MercadoLivreSyncJobs />
          </TabsContent>

          <TabsContent value="configuracoes">
            <MercadoLivreSyncConfig />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
