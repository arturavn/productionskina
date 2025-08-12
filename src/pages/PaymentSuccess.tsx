import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, Home, Mail, ShoppingBag, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useClearCart, useCartSession } from '@/hooks/useApi';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PaymentInfo {
  id: string;
  status: string;
  external_reference: string;
  transaction_amount: number;
  date_created: string;
  payment_method: {
    id: string;
    type: string;
  };
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  userName: string;
  userEmail: string;
  mercadoPagoPaymentMethod?: string;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionId } = useCartSession();
  const clearCartMutation = useClearCart();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    let cleared = false;
    const fetchData = async () => {
      if (!paymentId || !externalReference) {
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          console.log('❌ Usuário não autenticado');
          setAuthError(true);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Buscar dados do pagamento
        try {
          const paymentResponse = await fetch(`${import.meta.env.VITE_API_URL}/payments/${paymentId}`, { headers });
          
          if (paymentResponse.status === 401) {
            console.log('❌ Token inválido ou expirado');
            setAuthError(true);
            setIsLoading(false);
            return;
          }

          if (paymentResponse.status === 403) {
            console.log('❌ Usuário não tem permissão para acessar este pagamento');
            setAuthError(true);
            setIsLoading(false);
            return;
          }

          const paymentData = await paymentResponse.json();
          if (paymentData.success) {
            setPaymentInfo(paymentData.payment);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do pagamento:', error);
        }

        // Buscar dados do pedido
        try {
          const orderResponse = await fetch(`${import.meta.env.VITE_API_URL}/orders/external/${externalReference}`, { headers });
          
          if (orderResponse.status === 401) {
            console.log('❌ Token inválido ou expirado');
            setAuthError(true);
            setIsLoading(false);
            return;
          }

          if (orderResponse.status === 403) {
            console.log('❌ Usuário não tem permissão para acessar este pedido');
            setAuthError(true);
            setIsLoading(false);
            return;
          }

          const orderData = await orderResponse.json();
          if (orderData.success) {
            setOrderData(orderData.order);
            // Limpar carrinho apenas se o pagamento foi aprovado e ainda não limpou
            if (paymentInfo?.status === 'approved' && !cleared) {
              clearCartMutation.mutate(sessionId);
              cleared = true;
              toast.success('Pedido confirmado! Carrinho limpo automaticamente.');
            }
          } else {
            console.error('Erro ao buscar dados do pedido:', orderData.message);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do pedido:', error);
        }

      } catch (error) {
        console.error('Erro ao buscar informações:', error);
        toast.error('Erro ao carregar informações do pedido');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, externalReference, sessionId]);

  const getStatusMessage = () => {
    if (status === 'approved' || paymentInfo?.status === 'approved') {
      return {
        title: 'Pagamento Aprovado!',
        message: 'Seu pedido foi confirmado e será processado em breve.',
        icon: <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />,
        color: 'text-green-600'
      };
    }
    
    return {
      title: 'Pagamento em Processamento',
      message: 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.',
      icon: <Package className="w-16 h-16 text-blue-500 mx-auto" />,
      color: 'text-blue-600'
    };
  };

  const statusInfo = getStatusMessage();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Se não estiver autenticado, mostrar mensagem de erro
  if (authError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-32">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <CardTitle className="text-2xl font-bold text-red-600 mt-4">
                Acesso Negado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600 text-lg">
                Para visualizar os detalhes do seu pedido, você precisa estar logado.
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full bg-skina-green hover:bg-skina-green/90"
                  size="lg"
                >
                  Fazer Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Button>
              </div>

             
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-32">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Carregando Confirmação...
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Aguarde enquanto carregamos os detalhes do seu pedido.
            </p>
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-32">
        <Card className="text-center">
          <CardHeader className="pb-4">
            {statusInfo.icon}
            <CardTitle className={`text-2xl font-bold ${statusInfo.color} mt-4`}>
              {statusInfo.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600 text-lg">
              {statusInfo.message}
            </p>

            {/* Dados do Pedido */}
            {orderData && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Detalhes do Pedido
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Número do Pedido:</span>
                    <p className="text-gray-800 dark:text-white font-mono">{orderData.orderNumber}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">ID do Pedido:</span>
                    <p className="text-gray-800 dark:text-white font-mono">{orderData.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Data do Pedido:</span>
                    <p className="text-gray-800 dark:text-white">{formatDate(orderData.createdAt)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Status do Pedido:</span>
                    <p className="text-gray-800 dark:text-white capitalize">{orderData.status}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Método de Pagamento:</span>
                    <p className="text-gray-800 dark:text-white capitalize">{orderData.mercadoPagoPaymentMethod || 'Mercado Pago'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Valor Pago:</span>
                    <p className="text-gray-800 dark:text-white font-mono">{paymentInfo ? formatCurrency(paymentInfo.transaction_amount) : 'R$ 0,00'}</p>
                  </div>
                </div>

                {/* Itens do Pedido */}
                {orderData.items && orderData.items.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3">Itens do Pedido:</h4>
                    <div className="space-y-2">
                      {orderData.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-600 rounded border">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-500 rounded mr-3 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">{item.productName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-300">Qtd: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-800 dark:text-white">{formatCurrency(item.totalPrice)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-300">{formatCurrency(item.unitPrice)} cada</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo Financeiro */}
                <div className="mt-6 p-4 bg-white dark:bg-gray-600 rounded border">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Resumo Financeiro
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                      <span className="text-gray-800 dark:text-white">{formatCurrency(orderData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Frete:</span>
                      <span className="text-gray-800 dark:text-white">{formatCurrency(orderData.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span className="text-gray-800 dark:text-white">Total:</span>
                      <span className="text-green-600 dark:text-green-400">{formatCurrency(orderData.total)}</span>
                    </div>
                  </div>
                </div>
                    </div>
                  )}

            {/* Dados do Pagamento */}

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/perfil')}
                className="w-full bg-skina-green hover:bg-skina-green/90"
                size="lg"
              >
                <Package className="mr-2 h-4 w-4" />
                Ver Meus Pedidos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </div>

           
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}