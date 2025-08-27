const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 8080;

// Middleware para adicionar headers do ngrok
app.use((req, res, next) => {
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});

// Proxy para requisições da API
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Servir o index.html para todas as outras rotas (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📡 API proxy: http://localhost:${PORT}/api -> http://localhost:3001/api`);
});