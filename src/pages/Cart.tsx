import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart, useCartSession, useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/hooks/useApi';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  originalPrice: number;
  discountPrice: number;
  imageUrl?: string;
  quantity: number;
  inStock: boolean;
  stockQuantity: number;
  addedAt: string;
}

interface CartData {
  sessionId: string;
  cart: {
    id: string;
    sessionId: string;
    userId?: string;
    createdAt: string;
    updatedAt: string;
    items: CartItem[];
  };
}

const Cart = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Integração com API do carrinho
  const { sessionId } = useCartSession();
  const { data: cartData, isLoading, error } = useCart(sessionId);
  const updateCartMutation = useUpdateCartItem();
  const removeFromCartMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();

  // cartData agora é diretamente o objeto cart
  const cartItems = cartData?.items || [];
  const subtotal = cartItems.reduce((total: number, item: CartItem) => {
    const price = item.discountPrice > 0 ? item.discountPrice : item.originalPrice;
    return total + (price * item.quantity);
  }, 0);
  const shipping = 0; // Frete grátis
  const total = subtotal + shipping;

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateCartMutation.mutate({ itemId: productId, quantity, sessionId });
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCartMutation.mutate({ sessionId, itemId: productId });
  };

  const handleClearCart = () => {
    clearCartMutation.mutate(sessionId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-32 lg:pt-36">
        {/* Botão voltar */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-skina-blue/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de itens do carrinho */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-skina-blue" />
                <h1 className="text-2xl lg:text-3xl font-bold text-skina-blue">
                  Meu Carrinho
                </h1>
              </div>
              {cartItems.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearCart}
                  className="text-red-500 border-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Carrinho
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando carrinho...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">Erro ao carregar carrinho. Tente novamente.</p>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Seu carrinho está vazio</h3>
                <p className="text-gray-500 mb-6">Adicione produtos ao seu carrinho para continuar</p>
                <Button 
                  onClick={() => navigate('/produtos')}
                  className="bg-skina-blue hover:bg-skina-blue/90"
                >
                  Ver Produtos
                </Button>
              </div>
            ) : (
              cartItems.map((item: CartItem) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Imagem do produto */}
                      <div className="w-full md:w-32 h-32 flex-shrink-0">
                        <img
                          src={item.imageUrl || '/placeholder.svg'}
                          alt={item.name}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>

                      {/* Informações do produto */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="font-semibold text-skina-blue line-clamp-2">
                            {item.name}
                          </h3>
                        </div>

                        {/* Preços */}
                        <div className="flex items-center gap-2">
                          {item.discountPrice > 0 && item.originalPrice > item.discountPrice && (
                            <span className="text-gray-400 line-through text-sm">
                              R$ {item.originalPrice?.toFixed(2).replace('.', ',') || '0,00'}
                            </span>
                          )}
                          <span className="text-skina-green font-bold text-lg">
                            R$ {(item.discountPrice > 0 ? item.discountPrice : item.originalPrice)?.toFixed(2).replace('.', ',') || '0,00'}
                          </span>
                        </div>

                        {/* Controles de quantidade */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">Quantidade:</span>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveItem(item.productId)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remover
                          </Button>
                        </div>

                        {/* Subtotal do item */}
                        <div className="text-right">
                          <span className="text-sm text-gray-600">Subtotal: </span>
                          <span className="font-bold text-skina-blue">
                            R$ {((item.discountPrice > 0 ? item.discountPrice : item.originalPrice) * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Resumo do pedido */}
          {cartItems.length > 0 && (
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-skina-blue">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({cartItems.length} itens)</span>
                      <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-skina-green">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Button 
                      className="w-full bg-gradient-to-r from-skina-green to-green-500 hover:from-skina-green/90 hover:to-green-500/90 text-white font-semibold py-3 rounded-2xl"
                      onClick={() => navigate('/checkout')}
                    >
                      Finalizar Compra
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-skina-blue text-skina-blue hover:bg-skina-blue/10 py-3 rounded-2xl"
                      onClick={() => navigate('/produtos')}
                    >
                      Continuar Comprando
                    </Button>
                  </div>

                  {/* Informações adicionais */}
                  <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
                    <p>✓ Frete grátis para todo o DF</p>
                    <p>✓ Garantia de 30 dias</p>
                   
                    
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Cart;