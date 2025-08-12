import axios from 'axios';
import dotenv from 'dotenv';
import Preference from '../models/Preference.js';

dotenv.config();

export default class MercadoPagoService {
  constructor() {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const mpEnvironment = process.env.MERCADO_PAGO_ENVIRONMENT || 'SANDBOX';
    
    console.log(' Token MP:', token ? `${token.substring(0, 10)}...` : 'NÃO ENCONTRADO');
    console.log(' Ambiente configurado no .env:', mpEnvironment);
    /*console.log('Expiração fixa: 1 minutos para teste');*/
    
    this.api = axios.create({
      baseURL: 'https://api.mercadopago.com',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    this.environment = mpEnvironment;
  }

  async createPreference(orderData) {
    try {
      console.log(' Dados recebidos no MercadoPagoService:', orderData);
      
      // Validações de entrada
      if (!orderData.orderId) {
        throw new Error('orderId é obrigatório');
      }
      
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('items é obrigatório e deve ser um array não vazio');
      }
      
      if (!orderData.customerName || !orderData.customerEmail) {
        throw new Error('customerName e customerEmail são obrigatórios');
      }
      
      // Calcular total dos itens
      const itemsTotal = orderData.items.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
      
      if (itemsTotal <= 0) {
        throw new Error('Total dos itens deve ser maior que zero');
      }
      
      console.log(' Processando itens para MP:', orderData.items);
      console.log(' Total calculado:', itemsTotal);
      
      // Criar apenas um item fixo com o total
      const items = [{
        id: `${orderData.orderId}_main`,
        title: 'Produto Skina Ecopecas',
        unit_price: itemsTotal,
        quantity: 1,
        picture_url: null,
        description: 'Produto Skina Ecopeças - Compra segura',
        category_id: 'others',
        currency_id: 'BRL'
      }];
      
      console.log(' Item fixo criado:', items[0]);
      
      // Adicionar frete como item se houver
      if (orderData.shippingCost && orderData.shippingCost > 0) {
        items.push({
          id: `${orderData.orderId}_shipping`,
          title: 'Frete Skina Ecopecas',
          unit_price: orderData.shippingCost,
          quantity: 1,
          description: 'Frete Skina Ecopecas',
          category_id: 'others',
          currency_id: 'BRL'
        });
      }
      
      // Calcular datas de expiração fixa de 12 horas (720 minutos)
      const currentDate = new Date();
      const expirationDate = new Date(currentDate.getTime() + (12 * 60 * 60 * 1000));
      
      
      let areaCode = '';
      let phoneNumber = '';
      if (orderData.customerPhone) {
        const phone = orderData.customerPhone.replace(/\D/g, '');
        if (phone.length >= 10) {
          areaCode = phone.substring(0, 2);
          phoneNumber = phone.substring(2);
        } else {
          phoneNumber = phone;
        }
      }
      
      const preference = {
        items: items,
        payer: {
          name: orderData.customerName,
          last_name: orderData.customerLastName || '',
          email: orderData.customerEmail,
          phone: {
            area_code: areaCode,
            number: phoneNumber
          },
          ...(orderData.cpf ? { identification: { type: 'CPF', number: orderData.cpf } } : {}),
          ...(orderData.shippingAddress ? {
            address: {
              zip_code: orderData.shippingAddress.zipCode || orderData.shippingAddress.cep || '',
              street_name: orderData.shippingAddress.street || orderData.shippingAddress.logradouro || '',
              street_number: orderData.shippingAddress.number || orderData.shippingAddress.numero || '',
              city: orderData.shippingAddress.city || orderData.shippingAddress.cidade || '',
              state: orderData.shippingAddress.state || orderData.shippingAddress.uf || '',
              neighborhood: orderData.shippingAddress.neighborhood || orderData.shippingAddress.bairro || '',
             
            }
          } : {})
        },
        statement_descriptor: "SKINA ECOPECAS",
        payment_methods: {
          excluded_payment_types: [{ id: 'atm' }], // Apenas exclui ATM
          installments: 12,
          default_installments: 1
        },
        external_reference: orderData.orderId.toString(),
        notification_url: `${process.env.BASE_URL || 'http://localhost:3001'}/api/mercado_pago/${process.env.WEBHOOK_SECRET_TOKEN}`,
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-pending`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure`
        },
        expires: true,
        expiration_date_from: currentDate.toISOString(),
        expiration_date_to: expirationDate.toISOString(),
        //collector_id: null,
        //differential_pricing: null,
        binary_mode: false
      };

      console.log('🎯 Enviando preferência para MP:', JSON.stringify(preference, null, 2));
      console.log('🔗 External Reference sendo enviado:', preference.external_reference);
      
      console.log('Configurações de pagamento:', {
        excluded_payment_types: preference.payment_methods.excluded_payment_types,
        installments: preference.payment_methods.installments,
        binary_mode: preference.binary_mode
      });
      
     
      
      const response = await this.api.post('/checkout/preferences', preference);
      
      console.log('✅ Resposta do MP:', response.data);
      
      // Verificar se a expiração foi aplicada
      if (response.data.expiration_date_to) {
        console.log('✅ Expiração aplicada com sucesso:', {
          expiration_date: response.data.expiration_date_to,
          expires: response.data.expires
        });
      } else {
        console.log('⚠️ Expiração não foi aplicada pelo MP');
      }
      
      // Determinar URL baseada no ambiente configurado no .env
      let paymentUrl;
      let environment;
      
      if (this.environment === 'PRODUCTION') {
        paymentUrl = response.data.init_point;
        environment = 'PRODUCTION';
        console.log('🌍 Usando ambiente PRODUÇÃO');
      } else {
        paymentUrl = response.data.sandbox_init_point;
        environment = 'SANDBOX';
        console.log('🌍 Usando ambiente SANDBOX');
      }
      
      console.log('🔗 URL de pagamento:', paymentUrl);
      
      // Salvar preferência no banco de dados
      try {
        const preferenceData = {
          preferenceId: response.data.id,
          orderId: orderData.orderId,
          externalReference: orderData.orderId.toString(),
          payerName: orderData.customerName,
          payerEmail: orderData.customerEmail,
          payerPhone: orderData.customerPhone,
          payerCpf: orderData.cpf,
          payerAddress: orderData.shippingAddress,
          items: items,
          totalAmount: itemsTotal + (orderData.shippingCost || 0),
          shippingCost: orderData.shippingCost || 0,
          initPoint: response.data.init_point,
          sandboxInitPoint: response.data.sandbox_init_point,
          paymentUrl: paymentUrl,
          notificationUrl: preference.notification_url,
          backUrls: preference.back_urls,
          paymentMethods: preference.payment_methods,
          statementDescriptor: preference.statement_descriptor,
          binaryMode: preference.binary_mode,
          expires: preference.expires,
          expirationDateFrom: preference.expiration_date_from,
          expirationDateTo: preference.expiration_date_to,
          environment: environment,
          status: 'pending'
        };
        
        const savedPreference = await Preference.create(preferenceData);
        console.log('Preferência salva no banco de dados:', savedPreference.id);
        
      } catch (dbError) {
        console.error('❌ Erro ao salvar preferência no banco:', dbError);
        // Não falhar a operação se não conseguir salvar no banco
      }
      
      return {
        success: true,
        id: response.data.id,
        init_point: response.data.init_point,
        sandbox_init_point: response.data.sandbox_init_point,
        payment_url: paymentUrl,
        environment: environment
      };
    } catch (error) {
      console.error('Erro ao criar preferência no Mercado Pago:', error);
      return { 
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Cache simples para evitar consultas repetidas
  paymentCache = new Map();
  
  async verifyPayment(paymentId) {
    try {
      // Verificar cache primeiro (cache por 30 segundos)
      const cacheKey = `payment_${paymentId}`;
      const cached = this.paymentCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < 30000) {
        console.log(` Usando cache para payment ${paymentId}`);
        return cached.data;
      }
      
      console.log(`🔍 Consultando API do MP para payment ${paymentId}`);
      const response = await this.api.get(`/v1/payments/${paymentId}`);
      
      const result = {
        success: true,
        payment: response.data,
        cached: false
      };
      
      // Armazenar no cache
      this.paymentCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      // Limpar cache antigo (manter apenas últimos 100 itens)
      if (this.paymentCache.size > 100) {
        const oldestKey = this.paymentCache.keys().next().value;
        this.paymentCache.delete(oldestKey);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Erro ao verificar payment ${paymentId}:`, error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Função para verificar se uma preferência expirou
  async checkPreferenceExpiration(preferenceId) {
    try {
      const response = await this.api.get(`/checkout/preferences/${preferenceId}`);
      const preference = response.data;
      
      console.log('🔍 Verificando expiração da preferência:', {
        preference_id: preferenceId,
        expires: preference.expires,
        expiration_date: preference.expiration_date_to,
        current_time: new Date().toISOString()
      });
      
      return {
        success: true,
        preference: preference,
        isExpired: preference.expires && preference.expiration_date_to 
          ? new Date() > new Date(preference.expiration_date_to)
          : false
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Limpar cache de pagamentos
  clearPaymentCache() {
    const cacheSize = this.paymentCache.size;
    this.paymentCache.clear();
    console.log(`Cache de pagamentos limpo (${cacheSize} itens removidos)`);
    return cacheSize;
  }

  // Obter estatísticas do cache
  getCacheStats() {
    return {
      size: this.paymentCache.size,
      maxSize: 100,
      entries: Array.from(this.paymentCache.keys())
    };
  }

  // Verificar se um pagamento está em cache
  isPaymentCached(paymentId) {
    const cacheKey = `payment_${paymentId}`;
    const cached = this.paymentCache.get(cacheKey);
    return cached && (Date.now() - cached.timestamp) < 30000;
  }
}

export const mercadoPagoService = new MercadoPagoService();
