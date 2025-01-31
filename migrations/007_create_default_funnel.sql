-- Inserir Funil Padrão para cada cliente
INSERT INTO funnels (name, description, is_default, client_id)
SELECT 
    'Funil de Vendas',
    'Funil de vendas padrão',
    true,
    clients.id as client_id
FROM clients
JOIN licenses ON licenses.client_id = clients.id
WHERE licenses.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM funnels f 
    WHERE f.client_id = clients.id 
    AND f.is_default = true
);

-- Inserir estágios padrão para cada funil criado
INSERT INTO funnel_stages (funnel_id, name, description, color, order_index, client_id)
SELECT 
    f.id as funnel_id,
    s.name,
    s.description,
    s.color,
    s.order_index,
    f.client_id
FROM funnels f
CROSS JOIN (
    VALUES 
        ('Primeiro Contato', 'Estágio inicial de contato', 'gray', 0),
        ('Enviando Proposta', 'Proposta em elaboração', 'blue', 1),
        ('Follow-up', 'Acompanhamento da proposta', 'green', 2),
        ('Fechamento', 'Negociação final', 'red', 3)
) as s(name, description, color, order_index)
WHERE f.is_default = true
AND NOT EXISTS (
    SELECT 1 FROM funnel_stages fs 
    WHERE fs.funnel_id = f.id 
    AND fs.name = s.name
); 