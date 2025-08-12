import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from './auth.js';
import { query } from '../config/database.js';

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
  }
};

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📸 SLIDES ROUTER CARREGADO - Rotas disponíveis serão registradas');

// Log das rotas registradas
router.use((req, res, next) => {
  console.log('📸 SLIDES ROUTER - Requisição recebida:', req.method, req.path);
  next();
});

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/lovable-uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'slide-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens JPEG, PNG e WebP são permitidas'));
    }
  }
});

// Os slides agora são armazenados no banco de dados PostgreSQL

// GET /api/slides - Listar todos os slides
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, subtitle, background_image as "backgroundImage", cta_text as "ctaText", cta_link as "ctaLink", is_active as "isActive", display_order as "order", created_at as "createdAt", updated_at as "updatedAt" FROM slides WHERE is_active = true ORDER BY display_order ASC'
    );
    
    res.json({
      slides: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Erro ao buscar slides:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/slides/admin - Listar slides para administradores (incluindo inativos)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, subtitle, cta_text as "ctaText", cta_link as "ctaLink", background_image as "backgroundImage", is_active as "isActive", display_order as "order", created_at as "createdAt", updated_at as "updatedAt" FROM slides ORDER BY display_order ASC'
    );
    
    res.json({
      slides: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Erro ao buscar slides para admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/slides/reorder - Reordenar slides
router.put('/reorder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { slideIds } = req.body;
    
    if (!Array.isArray(slideIds)) {
      return res.status(400).json({ error: 'slideIds deve ser um array' });
    }
    
    // Validar se todos os slides existem no banco de dados
    const existingSlidesResult = await query(
      'SELECT id FROM slides WHERE id = ANY($1)',
      [slideIds]
    );
    
    if (existingSlidesResult.rows.length !== slideIds.length) {
      return res.status(400).json({ error: 'Um ou mais slides não foram encontrados' });
    }
    
    // Atualizar a ordem dos slides no banco de dados
    // A ordem é baseada na posição no array slideIds
    for (let i = 0; i < slideIds.length; i++) {
      const slideId = slideIds[i];
      const newOrder = i + 1; // Ordem começa em 1
      await query(
        'UPDATE slides SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newOrder, slideId]
      );
    }
    
    // Buscar todos os slides atualizados
    const result = await query(
      'SELECT id, title, subtitle, cta_text as "ctaText", cta_link as "ctaLink", background_image as "backgroundImage", is_active as "isActive", display_order as "order", created_at as "createdAt", updated_at as "updatedAt" FROM slides ORDER BY display_order ASC'
    );
    
    res.json({
        message: 'Slides reordenados com sucesso',
        slides: result.rows
      });
    } catch (error) {
      console.error('Erro ao reordenar slides:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/slides - Criar novo slide
router.post('/', authenticateToken, requireAdmin, upload.single('backgroundImage'), async (req, res) => {
  try {
    const { title, subtitle, ctaText, ctaLink } = req.body;
    
    if (!title || !ctaText || !ctaLink || !req.file) {
      return res.status(400).json({ error: 'Título, texto do botão, link e imagem são obrigatórios' });
    }
    
    // Buscar a próxima ordem disponível
    const orderResult = await query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM slides'
    );
    const nextOrder = orderResult.rows[0].next_order;
    
    // Inserir slide no banco de dados
    const result = await query(
      `INSERT INTO slides (title, subtitle, cta_text, cta_link, background_image, is_active, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, title, subtitle, cta_text as "ctaText", cta_link as "ctaLink", background_image as "backgroundImage", is_active as "isActive", display_order as "order", created_at as "createdAt", updated_at as "updatedAt"`,
      [title, subtitle || '', ctaText, ctaLink, `/lovable-uploads/${req.file.filename}`, true, nextOrder]
    );
    
    const newSlide = result.rows[0];
    
    res.status(201).json({
      message: 'Slide criado com sucesso',
      slide: newSlide
    });
  } catch (error) {
    console.error('Erro ao criar slide:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/slides/:id - Atualizar slide
router.put('/:id', authenticateToken, requireAdmin, upload.single('backgroundImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, ctaText, ctaLink, isActive } = req.body;
    
    // Buscar o slide no banco de dados
    const slideResult = await query(
      'SELECT * FROM slides WHERE id = $1',
      [id]
    );
    
    if (slideResult.rows.length === 0) {
      return res.status(404).json({ error: 'Slide não encontrado' });
    }
    
    const slide = slideResult.rows[0];
    
    // Preparar campos para atualização
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      updateValues.push(title);
      paramIndex++;
    }
    
    if (subtitle !== undefined) {
      updateFields.push(`subtitle = $${paramIndex}`);
      updateValues.push(subtitle);
      paramIndex++;
    }
    
    if (ctaText !== undefined) {
      updateFields.push(`cta_text = $${paramIndex}`);
      updateValues.push(ctaText);
      paramIndex++;
    }
    
    if (ctaLink !== undefined) {
      updateFields.push(`cta_link = $${paramIndex}`);
      updateValues.push(ctaLink);
      paramIndex++;
    }
    
    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.push(isActive === 'true' || isActive === true);
      paramIndex++;
    }
    
    // Atualizar imagem se fornecida
    if (req.file) {
      // Remover imagem antiga se existir
      if (slide.background_image) {
        const oldImagePath = path.join(__dirname, '../../public', slide.background_image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      updateFields.push(`background_image = $${paramIndex}`);
      updateValues.push(`/lovable-uploads/${req.file.filename}`);
      paramIndex++;
    }
    
    // Sempre atualizar updated_at
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Executar atualização
    updateValues.push(id); // ID para WHERE clause
    const updateQuery = `
      UPDATE slides 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, title, subtitle, cta_text as "ctaText", cta_link as "ctaLink", background_image as "backgroundImage", is_active as "isActive", display_order as "order", created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const result = await query(updateQuery, updateValues);
    const updatedSlide = result.rows[0];
    
    res.json({
      message: 'Slide atualizado com sucesso',
      slide: updatedSlide
    });
  } catch (error) {
    console.error('Erro ao atualizar slide:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/slides/:id - Deletar slide
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o slide no banco de dados
    const slideResult = await query(
      'SELECT * FROM slides WHERE id = $1',
      [id]
    );
    
    if (slideResult.rows.length === 0) {
      return res.status(404).json({ error: 'Slide não encontrado' });
    }
    
    const slide = slideResult.rows[0];
    
    // Remover imagem do disco se existir
    if (slide.background_image) {
      const imagePath = path.join(__dirname, '../../public', slide.background_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Deletar slide do banco de dados
    await query('DELETE FROM slides WHERE id = $1', [id]);
    
    res.json({ message: 'Slide deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar slide:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});



// PUT /api/slides/:id/order - Atualizar ordem do slide
router.put('/:id/order', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newOrder } = req.body;
    
    if (typeof newOrder !== 'number' || newOrder < 1) {
      return res.status(400).json({ error: 'Nova ordem deve ser um número positivo' });
    }
    
    // Buscar o slide no banco de dados
    const slideResult = await query(
      'SELECT * FROM slides WHERE id = $1',
      [id]
    );
    
    if (slideResult.rows.length === 0) {
      return res.status(404).json({ error: 'Slide não encontrado' });
    }
    
    const slide = slideResult.rows[0];
    const oldOrder = slide.display_order;
    
    // Reordenar slides no banco de dados
    if (newOrder > oldOrder) {
      // Movendo para baixo - decrementar ordem dos slides entre oldOrder e newOrder
      await query(
        'UPDATE slides SET display_order = display_order - 1, updated_at = CURRENT_TIMESTAMP WHERE display_order > $1 AND display_order <= $2 AND id != $3',
        [oldOrder, newOrder, id]
      );
    } else {
      // Movendo para cima - incrementar ordem dos slides entre newOrder e oldOrder
      await query(
        'UPDATE slides SET display_order = display_order + 1, updated_at = CURRENT_TIMESTAMP WHERE display_order >= $1 AND display_order < $2 AND id != $3',
        [newOrder, oldOrder, id]
      );
    }
    
    // Atualizar a ordem do slide específico
    const result = await query(
      'UPDATE slides SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, title, subtitle, cta_text as "ctaText", cta_link as "ctaLink", background_image as "backgroundImage", is_active as "isActive", display_order as "order", created_at as "createdAt", updated_at as "updatedAt"',
      [newOrder, id]
    );
    
    const updatedSlide = result.rows[0];
    
    res.json({
      message: 'Ordem do slide atualizada com sucesso',
      slide: updatedSlide
    });
  } catch (error) {
    console.error('Erro ao atualizar ordem do slide:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;