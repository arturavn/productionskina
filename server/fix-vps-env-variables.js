#!/usr/bin/env node

/**
 * CORREÇÃO DE VARIÁVEIS DE AMBIENTE NA VPS
 * 
 * Este script corrige as variáveis de ambiente que estão faltando ou com nomes incorretos na VPS
 * Baseado na análise do script compare-environments.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 CORREÇÃO DE VARIÁVEIS DE AMBIENTE NA VPS');
console.log('==========================================\n');

// Caminho do arquivo .env na VPS
const envPath = path.join(__dirname, '.env');

try {
    // 1. Ler arquivo .env atual
    console.log('📖 Lendo arquivo .env atual...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Arquivo .env lido com sucesso');
    
    // 2. Verificar se as variáveis já existem
    const lines = envContent.split('\n');
    let hasChanges = false;
    let newContent = envContent;
    
    // Variáveis que precisam ser adicionadas/corrigidas
    const requiredVars = {
        'MERCADOPAGO_ACCESS_TOKEN': 'MERCADO_PAGO_ACCESS_TOKEN',
        'MERCADOLIVRE_CLIENT_ID': 'ML_APP_ID',
        'MERCADOLIVRE_CLIENT_SECRET': 'ML_APP_SECRET'
    };
    
    console.log('\n🔍 Verificando variáveis necessárias...');
    
    for (const [newVar, existingVar] of Object.entries(requiredVars)) {
        // Verificar se a nova variável já existe
        const newVarExists = lines.some(line => line.startsWith(`${newVar}=`));
        
        if (!newVarExists) {
            // Procurar pela variável existente
            const existingLine = lines.find(line => line.startsWith(`${existingVar}=`));
            
            if (existingLine) {
                const value = existingLine.split('=')[1];
                const newLine = `${newVar}=${value}`;
                
                console.log(`📝 Adicionando: ${newVar}`);
                
                // Adicionar a nova variável após a existente
                const existingIndex = lines.findIndex(line => line.startsWith(`${existingVar}=`));
                lines.splice(existingIndex + 1, 0, newLine);
                hasChanges = true;
            } else {
                console.log(`⚠️  Variável ${existingVar} não encontrada`);
            }
        } else {
            console.log(`✅ ${newVar} já existe`);
        }
    }
    
    // 3. Salvar arquivo se houver mudanças
    if (hasChanges) {
        console.log('\n💾 Salvando alterações...');
        
        // Fazer backup
        const backupPath = `${envPath}.backup-${Date.now()}`;
        fs.copyFileSync(envPath, backupPath);
        console.log(`📋 Backup criado: ${backupPath}`);
        
        // Salvar novo conteúdo
        fs.writeFileSync(envPath, lines.join('\n'));
        console.log('✅ Arquivo .env atualizado com sucesso');
        
        console.log('\n📋 VARIÁVEIS ADICIONADAS:');
        for (const [newVar, existingVar] of Object.entries(requiredVars)) {
            const line = lines.find(l => l.startsWith(`${newVar}=`));
            if (line) {
                console.log(`   ${newVar}=${line.split('=')[1]}`);
            }
        }
    } else {
        console.log('\n✅ Todas as variáveis já estão corretas');
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Reiniciar o PM2: pm2 restart skina-backend');
    console.log('2. Verificar logs: pm2 logs skina-backend');
    console.log('3. Testar a aplicação');
    
} catch (error) {
    console.error('❌ Erro ao processar arquivo .env:', error.message);
    process.exit(1);
}

console.log('\n✅ Correção de variáveis de ambiente concluída!');