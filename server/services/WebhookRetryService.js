import WebhookEvent from '../models/WebhookEvent.js';
import Order from '../models/Order.js';
import axios from 'axios';

class WebhookRetryService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelays = [5000, 15000, 30000]; // 5s, 15s, 30s
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ WebhookRetryService já está rodando');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Iniciando WebhookRetryService...');

    // Executar a cada 5 minutos
    this.interval = setInterval(async () => {
      await this.processFailedWebhooks();
    }, 5 * 60 * 1000);

    // Executar imediatamente na primeira vez
    await this.processFailedWebhooks();
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.isRunning = false;
    console.log('WebhookRetryService parado');
  }

  async processFailedWebhooks() {
    try {
      console.log('🔍 Verificando webhooks falhados...');

      // Buscar webhooks com status de erro
      const failedEvents = await WebhookEvent.findByStatus('failed');
      
      if (failedEvents.length === 0) {
        console.log('✅ Nenhum webhook falhado encontrado');
        return;
      }

      console.log(`🔄 Processando ${failedEvents.length} webhooks falhados`);

      for (const event of failedEvents) {
        await this.retryWebhook(event);
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhooks falhados:', error);
    }
  }

  async retryWebhook(event) {
    try {
      console.log(`🔄 Tentando reprocessar webhook ${event.id}...`);

      // Verificar se já tentou o máximo de vezes
      const retryCount = await this.getRetryCount(event.id);
      if (retryCount >= this.maxRetries) {
        console.log(`❌ Webhook ${event.id} excedeu o limite de tentativas`);
        await this.markAsPermanentlyFailed(event.id);
        return;
      }

      // Aguardar antes de tentar novamente
      const delay = this.retryDelays[retryCount] || this.retryDelays[this.retryDelays.length - 1];
      await new Promise(resolve => setTimeout(resolve, delay));

      // Reprocessar o webhook
      const success = await this.reprocessWebhook(event);
      
      if (success) {
        console.log(`✅ Webhook ${event.id} reprocessado com sucesso`);
        await this.markAsSuccess(event.id);
      } else {
        console.log(`❌ Webhook ${event.id} falhou novamente`);
        await this.incrementRetryCount(event.id);
      }
    } catch (error) {
      console.error(`❌ Erro ao reprocessar webhook ${event.id}:`, error);
      await this.incrementRetryCount(event.id);
    }
  }

  async reprocessWebhook(event) {
    try {
      // Simular o processamento do webhook original
      const paymentId = event.paymentId;
      const externalReference = event.externalReference;

      if (!paymentId || !externalReference) {
        console.log(`⚠️ Webhook ${event.id} sem payment_id ou external_reference`);
        return false;
      }

      // Buscar dados do pagamento no Mercado Pago
      const mercadoPagoApi = axios.create({
        baseURL: 'https://api.mercadopago.com',
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const paymentResponse = await mercadoPagoApi.get(`/v1/payments/${paymentId}`);
      const paymentDetails = paymentResponse.data;

      // Buscar pedido
      const order = await Order.findByExternalReference(externalReference);
      if (!order) {
        console.log(`❌ Pedido não encontrado para external_reference: ${externalReference}`);
        return false;
      }

      // Mapear status
      let orderStatus = 'pending';
      let paymentStatus = 'pending';

      switch (paymentDetails.status) {
        case 'approved':
          orderStatus = 'processing';
          paymentStatus = 'paid';
          break;
        case 'rejected':
        case 'cancelled':
          orderStatus = 'cancelled';
          paymentStatus = 'failed';
          break;
        case 'refunded':
          orderStatus = 'refunded';
          paymentStatus = 'refunded';
          break;
        case 'pending':
          orderStatus = 'pending';
          paymentStatus = 'pending';
          break;
        case 'in_process':
          orderStatus = 'processing';
          paymentStatus = 'processing';
          break;
      }

      // Atualizar pedido
      const updateData = {
        status: orderStatus,
        paymentStatus: paymentStatus,
        mercadoPagoStatus: paymentDetails.status,
        mercadoPagoPaymentId: paymentId,
        mercadoPagoPaymentMethod: paymentDetails.payment_method?.type || 'unknown',
        paymentMethod: paymentDetails.payment_method?.type || 'unknown',
        payment_details: paymentDetails,
        mercadoPagoApprovedAt: paymentDetails.status === 'approved' ? paymentDetails.date_approved || paymentDetails.date_created : null
      };

      await Order.update(order.id, updateData);
      
      // Atualizar status do webhook event
      await WebhookEvent.updateStatusByPaymentId(paymentId, orderStatus);

      return true;
    } catch (error) {
      console.error(`❌ Erro ao reprocessar webhook:`, error);
      return false;
    }
  }

  async getRetryCount(eventId) {
    return 0; // Placeholder
  }

  async incrementRetryCount(eventId) {
    // Implementar incremento de tentativas
    console.log(`Incrementando contador de tentativas para webhook ${eventId}`);
  }

  async markAsSuccess(eventId) {
    // Marcar webhook como processado com sucesso
    console.log(`✅ Marcando webhook ${eventId} como processado com sucesso`);
  }

  async markAsPermanentlyFailed(eventId) {
    // Marcar webhook como falha permanente
    console.log(`Marcando webhook ${eventId} como falha permanente`);
  }

  async getStats() {
    try {
      const stats = await WebhookEvent.getStats();
      return {
        ...stats,
        retryService: {
          isRunning: this.isRunning,
          maxRetries: this.maxRetries,
          retryDelays: this.retryDelays
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

export default WebhookRetryService; 