-- Lista todas as tabelas do banco de dados
SELECT 
    n.nspname as schema,
    c.relname as table_name,
    CASE 
        WHEN c.relkind = 'r' THEN 'table'
        WHEN c.relkind = 'v' THEN 'view'
        WHEN c.relkind = 'm' THEN 'materialized view'
        ELSE c.relkind::text
    END as type,
    pg_catalog.obj_description(c.oid, 'pg_class') as description,
    to_char(pg_stat_all_tables.n_live_tup, '999,999,999') as "rows"
FROM pg_catalog.pg_class c
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_all_tables ON pg_stat_all_tables.relid = c.oid
WHERE 
    c.relkind IN ('r', 'v', 'm') -- r = tabela comum, v = view, m = materialized view
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname !~ '^pg_toast'
ORDER BY 
    n.nspname,
    c.relname; 