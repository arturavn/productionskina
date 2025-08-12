import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import IndividualShippingCalculator from '@/components/IndividualShippingCalculator';
import { toast } from 'sonner';

const ShippingTest: React.FC = () => {
  const handleShippingCalculated = (options: any[]) => {
    console.log('Opções de frete calculadas:', options);
    if (options.length > 0) {
      toast.success(`${options.length} opções de frete encontradas!`);
    } else {
      toast.warning('Nenhuma opção de frete disponível');
    }
  };

  // Exemplos de produtos para teste
  const exampleProducts = [
    {
      id: 'produto-pequeno',
      width: 11,
      height: 17,
      length: 11,
      weight: 0.3,
      insurance_value: 10.1,
      quantity: 1
    },
    {
      id: 'produto-medio',
      width: 16,
      height: 25,
      length: 11,
      weight: 0.3,
      insurance_value: 55.05,
      quantity: 2
    },
    {
      id: 'produto-grande',
      width: 22,
      height: 30,
      length: 11,
      weight: 1,
      insurance_value: 30,
      quantity: 1
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-skina-green hover:text-skina-green/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Teste de Calculadora de Frete Individual
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Teste a integração com a API do Melhor Envio para cálculo de frete individual por produto.
          </p>
        </div>

        {/* Informações da API */}
        <Card className="mb-8 bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Documentação da API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium mb-2 dark:text-white">Endpoint:</h4>
              <code className="text-sm bg-white dark:bg-gray-700 px-2 py-1 rounded">
                POST /api/shipping/calculate-individual
              </code>
              
              <h4 className="font-medium mb-2 mt-4 dark:text-white">Exemplo de Payload:</h4>
              <pre className="text-xs bg-white dark:bg-gray-700 p-3 rounded overflow-x-auto">
{`{
  "fromCep": "70070120",
  "toCep": "[CEP_DESTINO_USUARIO]",
  "product": {
    "id": "x",
    "width": 11,
    "height": 17,
    "length": 11,
    "weight": 0.3,
    "insurance_value": 10.1,
    "quantity": 1
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Calculadora Principal */}
        <IndividualShippingCalculator 
          onShippingCalculated={handleShippingCalculated}
        />

        {/* Exemplos Rápidos */}
        <Card className="mt-8 bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Exemplos Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Use estes exemplos para testar rapidamente diferentes cenários:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exampleProducts.map((product, index) => (
                <div key={index} className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <h4 className="font-medium mb-2 dark:text-white">{product.id}</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p>Dimensões: {product.width}x{product.height}x{product.length} cm</p>
                    <p>Peso: {product.weight} kg</p>
                    <p>Valor: R$ {product.insurance_value.toFixed(2)}</p>
                    <p>Quantidade: {product.quantity}</p>
                  </div>
                  <IndividualShippingCalculator 
                    defaultProduct={product}
                    onShippingCalculated={(options) => {
                      console.log(`Frete para ${product.id}:`, options);
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações Técnicas */}
        <Card className="mt-8 bg-white dark:bg-gray-800 border dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 dark:text-white">Validações:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• CEP deve ter 8 dígitos</li>
                  <li>• Dimensões mínimas: 1cm</li>
                  <li>• Peso mínimo: 0.1kg</li>
                  <li>• Quantidade mínima: 1</li>
                  <li>• Valor do seguro obrigatório</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 dark:text-white">Transportadoras Suportadas:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Correios (PAC, SEDEX)</li>
                  <li>• Jadlog</li>
                  <li>• Azul Cargo</li>
                  <li>• Total Express</li>
                  <li>• E outras via Melhor Envio</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShippingTest;