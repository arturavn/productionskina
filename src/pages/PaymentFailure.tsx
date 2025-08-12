import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home, HelpCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PaymentInfo {
  id: string;
  status: string;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  statusDetail: string;
  mercadoPagoPaymentUrl: string;
  total: number;
  createdAt: string;
}

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
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
          }
        } catch (error) {
          console.error('Erro ao buscar dados do pedido:', error);
        }

        // Buscar link de pagamento
        try {
          const paymentUrlResponse = await fetch(`${import.meta.env.VITE_API_URL}/orders/${externalReference}/payment-url`, { headers });
          
          if (paymentUrlResponse.status === 401) {
            console.log('❌ Token inválido ou expirado');
            setAuthError(true);
            setIsLoading(false);
            return;
          }

          if (paymentUrlResponse.status === 403) {
            console.log('❌ Usuário não tem permissão para acessar link de pagamento');
            setAuthError(true);
            setIsLoading(false);
            return;
          }

          const paymentUrlData = await paymentUrlResponse.json();
          if (paymentUrlData.success) {
            setPaymentUrl(paymentUrlData.paymentUrl);
          } else if (paymentUrlResponse.status === 404) {
            console.log('❌ Link de pagamento não disponível');
            setPaymentUrl(null);
          }
        } catch (error) {
          console.error('Erro ao buscar link de pagamento:', error);
          setPaymentUrl(null);
        }

      } catch (error) {
        console.error('Erro ao buscar informações:', error);
        toast.error('Erro ao carregar informações do pagamento');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [paymentId, externalReference]);

  // Mapeamento dos códigos para significados amigáveis
  const statusDetailMeanings: Record<string, string> = {
    cc_rejected_bad_filled_card_number: 'Número do cartão inválido ou mal preenchido.',
    cc_rejected_bad_filled_date: 'Data de vencimento inválida ou mal preenchida.',
    cc_rejected_bad_filled_other: 'Dados adicionais inválidos ou mal preenchidos.',
    cc_rejected_bad_filled_security_code: 'Código de segurança inválido (CVV incorreto).',
    cc_rejected_blacklist: 'O cartão ou o CPF está na blacklist do Mercado Pago.',
    cc_rejected_call_for_authorize: 'O banco exige que o titular autorize a compra.',
    cc_rejected_card_disabled: 'Cartão está inativo ou bloqueado.',
    cc_rejected_card_error: 'Erro ao processar o cartão.',
    cc_rejected_duplicated_payment: 'O pagamento é duplicado. Já foi feito um pagamento idêntico recentemente.',
    cc_rejected_high_risk: 'Pagamento recusado por alto risco de fraude.',
    cc_rejected_insufficient_amount: 'Saldo ou limite insuficiente.',
    cc_rejected_invalid_installments: 'Parcelamento inválido para o cartão ou valor.',
    cc_rejected_max_attempts: 'Número máximo de tentativas excedido.',
    cc_rejected_other_reason: 'Outra razão genérica (não especificada).'
  };

  function getStatusDetailMeaning(code?: string) {
    if (!code) return null;
    return statusDetailMeanings[code] || code;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleTryAgain = () => {
    if (paymentUrl) {
      // Abrir o link de pagamento em uma nova aba
      window.open(paymentUrl, '_blank');
    } else {
      // Mostrar mensagem de que o link não está disponível
      toast.error('Link para pagamento não está mais disponível');
    }
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
                Para visualizar os detalhes do seu pagamento, você precisa estar logado.
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full bg-skina-green hover:bg-skina-green/90"
                  size="lg"
                >
                  Fazer Login
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
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <XCircle className="h-6 w-6 text-red-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Carregando Informações...
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Aguarde enquanto carregamos os detalhes do pagamento.
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
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <CardTitle className="text-2xl font-bold text-red-600 mt-4">
              Pagamento Não Aprovado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-gray-600 text-lg">
                Infelizmente, não foi possível processar seu pagamento.
              </p>
              {paymentInfo && (
                <p className="text-red-600 font-medium">
                  Motivo: {getStatusDetailMeaning(orderData.statusDetail)}
                </p>
              )}
            </div>

            {/* Dados do Pedido */}
            {orderData && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                  Detalhes do Pedido
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Número do Pedido:</span>
                    <p className="text-gray-800 dark:text-white font-mono">{orderData.orderNumber}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Valor Total:</span>
                    <p className="text-gray-800 dark:text-white">{formatCurrency(orderData.total)}</p>
                  </div>
                  {orderData.statusDetail && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600 dark:text-gray-300">Motivo Rejeição:</span>
                      <p className="text-red-700 dark:text-red-300 font-semibold">{getStatusDetailMeaning(orderData.statusDetail)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dados do Pagamento */}
            {paymentInfo && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-3">Detalhes da Transação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-red-700 dark:text-red-300">ID do Pagamento:</span>
                    <p className="text-red-800 dark:text-red-200">{paymentInfo.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-red-700 dark:text-red-300">Status:</span>
                    <p className="text-red-800 dark:text-red-200 capitalize">{paymentInfo.status}</p>
                  </div>
                  <div>
                    <span className="font-medium text-red-700 dark:text-red-300">Valor:</span>
                    <p className="text-red-800 dark:text-red-200">{formatCurrency(paymentInfo.transaction_amount)}</p>
                  </div>
                  {externalReference && (
                    <div>
                      <span className="font-medium text-red-700 dark:text-red-300">Referência:</span>
                      <p className="text-red-800 dark:text-red-200">{externalReference}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">O que fazer agora?</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Verifique os dados do seu cartão</li>
                    <li>• Certifique-se de que há saldo suficiente</li>
                    <li>• Tente usar outro cartão ou método de pagamento</li>
                    <li>• Entre em contato com seu banco se necessário</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleTryAgain}
                className="w-full bg-skina-green hover:bg-skina-green/90"
                size="lg"
                disabled={!paymentUrl}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {paymentUrl ? 'Tentar Novamente' : 'Link Indisponível'}
              </Button>
              
              {!paymentUrl && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
                     <strong>Atenção:</strong> O link para pagamento não está mais disponível. 
                    Refaça seu pedido.
                  </p>
                </div>
              )}
              
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