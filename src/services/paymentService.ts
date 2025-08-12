// Interfaces para requisições de pagamento
export interface PaymentRequest {
  orderId: string;
  amount: number;
  description: string;
}

export interface CardPaymentRequest extends PaymentRequest {
  token: string;
  installments: number;
  payment_method_id: string;
  issuer_id: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

export interface PixPaymentRequest extends PaymentRequest {
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

// Interfaces para respostas de pagamento
export interface PaymentResponse {
  success: boolean;
  payment?: any;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  error?: string;
  errors?: string[];
}

export interface PaymentStatusResponse {
  success: boolean;
  payment?: any;
  error?: string;
}

class PaymentService {
  private baseUrl = '/api/payments';

  /**
   * Processa pagamento com cartão de crédito
   */
  async createCardPayment(paymentData: {
    transaction_amount: number;
    token: string;
    description: string;
    installments: number;
    payment_method_id: string;
    issuer_id: string;
    payer: {
      email: string;
      identification: {
        type: string;
        number: string;
      };
    };
    order_id?: string;
  }): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/process_payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao processar pagamento com cartão:', error);
      throw error;
    }
  }

  /**
   * Processa pagamento PIX
   */
  async createPixPayment(paymentData: {
    transaction_amount: number;
    description: string;
    payer: {
      email: string;
      first_name: string;
      last_name: string;
      identification: {
        type: string;
        number: string;
      };
    };
    order_id?: string;
  }): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/process_pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao processar pagamento PIX:', error);
      throw error;
    }
  }

  /**
   * Busca status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao buscar status do pagamento:', error);
      throw error;
    }
  }

  /**
   * Valida dados de pagamento
   */
  validatePaymentData(data: any, type: 'card' | 'pix'): string[] {
    const errors: string[] = [];

    // Validações comuns
    if (!data.transaction_amount || data.transaction_amount <= 0) {
      errors.push('Valor da transação é obrigatório e deve ser maior que zero');
    }

    if (!data.description) {
      errors.push('Descrição é obrigatória');
    }

    if (!data.payer || !data.payer.email) {
      errors.push('Email do pagador é obrigatório');
    }

    if (!data.payer.identification || 
        !data.payer.identification.type || 
        !data.payer.identification.number) {
      errors.push('Identificação do pagador é obrigatória');
    }

    // Validações específicas para cartão
    if (type === 'card') {
      if (!data.token) {
        errors.push('Token do cartão é obrigatório');
      }

      if (!data.payment_method_id) {
        errors.push('Método de pagamento é obrigatório');
      }

      if (!data.installments || data.installments < 1) {
        errors.push('Número de parcelas é obrigatório e deve ser maior que zero');
      }
    }

    // Validações específicas para PIX
    if (type === 'pix') {
      if (!data.payer.first_name) {
        errors.push('Nome do pagador é obrigatório para PIX');
      }

      if (!data.payer.last_name) {
        errors.push('Sobrenome do pagador é obrigatório para PIX');
      }
    }

    return errors;
  }

  /**
   * Formata valor monetário
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Valida CPF
   */
  validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  }

  /**
   * Valida CNPJ
   */
  validateCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;

    return true;
  }
}

// Buscar métodos de pagamento disponíveis
export const getPaymentMethods = async (): Promise<any[]> => {
  try {
    const response = await fetch(`/api/payments/methods`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar métodos de pagamento');
    }

    return result.data;
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
    throw error;
  }
};

export const paymentService = new PaymentService();
export { paymentService as default };