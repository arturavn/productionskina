// Script para debugar o problema do cupom
import jwt from 'jsonwebtoken';
import { query } from './config/database.js';

// Token que pode estar sendo usado (exemplo do debug-token.html)
const EXAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGZhNzNkZi1hNzY4LTQ5YzQtOGJjZC1hNzY4ZjU5ZjU5ZjUiLCJlbWFpbCI6ImFydHVyYXZuMjhAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTMzMzE5MzksImV4cCI6MTc1MzkzNjczOX0.dpKAr4VeZEyRVGE-ISoMtAgwrxFGxzTrWXMRIlywBIk';

async function debugCouponIssue() {
  try {
    console.log('=== DEBUG DO PROBLEMA DO CUPOM ===\n');
    
    // 1. Verificar dados do cupom
    console.log('1. Dados do cupom SKINA4010590E:');
    const couponResult = await query('SELECT * FROM coupons WHERE code = $1', ['SKINA4010590E']);
    if (couponResult.rows.length > 0) {
      const coupon = couponResult.rows[0];
      console.log(`   - ID: ${coupon.id}`);
      console.log(`   - Código: ${coupon.code}`);
      console.log(`   - User ID: ${coupon.user_id}`);
      console.log(`   - Usado: ${coupon.is_used}`);
      console.log(`   - Expira em: ${coupon.expires_at}`);
      
      // 2. Verificar dados do usuário dono do cupom
      console.log('\n2. Dados do usuário dono do cupom:');
      const userResult = await query('SELECT id, email, name FROM users WHERE id = $1', [coupon.user_id]);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Nome: ${user.name}`);
      }
      
      // 3. Tentar decodificar o token de exemplo
      console.log('\n3. Decodificando token de exemplo:');
      try {
        const decoded = jwt.verify(EXAMPLE_TOKEN, process.env.JWT_SECRET || 'skina-ecopecas-secret-key-2024');
        console.log(`   - User ID no token: ${decoded.userId}`);
        console.log(`   - Email no token: ${decoded.email}`);
        console.log(`   - Role: ${decoded.role}`);
        
        // 4. Comparar IDs
        console.log('\n4. Comparação:');
        console.log(`   - User ID do cupom: ${coupon.user_id}`);
        console.log(`   - User ID do token: ${decoded.userId}`);
        console.log(`   - IDs são iguais: ${coupon.user_id === decoded.userId}`);
        
        if (coupon.user_id !== decoded.userId) {
          console.log('\n❌ PROBLEMA ENCONTRADO:');
          console.log('   O cupom pertence a um usuário diferente do que está logado!');
          console.log('   Isso explica o erro "Este cupom não pertence a você"');
        } else {
          console.log('\n✅ IDs coincidem - o problema pode estar em outro lugar');
        }
        
      } catch (tokenError) {
        console.log(`   ❌ Erro ao decodificar token: ${tokenError.message}`);
      }
      
    } else {
      console.log('   ❌ Cupom não encontrado!');
    }
    
  } catch (error) {
    console.error('Erro durante debug:', error);
  } finally {
    process.exit(0);
  }
}

debugCouponIssue();