import Order from './models/Order.js';
import Product from './models/Product.js';
import User from './models/User.js';

async function testLastPurchaseDirect() {
  console.log('🔍 Testando funcionalidade de última compra diretamente...');
  
  try {
    // 1. Buscar o usuário
    console.log('\n1. Buscando usuário arturavn28@gmail.com...');
    const user = await User.findByEmail('arturavn28@gmail.com');
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name
    });
    
    // 2. Buscar o produto
    console.log('\n2. Buscando produto "Filtro de Óleo Mann W712/75"...');
    const product = await Product.findByName('Filtro de Óleo Mann W712/75');
    
    if (!product) {
      console.log('❌ Produto não encontrado');
      return;
    }
    
    console.log('✅ Produto encontrado:', {
      id: product.id,
      name: product.name
    });
    
    // 3. Testar método findLastPurchaseByUserAndProduct
    console.log('\n3. Testando método findLastPurchaseByUserAndProduct...');
    const lastPurchaseByUserId = await Order.findLastPurchaseByUserAndProduct(user.id, product.id);
    
    if (lastPurchaseByUserId) {
      console.log('✅ Última compra encontrada (por userId):', {
        orderId: lastPurchaseByUserId.orderId,
        orderNumber: lastPurchaseByUserId.orderNumber,
        purchaseDate: lastPurchaseByUserId.purchaseDate,
        orderStatus: lastPurchaseByUserId.orderStatus,
        paymentStatus: lastPurchaseByUserId.paymentStatus
      });
    } else {
      console.log('❌ Nenhuma compra encontrada por userId');
    }
    
    // 4. Testar método findLastPurchaseByUserEmail
    console.log('\n4. Testando método findLastPurchaseByUserEmail...');
    const lastPurchaseByEmail = await Order.findLastPurchaseByUserEmail(user.email, product.id);
    
    if (lastPurchaseByEmail) {
      console.log('✅ Última compra encontrada (por email):', {
        orderId: lastPurchaseByEmail.orderId,
        orderNumber: lastPurchaseByEmail.orderNumber,
        purchaseDate: lastPurchaseByEmail.purchaseDate,
        orderStatus: lastPurchaseByEmail.orderStatus,
        paymentStatus: lastPurchaseByEmail.paymentStatus
      });
    } else {
      console.log('❌ Nenhuma compra encontrada por email');
    }
    
    // 5. Verificar se o problema está na lógica da rota
    console.log('\n5. Simulando lógica da rota...');
    const reqUser = { userId: user.id, email: user.email };
    let lastPurchase = null;
    
    if (reqUser.userId) {
      console.log('Buscando por userId...');
      lastPurchase = await Order.findLastPurchaseByUserAndProduct(reqUser.userId, product.id);
    } else if (reqUser.email) {
      console.log('Buscando por email...');
      lastPurchase = await Order.findLastPurchaseByUserEmail(reqUser.email, product.id);
    }
    
    console.log('Resultado final da simulação:', lastPurchase ? 'Compra encontrada' : 'Nenhuma compra encontrada');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testLastPurchaseDirect().then(() => {
  console.log('\n🏁 Teste direto concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});