import fetch from 'node-fetch';
import fs from 'fs';

async function testLastPurchaseAPI() {
  console.log('🔍 Testando API de última compra...');
  
  try {
    // 1. Fazer login para obter token
    console.log('\n1. Fazendo login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'arturavn28@gmail.com',
        password: 'senha123' // Substitua pela senha correta
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Erro no login:', loginResponse.status, loginResponse.statusText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    
    const token = loginData.token;
    
    // 2. Buscar o produto "Filtro de Óleo Mann W712/75"
    console.log('\n2. Buscando produto "Filtro de Óleo Mann W712/75"...');
    const productsResponse = await fetch('http://localhost:3001/api/products?search=Filtro%20de%20Óleo%20Mann%20W712/75');
    
    if (!productsResponse.ok) {
      console.log('❌ Erro ao buscar produtos:', productsResponse.status);
      return;
    }
    
    const productsData = await productsResponse.json();
    const product = productsData.data.products.find(p => p.name.includes('Filtro de Óleo Mann W712/75'));
    
    if (!product) {
      console.log('❌ Produto não encontrado');
      return;
    }
    
    console.log('✅ Produto encontrado:', {
      id: product.id,
      name: product.name
    });
    
    // 3. Testar API de última compra
    console.log('\n3. Testando API de última compra...');
    const lastPurchaseResponse = await fetch(`http://localhost:3001/api/orders/last-purchase/${product.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status da resposta:', lastPurchaseResponse.status);
    
    if (!lastPurchaseResponse.ok) {
      const errorText = await lastPurchaseResponse.text();
      console.log('❌ Erro na API de última compra:', errorText);
      return;
    }
    
    const lastPurchaseData = await lastPurchaseResponse.json();
    console.log('📊 Resposta da API:', JSON.stringify(lastPurchaseData, null, 2));
    
    if (lastPurchaseData.data.lastPurchase) {
      console.log('✅ Última compra encontrada:', {
        orderId: lastPurchaseData.data.lastPurchase.orderId,
        orderNumber: lastPurchaseData.data.lastPurchase.orderNumber,
        purchaseDate: lastPurchaseData.data.lastPurchase.purchaseDate,
        orderStatus: lastPurchaseData.data.lastPurchase.orderStatus,
        paymentStatus: lastPurchaseData.data.lastPurchase.paymentStatus
      });
    } else {
      console.log('❌ Nenhuma última compra encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testLastPurchaseAPI().then(() => {
  console.log('\n🏁 Teste da API concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});