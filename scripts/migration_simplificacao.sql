-- SCRIPT DE MIGRAÇÃO - SIMPLIFICAÇÃO DO SISTEMA
-- AIDEV-NOTE: Script para migrar dados de entidades dinâmicas para tabelas fixas

-- =====================================================
-- FASE 1: BACKUP E ANÁLISE
-- =====================================================

-- Criar backup das tabelas que serão modificadas
CREATE TABLE backup_web_entity_records AS SELECT * FROM web_entity_records;
CREATE TABLE backup_web_entities AS SELECT * FROM web_entities;
CREATE TABLE backup_web_flow_entity_links AS SELECT * FROM web_flow_entity_links;

-- Análise dos dados existentes
SELECT 
    e.name as entity_name,
    e.slug,
    e.is_system,
    COUNT(er.id) as total_records,
    string_agg(DISTINCT jsonb_object_keys(er.data), ', ') as available_fields
FROM web_entities e
LEFT JOIN web_entity_records er ON e.id = er.entity_id
GROUP BY e.id, e.name, e.slug, e.is_system
ORDER BY total_records DESC;

-- =====================================================
-- FASE 2: MIGRAÇÃO DE DADOS
-- =====================================================

-- 2.1 MIGRAR ALUNOS E PROPRIETÁRIOS PARA WEB_PEOPLE
INSERT INTO web_people (
    name, 
    email, 
    phone, 
    people_type, 
    client_id, 
    created_at,
    updated_at
)
SELECT 
    COALESCE(er.data->>'name', er.data->>'nome', 'Nome não informado') as name,
    er.data->>'email' as email,
    COALESCE(er.data->>'phone', er.data->>'telefone') as phone,
    CASE 
        WHEN e.slug = 'alunos' THEN 'student'
        WHEN e.slug = 'proprietarios' THEN 'owner'
        ELSE 'contact'
    END as people_type,
    er.client_id,
    er.created_at,
    er.updated_at
FROM web_entity_records er
JOIN web_entities e ON er.entity_id = e.id
WHERE e.slug IN ('alunos', 'proprietarios')
AND er.data->>'name' IS NOT NULL;

-- 2.2 MIGRAR CLIENTES SAAS PARA WEB_COMPANIES
INSERT INTO web_companies (
    name,
    email,
    phone,
    company_type,
    client_id,
    created_at,
    updated_at
)
SELECT 
    COALESCE(er.data->>'name', er.data->>'empresa', 'Empresa não informada') as name,
    er.data->>'email' as email,
    COALESCE(er.data->>'phone', er.data->>'telefone') as phone,
    'client' as company_type,
    er.client_id,
    er.created_at,
    er.updated_at
FROM web_entity_records er
JOIN web_entities e ON er.entity_id = e.id
WHERE e.slug = 'clientes-saas'
AND er.data->>'name' IS NOT NULL;

-- 2.3 CRIAR TABELA ESPECÍFICA PARA PRODUTOS/CURSOS (SE NECESSÁRIO)
CREATE TABLE IF NOT EXISTS web_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(50), -- 'course', 'product', 'real_estate'
    metadata JSONB DEFAULT '{}',
    client_id UUID REFERENCES core_clients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrar Cursos, Produtos e Imóveis para web_products
INSERT INTO web_products (
    name,
    description,
    price,
    category,
    metadata,
    client_id,
    created_at,
    updated_at
)
SELECT 
    COALESCE(er.data->>'name', er.data->>'titulo', 'Item não informado') as name,
    er.data->>'description' as description,
    CASE 
        WHEN er.data->>'price' ~ '^[0-9]+(\.[0-9]+)?$' 
        THEN (er.data->>'price')::DECIMAL(10,2)
        ELSE NULL
    END as price,
    CASE 
        WHEN e.slug LIKE '%curso%' THEN 'course'
        WHEN e.slug = 'produtos' THEN 'product'
        WHEN e.slug = 'imoveis' THEN 'real_estate'
        ELSE 'other'
    END as category,
    er.data as metadata, -- Preservar todos os dados originais
    er.client_id,
    er.created_at,
    er.updated_at
FROM web_entity_records er
JOIN web_entities e ON er.entity_id = e.id
WHERE e.slug IN ('cursos', 'cursos-online', 'produtos', 'imoveis')
AND er.data->>'name' IS NOT NULL;

-- 2.4 MIGRAR ASSINATURAS PARA WEB_DEALS (COMO NEGÓCIOS RECORRENTES)
INSERT INTO web_deals (
    title,
    description,
    value,
    deal_type,
    status,
    client_id,
    created_at,
    updated_at
)
SELECT 
    CONCAT('Assinatura - ', COALESCE(er.data->>'name', er.data->>'plano', 'Plano')) as title,
    er.data->>'description' as description,
    CASE 
        WHEN er.data->>'value' ~ '^[0-9]+(\.[0-9]+)?$' 
        THEN (er.data->>'value')::DECIMAL(10,2)
        ELSE 0
    END as value,
    'subscription' as deal_type,
    COALESCE(er.data->>'status', 'active') as status,
    er.client_id,
    er.created_at,
    er.updated_at
FROM web_entity_records er
JOIN web_entities e ON er.entity_id = e.id
WHERE e.slug = 'assinaturas';

-- =====================================================
-- FASE 3: VALIDAÇÃO DOS DADOS MIGRADOS
-- =====================================================

-- Verificar migração de pessoas
SELECT 
    'web_people' as table_name,
    people_type,
    COUNT(*) as migrated_count
FROM web_people 
WHERE created_at >= (SELECT MIN(created_at) FROM backup_web_entity_records)
GROUP BY people_type;

-- Verificar migração de empresas
SELECT 
    'web_companies' as table_name,
    company_type,
    COUNT(*) as migrated_count
FROM web_companies 
WHERE created_at >= (SELECT MIN(created_at) FROM backup_web_entity_records)
GROUP BY company_type;

-- Verificar migração de produtos
SELECT 
    'web_products' as table_name,
    category,
    COUNT(*) as migrated_count
FROM web_products 
GROUP BY category;

-- Verificar migração de assinaturas para deals
SELECT 
    'web_deals' as table_name,
    deal_type,
    COUNT(*) as migrated_count
FROM web_deals 
WHERE deal_type = 'subscription'
GROUP BY deal_type;

-- =====================================================
-- FASE 4: LIMPEZA (EXECUTAR APENAS APÓS VALIDAÇÃO)
-- =====================================================

-- ATENÇÃO: Executar apenas após confirmar que todos os dados foram migrados corretamente

-- Remover foreign keys primeiro
-- ALTER TABLE web_flow_entity_links DROP CONSTRAINT IF EXISTS web_flow_entity_links_entity_id_fkey;
-- ALTER TABLE web_entity_records DROP CONSTRAINT IF EXISTS web_entity_records_entity_id_fkey;
-- ALTER TABLE web_entity_fields DROP CONSTRAINT IF EXISTS web_entity_fields_entity_id_fkey;

-- Remover tabelas obsoletas
-- DROP TABLE IF EXISTS web_flow_entity_links;
-- DROP TABLE IF EXISTS web_entity_records;
-- DROP TABLE IF EXISTS web_entity_fields;
-- DROP TABLE IF EXISTS web_entities;

-- =====================================================
-- FASE 5: OTIMIZAÇÃO
-- =====================================================

-- Criar índices otimizados
CREATE INDEX IF NOT EXISTS idx_deals_company_contact ON web_deals(company_id, contact_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_company ON web_people(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_type_client ON web_people(people_type, client_id);
CREATE INDEX IF NOT EXISTS idx_companies_type_client ON web_companies(company_type, client_id);
CREATE INDEX IF NOT EXISTS idx_products_category_client ON web_products(category, client_id);
CREATE INDEX IF NOT EXISTS idx_deals_type_client ON web_deals(deal_type, client_id) WHERE deal_type IS NOT NULL;

-- Atualizar estatísticas das tabelas
ANALYZE web_people;
ANALYZE web_companies;
ANALYZE web_deals;
ANALYZE web_products;

-- =====================================================
-- RELATÓRIO FINAL
-- =====================================================

SELECT 
    'MIGRAÇÃO CONCLUÍDA' as status,
    (
        SELECT COUNT(*) FROM web_people 
        WHERE created_at >= (SELECT MIN(created_at) FROM backup_web_entity_records)
    ) as pessoas_migradas,
    (
        SELECT COUNT(*) FROM web_companies 
        WHERE created_at >= (SELECT MIN(created_at) FROM backup_web_entity_records)
    ) as empresas_migradas,
    (
        SELECT COUNT(*) FROM web_products
    ) as produtos_migrados,
    (
        SELECT COUNT(*) FROM web_deals WHERE deal_type = 'subscription'
    ) as assinaturas_migradas,
    (
        SELECT COUNT(*) FROM backup_web_entity_records
    ) as total_registros_originais;

-- AIDEV-NOTE: Script completo de migração que preserva todos os dados importantes
-- e cria uma estrutura mais simples e performática