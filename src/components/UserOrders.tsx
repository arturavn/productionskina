import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Package, Calendar, CreditCard, Eye } from 'lucide-react';
import { useOrders, useOrderById } from '../hooks/useApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  paymentStatus?: string;
  paymentMethod?: string;
}

interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal?: number;
  shippingCost?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  customerName?: string;
  customerEmail?: string;
}

const UserOrders: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  const { data: ordersData, isLoading, error } = useOrders({ 
    page: currentPage, 
    limit: 10 
  });
  
  const { data: orderDetailsData, isLoading: isLoadingDetails } = useOrderById(
    selectedOrderId || ''
  );

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
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setSelectedOrderId(null);
    setIsOrderModalOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando pedidos...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600 dark:text-red-400">
            <p>Erro ao carregar pedidos. Tente novamente mais tarde.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // A API pode retornar dados em diferentes estruturas
  // Verificar se os dados estão em ordersData.data.orders ou diretamente em ordersData.orders
  let orders = [];
  let pagination = null;
  
  if (ordersData) {
    // Estrutura: { success: true, data: { orders: [...], pagination: {...} } }
    if (ordersData.data && ordersData.data.orders) {
      orders = ordersData.data.orders;
      pagination = ordersData.data.pagination;
    }
    // Estrutura: { orders: [...], pagination: {...} }
    else if (ordersData.orders) {
      orders = ordersData.orders;
      pagination = ordersData.pagination;
    }
    // Estrutura: [order1, order2, ...] (array direto)
    else if (Array.isArray(ordersData)) {
      orders = ordersData;
    }
  }
  
  // Debug temporário
  console.log('🔍 UserOrders Debug:');
  console.log('- ordersData completo:', ordersData);
  console.log('- orders extraídos:', orders);
  console.log('- orders.length:', orders.length);
  console.log('- pagination:', pagination);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Meus Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Você ainda não fez nenhum pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">Pedido #{order.orderNumber}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {formatCurrency(order.total)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Página {pagination.currentPage} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {orderDetailsData?.data?.order ? 
                `Detalhes do Pedido #${orderDetailsData.data.order.orderNumber}` : 
                'Carregando...'
              }
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando detalhes...</span>
            </div>
          ) : orderDetailsData?.data?.order ? (
            <div className="space-y-6">
              {(() => {
                const order = orderDetailsData.data.order as OrderDetails;
                return (
                  <>
                    {/* Informações Gerais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Informações do Pedido</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Número:</strong> #{order.orderNumber}</p>
                          <p><strong>Status:</strong> 
                            <Badge className={`ml-2 ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </Badge>
                          </p>
                          <p><strong>Data:</strong> {formatDate(order.createdAt)}</p>
                          <p><strong>Pagamento:</strong> {order.paymentMethod || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Resumo Financeiro</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Subtotal:</strong> {formatCurrency(order.subtotal)}</p>
                          <p><strong>Frete:</strong> {formatCurrency(order.shippingCost)}</p>
                          <p className="text-lg font-semibold">
                            <strong>Total:</strong> {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    <div>
                      <h4 className="font-semibold mb-4">Itens do Pedido</h4>
                      <div className="space-y-3">
                        {order.items?.map((item: OrderItem) => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {item.productImage && (
                                <img 
                                  src={item.productImage} 
                                  alt={item.productName}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Quantidade: {item.quantity} × {formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">
                Erro ao carregar detalhes do pedido.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserOrders;