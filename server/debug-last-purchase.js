import { Pool } from 'pg';
import Order from './models/Order.js';

const pool = new Pool({
  user: 'arturnunes',
  host: 'localhost',
  database: 'skina_ecopecas',
  password: '',
  port: 5432,
});

async function debugLastPurchase() {
  try {
    console.log('🔍 Debugando última compra para produto "teste api frete"...');
    
    const productName = 'teste api frete';
    const userEmail = 'arturavn28@gmail.com';
    
    // 1. Buscar o produto
    const productQuery = `
      SELECT id, name FROM products WHERE LOWER(name) = LOWER($1)
    `;
    const productResult = await pool.query(productQuery, [productName]);
    
    if (productResult.rows.length === 0) {
      console.log('❌ Produto não encontrado');
      return;
    }
    
    const product = productResult.rows[0];
    console.log('✅ Produto encontrado:', product);
    
    // 2. Buscar o usuário
    const userQuery = `
      SELECT id, name, email FROM users WHERE email = $1
    `;
    const userResult = await pool.query(userQuery, [userEmail]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Usuário encontrado:', user);
    
    // 3. Buscar todas as compras do usuário para este produto
    const ordersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.created_at,
        o.status as order_status,
        o.payment_status,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        p.name as product_name
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1 AND oi.product_id = $2
      ORDER BY o.created_at DESC
    `;
    
    const ordersResult = await pool.query(ordersQuery, [user.id, product.id]);
    
    console.log('\n📦 Todas as compras do usuário para este produto:');
    if (ordersResult.rows.length === 0) {
      console.log('❌ Nenhuma compra encontrada para este produto');
    } else {
      ordersResult.rows.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order.id}`);
        console.log(`   Order Number: ${order.order_number}`);
        console.log(`   Data: ${order.created_at}`);
        console.log(`   Status: ${order.order_status}`);
        console.log(`   Payment Status: ${order.payment_status}`);
        console.log(`   Quantidade: ${order.quantity}`);
        console.log(`   Preço unitário: R$ ${order.unit_price}`);
        console.log(`   Preço total: R$ ${order.total_price}`);
        console.log('---');
      });
    }
    
    // 4. Testar o método do modelo Order
    console.log('\n🧪 Testando método Order.findLastPurchaseByUserAndProduct...');
    const lastPurchaseByUser = await Order.findLastPurchaseByUserAndProduct(user.id, product.id);
    console.log('Resultado por userId:', lastPurchaseByUser);
    
    console.log('\n🧪 Testando método Order.findLastPurchaseByUserEmail...');
    const lastPurchaseByEmail = await Order.findLastPurchaseByUserEmail(userEmail, product.id);
    console.log('Resultado por email:', lastPurchaseByEmail);
    
    // 5. Verificar se há algum problema com os status
    console.log('\n🔍 Verificando status das compras...');
    const statusQuery = `
      SELECT DISTINCT status, payment_status, COUNT(*) as count
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1 AND oi.product_id = $2
      GROUP BY status, payment_status
    `;
    
    const statusResult = await pool.query(statusQuery, [user.id, product.id]);
    console.log('Status das compras:');
    statusResult.rows.forEach(row => {
      console.log(`- Status: ${row.status}, Payment: ${row.payment_status}, Count: ${row.count}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

debugLastPurchase();