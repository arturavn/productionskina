#!/bin/bash

# Script para fazer deploy das correções de JSON-LD para o VPS
echo "🚀 Iniciando deploy das correções de JSON-LD para o VPS..."

# Copiar o arquivo index.html para o VPS
echo "📦 Copiando index.html para o VPS..."
scp index.html usuario@seu-vps:/caminho/para/site/

# Executar o build no VPS
echo "🔨 Executando build no VPS..."
ssh usuario@seu-vps "cd /caminho/para/site/ && npm run build"

# Verificar se o JSON-LD foi atualizado corretamente
echo "✅ Verificando se o JSON-LD foi atualizado corretamente..."
ssh usuario@seu-vps "grep -A 15 '\"@type\": \"Product\"' /caminho/para/site/dist/index.html"

echo "🎉 Deploy concluído! Aguarde algumas horas para o Google atualizar o cache."
echo "🔍 Teste novamente no Google Rich Results Test: https://search.google.com/test/rich-results"
