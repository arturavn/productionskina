#!/bin/bash

# Script de deploy para forçar atualização na VPS
echo "🚀 Iniciando deploy..."

# Fazer commit das alterações se houver
git add .
git commit -m "deploy: Forçar atualização do código na VPS" || echo "Nenhuma alteração para commit"

# Push para o repositório
git push origin main

echo "✅ Deploy concluído! A VPS deve fazer pull automaticamente."
echo "💡 Se o problema persistir, verifique se o webhook de deploy está funcionando na VPS."