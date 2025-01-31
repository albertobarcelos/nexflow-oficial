-- Verificar estrutura das tabelas principais
SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    tc.constraint_type,
    tc.constraint_name
FROM information_schema.columns c
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON c.column_name = ccu.column_name 
    AND c.table_name = ccu.table_name
LEFT JOIN information_schema.table_constraints tc
    ON ccu.constraint_name = tc.constraint_name
WHERE c.table_name IN (
    'clients',
    'licenses',
    'collaborators',
    'companies',
    'people',
    'funnels',
    'funnel_stages',
    'deals',
    'deal_tags',
    'tags'
)
AND c.table_schema = 'public'
AND (
    c.column_name = 'client_id' 
    OR tc.constraint_type = 'PRIMARY KEY'
)
ORDER BY 
    c.table_name,
    c.column_name;

-- Verificar RLS e Políticas
SELECT 
    t.tablename,
    t.hasrules as "RLS Ativo",
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as "Número de Políticas"
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.tablename IN (
    'clients',
    'licenses',
    'collaborators',
    'companies',
    'people',
    'funnels',
    'funnel_stages',
    'deals',
    'deal_tags',
    'tags'
)
ORDER BY t.tablename; 