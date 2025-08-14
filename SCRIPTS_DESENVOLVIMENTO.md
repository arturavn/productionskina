# 🚀 Scripts de Automação para Desenvolvimento

Este projeto inclui scripts automatizados para facilitar o desenvolvimento em diferentes ambientes e redes.

## 📁 Arquivos Criados

### Configurações de Ambiente

#### Backend (server/)
- **`server/.env`** - Configuração padrão (produção/VPS)
- **`server/.env.local`** - Configuração para desenvolvimento local

#### Frontend (raiz do projeto)
- **`.env`** - Configuração padrão (produção/VPS)
- **`.env.local`** - Configuração para desenvolvimento local
- **`vite.config.ts`** - Configuração do Vite (funciona para ambos os ambientes)

### Scripts de Automação
- **`switch-env.sh`** - Alterna entre configurações de ambiente (backend + frontend)
- **`start-local.sh`** - Inicia desenvolvimento local
- **`start-production.sh`** - Inicia em modo produção

## 🚀 Como Usar

### 1. Desenvolvimento Local

```bash
# Inicia automaticamente em modo desenvolvimento
./start-local.sh
```

**O que acontece:**
- Alterna para configuração `.env.local` (backend e frontend)
- Mantém `vite.config.ts` original (já configurado para desenvolvimento)
- Instala dependências se necessário
- Inicia backend (porta 3001) e frontend (porta 5173)
- URLs disponíveis:
  - Frontend: http://localhost:5173
  - Backend: http://localhost:3001
  - API: http://localhost:3001/api

### 2. Preparação para Produção/VPS

```bash
# Prepara arquivos para produção (antes de enviar para VPS)
./start-production.sh
```

**O que acontece:**
- Alterna para configuração `.env` (produção - backend e frontend)
- Restaura `vite.config.ts` original do backup
- Instala dependências de produção
- Constrói a aplicação (build)
- **Prepara os arquivos para serem enviados ao VPS**

> **Nota:** Este script é usado localmente apenas para preparar os arquivos antes de fazer o deploy no VPS. No VPS, você usará os comandos específicos documentados em `COMANDOS_VPS.md`.

### 3. Alternância Manual de Ambiente

```bash
# Alterna para desenvolvimento
./switch-env.sh local

# Alterna para produção
./switch-env.sh production

# Verifica status atual
./switch-env.sh status

# Cria backup da configuração atual
./switch-env.sh backup

# Restaura backup
./switch-env.sh restore
```

## ⚙️ Configurações Específicas do Frontend

### Variáveis de Ambiente

#### `.env` (Produção)
```bash
VITE_API_URL=https://skinaecopecas.com.br/api
```

#### `.env.local` (Desenvolvimento)
```bash
VITE_API_URL=http://localhost:3001/api
```

### Configurações do Vite

#### `vite.config.ts`
- Configuração única que funciona para desenvolvimento e produção
- Proxy configurado para `http://localhost:3001/api` em desenvolvimento
- Build otimizado para produção
- Hot reload automático em modo desenvolvimento

### Como o Sistema Funciona

1. **Desenvolvimento Local:**
   - `switch-env.sh local` copia `.env.local` → `.env`
   - `vite.config.ts` detecta automaticamente o modo desenvolvimento
   - Frontend faz requisições para `http://localhost:3001/api`
   - Proxy do Vite redireciona `/api` para o backend local

2. **Preparação para Produção/VPS:**
   - `switch-env.sh production` restaura arquivos originais do backup
   - `vite.config.ts` funciona em modo produção
   - Build preparado para `https://skinaecopecas.com.br/api`
   - Arquivos prontos para deploy no VPS (onde nginx faz proxy reverso)

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