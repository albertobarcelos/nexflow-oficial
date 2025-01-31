-- Verificar todas as colunas da tabela licenses
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'licenses'
ORDER BY ordinal_position; 