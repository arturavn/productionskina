import axios from 'axios';

class MelhorEnvioService {
  constructor() {
    this.baseURL = 'https://melhorenvio.com.br/api/v2/me';
    this.sandboxURL = 'https://sandbox.melhorenvio.com.br/api/v2/me';
    // Force production API for now since we have a production token
    this.useSandbox = false;
    this.apiUrl = this.useSandbox ? this.sandboxURL : this.baseURL;
  }

  /**
   * Calcula frete para produtos individuais
   * @param {Object} params - Parâmetros do cálculo
   * @param {Object} params.from - CEP de origem
   * @param {Object} params.to - CEP de destino
   * @param {Array} params.products - Lista de produtos com dimensões
   * @param {Object} headers - Headers de autenticação
   * @returns {Promise} Resultado do cálculo de frete
   */
  async calculoDeFretesPorProdutos(params, headers = {}) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/shipment/calculate`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Skina-Ecopecas-API/1.0',
            ...headers
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erro ao calcular frete:', error.response?.data || error.message);
      throw new Error(`Erro no cálculo de frete: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Calcula frete individual para um produto específico
   * Segue exatamente a documentação do Melhor Envio
   * @param {Object} productData - Dados do produto
   * @param {string} productData.id - ID do produto
   * @param {number} productData.width - Largura em cm
   * @param {number} productData.height - Altura em cm
   * @param {number} productData.length - Comprimento em cm
   * @param {number} productData.weight - Peso em kg
   * @param {number} productData.insurance_value - Valor do seguro
   * @param {number} productData.quantity - Quantidade
   * @param {string} fromCep - CEP de origem
   * @param {string} toCep - CEP de destino
   * @param {string} token - Token de autenticação
   * @returns {Promise} Resultado do cálculo de frete
   */
  async calculateIndividualProductShipping(productData, fromCep, toCep, token) {
    try {
      const params = {
        from: { postal_code: fromCep.replace(/\D/g, '') },
        to: { postal_code: toCep.replace(/\D/g, '') },
        products: [{
          id: productData.id,
          width: productData.width,
          height: productData.height,
          length: productData.length,
          weight: productData.weight,
          insurance_value: productData.insurance_value,
          quantity: productData.quantity || 1
        }]
      };

      const headers = {
        'Authorization': token,
        'User-Agent': 'Skina-Ecopecas-API/1.0'
      };

      const result = await this.calculoDeFretesPorProdutos(params, headers);
      
      return {
        success: true,
        data: result,
        options: this.formatShippingOptions(result)
      };
    } catch (error) {
      console.error('Erro no cálculo de frete individual:', error);
      return {
        success: false,
        error: error.message,
        data: null,
        options: []
      };
    }
  }

  /**
   * Converte produtos do carrinho para formato do Melhor Envio
   * @param {Array} cartItems - Itens do carrinho
   * @returns {Array} Produtos formatados para API
   */
  formatProductsForAPI(cartItems) {
    if (!cartItems || !Array.isArray(cartItems)) {
      return [];
    }
    
    return cartItems.map(item => {
      // Valores padrão caso não existam dimensões
      const defaultDimensions = {
        width: 10,
        height: 10,
        length: 10,
        weight: 0.3
      };

      // Usar dimensões do banco de dados (width_cm, height_cm, length_cm, weight_kg)
      const dimensions = {
        width: item.width_cm || defaultDimensions.width,
        height: item.height_cm || defaultDimensions.height,
        length: item.length_cm || defaultDimensions.length,
        weight: item.weight_kg || defaultDimensions.weight
      };

      // Usar preço com desconto se disponível, senão preço original
      const price = item.discount_price && item.discount_price > 0 
        ? item.discount_price 
        : item.original_price;

      return {
        id: item.id || item.product_id,
        width: Math.max(1, Math.round(dimensions.width)), // Mínimo 1cm
        height: Math.max(1, Math.round(dimensions.height)),
        length: Math.max(1, Math.round(dimensions.length)),
        weight: Math.max(0.1, dimensions.weight), // Mínimo 0.1kg
        insurance_value: price,
        quantity: item.quantity || 1
      };
    });
  }

  /**
   * Calcula frete para itens do carrinho
   * @param {Object} params - Parâmetros do cálculo
   * @param {string} params.fromCep - CEP de origem
   * @param {string} params.toCep - CEP de destino
   * @param {Array} params.cartItems - Itens do carrinho
   * @param {string} token - Token de autenticação
   * @returns {Promise} Resultado do cálculo
   */
  async calculateShippingForCart(params, token) {
    const { fromCep, toCep, cartItems } = params;
    
    // Formatar produtos para API
    const products = this.formatProductsForAPI(cartItems);
    
    // Parâmetros para API do Melhor Envio
    const apiParams = {
      from: { postal_code: fromCep.replace(/\D/g, '') }, // Remove caracteres não numéricos
      to: { postal_code: toCep.replace(/\D/g, '') },
      products: products
    };

    // Headers de autenticação
    const headers = {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Skina-Ecopecas-API/1.0'
    };

    return await this.calculoDeFretesPorProdutos(apiParams, headers);
  }

  /**
   * Processa resultado do cálculo e retorna opções formatadas
   * @param {Object} shippingResult - Resultado da API
   * @returns {Array} Opções de frete formatadas
   */
  formatShippingOptions(shippingResult) {
    if (!shippingResult || !Array.isArray(shippingResult)) {
      return [];
    }

    return shippingResult.map(option => ({
      id: option.id,
      name: option.name,
      company: option.company?.name || 'Transportadora',
      price: parseFloat(option.price || 0),
      discount: parseFloat(option.discount || 0),
      currency: option.currency || 'BRL',
      delivery_time: option.delivery_time || 0,
      delivery_range: option.delivery_range || {},
      packages: option.packages || [],
      additional_services: option.additional_services || {},
      company_id: option.company?.id,
      error: option.error || null
    })).filter(option => !option.error); // Filtrar opções com erro
  }

  /**
   * Método principal para calcular frete com tratamento de erros
   * @param {Object} params - Parâmetros do cálculo
   * @returns {Promise} Opções de frete ou erro tratado
   */
  async getShippingOptions(fromCep, toCep, cartItems, authToken) {
    try {
      const params = {
        fromCep,
        toCep,
        cartItems,
        token: authToken
      };
      
      const result = await this.calculateShippingForCart(params, authToken);
      return {
        success: true,
        options: this.formatShippingOptions(result),
        raw: result
      };
    } catch (error) {
      console.error('Erro no serviço de frete:', error);
      return {
        success: false,
        error: error.message,
        options: []
      };
    }
  }
}

export default new MelhorEnvioService();