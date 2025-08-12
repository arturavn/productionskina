import fetch from 'node-fetch';
import fs from 'fs';

async function testFrontendAPI() {
  console.log('🔍 Testando API de última compra como o frontend faz...');
  
  try {
    // 1. Obter token do arquivo salvo
    console.log('\n1. Obtendo token de autenticação...');
    let token;
    
    // Sempre fazer login para garantir token válido do usuário correto
    console.log('Fazendo login com arturavn28@gmail.com...');
      
    // Fazer login
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'arturavn28@gmail.com',
        password: 'test123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Erro no login:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.log('Erro detalhado:', errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    token = loginData.data.token;
    console.log('✅ Login realizado com sucesso');
    console.log('Usuário:', loginData.data.user.name, '-', loginData.data.user.email);
    
    // 2. Testar API para os produtos encontrados
    const products = [
      { id: '40feb878-d09f-4dd9-934f-497b57aa4bb7', name: 'TESTE REAL' },
      { id: '4b8a86df-636f-48f2-b865-a87aeb66359f', name: 'teste api frete' }
    ];
    
    for (const product of products) {
      console.log(`\n2. Testando API para produto: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      
      const response = await fetch(`http://localhost:3001/api/orders/last-purchase/${product.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`   Status da resposta: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Erro na API:`, errorText);
        continue;
      }
      
      const data = await response.json();
      console.log(`   📊 Resposta da API:`);
      console.log(`   Success: ${data.success}`);
      console.log(`   Message: ${data.message}`);
      
      if (data.data && data.data.lastPurchase) {
        console.log(`   ✅ Última compra encontrada:`);
        console.log(`      Order ID: ${data.data.lastPurchase.orderId}`);
        console.log(`      Order Number: ${data.data.lastPurchase.orderNumber}`);
        console.log(`      Purchase Date: ${data.data.lastPurchase.purchaseDate}`);
        console.log(`      Order Status: ${data.data.lastPurchase.orderStatus}`);
        console.log(`      Payment Status: ${data.data.lastPurchase.paymentStatus}`);
      } else {
        console.log(`   ❌ Nenhuma última compra encontrada`);
        console.log(`   Dados completos:`, JSON.stringify(data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFrontendAPI();