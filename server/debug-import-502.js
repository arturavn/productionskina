import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import axios from 'axios';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 DIAGNÓSTICO DO ERRO 502 NA IMPORTAÇÃO DE PRODUTOS');
console.log('=' .repeat(60));

// Função para testar conexão com banco
async function testDatabaseConnection() {
  console.log('\n📊 TESTANDO CONEXÃO COM BANCO DE DADOS...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'skina_ecopecas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'skinalogindb'
  });
  
  try {
    await client.connect();
    console.log('✅ Conexão com PostgreSQL estabelecida');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query de teste executada:', result.rows[0].current_time);
    
    // Verificar tabela products
    const productsCheck = await client.query('SELECT COUNT(*) FROM products');
    console.log('✅ Tabela products acessível, total de produtos:', productsCheck.rows[0].count);
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error.message);
    return false;
  }
}

// Função para testar o backend
async function testBackendHealth() {
  console.log('\n🌐 TESTANDO SAÚDE DO BACKEND...');
  
  try {
    // Testar rota de saúde
    const healthResponse = await axios.get('http://localhost:3001/api/test/health', {
      timeout: 5000
    });
    console.log('✅ Rota de saúde respondeu:', healthResponse.status, healthResponse.data);
    
    // Testar rota de produtos
    const productsResponse = await axios.get('http://localhost:3001/api/products', {
      timeout: 5000
    });
    console.log('✅ Rota de produtos respondeu:', productsResponse.status, 'produtos encontrados:', productsResponse.data.length || 0);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar backend:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    return false;
  }
}

// Função para testar rota específica de importação
async function testImportRoute() {
  console.log('\n📦 TESTANDO ROTA DE IMPORTAÇÃO...');
  
  try {
    // Primeiro, tentar fazer login para obter token
    console.log('🔐 Tentando fazer login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@skina.com.br',
      password: 'admin123'
    }, {
      timeout: 5000
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      console.log('✅ Login realizado com sucesso');
      const token = loginResponse.data.token;
      
      // Testar rota de importação com um ID de teste
      console.log('📦 Testando rota de importação...');
      const importResponse = await axios.post('http://localhost:3001/api/mercado_livre/import/MLB123456789', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos para importação
      });
      
      console.log('✅ Rota de importação respondeu:', importResponse.status, importResponse.data);
      return true;
    } else {
      console.log('❌ Falha no login:', loginResponse.status, loginResponse.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar rota de importação:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Se for erro 502, isso confirma o problema
    if (error.response?.status === 502) {
      console.log('🎯 CONFIRMADO: Erro 502 Bad Gateway na rota de importação!');
      console.log('📋 Possíveis causas:');
      console.log('   1. Timeout na conexão com banco de dados');
      console.log('   2. Erro não tratado no código que causa crash');
      console.log('   3. Problema na conexão com API do Mercado Livre');
      console.log('   4. Nginx retornando 502 por timeout do backend');
    }
    
    return false;
  }
}

// Função para verificar logs do PM2
async function checkPM2Logs() {
  console.log('\n📋 VERIFICANDO LOGS DO PM2...');
  
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Verificar status do PM2
    const statusResult = await execAsync('pm2 status');
    console.log('📊 Status do PM2:');
    console.log(statusResult.stdout);
    
    // Verificar logs recentes
    const logsResult = await execAsync('pm2 logs skina-backend --lines 20 --nostream');
    console.log('📋 Logs recentes do PM2:');
    console.log(logsResult.stdout);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar logs do PM2:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando diagnóstico completo...');
  
  // Carregar variáveis de ambiente
  const envPath = join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
    
    console.log('✅ Variáveis de ambiente carregadas do .env');
  }
  
  const results = {
    database: await testDatabaseConnection(),
    backend: await testBackendHealth(),
    import: await testImportRoute(),
    pm2: await checkPM2Logs()
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO DIAGNÓSTICO:');
  console.log('=' .repeat(60));
  console.log('🗄️  Banco de dados:', results.database ? '✅ OK' : '❌ ERRO');
  console.log('🌐 Backend:', results.backend ? '✅ OK' : '❌ ERRO');
  console.log('📦 Importação:', results.import ? '✅ OK' : '❌ ERRO');
  console.log('📋 PM2:', results.pm2 ? '✅ OK' : '❌ ERRO');
  
  if (!results.import) {
    console.log('\n🔧 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('1. Verificar logs detalhados do PM2: pm2 logs skina-backend --lines 50');
    console.log('2. Verificar logs do Nginx: sudo tail -f /var/log/nginx/error.log');
    console.log('3. Testar importação diretamente no backend sem passar pelo Nginx');
    console.log('4. Verificar timeout do Nginx para rotas do backend');
  }
}

// Executar diagnóstico
main().catch(error => {
  console.error('❌ Erro fatal no diagnóstico:', error);
  process.exit(1);
});