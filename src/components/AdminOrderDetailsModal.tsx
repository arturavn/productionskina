import React, { useEffect, useState } from 'react';
import { useAdminOrderById } from '../hooks/useApi';

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
  number?: string;
  neighborhood?: string;
  fullAddress?: string;
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
  userName?: string;
  userEmail?: string;
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
  order: Order;
}

interface AdminOrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const AdminOrderDetailsModal: React.FC<AdminOrderDetailsModalProps> = ({ orderId, isOpen, onClose }) => {
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
  
  // Usar o hook específico para admin
  const { data: orderData, isLoading, error } = useAdminOrderById(activeOrderId || '');

  // Debug logs
  console.log('AdminOrderDetailsModal render:', { orderId, isOpen, activeOrderId, isLoading, error, orderData });
  console.log('AdminOrderDetailsModal - orderData structure:', orderData);
  console.log('AdminOrderDetailsModal - error details:', error);

  if (!isOpen || !orderId) return null;

  // Usar dados reais da API administrativa
  const order = (orderData as unknown as OrderResponse)?.order || null;

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
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const parseAddress = (addressData?: string | object): string | null => {
    if (!addressData) return null;
    
    console.log('parseAddress input:', addressData, typeof addressData);
    
    // Se já é um objeto, processa diretamente
     if (typeof addressData === 'object' && addressData !== null) {
       const addr = addressData as Address;
      
      if (addr.fullAddress && typeof addr.fullAddress === 'string') {
        return addr.fullAddress;
      }
      
      // Monta endereço a partir dos campos individuais
      const parts = [];
      if (addr.street && typeof addr.street === 'string') parts.push(addr.street);
      if (addr.number && typeof addr.number === 'string') parts.push(addr.number);
      if (addr.neighborhood && typeof addr.neighborhood === 'string') parts.push(addr.neighborhood);
      if (addr.city && typeof addr.city === 'string') parts.push(addr.city);
      if (addr.state && typeof addr.state === 'string') parts.push(addr.state);
      if (addr.zipCode && typeof addr.zipCode === 'string') parts.push(`CEP: ${addr.zipCode}`);
      
      return parts.length > 0 ? parts.join(', ') : 'Endereço incompleto';
    }
    
    // Se é string, tenta fazer parse como JSON
    if (typeof addressData === 'string') {
      try {
        const parsed = JSON.parse(addressData);
        
        // Se for um objeto, monta o endereço
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed.fullAddress && typeof parsed.fullAddress === 'string') {
            return parsed.fullAddress;
          }
          
          // Monta endereço a partir dos campos individuais
          const parts = [];
          if (parsed.street && typeof parsed.street === 'string') parts.push(parsed.street);
          if (parsed.number && typeof parsed.number === 'string') parts.push(parsed.number);
          if (parsed.neighborhood && typeof parsed.neighborhood === 'string') parts.push(parsed.neighborhood);
          if (parsed.city && typeof parsed.city === 'string') parts.push(parsed.city);
          if (parsed.state && typeof parsed.state === 'string') parts.push(parsed.state);
          if (parsed.zipCode && typeof parsed.zipCode === 'string') parts.push(`CEP: ${parsed.zipCode}`);
          
          return parts.length > 0 ? parts.join(', ') : 'Endereço incompleto';
        }
        
        // Garante que sempre retorna uma string
        return String(parsed);
      } catch {
        // Se não for JSON, trata como string simples
        return String(addressData);
      }
    }
    
    // Fallback para qualquer outro tipo
    return String(addressData);
  };

  const renderAddress = (addressData: string | null) => {
    return addressData || 'Não informado';
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
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalhes do Pedido - Admin
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando detalhes do pedido...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 font-medium">Erro ao carregar pedido</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
          )}

          {!isLoading && !error && !order && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                Não foi possível carregar os detalhes do pedido
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                Verifique se o pedido existe e tente novamente.
              </p>
            </div>
          )}

          {order && (
            <div className="space-y-6">
              {/* Informações básicas do pedido */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Número do Pedido</h3>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{order.orderNumber}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Data do Pedido</h3>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(order.createdAt)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total</h3>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                </div>
              </div>

              {/* Informações de pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Método de Pagamento</h3>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{order.paymentMethod}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status do Pagamento</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Código de Rastreio */}
              {order.trackingCode && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Código de Rastreio</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-700 dark:text-blue-300">Código:</span>
                    <span className="font-mono text-lg font-semibold text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded">
                      {order.trackingCode}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    Use este código para rastrear o pedido no site dos Correios ou transportadora.
                  </p>
                </div>
              )}

              {/* Informações da Transportadora */}
              {order.shippingMethod && (() => {
                const shippingMethod = parseShippingMethod(order.shippingMethod);
                return shippingMethod ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">Informações da Transportadora</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shippingMethod.company && (
                        <div>
                          <span className="text-sm text-green-700 dark:text-green-300 font-medium">Transportadora:</span>
                          <p className="text-green-900 dark:text-green-100">{shippingMethod.company}</p>
                        </div>
                      )}
                      {shippingMethod.name && (
                        <div>
                          <span className="text-sm text-green-700 dark:text-green-300 font-medium">Serviço:</span>
                          <p className="text-green-900 dark:text-green-100">{shippingMethod.name}</p>
                        </div>
                      )}
                      {shippingMethod.deliveryTime && (
                        <div>
                          <span className="text-sm text-green-700 dark:text-green-300 font-medium">Prazo de Entrega:</span>
                          <p className="text-green-900 dark:text-green-100">{shippingMethod.deliveryTime}</p>
                        </div>
                      )}
                      {shippingMethod.price && (
                        <div>
                          <span className="text-sm text-green-700 dark:text-green-300 font-medium">Valor do Frete:</span>
                          <p className="text-green-900 dark:text-green-100">{formatCurrency(shippingMethod.price)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Informações do cliente */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.customerName && order.customerLastName 
                        ? `${order.customerName} ${order.customerLastName}`
                        : order.userName || 'Não informado'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.customerEmail || order.userEmail || 'Não informado'}
                    </p>
                  </div>
                  {order.customerPhone && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{order.customerPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereços */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Endereço de Entrega</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {renderAddress(parseAddress(order.shippingAddress))}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Endereço de Cobrança</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {renderAddress(parseAddress(order.billingAddress))}
                  </p>
                </div>
              </div>

              {/* Itens do pedido */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Itens do Pedido</h3>
                {order.items && order.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-100 dark:bg-gray-600">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Produto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Preço Unitário
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {order.items.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {item.productName || 'Produto não identificado'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {formatCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Nenhum item encontrado para este pedido.</p>
                )}
              </div>

              {/* Resumo financeiro */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumo Financeiro</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.shippingCost && order.shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Frete:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(order.shippingCost)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {order.notes && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Observações</h3>
                  <p className="text-gray-700 dark:text-gray-300">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailsModal;