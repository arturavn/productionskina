import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'skina-ecopecas-secret-key-2024';

// Middleware para validação de erros
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  next();
};

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso requerido',
      message: 'Você precisa estar logado para acessar este recurso'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'Token de acesso expirado ou inválido'
      });
    }
    req.user = user;
    next();
  });
};

// POST /api/auth/register - Registrar novo usuário
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Formato de telefone inválido. Use o formato brasileiro (ex: 11987654321)'),
  body('cpf')
    .optional()
    .isLength({ min: 11, max: 14 })
    .withMessage('CPF inválido')
], handleValidationErrors, async (req, res) => {
  try {
    console.log('🔍 DEBUG - Dados recebidos no registro:', req.body);
    console.log('🔍 DEBUG - Headers:', req.headers);
    const { name, lastName, email, password, phone, cpf } = req.body;

    // Verificar se o email já existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email já cadastrado',
        message: 'Este email já está sendo usado por outro usuário'
      });
    }

    // Criar novo usuário
    const newUser = await User.create({
      name,
      lastName,
      email,
      password,
      phone: phone || null,
      cpf: cpf || null,
      role: 'user'
    });

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: newUser.toJSON(),
        token,
        expiresIn: '7d'
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/login - Login do usuário
router.post('/login', [
  body('email')
    .isEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário por email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      return res.status(401).json({
        error: 'Conta desativada',
        message: 'Sua conta foi desativada. Entre em contato com o suporte'
      });
    }

    // Verificar senha
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Último login removido - coluna não existe na tabela

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: user.toJSON(),
        token,
        expiresIn: '7d'
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/auth/profile - Obter perfil do usuário logado
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/auth/profile - Atualizar perfil do usuário
router.put('/profile', [
  authenticateToken,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Sobrenome deve ter entre 2 e 100 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone inválido'),
  body('cpf')
    .optional()
    .isLength({ min: 11, max: 14 })
    .withMessage('CPF inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, lastName, phone, cpf } = req.body;
    
    // Preparar dados para atualização
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (cpf !== undefined) updateData.cpf = cpf;
    
    // Atualizar usuário
    const updatedUser = await User.update(req.user.userId, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/change-password - Alterar senha
router.post('/change-password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Buscar usuário
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Alterar senha
    await user.changePassword(newPassword);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/forgot-password - Solicitar reset de senha
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;
    
    // Buscar usuário pelo email
    const user = await User.findByEmail(email);
    if (!user) {
      // Por segurança, sempre retornamos sucesso mesmo se o email não existir
      return res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá as instruções de redefinição'
      });
    }
    
    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora
    
    // Salvar token no banco
    await User.setResetToken(user.id, resetToken, resetTokenExpires);
    
    // Enviar email
    const emailResult = await sendPasswordResetEmail(email, resetToken, user.name);
    
    if (!emailResult.success) {
      console.error('Erro ao enviar email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar email de redefinição'
      });
    }
    
    res.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá as instruções de redefinição'
    });
  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/reset-password - Redefinir senha com token
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
], handleValidationErrors, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Buscar usuário pelo token válido
    const user = await User.findByResetToken(token);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }
    
    // Alterar senha
    await user.changePassword(newPassword);
    
    // Limpar token de reset
    await User.clearResetToken(user.id);
    
    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/logout - Logout (invalidar token)
router.post('/logout', authenticateToken, (req, res) => {
  // Em uma implementação real, você adicionaria o token a uma blacklist
  // Por enquanto, apenas retornamos sucesso
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

export { authenticateToken };
export default router;