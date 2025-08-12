import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { useCepLookup, AddressData } from '@/hooks/useCepLookup';
import { toast } from 'sonner';

export interface AddressFormData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface AddressFormProps {
  data: AddressFormData;
  onChange: (field: keyof AddressFormData, value: string) => void;
  onAddressFound?: (addressData: AddressData) => void;
  disabled?: boolean;
  showLabels?: boolean;
  className?: string;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  data,
  onChange,
  onAddressFound,
  disabled = false,
  showLabels = true,
  className = ''
}) => {
  const { lookupCep, formatCep, isValidCep, isLoading } = useCepLookup();
  const [cepValue, setCepValue] = useState(data.cep);

  useEffect(() => {
    setCepValue(data.cep);
  }, [data.cep]);

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setCepValue(formatted);
    onChange('cep', formatted);
    
    // Buscar automaticamente quando CEP estiver válido
    if (isValidCep(formatted)) {
      const addressData = await lookupCep(formatted);
      if (addressData) {
        // Preencher apenas campos vazios para não sobrescrever dados já inseridos
        if (!data.street && addressData.street) {
          onChange('street', addressData.street);
        }
        if (!data.neighborhood && addressData.neighborhood) {
          onChange('neighborhood', addressData.neighborhood);
        }
        if (!data.city && addressData.city) {
          onChange('city', addressData.city);
        }
        if (!data.state && addressData.state) {
          onChange('state', addressData.state);
        }
        
        onAddressFound?.(addressData);
      }
    }
  };



  const handleManualLookup = async () => {
    if (!isValidCep(cepValue)) {
      toast.error('Digite um CEP válido para buscar');
      return;
    }
    
    const addressData = await lookupCep(cepValue);
    if (addressData) {
      // Preencher todos os campos na busca manual
      onChange('street', addressData.street);
      onChange('neighborhood', addressData.neighborhood);
      onChange('city', addressData.city);
      onChange('state', addressData.state);
      
      onAddressFound?.(addressData);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* CEP com busca */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {showLabels && <Label htmlFor="cep">CEP *</Label>}
          <div className="flex gap-2">
            <Input
              id="cep"
              value={cepValue}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              disabled={disabled}
              maxLength={9}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleManualLookup}
              disabled={disabled || isLoading || !isValidCep(cepValue)}
              title="Buscar endereço pelo CEP"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          {cepValue && !isValidCep(cepValue) && (
            <p className="text-sm text-red-500 mt-1">CEP deve ter 8 dígitos</p>
          )}
        </div>
      </div>

      {/* Rua */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {showLabels && <Label htmlFor="street">Rua *</Label>}
          <Input
            id="street"
            value={data.street}
            onChange={(e) => onChange('street', e.target.value)}
            placeholder="Nome da rua"
            disabled={disabled}
          />
        </div>
        <div>
          {showLabels && <Label htmlFor="number">Número *</Label>}
          <Input
            id="number"
            value={data.number}
            onChange={(e) => onChange('number', e.target.value)}
            placeholder="123"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Complemento */}
      <div>
        {showLabels && <Label htmlFor="complement">Complemento</Label>}
        <Input
          id="complement"
          value={data.complement}
          onChange={(e) => onChange('complement', e.target.value)}
          placeholder="Apto, bloco, etc."
          disabled={disabled}
        />
      </div>

      {/* Bairro e Cidade */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          {showLabels && <Label htmlFor="neighborhood">Bairro *</Label>}
          <Input
            id="neighborhood"
            value={data.neighborhood}
            onChange={(e) => onChange('neighborhood', e.target.value)}
            placeholder="Nome do bairro"
            disabled={disabled}
          />
        </div>
        <div>
          {showLabels && <Label htmlFor="city">Cidade *</Label>}
          <Input
            id="city"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Nome da cidade"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Estado */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          {showLabels && <Label htmlFor="state">Estado *</Label>}
          <Input
            id="state"
            value={data.state}
            onChange={(e) => onChange('state', e.target.value)}
            placeholder="SP"
            disabled={disabled}
            maxLength={2}
          />
        </div>
      </div>
    </div>
  );
};

export default AddressForm;