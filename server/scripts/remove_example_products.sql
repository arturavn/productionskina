-- Script para remover produtos de exemplo do banco de dados
-- Mantém apenas os produtos reais cadastrados pelo usuário

BEGIN;

-- Primeiro, remover itens de carrinho que referenciam produtos de exemplo
DELETE FROM cart_items 
WHERE product_id IN (
    '770e8400-e29b-41d4-a716-446655440000', -- Filtro de Óleo Mann W712/75
    '770e8400-e29b-41d4-a716-446655440001', -- Vela de Ignição NGK BPR6ES
    '770e8400-e29b-41d4-a716-446655440002', -- Correia Dentada Gates 5496XS
    '770e8400-e29b-41d4-a716-446655440003', -- Amortecedor Dianteiro Monroe G7341
    '770e8400-e29b-41d4-a716-446655440004', -- Mola Helicoidal Eibach Pro-Kit
    '770e8400-e29b-41d4-a716-446655440005', -- Pastilha de Freio Bosch BB1234
    '770e8400-e29b-41d4-a716-446655440006', -- Disco de Freio Fremax BD5678
    '770e8400-e29b-41d4-a716-446655440007', -- Óleo de Câmbio Castrol Transmax
    '770e8400-e29b-41d4-a716-446655440008', -- Kit Embreagem Sachs 6234
    '770e8400-e29b-41d4-a716-446655440009', -- Bateria Moura 60Ah
    '770e8400-e29b-41d4-a716-446655440010', -- Alternador Bosch 90A
    '770e8400-e29b-41d4-a716-446655440011', -- Farol Dianteiro Arteb
    '770e8400-e29b-41d4-a716-446655440012'  -- Retrovisor Externo Metagal
);

-- Remover itens de pedidos que referenciam produtos de exemplo
DELETE FROM order_items 
WHERE product_id IN (
    '770e8400-e29b-41d4-a716-446655440000',
    '770e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440002',
    '770e8400-e29b-41d4-a716-446655440003',
    '770e8400-e29b-41d4-a716-446655440004',
    '770e8400-e29b-41d4-a716-446655440005',
    '770e8400-e29b-41d4-a716-446655440006',
    '770e8400-e29b-41d4-a716-446655440007',
    '770e8400-e29b-41d4-a716-446655440008',
    '770e8400-e29b-41d4-a716-446655440009',
    '770e8400-e29b-41d4-a716-446655440010',
    '770e8400-e29b-41d4-a716-446655440011',
    '770e8400-e29b-41d4-a716-446655440012'
);

-- Remover histórico de estoque dos produtos de exemplo
DELETE FROM stock_history 
WHERE product_id IN (
    '770e8400-e29b-41d4-a716-446655440000',
    '770e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440002',
    '770e8400-e29b-41d4-a716-446655440003',
    '770e8400-e29b-41d4-a716-446655440004',
    '770e8400-e29b-41d4-a716-446655440005',
    '770e8400-e29b-41d4-a716-446655440006',
    '770e8400-e29b-41d4-a716-446655440007',
    '770e8400-e29b-41d4-a716-446655440008',
    '770e8400-e29b-41d4-a716-446655440009',
    '770e8400-e29b-41d4-a716-446655440010',
    '770e8400-e29b-41d4-a716-446655440011',
    '770e8400-e29b-41d4-a716-446655440012'
);

-- Remover imagens dos produtos de exemplo (se existirem)
DELETE FROM product_images 
WHERE product_id IN (
    '770e8400-e29b-41d4-a716-446655440000',
    '770e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440002',
    '770e8400-e29b-41d4-a716-446655440003',
    '770e8400-e29b-41d4-a716-446655440004',
    '770e8400-e29b-41d4-a716-446655440005',
    '770e8400-e29b-41d4-a716-446655440006',
    '770e8400-e29b-41d4-a716-446655440007',
    '770e8400-e29b-41d4-a716-446655440008',
    '770e8400-e29b-41d4-a716-446655440009',
    '770e8400-e29b-41d4-a716-446655440010',
    '770e8400-e29b-41d4-a716-446655440011',
    '770e8400-e29b-41d4-a716-446655440012'
);

-- Finalmente, remover os produtos de exemplo
DELETE FROM products 
WHERE id IN (
    '770e8400-e29b-41d4-a716-446655440000', -- Filtro de Óleo Mann W712/75
    '770e8400-e29b-41d4-a716-446655440001', -- Vela de Ignição NGK BPR6ES
    '770e8400-e29b-41d4-a716-446655440002', -- Correia Dentada Gates 5496XS
    '770e8400-e29b-41d4-a716-446655440003', -- Amortecedor Dianteiro Monroe G7341
    '770e8400-e29b-41d4-a716-446655440004', -- Mola Helicoidal Eibach Pro-Kit
    '770e8400-e29b-41d4-a716-446655440005', -- Pastilha de Freio Bosch BB1234
    '770e8400-e29b-41d4-a716-446655440006', -- Disco de Freio Fremax BD5678
    '770e8400-e29b-41d4-a716-446655440007', -- Óleo de Câmbio Castrol Transmax
    '770e8400-e29b-41d4-a716-446655440008', -- Kit Embreagem Sachs 6234
    '770e8400-e29b-41d4-a716-446655440009', -- Bateria Moura 60Ah
    '770e8400-e29b-41d4-a716-446655440010', -- Alternador Bosch 90A
    '770e8400-e29b-41d4-a716-446655440011', -- Farol Dianteiro Arteb
    '770e8400-e29b-41d4-a716-446655440012'  -- Retrovisor Externo Metagal
);

-- Remover pedidos de exemplo que ficaram sem itens
DELETE FROM orders 
WHERE id IN (
    '880e8400-e29b-41d4-a716-446655440000',
    '880e8400-e29b-41d4-a716-446655440001',
    '880e8400-e29b-41d4-a716-446655440002'
) AND NOT EXISTS (
    SELECT 1 FROM order_items WHERE order_id = orders.id
);

-- Remover sessões de carrinho vazias
DELETE FROM cart_sessions 
WHERE id IN (
    'aa0e8400-e29b-41d4-a716-446655440000',
    'aa0e8400-e29b-41d4-a716-446655440001',
    'aa0e8400-e29b-41d4-a716-446655440002'
) AND NOT EXISTS (
    SELECT 1 FROM cart_items WHERE cart_session_id = cart_sessions.id
);

COMMIT;

-- Verificar quantos produtos restaram
SELECT COUNT(*) as produtos_restantes FROM products WHERE active = true;

-- Listar produtos que restaram
SELECT id, name, sku, created_at FROM products WHERE active = true ORDER BY created_at DESC;