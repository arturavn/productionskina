import { Pool } from 'pg';
import Order from './models/Order.js';

const pool = new Pool({
  user: 'arturnunes',
  host: 'localhost',
  database: 'skina_ecopecas',
  password: '',
  port: 5432,
});

async function debugAPIQuery() {
  try {
    console.log('🔍 Debugando query da API de última compra...');
    
    const userId = '5b15db44-8f19-4aff-978c-265dc35c39d9';
    const userEmail = 'arturavn28@gmail.com';
    const productId = '4b8a86df-636f-48f2-b865-a87aeb66359f';
    
    console.log('Parâmetros:');
    console.log('- User ID:', userId);
    console.log('- User Email:', userEmail);
    console.log('- Product ID:', productId);
    
    // 1. Testar a query exata do método findLastPurchaseByUserAndProduct
    console.log('\n1. Testando query exata do método findLastPurchaseByUserAndProduct...');
    const sql1 = `
      SELECT o.*, oi.quantity, oi.unit_price as item_unit_price, oi.total_price as item_total_price
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE (o.user_id = $1 OR o.customer_email = (
        SELECT email FROM users WHERE id = $1
      ))
      AND oi.product_id = $2
      AND o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    const result1 = await pool.query(sql1, [userId, productId]);
    console.log('Resultado da query 1:', result1.rows.length, 'linhas');
    if (result1.rows.length > 0) {
      console.log('Dados encontrados:', {
        orderId: result1.rows[0].id,
        orderNumber: result1.rows[0].order_number,
        status: result1.rows[0].status,
        userId: result1.rows[0].user_id,
        customerEmail: result1.rows[0].customer_email,
        createdAt: result1.rows[0].created_at
      });
    } else {
      console.log('❌ Nenhum resultado encontrado');
    }
    
    // 2. Testar sem o filtro de status
    console.log('\n2. Testando sem filtro de status...');
    const sql2 = `
      SELECT o.*, oi.quantity, oi.unit_price as item_unit_price, oi.total_price as item_total_price
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE (o.user_id = $1 OR o.customer_email = (
        SELECT email FROM users WHERE id = $1
      ))
      AND oi.product_id = $2
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    const result2 = await pool.query(sql2, [userId, productId]);
    console.log('Resultado da query 2:', result2.rows.length, 'linhas');
    if (result2.rows.length > 0) {
      console.log('Dados encontrados:', {
        orderId: result2.rows[0].id,
        orderNumber: result2.rows[0].order_number,
        status: result2.rows[0].status,
        userId: result2.rows[0].user_id,
        customerEmail: result2.rows[0].customer_email,
        createdAt: result2.rows[0].created_at
      });
    } else {
      console.log('❌ Nenhum resultado encontrado');
    }
    
    // 3. Testar apenas por user_id
    console.log('\n3. Testando apenas por user_id...');
    const sql3 = `
      SELECT o.*, oi.quantity, oi.unit_price as item_unit_price, oi.total_price as item_total_price
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      AND oi.product_id = $2
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    const result3 = await pool.query(sql3, [userId, productId]);
    console.log('Resultado da query 3:', result3.rows.length, 'linhas');
    if (result3.rows.length > 0) {
      console.log('Dados encontrados:', {
        orderId: result3.rows[0].id,
        orderNumber: result3.rows[0].order_number,
        status: result3.rows[0].status,
        userId: result3.rows[0].user_id,
        customerEmail: result3.rows[0].customer_email,
        createdAt: result3.rows[0].created_at
      });
    } else {
      console.log('❌ Nenhum resultado encontrado');
    }
    
    // 4. Testar apenas por customer_email
    console.log('\n4. Testando apenas por customer_email...');
    const sql4 = `
      SELECT o.*, oi.quantity, oi.unit_price as item_unit_price, oi.total_price as item_total_price
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_email = $1
      AND oi.product_id = $2
      ORDER BY o.created_at DESC
      LIMIT 1
    `;
    
    const result4 = await pool.query(sql4, [userEmail, productId]);
    console.log('Resultado da query 4:', result4.rows.length, 'linhas');
    if (result4.rows.length > 0) {
      console.log('Dados encontrados:', {
        orderId: result4.rows[0].id,
        orderNumber: result4.rows[0].order_number,
        status: result4.rows[0].status,
        userId: result4.rows[0].user_id,
        customerEmail: result4.rows[0].customer_email,
        createdAt: result4.rows[0].created_at
      });
    } else {
      console.log('❌ Nenhum resultado encontrado');
    }
    
    // 5. Verificar se o email do usuário está correto
    console.log('\n5. Verificando email do usuário...');
    const sql5 = `SELECT email FROM users WHERE id = $1`;
    const result5 = await pool.query(sql5, [userId]);
    console.log('Email do usuário no banco:', result5.rows[0]?.email);
    
    // 6. Verificar todas as compras do usuário para este produto
    console.log('\n6. Verificando todas as compras do usuário para este produto...');
    const sql6 = `
      SELECT o.id, o.order_number, o.status, o.user_id, o.customer_email, o.created_at
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.product_id = $1
      ORDER BY o.created_at DESC
    `;
    
    const result6 = await pool.query(sql6, [productId]);
    console.log('Todas as compras para este produto:', result6.rows.length, 'linhas');
    result6.rows.forEach((row, index) => {
      console.log(`${index + 1}. Order: ${row.order_number}, Status: ${row.status}, User ID: ${row.user_id}, Email: ${row.customer_email}, Data: ${row.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

debugAPIQuery();