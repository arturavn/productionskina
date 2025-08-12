#!/bin/bash

# Script para configuração inicial do ngrok
# Execute este script apenas uma vez para configurar sua conta ngrok

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 Configuração do ngrok"
echo

# Verificar se ngrok está instalado
if ! command -v ngrok >/dev/null 2>&1; then
    print_status "ngrok não encontrado. Instalando..."
    
    if command -v brew >/dev/null 2>&1; then
        brew install ngrok/ngrok/ngrok
        print_success "ngrok instalado via Homebrew"
    else
        print_error "Homebrew não encontrado."
        print_error "Por favor, instale o ngrok manualmente:"
        print_error "1. Visite: https://ngrok.com/download"
        print_error "2. Baixe e instale o ngrok"
        print_error "3. Execute este script novamente"
        exit 1
    fi
else
    print_success "ngrok já está instalado"
fi

echo
print_status "Para usar o ngrok, você precisa de uma conta gratuita."
print_status "Se você ainda não tem uma conta:"
echo "  1. Visite: https://dashboard.ngrok.com/signup"
echo "  2. Crie uma conta gratuita"
echo "  3. Copie seu authtoken do dashboard"
echo

# Verificar se já está configurado
if ngrok config check >/dev/null 2>&1; then
    print_success "ngrok já está configurado!"
    
    # Testar conexão
    print_status "Testando configuração..."
    timeout 10s ngrok http 8080 --log=stdout > /tmp/ngrok_test.log 2>&1 &
    NGROK_PID=$!
    sleep 3
    
    if kill -0 $NGROK_PID 2>/dev/null; then
        kill $NGROK_PID 2>/dev/null || true
        print_success "✅ ngrok está funcionando corretamente!"
    else
        print_warning "⚠️  Possível problema na configuração do ngrok"
    fi
    
    rm -f /tmp/ngrok_test.log
else
    print_warning "ngrok não está configurado."
    echo
    echo "Para configurar o ngrok:"
    echo "  1. Visite: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "  2. Copie seu authtoken"
    echo "  3. Execute: ngrok config add-authtoken SEU_TOKEN_AQUI"
    echo
    
    read -p "Você tem um authtoken do ngrok? (s/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo
        read -p "Cole seu authtoken aqui: " AUTHTOKEN
        
        if [ ! -z "$AUTHTOKEN" ]; then
            print_status "Configurando ngrok..."
            ngrok config add-authtoken "$AUTHTOKEN"
            
            if ngrok config check >/dev/null 2>&1; then
                print_success "✅ ngrok configurado com sucesso!"
                
                # Testar configuração
                print_status "Testando configuração..."
                timeout 10s ngrok http 8080 --log=stdout > /tmp/ngrok_test.log 2>&1 &
                NGROK_PID=$!
                sleep 3
                
                if kill -0 $NGROK_PID 2>/dev/null; then
                    kill $NGROK_PID 2>/dev/null || true
                    print_success "✅ Teste bem-sucedido!"
                else
                    print_warning "⚠️  Possível problema na configuração"
                fi
                
                rm -f /tmp/ngrok_test.log
            else
                print_error "❌ Erro na configuração do ngrok"
                exit 1
            fi
        else
            print_error "Token não fornecido"
            exit 1
        fi
    else
        echo
        print_status "Sem problema! Você pode usar o ngrok sem conta, mas com limitações."
        print_status "Para criar uma conta gratuita: https://dashboard.ngrok.com/signup"
    fi
fi

echo
print_success "🎉 Configuração do ngrok concluída!"
echo
print_status "Agora você pode usar os scripts de desenvolvimento:"
echo "  ./start-dev-auto.sh  # Configuração completa"
echo "  ./quick-start.sh     # Início rápido"
echo
print_status "O ngrok permitirá acesso público ao seu ambiente local."
print_status "Útil para:"
echo "  📱 Testar em dispositivos móveis"
echo "  🌐 Compartilhar com colegas"
echo "  🔗 Webhooks e APIs externas"
echo "  🧪 Testes em diferentes redes"
echo