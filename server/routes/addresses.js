import express from 'express';
import { body, validationResult } from 'express-validator';
import UserAddress from '../models/UserAddress.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Middleware de validação para endereços
const validateAddress = [
  body('title').notEmpty().withMessage('Título é obrigatório'),
  body('recipientName').notEmpty().withMessage('Nome do destinatário é obrigatório'),
  body('street').notEmpty().withMessage('Rua é obrigatória'),
  body('number').notEmpty().withMessage('Número é obrigatório'),
  body('neighborhood').notEmpty().withMessage('Bairro é obrigatório'),
  body('city').notEmpty().withMessage('Cidade é obrigatória'),
  body('state').notEmpty().withMessage('Estado é obrigatório'),
  body('zipCode').notEmpty().withMessage('CEP é obrigatório')
    .matches(/^\d{5}-?\d{3}$/).withMessage('CEP deve ter o formato 00000-000')
];

// Listar endereços do usuário
router.get('/', authenticateToken, async (req, res) => {
  try {
    const addresses = await UserAddress.findByUserId(req.user.id);
    res.json(addresses.map(address => address.toJSON()));
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar endereço específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const address = await UserAddress.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    
    // Verificar se o endereço pertence ao usuário
    if (address.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    res.json(address.toJSON());
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo endereço
router.post('/', authenticateToken, validateAddress, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const addressData = {
      userId: req.user.id,
      title: req.body.title,
      recipientName: req.body.recipientName,
      street: req.body.street,
      number: req.body.number,
      complement: req.body.complement,
      neighborhood: req.body.neighborhood,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
      country: req.body.country || 'Brasil',
      isDefault: req.body.isDefault || false
    };

    const address = await UserAddress.create(addressData);
    res.status(201).json(address.toJSON());
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar endereço
router.put('/:id', authenticateToken, validateAddress, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verificar se o endereço existe e pertence ao usuário
    const existingAddress = await UserAddress.findById(req.params.id);
    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    
    if (existingAddress.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const addressData = {
      title: req.body.title,
      recipientName: req.body.recipientName,
      street: req.body.street,
      number: req.body.number,
      complement: req.body.complement,
      neighborhood: req.body.neighborhood,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
      country: req.body.country || 'Brasil',
      isDefault: req.body.isDefault || false
    };

    const address = await UserAddress.update(req.params.id, addressData);
    res.json(address.toJSON());
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Definir endereço como padrão
router.patch('/:id/default', authenticateToken, async (req, res) => {
  try {
    // Verificar se o endereço existe e pertence ao usuário
    const existingAddress = await UserAddress.findById(req.params.id);
    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    
    if (existingAddress.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const address = await UserAddress.setAsDefault(req.params.id, req.user.id);
    res.json(address.toJSON());
  } catch (error) {
    console.error('Erro ao definir endereço como padrão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar endereço
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar se o endereço existe e pertence ao usuário
    const existingAddress = await UserAddress.findById(req.params.id);
    if (!existingAddress) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    
    if (existingAddress.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const deleted = await UserAddress.delete(req.params.id);
    if (deleted) {
      res.json({ message: 'Endereço deletado com sucesso' });
    } else {
      res.status(404).json({ error: 'Endereço não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;