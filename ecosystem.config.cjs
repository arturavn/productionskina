// PM2 Ecosystem Configuration (CommonJS format)
// Este arquivo resolve o problema ES modules vs CommonJS

module.exports = {
  apps: [{
    name: 'skina-backend',
    script: './server/server.js',
    cwd: '/var/www/productionskina',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
      DB_HOST: 'localhost',
      DB_USER: 'postgres',
      DB_NAME: 'skina_ecopecas',
      DB_PASSWORD: 'skinalogindb',
      DB_PORT: '5432'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};