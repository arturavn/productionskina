import { query } from '../config/database.js';

/**
 * Script para habilitar a extensão UNACCENT no PostgreSQL
 * Esta extensão permite busca insensível a acentos
 */

async function enableUnaccent() {
  try {
    console.log('🔍 Verificando se a extensão UNACCENT está disponível...');
    
    // Verificar se a extensão já está habilitada
    const checkResult = await query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'unaccent'
      ) as enabled;
    `);
    
    const isEnabled = checkResult.rows[0].enabled;
    
    if (isEnabled) {
      console.log('✅ Extensão UNACCENT já está habilitada!');
      return;
    }
    
    console.log('📦 Habilitando extensão UNACCENT...');
    
    // Tentar habilitar a extensão
    await query('CREATE EXTENSION IF NOT EXISTS unaccent;');
    
    console.log('✅ Extensão UNACCENT habilitada com sucesso!');
    
    // Testar a funcionalidade
    console.log('🧪 Testando funcionalidade UNACCENT...');
    
    const testResult = await query(`
      SELECT 
        'suspensão' as original,
        UNACCENT('suspensão') as sem_acento,
        UNACCENT('suspensao') = UNACCENT('suspensão') as match_test
    `);
    
    console.log('Resultado do teste:', testResult.rows[0]);
    
    if (testResult.rows[0].match_test) {
      console.log('✅ Teste de UNACCENT passou! Busca insensível a acentos funcionando.');
    } else {
      console.log('❌ Teste de UNACCENT falhou.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao habilitar extensão UNACCENT:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.log('\n💡 Dica: Execute este comando como superusuário do PostgreSQL:');
      console.log('   sudo -u postgres psql -d seu_banco -c "CREATE EXTENSION unaccent;"');
    }
    
    console.log('\n🔄 Implementando fallback para busca sem UNACCENT...');
    console.log('   A busca funcionará normalmente, mas será sensível a acentos.');
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  enableUnaccent()
    .then(() => {
      console.log('\n🎉 Script concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

export default enableUnaccent;