# 🚀 Scripts de Automação para Desenvolvimento

Este projeto inclui scripts automatizados para facilitar o desenvolvimento em diferentes ambientes e redes.

## 📋 Scripts Disponíveis

### 1. `start-dev-auto.sh` - Configuração Completa
**Uso:** Primeira vez ou quando há problemas
```bash
./start-dev-auto.sh
```

**O que faz:**
- ✅ Verifica e instala dependências (Node.js, npm, ngrok)
- ✅ Configura arquivos de ambiente (.env)
- ✅ Instala dependências do projeto (npm install)
- ✅ Libera portas ocupadas (3001, 5173)
- ✅ Inicia backend na porta 3001
- ✅ Inicia frontend na porta 5173
- ✅ Configura ngrok para acesso público
- ✅ Monitora processos e exibe status
- ✅ Cria logs detalhados

### 2. `quick-start.sh` - Início Rápido
**Uso:** Uso diário quando tudo já está configurado
```bash
./quick-start.sh
```

**O que faz:**
- ⚡ Libera portas rapidamente
- ⚡ Inicia todos os serviços em segundos
- ⚡ Exibe URLs de acesso
- ⚡ Mantém processos rodando

### 3. `stop-dev.sh` - Parar Serviços
**Uso:** Para parar todos os serviços
```bash
./stop-dev.sh
```

**O que faz:**
- 🛑 Para backend, frontend e ngrok
- 🛑 Libera todas as portas
- 🛑 Remove arquivos de PID

## 🌐 Portas Utilizadas

| Serviço | Porta | URL |
|---------|-------|-----|
| Backend | 3001 | http://localhost:3001 |
| Frontend | 5173 | http://localhost:5173 |
| ngrok Admin | 4040 | http://localhost:4040 |
| ngrok Público | - | https://xxxxx.ngrok-free.app |

## 📁 Arquivos Gerados

Os scripts criam automaticamente:

```
├── backend.pid          # PID do processo backend
├── frontend.pid         # PID do processo frontend
├── ngrok.pid           # PID do processo ngrok
├── ngrok.url           # URL pública do ngrok
├── backend.log         # Log do backend
├── frontend.log        # Log do frontend
├── ngrok.log          # Log do ngrok
└── stop-dev.sh        # Script de parada (criado automaticamente)
```

## 🔧 Pré-requisitos

### Obrigatórios:
- **Node.js** (v16 ou superior)
- **npm** (incluído com Node.js)
- **macOS** (scripts otimizados para Mac)

### Opcionais (instalados automaticamente):
- **Homebrew** (para instalar ngrok)
- **ngrok** (para acesso público)

## 🚀 Guia de Uso

### Primeira Vez / Novo Ambiente:
```bash
# 1. Navegue até o diretório do projeto
cd skina-ecopecas-storefront-main

# 2. Execute o script completo
./start-dev-auto.sh

# 3. Aguarde a configuração automática
# O script irá:
# - Verificar dependências
# - Configurar ambiente
# - Iniciar todos os serviços
# - Exibir URLs de acesso
```

### Uso Diário:
```bash
# Início rápido (quando tudo já está configurado)
./quick-start.sh

# Para parar
./stop-dev.sh
```

### Monitoramento:
```bash
# Ver logs em tempo real
tail -f backend.log
tail -f frontend.log
tail -f ngrok.log

# Ver todos os logs juntos
tail -f *.log
```

## 🌍 Acesso Remoto com ngrok

O ngrok permite acessar seu ambiente local de qualquer lugar:

1. **URL Local:** http://localhost:5173
2. **URL Pública:** https://xxxxx.ngrok-free.app (exibida no terminal)
3. **Painel ngrok:** http://localhost:4040

### Configuração do ngrok:
```bash
# Se for a primeira vez usando ngrok, configure sua conta:
ngrok config add-authtoken SEU_TOKEN_AQUI
```

## 🔍 Solução de Problemas

### Problema: Porta já está em uso
```bash
# Os scripts automaticamente liberam as portas, mas se precisar fazer manualmente:
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
pkill -f "ngrok"               # ngrok
```

### Problema: ngrok não funciona
```bash
# Instalar ngrok manualmente:
brew install ngrok/ngrok/ngrok

# Ou baixar de: https://ngrok.com/download
```

### Problema: Dependências não instaladas
```bash
# Instalar dependências manualmente:
npm install                    # Frontend
cd server && npm install       # Backend
```

### Problema: Arquivos .env não existem
```bash
# Os scripts copiam automaticamente, mas se precisar fazer manualmente:
cp .env.example .env
cp server/.env.example server/.env
```

## 📊 Status dos Serviços

Após executar os scripts, você verá:

```
=== AMBIENTE DE DESENVOLVIMENTO CONFIGURADO ===

Serviços rodando:
  🔧 Backend:  http://localhost:3001 (PID: 12345)
  🌐 Frontend: http://localhost:5173 (PID: 12346)
  🌍 Público:  https://xxxxx.ngrok-free.app (PID: 12347)

Logs disponíveis:
  📄 Backend:  tail -f backend.log
  📄 Frontend: tail -f frontend.log
  📄 ngrok:    tail -f ngrok.log

Para parar todos os serviços: ./stop-dev.sh
```

## 🎯 Vantagens dos Scripts

✅ **Automação Completa:** Um comando inicia tudo
✅ **Portabilidade:** Funciona em qualquer rede/ambiente
✅ **Monitoramento:** Logs organizados e status em tempo real
✅ **Recuperação:** Detecta e corrige problemas automaticamente
✅ **Flexibilidade:** Script completo ou rápido conforme necessidade
✅ **Limpeza:** Para todos os serviços com um comando

## 🔄 Fluxo de Trabalho Recomendado

```bash
# Chegou em um novo local/rede?
./start-dev-auto.sh    # Primeira vez

# Desenvolvimento diário:
./quick-start.sh       # Início rápido
# ... trabalhar ...
./stop-dev.sh         # Parar ao final

# Mudou de rede?
./quick-start.sh       # Reinicia com nova configuração de rede
```

## 📝 Notas Importantes

- Os scripts são **idempotentes** - podem ser executados múltiplas vezes sem problemas
- Todos os processos são **monitorados** e podem ser parados com Ctrl+C
- Os **logs são preservados** entre execuções para debugging
- O **ngrok gera uma nova URL** a cada execução (versão gratuita)
- Os scripts **detectam automaticamente** se os serviços já estão rodando

---

**Desenvolvido para facilitar o desenvolvimento em múltiplos ambientes de rede** 🚀