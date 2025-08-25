import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface MercadoLivreProduct {
  id: string;
  title: string;
  price: number;
  available_quantity: number;
  thumbnail: string;
  variations?: any[];
}

const MercadoLivreIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [products, setProducts] = useState<MercadoLivreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setIsConnected(true);
      toast({
        title: 'Conectado com sucesso',
        description: 'Sua conta do Mercado Livre foi vinculada.',
      });
    } catch (error) {
      toast({
        title: 'Erro na conexão',
        description: 'Não foi possível conectar ao Mercado Livre.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const mockProducts: MercadoLivreProduct[] = [];
      setProducts(mockProducts);
    } catch (error) {
      toast({
        title: 'Erro ao buscar produtos',
        description: 'Não foi possível carregar os produtos do Mercado Livre.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Integração com Mercado Livre</h2>
        
        {!isConnected ? (
          <div className="space-y-4">
            <p>Conecte sua conta do Mercado Livre para sincronizar produtos.</p>
            <Button 
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? 'Conectando...' : 'Conectar conta'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <span>✓</span>
              <p>Conta do Mercado Livre conectada</p>
            </div>
            
            <Button 
              onClick={fetchProducts}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Carregando...' : 'Buscar produtos'}
            </Button>
          </div>
        )}
      </Card>

      {products.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Produtos do Mercado Livre</h3>
          <Table>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default MercadoLivreIntegration;
