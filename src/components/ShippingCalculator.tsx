import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Clock, Loader2, ShoppingCart } from 'lucide-react';
import ProductDimensions from '@/components/ProductDimensions';
import { useCalculateShipping, useCart, useCartSession } from '@/hooks/useApi';
import { ShippingOption } from '@/services/api';
import { toast } from 'sonner';

interface ShippingCalculatorProps {
  onShippingSelect?: (option: ShippingOption) => void;
  selectedShipping?: ShippingOption | null;
  fromCep?: string;
  toCep?: string;
  className?: string;
  product?: {
    widthCm?: number;
    heightCm?: number;
    lengthCm?: number;
    weightKg?: number;
    width_cm?: number;
    height_cm?: number;
    length_cm?: number;
    weight_kg?: number;
    name?: string;
  };
}

const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  onShippingSelect,
  selectedShipping,
  fromCep = '70070120', // CEP padrão da empresa
  toCep,
  className = '',
  product
}) => {
  const [cep, setCep] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const { sessionId } = useCartSession();
  const { data: cart } = useCart(sessionId); // Garante que a sessão existe no banco
  const calculateShippingMutation = useCalculateShipping();

  // Formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  // Preencher automaticamente o CEP quando fornecido via prop
  useEffect(() => {
    if (toCep && toCep !== cep) {
      const formattedCep = formatCep(toCep);
      setCep(formattedCep);
    }
  }, [toCep, cep]);

  // Calcular frete automaticamente quando CEP válido for inserido
  useEffect(() => {
    if (isValidCep(cep) && sessionId && !calculateShippingMutation.isPending) {
      const timeoutId = setTimeout(() => {
        handleCalculateShipping();
      }, 1000); // Aguarda 1 segundo após parar de digitar

      return () => clearTimeout(timeoutId);
    }
  }, [cep, sessionId]);

  // Validar CEP
  const isValidCep = (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8;
  };

  // Calcular frete
  const handleCalculateShipping = async () => {
    if (!isValidCep(cep)) {
      toast.error('Por favor, insira um CEP válido');
      return;
    }

    if (!sessionId) {
      toast.error('Carrinho não encontrado');
      return;
    }

    try {
      const result = await calculateShippingMutation.mutateAsync({
        sessionId,
        fromCep,
        toCep: cep,
      });

      console.log('Resultado da API:', result);
      
      // A API retorna { success: true, data: { options: [...] } }
      if (result && result.data && result.data.options) {
        setShippingOptions(result.data.options);
        setShowResults(true);
        
        if (result.data.options.length === 0) {
          toast.warning('Nenhuma opção de frete disponível para este CEP');
        } else {
          toast.success(`${result.data.options.length} opções de frete encontradas`);
        }
      } else {
        console.log('Estrutura inesperada da resposta:', result);
        toast.error('Não foi possível calcular o frete - estrutura de resposta inválida');
        setShippingOptions([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      toast.error(`Erro ao calcular frete: ${error.message || 'Erro desconhecido'}`);
      setShippingOptions([]);
      setShowResults(false);
    }
  };

  // Selecionar opção de frete
  const handleSelectShipping = (option: ShippingOption) => {
    if (onShippingSelect) {
      onShippingSelect(option);
    }
    toast.success(`Frete selecionado: ${option.name}`);
  };

  // Formatar tempo de entrega
  const formatDeliveryTime = (days: number) => {
    if (days === 1) return '1 dia útil';
    return `${days} dias úteis`;
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Calculadora de CEP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" />
            Calcular Frete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Digite seu CEP"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                maxLength={9}
                className="text-center pr-10"
              />
              {calculateShippingMutation.isPending && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                </div>
              )}
            </div>
            
            {!isValidCep(cep) && cep.length > 0 && (
              <p className="text-sm text-red-500">
                CEP deve ter 8 dígitos
              </p>
            )}
            
            {isValidCep(cep) && !calculateShippingMutation.isPending && !showResults && (
              <p className="text-sm text-blue-500">
                Calculando opções de frete...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados do frete */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Opções de entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Dimensões do produto para cálculo do frete */}
            {product && (
              <div className="mb-4">
                <ProductDimensions 
                  product={product} 
                  compact={true}
                  showTitle={false}
                  className="mb-3"
                />
                <div className="text-xs text-gray-500 mb-4">
                  * Dimensões utilizadas para o cálculo do frete
                </div>
              </div>
            )}
            {shippingOptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma opção de frete disponível para este CEP</p>
                <p className="text-sm mt-2">Tente outro CEP ou entre em contato conosco</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Opção de Retirada na Loja */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-300 ${
                    selectedShipping?.id === 'pickup'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleSelectShipping({
                    id: 'pickup',
                    name: 'Retirada na Loja',
                    company: 'Skina Ecopeças',
                    price: 0,
                    delivery_time: 1,
                    delivery_range: { min: 1, max: 1 }
                  })}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Retirada na Loja</span>
                        <span className="text-sm text-gray-500 skina-logo-style">(<span className="skina-part">SKINA</span> <span className="ecopecas-part">ECOPEÇAS</span>)</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Disponível em 1 dia útil</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg text-green-600">
                        GRÁTIS
                      </div>
                    </div>
                  </div>
                  
                  {selectedShipping?.id === 'pickup' && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-sm text-blue-600 font-medium">
                        ✓ Opção selecionada
                      </p>
                    </div>
                  )}
                </div>

                {/* Opções de Frete da API */}
                {shippingOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-300 ${
                      selectedShipping?.id === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleSelectShipping(option)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{option.name}</span>
                          <span className="text-sm text-gray-500">({option.company})</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDeliveryTime(option.delivery_time)}</span>
                          </div>
                          
                          {option.delivery_range.min && option.delivery_range.max && (
                            <span>
                              ({option.delivery_range.min} a {option.delivery_range.max} dias)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg text-green-600">
                          {option.price === 0 ? 'GRÁTIS' : formatPrice(option.price)}
                        </div>
                        
                        {option.discount > 0 && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(option.price + option.discount)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {selectedShipping?.id === option.id && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-sm text-blue-600 font-medium">
                          ✓ Opção selecionada
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShippingCalculator;