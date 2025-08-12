import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Calculator, Package } from 'lucide-react';
import { useCalculateIndividualShipping, useTestIndividualShipping } from '@/hooks/useApi';
import { toast } from 'sonner';

interface IndividualShippingCalculatorProps {
  productId?: string;
  defaultProduct?: {
    id: string;
    width: number;
    height: number;
    length: number;
    weight: number;
    insurance_value: number;
    quantity?: number;
  };
  onShippingCalculated?: (options: any[]) => void;
}

const IndividualShippingCalculator: React.FC<IndividualShippingCalculatorProps> = ({
  productId,
  defaultProduct,
  onShippingCalculated
}) => {
  const [fromCep, setFromCep] = useState('70070120'); // CEP padrão da empresa
  const [toCep, setToCep] = useState('');
  const [product, setProduct] = useState(defaultProduct || {
    id: productId || 'produto-teste',
    width: 11,
    height: 17,
    length: 11,
    weight: 0.3,
    insurance_value: 10.1,
    quantity: 1
  });
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);

  const calculateShipping = useCalculateIndividualShipping();
  const testShipping = useTestIndividualShipping();

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (value: string, setter: (value: string) => void) => {
    const formatted = formatCep(value);
    if (formatted.replace(/\D/g, '').length <= 8) {
      setter(formatted);
    }
  };

  const handleProductChange = (field: string, value: string | number) => {
    setProduct(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'id' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCalculate = async () => {
    if (!toCep || toCep.replace(/\D/g, '').length !== 8) {
      toast.error('Por favor, insira um CEP de destino válido');
      return;
    }

    try {
      const result = await calculateShipping.mutateAsync({
        fromCep,
        toCep,
        product
      });

      if (result.success) {
        setShippingOptions(result.data.options);
        onShippingCalculated?.(result.data.options);
        toast.success('Frete calculado com sucesso!');
      } else {
        toast.error('Erro ao calcular frete');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao calcular frete');
    }
  };

  const handleTest = async () => {
    try {
      const result = await testShipping.mutateAsync();
      if (result.success) {
        toast.success('Teste executado com sucesso!');
        console.log('Resultado do teste:', result);
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error('Erro no teste');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculadora de Frete Individual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CEPs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromCep">CEP de Origem</Label>
              <Input
                id="fromCep"
                value={fromCep}
                onChange={(e) => handleCepChange(e.target.value, setFromCep)}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            <div>
              <Label htmlFor="toCep">CEP de Destino *</Label>
              <Input
                id="toCep"
                value={toCep}
                onChange={(e) => handleCepChange(e.target.value, setToCep)}
                placeholder="00000-000"
                maxLength={9}
                required
              />
            </div>
          </div>

          {/* Dados do Produto */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Dados do Produto
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="productId">ID do Produto</Label>
                <Input
                  id="productId"
                  value={product.id}
                  onChange={(e) => handleProductChange('id', e.target.value)}
                  placeholder="ID do produto"
                />
              </div>
              <div>
                <Label htmlFor="width">Largura (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={product.width}
                  onChange={(e) => handleProductChange('width', e.target.value)}
                  placeholder="11"
                />
              </div>
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={product.height}
                  onChange={(e) => handleProductChange('height', e.target.value)}
                  placeholder="17"
                />
              </div>
              <div>
                <Label htmlFor="length">Comprimento (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={product.length}
                  onChange={(e) => handleProductChange('length', e.target.value)}
                  placeholder="11"
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={product.weight}
                  onChange={(e) => handleProductChange('weight', e.target.value)}
                  placeholder="0.3"
                />
              </div>
              <div>
                <Label htmlFor="insurance">Valor do Seguro (R$)</Label>
                <Input
                  id="insurance"
                  type="number"
                  step="0.01"
                  value={product.insurance_value}
                  onChange={(e) => handleProductChange('insurance_value', e.target.value)}
                  placeholder="10.10"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={product.quantity}
                  onChange={(e) => handleProductChange('quantity', e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleCalculate}
              disabled={calculateShipping.isPending}
              className="flex-1"
            >
              <Truck className="w-4 h-4 mr-2" />
              {calculateShipping.isPending ? 'Calculando...' : 'Calcular Frete'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleTest}
              disabled={testShipping.isPending}
            >
              {testShipping.isPending ? 'Testando...' : 'Teste API'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {shippingOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Opções de Frete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shippingOptions.map((option, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{option.name}</h4>
                      <p className="text-sm text-gray-600">{option.company}</p>
                      <p className="text-sm text-gray-600">
                        Prazo: {option.delivery_time} dias úteis
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatPrice(option.price)}</p>
                      {option.discount > 0 && (
                        <p className="text-sm text-green-600">
                          Desconto: {formatPrice(option.discount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndividualShippingCalculator;