import { Pool } from 'pg';
import Order from './models/Order.js';

const pool = new Pool({
  user: 'arturnunes',
  host: 'localhost',
  database: 'skina_ecopecas',
  password: '',
  port: 5432
});

async function checkUserPurchases() {
  try {
    console.log('Verificando produtos comprados pelo usuário arturavn28@gmail.com...');
    
    // Buscar todos os produtos comprados pelo usuário
    const result = await pool.query(`
      SELECT DISTINCT 
        p.name, 
        p.id, 
        COUNT(oi.id) as purchase_count,
        MAX(o.created_at) as last_purchase_date,
        MAX(o.status) as last_status
      FROM orders o 
      JOIN order_items oi ON o.id = oi.order_id 
      JOIN products p ON oi.product_id = p.id 
      WHERE o.user_id = '5b15db44-8f19-4aff-978c-265dc35c39d9' 
        AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered') 
      GROUP BY p.id, p.name 
      ORDER BY last_purchase_date DESC
    `);
    
    console.log(`\nEncontrados ${result.rows.length} produtos únicos comprados:`);
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Compras: ${row.purchase_count}`);
      console.log(`   Última compra: ${row.last_purchase_date}`);
      console.log(`   Status: ${row.last_status}`);
      console.log('');
    });
    
    // Testar a API de última compra para cada produto
    console.log('\nTestando API de última compra para cada produto...');
    
    for (const product of result.rows) {
      console.log(`\nTestando produto: ${product.name} (ID: ${product.id})`);
      
      // Testar método por userId
      const lastPurchaseByUser = await Order.findLastPurchaseByUserAndProduct(
        '5b15db44-8f19-4aff-978c-265dc35c39d9', 
        product.id
      );
      
      // Testar método por email
      const lastPurchaseByEmail = await Order.findLastPurchaseByUserEmail(
        'arturavn28@gmail.com', 
        product.id
      );
      
      console.log(`  Por userId: ${lastPurchaseByUser ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
      console.log(`  Por email: ${lastPurchaseByEmail ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
      
      if (lastPurchaseByUser) {
        console.log(`    Dados completos:`, lastPurchaseByUser);
        console.log(`    Data: ${lastPurchaseByUser.purchaseDate}`);
        console.log(`    Status: ${lastPurchaseByUser.orderStatus}`);
      }
      
      if (lastPurchaseByEmail) {
        console.log(`    Email - Data: ${lastPurchaseByEmail.purchaseDate}`);
        console.log(`    Email - Status: ${lastPurchaseByEmail.orderStatus}`);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

checkUserPurchases();