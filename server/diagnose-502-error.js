#!/usr/bin/env node

/**
 * Script de Diagnóstico para Erro 502 Bad Gateway
 * Verifica se o problema está no Nginx ou no PM2
 */

const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔍 DIAGNÓSTICO DO ERRO 502 BAD GATEWAY');
console.log('=' .repeat(50));

// Função para fazer requisição HTTP
function makeRequest(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, { timeout }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data.substring(0, 200) // Primeiros 200 chars
                });
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Função para executar comando e capturar saída
async function runCommand(command, description) {
    try {
        console.log(`\n🔧 ${description}`);
        console.log(`Comando: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        if (stdout) console.log(`✅ Saída: ${stdout.trim()}`);
        if (stderr) console.log(`⚠️  Erro: ${stderr.trim()}`);
        return { success: true, stdout, stderr };
    } catch (error) {
        console.log(`❌ Falha: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log(`\n📅 Iniciado em: ${new Date().toISOString()}`);
    
    // 1. Verificar status do PM2
    console.log('\n' + '='.repeat(30));
    console.log('1️⃣  VERIFICANDO PM2');
    console.log('='.repeat(30));
    
    await runCommand('pm2 list', 'Listando processos PM2');
    await runCommand('pm2 show skina-backend', 'Detalhes do processo skina-backend');
    await runCommand('pm2 logs skina-backend --lines 10', 'Últimos 10 logs do skina-backend');
    
    // 2. Testar conexão direta com o backend (porta 3001)
    console.log('\n' + '='.repeat(30));
    console.log('2️⃣  TESTANDO BACKEND DIRETO');
    console.log('='.repeat(30));
    
    const backendTests = [
        'http://localhost:3001',
        'http://localhost:3001/api/test',
        'http://localhost:3001/api/mercado_livre/ml-products?limit=1'
    ];
    
    for (const url of backendTests) {
        try {
            console.log(`\n🌐 Testando: ${url}`);
            const response = await makeRequest(url);
            console.log(`✅ Status: ${response.statusCode}`);
            console.log(`📄 Resposta: ${response.data}`);
        } catch (error) {
            console.log(`❌ Erro: ${error.message}`);
        }
    }
    
    // 3. Verificar configuração do Nginx
    console.log('\n' + '='.repeat(30));
    console.log('3️⃣  VERIFICANDO NGINX');
    console.log('='.repeat(30));
    
    await runCommand('nginx -t', 'Testando configuração do Nginx');
    await runCommand('systemctl status nginx', 'Status do serviço Nginx');
    
    // 4. Verificar logs do Nginx
    console.log('\n' + '='.repeat(30));
    console.log('4️⃣  LOGS DO NGINX');
    console.log('='.repeat(30));
    
    await runCommand('tail -n 20 /var/log/nginx/error.log', 'Últimos erros do Nginx');
    await runCommand('tail -n 10 /var/log/nginx/access.log', 'Últimos acessos do Nginx');
    
    // 5. Verificar portas em uso
    console.log('\n' + '='.repeat(30));
    console.log('5️⃣  VERIFICANDO PORTAS');
    console.log('='.repeat(30));
    
    await runCommand('netstat -tlnp | grep :3001', 'Verificando porta 3001 (backend)');
    await runCommand('netstat -tlnp | grep :80', 'Verificando porta 80 (nginx)');
    await runCommand('netstat -tlnp | grep :443', 'Verificando porta 443 (nginx ssl)');
    
    // 6. Testar conectividade interna
    console.log('\n' + '='.repeat(30));
    console.log('6️⃣  TESTE DE CONECTIVIDADE INTERNA');
    console.log('='.repeat(30));
    
    await runCommand('curl -I http://localhost:3001', 'Curl direto para backend');
    await runCommand('curl -I http://localhost/api/test', 'Curl via Nginx para API');
    
    // 7. Verificar configuração do site Nginx
    console.log('\n' + '='.repeat(30));
    console.log('7️⃣  CONFIGURAÇÃO DO SITE NGINX');
    console.log('='.repeat(30));
    
    await runCommand('ls -la /etc/nginx/sites-enabled/', 'Sites habilitados no Nginx');
    await runCommand('cat /etc/nginx/sites-enabled/default', 'Configuração do site default');
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 DIAGNÓSTICO CONCLUÍDO');
    console.log('='.repeat(50));
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Analise os logs acima para identificar erros');
    console.log('2. Verifique se o PM2 está rodando corretamente');
    console.log('3. Teste se o backend responde na porta 3001');
    console.log('4. Verifique se o Nginx consegue fazer proxy para o backend');
    console.log('5. Analise os logs de erro do Nginx para mais detalhes');
}

main().catch(console.error);