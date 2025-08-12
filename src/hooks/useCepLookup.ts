import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

export const useCepLookup = () => {
  const [isLoading, setIsLoading] = useState(false);

  const formatCep = useCallback((cep: string): string => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length <= 5) {
      return cleanCep;
    }
    return cleanCep.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  }, []);

  const isValidCep = useCallback((cep: string): boolean => {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8;
  }, []);

  const lookupCep = useCallback(async (cep: string): Promise<AddressData | null> => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (!isValidCep(cep)) {
      toast.error('CEP deve ter 8 dígitos');
      return null;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP');
      }
      
      const data: CepData = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return null;
      }
      
      const addressData: AddressData = {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        cep: formatCep(data.cep)
      };
      
      toast.success('Endereço encontrado!');
      return addressData;
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao consultar CEP. Tente novamente.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [formatCep, isValidCep]);

  return {
    lookupCep,
    formatCep,
    isValidCep,
    isLoading
  };
};

export default useCepLookup;