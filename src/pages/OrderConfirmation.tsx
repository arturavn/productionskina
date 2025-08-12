import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  CreditCard, 
  MapPin, 
  Clock,
  Download,
  Mail,
  Home
} from 'lucide-react';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  
  // Dados simulados do pedido - em produção viriam da API
  const orderData = {
    id: 'PED-2024-001234',
    date: new Date().toLocaleDateString('pt-BR'),
    status: 'confirmed',
    subtotal: 249.90,
    shippingCost: 50.00,
    total: 299.90,
    paymentMethod: 'Cartão de Crédito',
    shippingMethod: 'Frete Calculado',
    estimatedDelivery: 'Conforme selecionado',
    items: [
      {
        id: '1',
        name: 'Motor Completo Volkswagen',
        quantity: 1,
        price: 250.00,
        image: '/api/placeholder/80/80'
      },
      {
        id: '2',
        name: 'Filtro de Óleo Premium',
        quantity: 2,
        price: 24.95,
        image: '/api/placeholder/80/80'
      }
    ],
    customer: {
      name: 'João Silva',
      email: 'joao@email.com'
    },
    address: {
      street: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      cep: '01234-567'
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header de Sucesso */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-skina-blue mb-2">Pedido Confirmado!</h1>
          <p className="text-gray-600 text-lg">
            Obrigado pela sua compra. Seu pedido foi recebido e está sendo processado.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Detalhes do Pedido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Detalhes do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Número do Pedido</p>
                    <p className="font-bold text-lg">{orderData.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data do Pedido</p>
                    <p className="font-medium">{orderData.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Confirmado
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-bold text-lg text-skina-green">
                      R$ {orderData.total.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Produtos */}
            <Card>
              <CardHeader>
                <CardTitle>Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-600">Quantidade: {item.quantity}</span>
                          <span className="font-bold text-skina-green">
                            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Entrega */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Informações de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Método de Entrega</p>
                    <p className="font-medium">{orderData.shippingMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prazo Estimado</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {orderData.estimatedDelivery}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Endereço de Entrega</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium">{orderData.address.street}</p>
                      <p className="text-gray-600">
                        {orderData.address.neighborhood}, {orderData.address.city} - {orderData.address.state}
                      </p>
                      <p className="text-gray-600">CEP: {orderData.address.cep}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Resumo Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">R$ {orderData.subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frete:</span>
                    <span className="font-medium">R$ {orderData.shippingCost.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span className="text-gray-800">Total:</span>
                    <span className="text-skina-green">R$ {orderData.total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Informações de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{orderData.paymentMethod}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  O pagamento será processado e você receberá uma confirmação por e-mail.
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar com Ações */}
          <div className="space-y-6">
            {/* Próximos Passos */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Pedido Confirmado</p>
                      <p className="text-xs text-gray-600">Agora mesmo</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Preparando Pedido</p>
                      <p className="text-xs text-gray-600">1-2 dias úteis</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Produto Enviado</p>
                      <p className="text-xs text-gray-600">Prazo conforme frete selecionado</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Home className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Produto Entregue</p>
                      <p className="text-xs text-gray-600">{orderData.estimatedDelivery}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Ações */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Comprovante
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open(`mailto:${orderData.customer.email}`)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar por E-mail
                </Button>
                
                <Button 
                  className="w-full bg-skina-green hover:bg-skina-green/90"
                  onClick={() => navigate('/')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Continuar Comprando
                </Button>
              </CardContent>
            </Card>
            
            {/* Suporte */}
            <Card>
              <CardHeader>
                <CardTitle>Precisa de Ajuda?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Se você tiver alguma dúvida sobre seu pedido, entre em contato conosco.
                </p>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">WhatsApp:</span>
                    <span className="text-gray-600 ml-2">(11) 99999-9999</span>
                  </div>
                  <div>
                    <span className="font-medium">E-mail:</span>
                    <span className="text-gray-600 ml-2">suporte@skina.com.br</span>
                  </div>
                  <div>
                    <span className="font-medium">Horário:</span>
                    <span className="text-gray-600 ml-2">Seg-Sex 8h às 18h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Informações Importantes */}
        <div className="max-w-4xl mx-auto mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Confirmação por E-mail</h3>
                  <p className="text-sm text-gray-600">
                    Você receberá um e-mail com todos os detalhes do seu pedido
                  </p>
                </div>
                
                <div>
                  <Truck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Acompanhe seu Pedido</h3>
                  <p className="text-sm text-gray-600">
                    Você receberá atualizações sobre o status da entrega
                  </p>
                </div>
                
                <div>
                  <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium mb-1">Garantia de Qualidade</h3>
                  <p className="text-sm text-gray-600">
                    Todos os produtos têm garantia e suporte técnico
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;