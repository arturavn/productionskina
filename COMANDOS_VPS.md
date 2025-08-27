# 📋 Comandos Essenciais para VPS - Skina Ecopeças

## 🔍 Comandos para Descobrir Localização do Projeto

### 1. Verificar aplicações PM2 rodando
```bash
pm2 list
pm2 show skina-backend
```

### 2. Encontrar diretório do projeto
```bash
# Buscar pelo arquivo server.js
find /home -name "server.js" -type f 2>/dev/null
find /var/www -name "server.js" -type f 2>/dev/null
find /opt -name "server.js" -type f 2>/dev/null

# Buscar pela pasta server
find / -name "server" -type d 2>/dev/null | grep -v proc

# Ver processos Node.js rodando
ps aux | grep node
```

### 3. Verificar diretório atual
```bash
pwd
ls -la
```

## 📁 Localização Confirmada do Projeto
**Diretório principal:** `/var/www/productionskina/`
**Diretório do servidor:** `/var/www/productionskina/server/`

## 🔧 Comandos para Acessar Arquivos Essenciais

### Arquivo .env (Configurações do Servidor)
```bash
# Visualizar
cat /var/www/productionskina/server/.env

# Editar
nano /var/www/productionskina/server/.env
# ou
vi /var/www/productionskina/server/.env
```

### Arquivo server.js (Aplicação Principal)
```bash
# Visualizar
cat /var/www/productionskina/server/server.js

# Editar
nano /var/www/productionskina/server/server.js
```

### Package.json (Dependências)
```bash
# Visualizar
cat /var/www/productionskina/server/package.json

# Editar
nano /var/www/productionskina/server/package.json
```

### Logs da Aplicação
```bash
# Ver logs em tempo real
pm2 logs skina-backend

# Ver logs específicos
pm2 logs skina-backend --lines 100

# Logs de erro
cat /root/.pm2/logs/skina-backend-error.log

# Logs de saída
cat /root/.pm2/logs/skina-backend-out.log
```

## 🗄️ Comandos para Banco de Dados

### Conectar ao PostgreSQL
```bash
# Conectar como usuário postgres
psql -h localhost -U postgres -d skina_ecopecas

# Listar tabelas
psql -h localhost -U postgres -d skina_ecopecas -c "\dt"
```

### Backup do Banco
```bash
# Executar script de backup
cd /var/www/productionskina
./backup-database.sh

# Backup manual
pg_dump -h localhost -U postgres -d skina_ecopecas > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🔄 Comandos de Manutenção

### Gerenciar PM2
```bash
# Listar aplicações
pm2 list

# Reiniciar aplicação
pm2 restart skina-backend

# Parar aplicação
pm2 stop skina-backend

# Iniciar aplicação
pm2 start skina-backend

# Ver detalhes
pm2 show skina-backend

# Monitorar recursos
pm2 monit
```

### Atualizar Código
```bash
# Navegar para o diretório
cd /var/www/productionskina

# Verificar status do Git
git status

# Puxar atualizações
git pull

# Reiniciar aplicação
pm2 restart skina-backend
```

### Manutenção Segura (com backup)
```bash
# Executar script de manutenção completa
cd /var/www/productionskina
./manutencao-segura.sh
```

## 📂 Estrutura de Diretórios Importantes

```
/var/www/productionskina/
├── server/
│   ├── .env                 ← Configurações do servidor
│   ├── server.js           ← Aplicação principal
│   ├── package.json        ← Dependências
│   ├── migrations/         ← Scripts de banco
│   ├── routes/             ← Rotas da API
│   ├── models/             ← Modelos de dados
│   └── services/           ← Serviços
├── src/                    ← Frontend React
├── public/                 ← Arquivos estáticos
├── backup-database.sh      ← Script de backup
├── restore-database.sh     ← Script de restauração
└── manutencao-segura.sh    ← Script de manutenção
```

## 🔐 Comandos de Segurança

### Verificar Permissões
```bash
# Ver permissões dos arquivos
ls -la /var/www/productionskina/server/

# Verificar proprietário
ls -la /var/www/productionskina/server/.env
```

### Backup de Segurança
```bash
# Backup completo do projeto
tar -czf backup_projeto_$(date +%Y%m%d).tar.gz /var/www/productionskina/

# Backup apenas do .env
cp /var/www/productionskina/server/.env /var/www/productionskina/server/.env.backup
```

## 🚨 Comandos de Emergência

### Se a aplicação não estiver respondendo
```bash
# Ver status
pm2 list

# Reiniciar forçado
pm2 restart skina-backend --force

# Parar e iniciar
pm2 stop skina-backend
pm2 start skina-backend

# Ver logs de erro
pm2 logs skina-backend --err
```

### Restaurar backup do banco
```bash
# Listar backups disponíveis
ls -la /var/www/productionskina/backups/

# Restaurar backup específico
cd /var/www/productionskina
./restore-database.sh backups/backup_YYYYMMDD_HHMMSS.sql
```

## 📝 Notas Importantes

1. **Sempre fazer backup antes de mudanças importantes**
2. **Testar em ambiente local antes de aplicar no VPS**
3. **Verificar logs após qualquer alteração**
4. **Manter backups regulares do banco de dados**
5. **Documentar todas as alterações feitas**

## 🔗 Links Úteis

- **Logs PM2:** `/root/.pm2/logs/`
- **Configuração:** `/var/www/productionskina/server/.env`
- **Backups:** `/var/www/productionskina/backups/`
- **Aplicação:** `/var/www/productionskina/server/server.js`

---
*Documento criado em: $(date)*
*Projeto: Skina Ecopeças*
*VPS: Hostinger*