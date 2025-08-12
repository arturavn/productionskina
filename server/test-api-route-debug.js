import fetch from 'node-fetch';

async function testAPIRouteDebug() {
  try {
    console.log('🔍 Testando rota da API de última compra com debug detalhado...');
    
    // 1. Fazer login
    console.log('\n1. Fazendo login...');
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
      const errorText = await loginResponse.text();
      console.error('❌ Erro no login:', errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    console.log('Token:', loginData.data?.token ? 'Presente' : 'Ausente');
    console.log('User ID:', loginData.data?.user?.id);
    console.log('User Email:', loginData.data?.user?.email);
    
    const token = loginData.data?.token;
    
    // 2. Testar para o produto "teste api frete"
    const productId = '4b8a86df-636f-48f2-b865-a87aeb66359f';
    const productName = 'teste api frete';
    
    console.log(`\n2. Testando API para produto: ${productName}`);
    console.log(`   ID: ${productId}`);
    
    const response = await fetch(`http://localhost:3001/api/orders/last-purchase/${productId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('   📊 Resposta da API:');
    console.log('   Success:', data.success);
    console.log('   Message:', data.message);
    
    if (data.data && data.data.lastPurchase) {
      console.log('   ✅ Última compra encontrada:');
      console.log(`      Order ID: ${data.data.lastPurchase.orderId}`);
      console.log(`      Order Number: ${data.data.lastPurchase.orderNumber}`);
      console.log(`      Purchase Date: ${data.data.lastPurchase.purchaseDate}`);
      console.log(`      Order Status: ${data.data.lastPurchase.orderStatus}`);
      console.log(`      Payment Status: ${data.data.lastPurchase.paymentStatus}`);
    } else {
      console.log('   ❌ Nenhuma última compra encontrada');
      console.log('   Dados completos:', JSON.stringify(data, null, 2));
    }
    
    // 3. Testar também para o produto "TESTE REAL" que funcionou
    const productId2 = '40feb878-d09f-4dd9-934f-497b57aa4bb7';
    const productName2 = 'TESTE REAL';
    
    console.log(`\n3. Testando API para produto: ${productName2} (que funcionou antes)`);
    console.log(`   ID: ${productId2}`);
    
    const response2 = await fetch(`http://localhost:3001/api/orders/last-purchase/${productId2}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status da resposta: ${response2.status}`);
    
    if (!response2.ok) {
      const errorText = await response2.text();
      console.error('❌ Erro na API:', errorText);
      return;
    }
    
    const data2 = await response2.json();
    console.log('   📊 Resposta da API:');
    console.log('   Success:', data2.success);
    console.log('   Message:', data2.message);
    
    if (data2.data && data2.data.lastPurchase) {
      console.log('   ✅ Última compra encontrada:');
      console.log(`      Order ID: ${data2.data.lastPurchase.orderId}`);
      console.log(`      Order Number: ${data2.data.lastPurchase.orderNumber}`);
      console.log(`      Purchase Date: ${data2.data.lastPurchase.purchaseDate}`);
      console.log(`      Order Status: ${data2.data.lastPurchase.orderStatus}`);
      console.log(`      Payment Status: ${data2.data.lastPurchase.paymentStatus}`);
    } else {
      console.log('   ❌ Nenhuma última compra encontrada');
      console.log('   Dados completos:', JSON.stringify(data2, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testAPIRouteDebug();