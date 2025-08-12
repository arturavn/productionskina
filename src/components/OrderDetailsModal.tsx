import React, { useEffect, useState } from 'react';
import { useOrderById } from '../hooks/useApi';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface ShippingMethod {
  name?: string;
  company?: string;
  price?: number;
  deliveryTime?: string;
  serviceId?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost?: number;
  createdAt: string;
  userName?: string; // Mantido para compatibilidade
  userEmail?: string; // Mantido para compatibilidade
  customerName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress?: string;
  billingAddress?: string;
  items?: OrderItem[];
  notes?: string;
  trackingCode?: string;
  shippingMethod?: ShippingMethod;
}

interface OrderResponse {
  success: boolean;
  data: {
    order: Order;
  };
}

interface OrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ orderId, isOpen, onClose }) => {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  
  // Só atualiza o activeOrderId quando o modal está aberto e há um orderId válido
  useEffect(() => {
    if (isOpen && orderId) {
      setActiveOrderId(orderId);
    } else if (!isOpen) {
      // Mantém o activeOrderId quando o modal fecha para evitar piscar
      // setActiveOrderId(null);
    }
  }, [isOpen, orderId]);
  
  const { data: orderData, isLoading, error } = useOrderById(activeOrderId || '');

  // Debug logs
  console.log('OrderDetailsModal render:', { orderId, isOpen, activeOrderId, isLoading, error, orderData });
  console.log('OrderDetailsModal - orderData structure:', orderData);
  console.log('OrderDetailsModal - error details:', error);

  if (!isOpen || !orderId) return null;

  // Usar apenas dados reais da API
  const order = (orderData as unknown as OrderResponse)?.data?.order || null;

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

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return texts[status as keyof typeof texts] || status;
  };

  // Função para fazer parse seguro de endereços
  const parseAddress = (address: string | object | null | undefined): Address | null => {
    if (!address) return null;
    
    // Se já é um objeto, retorna diretamente
    if (typeof address === 'object') {
      return address;
    }
    
    // Se é uma string, tenta fazer parse
    if (typeof address === 'string') {
      try {
        return JSON.parse(address);
      } catch (error) {
        console.error('Erro ao fazer parse do endereço:', error);
        return null;
      }
    }
    
    return null;
  };

  // Função para fazer parse seguro das informações da transportadora
  const parseShippingMethod = (shippingMethod: string | object | null | undefined): ShippingMethod | null => {
    if (!shippingMethod) return null;
    
    // Se já é um objeto, retorna diretamente
    if (typeof shippingMethod === 'object') {
      return shippingMethod;
    }
    
    // Se é uma string, tenta fazer parse
    if (typeof shippingMethod === 'string') {
      try {
        return JSON.parse(shippingMethod);
      } catch (error) {
        console.error('Erro ao fazer parse das informações da transportadora:', error);
        return null;
      }
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Detalhes do Pedido</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>



          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-600">Erro ao carregar detalhes do pedido: {JSON.stringify(error)}</p>
            </div>
          )}

          {!isLoading && !order && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-yellow-600">Não foi possível carregar os detalhes do pedido.</p>
            </div>
          )}

          {order && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Informações do Pedido</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Número:</span> {order.orderNumber}</p>
                    <p><span className="font-medium">Data:</span> {formatDate(order.createdAt)}</p>
                    <p>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </p>
                    <p><span className="font-medium">Método de Pagamento:</span> {order.paymentMethod}</p>
                    <p><span className="font-medium">Status do Pagamento:</span> {order.paymentStatus}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Informações do Cliente</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Nome:</span> {order.customerName || order.userName || 'Não informado'}</p>
                    <p><span className="font-medium">Email:</span> {order.customerEmail || order.userEmail || 'Não informado'}</p>
                    {order.customerPhone && (
                      <p><span className="font-medium">Telefone:</span> {order.customerPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Código de Rastreio */}
              {order.trackingCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Código de Rastreio</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-700">Código:</span>
                    <span className="font-mono text-lg font-semibold text-blue-900 bg-blue-100 px-3 py-1 rounded">
                      {order.trackingCode}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">
                    Use este código para rastrear seu pedido no site dos Correios ou transportadora.
                  </p>
                </div>
              )}

              {/* Informações da Transportadora */}
              {order.shippingMethod && (() => {
                const shippingMethod = parseShippingMethod(order.shippingMethod);
                return shippingMethod ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">Informações da Transportadora</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shippingMethod.company && (
                        <div>
                          <span className="text-sm text-green-700 font-medium">Transportadora:</span>
                          <p className="text-green-900">{shippingMethod.company}</p>
                        </div>
                      )}
                      {shippingMethod.name && (
                        <div>
                          <span className="text-sm text-green-700 font-medium">Serviço:</span>
                          <p className="text-green-900">{shippingMethod.name}</p>
                        </div>
                      )}
                      {shippingMethod.deliveryTime && (
                        <div>
                          <span className="text-sm text-green-700 font-medium">Prazo de Entrega:</span>
                          <p className="text-green-900">{shippingMethod.deliveryTime}</p>
                        </div>
                      )}
                      {shippingMethod.price && (
                        <div>
                          <span className="text-sm text-green-700 font-medium">Valor do Frete:</span>
                          <p className="text-green-900">{formatCurrency(shippingMethod.price)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Endereços */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {order.shippingAddress && (() => {
                  const shippingAddr = parseAddress(order.shippingAddress);
                  return shippingAddr ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Endereço de Entrega</h3>
                      <div className="text-sm text-gray-600">
                        <p>{shippingAddr.street}</p>
                        <p>{shippingAddr.city}, {shippingAddr.state}</p>
                        <p>CEP: {shippingAddr.zipCode}</p>
                      </div>
                    </div>
                  ) : null;
                })()}

                {order.billingAddress && (() => {
                  const billingAddr = parseAddress(order.billingAddress);
                  return billingAddr ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">Endereço de Cobrança</h3>
                      <div className="text-sm text-gray-600">
                        <p>{billingAddr.street}</p>
                        <p>{billingAddr.city}, {billingAddr.state}</p>
                        <p>CEP: {billingAddr.zipCode}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Itens do Pedido */}
              {order.items && order.items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Itens do Pedido</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Produto</th>
                          <th className="text-center py-2">Quantidade</th>
                          <th className="text-right py-2">Preço Unit.</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item: OrderItem, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{item.productName}</td>
                            <td className="text-center py-2">{item.quantity}</td>
                            <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                            <td className="text-right py-2">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resumo Financeiro */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Resumo Financeiro</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete:</span>
                    <span>{formatCurrency(order.shippingCost || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {order.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Observações</h3>
                  <p className="text-gray-600">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;