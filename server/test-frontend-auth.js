const fetch = require('node-fetch');

async function testFrontendAuth() {
  try {
    console.log('🔍 Testando autenticação do frontend...');
    
    // 1. Fazer login
    console.log('\n1. Fazendo login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'arturavn28@gmail.com',
        password: 'test123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    console.log('Token:', loginData.data.token ? 'Presente' : 'Ausente');
    console.log('User ID:', loginData.data.user.id);
    console.log('User Email:', loginData.data.user.email);
    
    const token = loginData.data.token;
    const user = loginData.data.user;
    
    // 2. Testar rota de última compra com diferentes produtos
    const products = [
      { id: '4b8a86df-636f-48f2-b865-a87aeb66359f', name: 'teste api frete' },
      { id: '40feb878-d09f-4dd9-934f-497b57aa4bb7', name: 'TESTE REAL' }
    ];
    
    for (const product of products) {
      console.log(`\n2. Testando API para produto: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      
      // Testar com diferentes formatos de Authorization header
      const authFormats = [
        `Bearer ${token}`,
        token,
        `Token ${token}`
      ];
      
      for (let i = 0; i < authFormats.length; i++) {
        const authHeader = authFormats[i];
        console.log(`\n   Testando formato ${i + 1}: "${authHeader.substring(0, 20)}..."`);
        
        const response = await fetch(`http://localhost:3001/api/orders/last-purchase/${product.id}`, {
          headers: {
            'Authorization': authHeader,
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
          break; // Se funcionou, não precisa testar outros formatos
        } else {
          console.log(`   ❌ Nenhuma última compra encontrada`);
          console.log(`   Dados completos:`, JSON.stringify(data, null, 2));
        }
      }
    }
    
    // 3. Testar rota de verificação de token
    console.log('\n3. Testando verificação de token...');
    const verifyResponse = await fetch('http://localhost:3001/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Status da verificação: ${verifyResponse.status}`);
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Token válido');
      console.log('Dados do usuário:', JSON.stringify(verifyData, null, 2));
    } else {
      const errorText = await verifyResponse.text();
      console.log('❌ Token inválido:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFrontendAuth();