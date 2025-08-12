const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const token = jwt.sign(
  {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@skinaecopecas.com.br',
    role: 'admin'
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Token gerado:', token);