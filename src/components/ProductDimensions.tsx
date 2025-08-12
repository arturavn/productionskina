import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Ruler, Weight } from 'lucide-react';

interface ProductDimensionsProps {
  product: {
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
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

const ProductDimensions: React.FC<ProductDimensionsProps> = ({
  product,
  className = '',
  showTitle = true,
  compact = false
}) => {
  // Normalizar os campos de dimensões (suporta ambos os formatos)
  const width = product.widthCm || product.width_cm;
  const height = product.heightCm || product.height_cm;
  const length = product.lengthCm || product.length_cm;
  const weight = product.weightKg || product.weight_kg;

  // Se não há dimensões disponíveis, não renderizar o componente
  if (!width && !height && !length && !weight) {
    return null;
  }

  const formatDimension = (value: number | undefined, unit: string) => {
    if (!value) return 'N/A';
    return `${value.toFixed(value < 1 ? 2 : 1)} ${unit}`;
  };

  if (compact) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        <div className="flex items-center gap-4 flex-wrap">
          {(width || height || length) && (
            <div className="flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              <span>
                {formatDimension(length, 'cm')} × {formatDimension(width, 'cm')} × {formatDimension(height, 'cm')}
              </span>
            </div>
          )}
          {weight && (
            <div className="flex items-center gap-1">
              <Weight className="w-3 h-3" />
              <span>{formatDimension(weight, 'kg')}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5" />
            Dimensões e Peso
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showTitle ? '' : 'pt-4'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Comprimento:</span>
              <span className="font-semibold text-skina-blue">
                {formatDimension(length, 'cm')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Largura:</span>
              <span className="font-semibold text-skina-blue">
                {formatDimension(width, 'cm')}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Altura:</span>
              <span className="font-semibold text-skina-blue">
                {formatDimension(height, 'cm')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Peso:</span>
              <span className="font-semibold text-skina-blue">
                {formatDimension(weight, 'kg')}
              </span>
            </div>
          </div>
        </div>
        
        {/* Informação adicional sobre uso nas dimensões de frete */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">Dimensões para Frete</p>
              <p className="text-blue-700">
                Estas são as dimensões utilizadas para calcular o frete através da API dos Correios e transportadoras.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductDimensions;