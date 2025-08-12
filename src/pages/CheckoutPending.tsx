import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PaymentStatus {
  status: string;
  payment_id: string;
  external_reference: string;
  transaction_amount: number;
}

export default function CheckoutPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Remover o autoCheckInterval e polling automático
  // const [autoCheckInterval, setAutoCheckInterval] = useState<NodeJS.Timeout | null>(null);

  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');
  const collectionStatus = searchParams.get('collection_status');

    // Função para verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!paymentId) {
      setLoading(false);
      return;
    }

    try {
      // Verificar status na URL primeiro (mais rápido)
      if (collectionStatus === 'approved') {
        console.log('✅ Status approved na URL, redirecionando para success');
        navigate(`/payment-success?payment_id=${paymentId}&external_reference=${externalReference}`);
        return;
      }

      if (collectionStatus === 'rejected') {
        console.log('❌ Status rejected na URL, redirecionando para failure');
        navigate(`/payment-failure?payment_id=${paymentId}&external_reference=${externalReference}`);
        return;
      }

      // Se status é pending, verificar no backend
      console.log('Status pending, verificando no backend...');
      
      // Buscar status atual do pagamento no backend
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setPaymentStatus(data.payment);
        
        console.log('📊 Status do backend:', data.payment.status);
        
        // Redirecionar baseado no status real
        if (data.payment.status === 'approved') {
          console.log('Pagamento aprovado, redirecionando para success');
          // Limpar intervalo se existir
          // if (autoCheckInterval) {
          //   clearInterval(autoCheckInterval);
          //   setAutoCheckInterval(null);
          // }
          navigate(`/payment-success?payment_id=${paymentId}&external_reference=${externalReference}`);
          return;
        } else if (data.payment.status === 'rejected' || data.payment.status === 'cancelled') {
          console.log('❌ Pagamento rejeitado, redirecionando para failure');
          // Limpar intervalo se existir
          // if (autoCheckInterval) {
          //   clearInterval(autoCheckInterval);
          //   setAutoCheckInterval(null);
          // }
          navigate(`/payment-failure?payment_id=${paymentId}&external_reference=${externalReference}`);
          return;
        } else {
          console.log('Pagamento ainda pendente, mantendo na tela de pending');
          
          // Iniciar verificação automática a cada 5 segundos
          // if (!autoCheckInterval) {
          //   const interval = setInterval(() => {
          //     console.log('🔄 Verificação automática do status do pagamento...');
          //     checkPaymentStatus();
          //   }, 5000);
          //   setAutoCheckInterval(interval);
          // }
        }
      } else {
        console.log('⚠️ Erro ao buscar status:', data.message);
        setError(data.message || 'Erro ao verificar status do pagamento');
      }
    } catch (err) {
      console.error('❌ Erro ao verificar pagamento:', err);
      setError('Erro ao verificar status do pagamento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPaymentStatus();
    
    // Limpar intervalo quando componente for desmontado
    // return () => {
    //   if (autoCheckInterval) {
    //     clearInterval(autoCheckInterval);
    //   }
    // };
  }, [paymentId, collectionStatus, externalReference, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container max-w-4xl mx-auto px-4 py-32">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <Clock className="h-6 w-6 text-yellow-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verificando Pagamento...
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Aguarde enquanto verificamos o status do seu pagamento.
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pagamento em Processamento
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Seu pagamento está sendo processado pelo Mercado Pago. Você será redirecionado automaticamente assim que o pagamento for confirmado.
          </p>
          
          {/* Remover todo o código relacionado ao setInterval e autoCheckInterval dentro de checkPaymentStatus */}
          {/* Mensagem de dica: */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
               <strong>Dica:</strong> Se você não for redirecionado automaticamente, clique em "Verificar Novamente" ou atualize a página manualmente.
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm mt-2">
              <strong>Tempo estimado:</strong> O processamento pode levar alguns minutos, dependendo do método de pagamento escolhido.
            </p>
          </div>

          {paymentStatus && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                Detalhes do Pagamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">ID do Pagamento:</span>
                  <p className="text-gray-800 dark:text-white">{paymentStatus.payment_id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Status:</span>
                  <p className="text-gray-800 dark:text-white capitalize">{paymentStatus.status}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-300">Valor:</span>
                  <p className="text-gray-800 dark:text-white">
                    R$ {paymentStatus.transaction_amount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                {externalReference && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Referência:</span>
                    <p className="text-gray-800 dark:text-white">{externalReference}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button 
              onClick={() => {
                setLoading(true);
                setError(null);
                checkPaymentStatus();
              }}
              variant="outline"
              disabled={loading}
              className="px-8 py-2"
            >
              {loading ? 'Verificando...' : 'Verificar Novamente'}
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
