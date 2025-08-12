import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  ArrowRight,
  CreditCard, 
  Truck, 
  MapPin, 
  User, 
  Mail, 
  Phone,
  Package,
  Shield,
  Clock,
  Check,
  Smartphone,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useCart, useCartSession, useAddresses, useAuth, useCreateOrder, useValidateProducts } from '@/hooks/useApi';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import AddressForm, { AddressFormData } from '@/components/AddressForm';
import { AddressData } from '@/hooks/useCepLookup';
import { toast } from 'sonner';
import ShippingCalculator from '@/components/ShippingCalculator';
import { ShippingOption } from '@/services/api';
import { api } from '@/services/api';
import MercadoPagoLogo from '/public/images/mercadopago_logo.svg';

// Interface estendida para CartItem com todas as propriedades do backend
interface ExtendedCartItem {
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
  width_cm?: number;
  height_cm?: number;
  length_cm?: number;
  weight_kg?: number;
  sku?: string;
}

interface CheckoutForm {
  // Dados pessoais
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf: string;
  
  // Endereço
  addressId?: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  
  // Pagamento
  paymentMethod: 'mercadopago';
  
  // Entrega
  shippingMethod: string;
  
  // Observações
  notes: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { sessionId } = useCartSession();
  const { data: cart, isLoading: cartLoading } = useCart(sessionId);
  const { data: addresses } = useAddresses();
  const { user, isAuthenticated } = useAuth();
  
  // Estado para controlar as etapas
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [form, setForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cpf: '',
    addressId: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    paymentMethod: 'mercadopago',
    shippingMethod: '',
    notes: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number>(0);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderNumber: string; mercadoPagoPaymentUrl: string } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mercadopago'>('mercadopago');
  
  // Estados para cupom
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discountPercentage: number;
    discountAmount: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  const createOrderMutation = useCreateOrder();
  const validateProductsMutation = useValidateProducts();
  
  // Preencher dados do usuário automaticamente quando logado
  useEffect(() => {
    if (isAuthenticated && user) {
      setForm(prev => ({
        ...prev,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        cpf: user.cpf || ''
      }));
      
      // Se houver endereços, selecionar o padrão ou o primeiro
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        }
      }
    }
  }, [isAuthenticated, user, addresses]);
  
  // Calcular totais
  const subtotal = cart?.items?.reduce((sum, item) => {
    const extendedItem = item as ExtendedCartItem;
    const price = extendedItem.discountPrice > 0 ? extendedItem.discountPrice : extendedItem.originalPrice;
    return sum + (price * extendedItem.quantity);
  }, 0) || 0;
  
  // Usar frete calculado pela API
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  
  // Calcular desconto do cupom
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  
  // Total final com desconto
  const total = subtotal + shippingCost - couponDiscount;
  
  // Função para lidar com seleção de frete
  const handleShippingSelect = (option: ShippingOption) => {
    setSelectedShipping(option);
    setCalculatedShippingCost(option.price);
    toast.success(`Frete selecionado: ${option.name} - R$ ${option.price.toFixed(2).replace('.', ',')}`);
  };
  
  // Carregar endereço selecionado
  useEffect(() => {
    if (selectedAddress && addresses) {
      const address = addresses.find(addr => addr.id === selectedAddress);
      if (address) {
        setForm(prev => ({
            ...prev,
            addressId: address.id,
            cep: address.zipCode,
          street: address.street,
          number: address.number,
          complement: address.complement || '',
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state
        }));
      }
    }
  }, [selectedAddress, addresses]);
  
  const handleInputChange = (field: keyof CheckoutForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Funções para cupom
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const result = await api.validateCoupon(couponCode) as {
        success: boolean;
        coupon?: {
          id: string;
          code: string;
          discountPercentage: number;
        };
        message?: string;
      };

      if (result.success && result.coupon) {
        const discountAmount = (subtotal * result.coupon.discountPercentage) / 100;
        setAppliedCoupon({
          id: result.coupon.id,
          code: result.coupon.code,
          discountPercentage: result.coupon.discountPercentage,
          discountAmount: discountAmount
        });
        toast.success(`Cupom aplicado! Desconto de ${result.coupon.discountPercentage}%`);
      } else {
        setCouponError(result.message || 'Cupom inválido');
      }
    } catch (error) {
      setCouponError('Erro ao validar cupom');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast.success('Cupom removido');
  };

  // Funções de navegação entre etapas
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Validação por etapa
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // Dados pessoais
        if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.cpf) {
          toast.error('Por favor, complete todos os dados pessoais');
          return false;
        }
        return true;
      case 2: // Endereço e frete
        if (!form.cep || !form.street || !form.number || !form.neighborhood || !form.city || !form.state) {
          toast.error('Por favor, complete todos os dados de endereço');
          return false;
        }
        if (!selectedShipping) {
          toast.error('Por favor, selecione uma opção de frete');
          return false;
        }
        return true;
      case 3: // Pagamento
        return true;
      default:
        return true;
    }
  };

  // Função para obter o título da etapa
  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Dados Pessoais';
      case 2: return 'Endereço e Frete';
      case 3: return 'Pagamento';
      default: return '';
    }
  };

  // Função para obter o ícone da etapa
   const getStepIcon = (step: number) => {
     switch (step) {
       case 1: return User;
       case 2: return Truck;
       case 3: return CreditCard;
       default: return User;
     }
   };
  
  const validateForm = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'cpf', 'cep', 'street', 'number', 'neighborhood', 'city', 'state'];
    
    for (const field of required) {
      if (!form[field as keyof CheckoutForm]) {
        toast.error(`Campo ${field} é obrigatório`);
        return false;
      }
    }
    
    if (!cart?.items?.length) {
      toast.error('Carrinho vazio');
      return false;
    }
    
    return true;
  };
  
  // Função de validação para verificar se os dados estão completos
  const isFormValid = () => {
    return form.firstName && form.lastName && form.email && form.phone && form.cpf && form.cep && selectedShipping;
  };
  
  // Sistema de validação automática de produtos substitui o mapeamento manual

  // Função para criar o pedido
  const handleCreateOrder = async () => {
    setIsProcessing(true);
    
    try {
      // Garantir que todos os itens têm IDs válidos
      const invalidItems = cart.items.filter(item => !item.id || typeof item.id !== 'string');
      if (invalidItems.length > 0) {
        throw new Error('Alguns produtos possuem IDs inválidos');
      }

      // Validar produtos antes de criar o pedido
      /*console.log(' Validando produtos...');*/
      const validationResult = await validateProductsMutation.mutateAsync(
        cart.items.map(item => ({
          id: item.id,
          name: item.name,
          sku: (item as ExtendedCartItem).sku || ''
        }))
      );

      console.log('✅ Resultado da validação:', validationResult);

      if (validationResult.data.hasErrors) {
        const errorMessages = validationResult.data.errors.map((error: { originalName: string; error: string }) => 
          `${error.originalName}: ${error.error}`
        ).join(', ');
        throw new Error(`Produtos não encontrados: ${errorMessages}`);
      }

      // Criar mapeamento de IDs validados
      const validatedProductMap = {};
      validationResult.data.validatedItems.forEach((item: { originalId: string; validatedId: string }) => {
        validatedProductMap[item.originalId] = item.validatedId;
      });

      const orderPayload = {
        items: cart.items.map(item => {
          const validatedId = validatedProductMap[item.id];
          const validatedItem = validationResult.data.validatedItems.find(
            (v: { originalId: string; validatedId: string; price: number; validatedName: string }) => v.originalId === item.id
          );
          
          const extendedItem = item as ExtendedCartItem;
          
          return {
            productId: validatedId || item.id,
            quantity: item.quantity,
            price: validatedItem?.price || extendedItem.discountPrice || extendedItem.originalPrice,
            name: validatedItem?.validatedName || item.name,
            imageUrl: extendedItem.imageUrl
          };
        }),
        shippingAddress: {
          street: form.street,
          number: form.number,
          complement: form.complement,
          neighborhood: form.neighborhood,
          city: form.city,
          state: form.state,
          zipCode: form.cep
        },
        customerName: `${form.firstName} ${form.lastName}`,
        customerLastName: form.lastName, 
        customerEmail: form.email,
        customerPhone: form.phone,
        cpf: form.cpf,
        paymentMethod: 'mercadopago',
        shippingCost: selectedShipping ? selectedShipping.price : 0,
        shippingMethod: selectedShipping ? {
        name: selectedShipping.name,
        company: selectedShipping.company,
        price: selectedShipping.price,
        deliveryTime: selectedShipping.delivery_time,
        serviceId: selectedShipping.id
      } : null
      };

      const token = localStorage.getItem('auth_token');
      console.log('🔍 Token encontrado no localStorage:', token ? 'Sim' : 'Não');
      console.log('🔍 Token completo:', token);
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Adiciona token ao header se existir
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('Token adicionado ao header');
      } else {
        console.log('Nenhum token encontrado');
      }
      
      console.log('Headers da requisição:', headers);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar pedido');
      }

      const data = await response.json();
      
      // Limpar carrinho antes do redirecionamento
      console.log('🧹 Limpando carrinho antes do redirecionamento...');
      try {
        const sessionId = cart?.sessionId;
        await fetch('/api/cart/clear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId || ''
          }
        });
        console.log('Carrinho limpo com sucesso');
        
        // Limpar também do localStorage
        localStorage.removeItem('cart_session_id');
        localStorage.removeItem('cart_items');
        console.log('Carrinho limpo do localStorage');
      } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
      }
      
      // Redirecionar para o Mercado Pago
      window.location.href = data.data.payment_url;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error(error.message || 'Erro ao processar pedido');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Componente para mostrar status da validação de produtos
  const ProductValidationStatus = () => {
    if (validateProductsMutation.isPending) {
      return (
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Validando produtos...</span>
        </div>
      );
    }

    if (validateProductsMutation.isError) {
      return (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Erro na validação de produtos</span>
        </div>
      );
    }

    return null;
  };
  
  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-skina-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando carrinho...</p>
        </div>
      </div>
    );
  }
  
  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Carrinho Vazio</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Adicione produtos ao carrinho para continuar</p>
          <Button onClick={() => navigate('/')} className="bg-skina-green hover:bg-skina-green/90">
            Continuar Comprando
          </Button>
        </div>
      </div>
    );
  }
  
  // Componente do indicador de progresso
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((step) => {
          const Icon = getStepIcon(step);
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          
          return (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted ? 'bg-green-500 border-green-500 text-white' :
                isActive ? 'bg-skina-blue border-skina-blue text-white' :
                'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300'
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-skina-blue dark:text-skina-blue' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-300'
                }`}>
                  {getStepTitle(step)}
                </p>
              </div>
              {step < totalSteps && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/carrinho')}
            className="p-2 min-w-[40px]"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-skina-blue dark:text-skina-blue">Finalizar Compra</h1>
        </div>
        
        <StepIndicator />
        
        {/* Status da validação de produtos */}
        <ProductValidationStatus />
        
        {/* Aviso para usuários não logados */}
        {!isAuthenticated && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <User className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800">Faça login para uma experiência melhor</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Entre na sua conta para ter seus dados preenchidos automaticamente e acessar seus endereços salvos.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 w-full sm:w-auto"
                >
                  Fazer Login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Etapa 1: Dados Pessoais */}
              {currentStep === 1 && (
                <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-sm font-medium">Nome *</Label>
                        <Input
                          id="firstName"
                          value={form.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="Seu nome"
                          required
                          className="mt-1 h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-sm font-medium">Sobrenome *</Label>
                        <Input
                          id="lastName"
                          value={form.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="Seu sobrenome"
                          required
                          className="mt-1 h-11"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="seu@email.com"
                          required
                          className="mt-1 h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium">Telefone *</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="(11) 99999-9999"
                          required
                          className="mt-1 h-11"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="cpf" className="text-sm font-medium">CPF *</Label>
                      <Input
                        id="cpf"
                        value={form.cpf}
                        onChange={(e) => handleInputChange('cpf', e.target.value)}
                        placeholder="000.000.000-00"
                        className="mt-1 h-11"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-3 pt-6">
                      <Button 
                        onClick={nextStep} 
                        className="flex items-center justify-center bg-skina-blue hover:bg-skina-blue/90 w-full h-12"
                      >
                        <span className="text-base font-medium">Próximo: Endereço e Frete</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/cart')}
                        className="flex items-center justify-center w-full h-12"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="text-base">Voltar ao Carrinho</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Etapa 2: Endereço e Frete */}
              {currentStep === 2 && (
                <>
                  <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Endereço de Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Endereços Salvos */}
                      {addresses && addresses.length > 0 && (
                        <div>
                          <Label>Endereços Salvos</Label>
                          <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                            {addresses.map((address) => (
                              <div key={address.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                                <RadioGroupItem value={address.id} id={address.id} />
                                <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                                  <div className="font-medium">{address.street}, {address.number}</div>
                                  <div className="text-sm text-gray-600">
                                    {address.neighborhood}, {address.city} - {address.state}
                                  </div>
                                  <div className="text-sm text-gray-600">CEP: {address.zipCode}</div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                          <Separator className="my-4" />
                        </div>
                      )}
                      
                      <AddressForm
                        data={form as AddressFormData}
                        onChange={(field, value) => handleInputChange(field as keyof CheckoutForm, value)}
                        onAddressFound={(addressData: AddressData) => {
                          // Atualizar dados de endereço quando encontrado pelo CEP
                          setForm(prev => ({
                            ...prev,
                            street: addressData.street,
                            neighborhood: addressData.neighborhood,
                            city: addressData.city,
                            state: addressData.state,
                            cep: addressData.cep
                          }));
                        }}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Calculadora de Frete */}
                  <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Opções de Frete
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ShippingCalculator
                        onShippingSelect={handleShippingSelect}
                        selectedShipping={selectedShipping}
                        fromCep="70070120" // CEP da empresa
                        toCep={form.cep} // CEP de destino do formulário
                        product={cart.items.length > 0 ? {
                          name: cart.items[0].name,
                          widthCm: (cart.items[0] as ExtendedCartItem).width_cm,
                          heightCm: (cart.items[0] as ExtendedCartItem).height_cm,
                          lengthCm: (cart.items[0] as ExtendedCartItem).length_cm,
                          weightKg: (cart.items[0] as ExtendedCartItem).weight_kg,
                          width_cm: (cart.items[0] as ExtendedCartItem).width_cm,
                          height_cm: (cart.items[0] as ExtendedCartItem).height_cm,
                          length_cm: (cart.items[0] as ExtendedCartItem).length_cm,
                          weight_kg: (cart.items[0] as ExtendedCartItem).weight_kg
                        } : undefined}
                      />
                    </CardContent>
                  </Card>

                  <div className="flex flex-col gap-3 pt-6">
                    <Button 
                      onClick={nextStep} 
                      className="flex items-center justify-center bg-skina-blue hover:bg-skina-blue/90 w-full h-12"
                    >
                      <span className="text-base font-medium">Próximo: Pagamento</span>
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={prevStep}
                      className="flex items-center justify-center w-full h-12"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      <span className="text-base">Voltar: Dados Pessoais</span>
                    </Button>
                  </div>
                </>
              )}
              
              {/* Etapa 3: Pagamento */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <Card className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <img src={MercadoPagoLogo} alt="Mercado Pago" className="h-12 sm:h-16 w-auto" style={{maxHeight: 80}} />
                        <span className="text-lg sm:text-xl">Pagamento via Mercado Pago</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 dark:bg-blue-900/20 dark:border-blue-700">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                          <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                            <img src={MercadoPagoLogo} alt="Mercado Pago" className="h-8 w-auto" style={{maxHeight: 32}} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 text-base sm:text-lg">
                              Mercado Pago
                            </h4>
                            <p className="text-sm sm:text-base text-blue-600 dark:text-blue-300">Pagamento seguro e rápido</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 text-sm sm:text-base text-blue-700 dark:text-blue-300">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 flex-shrink-0" />
                            <span>Ambiente 100% seguro</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 flex-shrink-0" />
                            <span>Cartão de crédito, PIX e boleto</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>Processamento instantâneo</span>
                          </div>
                        </div>
                      </div>
                  
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 dark:bg-gray-700 dark:border-gray-600">
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 text-center">
                          Você será redirecionado para o ambiente seguro do Mercado Pago para finalizar seu pagamento.
                        </p>
                    
                        <Button 
                          onClick={handleCreateOrder}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                          disabled={isProcessing || !isFormValid()}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-5 w-5" />
                              Finalizar Pedido no Mercado Pago
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex flex-col gap-3 pt-6">
                    <Button 
                      variant="outline" 
                      onClick={prevStep}
                      className="flex items-center justify-center w-full h-12"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      <span className="text-base">Voltar: Endereço e Frete</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Resumo do Pedido */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <Card className="lg:sticky lg:top-4 bg-white dark:bg-gray-800 border dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Produtos */}
                <div className="space-y-3">
                  {cart.items.map((item) => {
                  const extendedItem = item as ExtendedCartItem;
                  return (
                  <div key={item.id} className="flex gap-2 sm:gap-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex-shrink-0">
                      {extendedItem.imageUrl && (
                        <img 
                          src={extendedItem.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm line-clamp-2">{item.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs sm:text-sm text-gray-600">Qty: {item.quantity}</span>
                        <span className="font-bold text-skina-green text-xs sm:text-sm">
                          R$ {((extendedItem.discountPrice || extendedItem.originalPrice || 0) * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                  );
                })}
                </div>
                
                <Separator />
                
                {/* Cupom de Desconto */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-skina-blue focus:border-transparent"
                      disabled={!!appliedCoupon}
                    />
                    {!appliedCoupon ? (
                      <Button
                        onClick={validateCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        size="sm"
                        className="bg-skina-blue hover:bg-skina-blue/90"
                      >
                        {isValidatingCoupon ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Aplicar'
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={removeCoupon}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                  
                  {couponError && (
                    <p className="text-red-500 text-xs">{couponError}</p>
                  )}
                  
                  {appliedCoupon && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-green-700 text-sm font-medium">
                          Cupom {appliedCoupon.code} aplicado
                        </span>
                        <span className="text-green-700 text-sm font-bold">
                          -{appliedCoupon.discountPercentage}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {selectedShipping && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Frete ({selectedShipping.name})</span>
                      <span>R$ {selectedShipping.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-xs sm:text-sm text-green-600">
                      <span>Desconto ({appliedCoupon.discountPercentage}%)</span>
                      <span>-R$ {couponDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base sm:text-lg">
                    <span>Total</span>
                    <span className="text-skina-green flex-shrink-0">R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
                
                {/* Informação sobre o pagamento */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                  <p>{isFormValid() ? 'Selecione a forma de pagamento e finalize sua compra' : 'Complete os dados obrigatórios para habilitar o pagamento'}</p>
                </div>
                
                {/* Garantias */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Compra 100% segura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-green-600" />
                    <span>Garantia de qualidade</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;