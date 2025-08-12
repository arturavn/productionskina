import axios from 'axios';

// Simular um webhook do Mercado Pago para o pedido SKE202507230001
const testWebhook = async () => {
  try {
    console.log('🧪 Testando webhook do Mercado Pago...');
    
    // Dados do webhook simulado
    const webhookData = {
      action: 'payment.updated',
      api_version: 'v1',
      data: {
        id: '1234567890' // ID fictício do pagamento
      },
      date_created: new Date().toISOString(),
      id: Date.now(),
      live_mode: false,
      type: 'payment',
      user_id: '302115427'
    };
    
    const webhookUrl = 'http://localhost:3001/api/webhooks/mercado_pago/87bb59f9ca74cfaa84b9845b6149887cf76bc39fbf5245f0e2c91c77eb9af374';
    
    console.log('📤 Enviando webhook para:', webhookUrl);
    console.log('📦 Dados do webhook:', JSON.stringify(webhookData, null, 2));
    
    const response = await axios.post(webhookUrl, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MercadoPago/1.0'
      }
    });
    
    console.log('✅ Resposta do webhook:', response.status, response.data);
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.response?.data || error.message);
  }
};

// Executar o teste
testWebhook();