-- AIDEV-NOTE: Script para popular banco com dados de teste
-- Este script insere dados de teste para empresas e pessoas no sistema CRM
-- Executado em: 2025-01-16
-- Status: ✅ Concluído com sucesso

-- ========================================
-- INSERÇÃO DE EMPRESAS DE TESTE
-- ========================================
-- Inserir 10 empresas de teste com diferentes tipos e setores
INSERT INTO web_companies (
  name, razao_social, cnpj, company_type, setor, email, whatsapp, telefone, celular,
  cep, rua, numero, bairro, pais, client_id, creator_id, created_at
) VALUES 
('TechSolutions Ltda', 'TechSolutions Tecnologia Ltda', '12.345.678/0001-90', 'Cliente Ativo', 'Tecnologia', 'contato@techsolutions.com.br', '(11) 99999-1111', '(11) 3333-1111', '(11) 99999-1111', '01310-100', 'Av. Paulista', '1000', 'Bela Vista', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('InnovaCorp', 'InnovaCorp Inovação e Tecnologia S.A.', '23.456.789/0001-01', 'Cliente Ativo', 'Inovação', 'admin@innovacorp.com.br', '(11) 98888-2222', '(11) 3333-2222', '(11) 98888-2222', '04038-001', 'Rua Augusta', '500', 'Consolação', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('DataFlow Systems', 'DataFlow Sistemas de Informação Ltda', '34.567.890/0001-12', 'Cliente Ativo', 'Tecnologia', 'info@dataflow.com.br', '(11) 97777-3333', '(11) 3333-3333', '(11) 97777-3333', '01414-001', 'Rua Haddock Lobo', '300', 'Cerqueira César', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('ConsultMax', 'ConsultMax Consultoria Empresarial Ltda', '45.678.901/0001-23', 'Empresa Parceira', 'Consultoria', 'contato@consultmax.com.br', '(11) 96666-4444', '(11) 3333-4444', '(11) 96666-4444', '01310-200', 'Av. Paulista', '1500', 'Bela Vista', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('MegaStore Brasil', 'MegaStore Comércio e Varejo S.A.', '56.789.012/0001-34', 'Cliente Ativo', 'Varejo', 'vendas@megastore.com.br', '(11) 95555-5555', '(11) 3333-5555', '(11) 95555-5555', '01310-300', 'Av. Paulista', '2000', 'Bela Vista', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('LogisticFlow', 'LogisticFlow Logística e Transporte Ltda', '67.890.123/0001-45', 'Cliente Ativo', 'Logística', 'logistica@logisticflow.com.br', '(11) 94444-6666', '(11) 3333-6666', '(11) 94444-6666', '04038-002', 'Rua Augusta', '800', 'Consolação', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('CleanPro Services', 'CleanPro Serviços de Limpeza Ltda', '78.901.234/0001-56', 'Cliente Ativo', 'Serviços', 'servicos@cleanpro.com.br', '(11) 93333-7777', '(11) 3333-7777', '(11) 93333-7777', '01414-002', 'Rua Haddock Lobo', '600', 'Cerqueira César', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('StrategicPartners', 'Strategic Partners Consultoria S.A.', '89.012.345/0001-67', 'Empresa Parceira', 'Consultoria', 'partners@strategic.com.br', '(11) 92222-8888', '(11) 3333-8888', '(11) 92222-8888', '01310-400', 'Av. Paulista', '2500', 'Bela Vista', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Fashion Plus', 'Fashion Plus Moda e Estilo Ltda', '90.123.456/0001-78', 'Possível Cliente (Lead)', 'Moda', 'moda@fashionplus.com.br', '(11) 91111-9999', '(11) 3333-9999', '(11) 91111-9999', '04038-003', 'Rua Augusta', '1200', 'Consolação', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('OldTech Corp', 'OldTech Corporação Tecnológica Ltda', '01.234.567/0001-89', 'Cliente Inativo', 'Tecnologia', 'contato@oldtech.com.br', '(11) 90000-0000', '(11) 3333-0000', '(11) 90000-0000', '01414-003', 'Rua Haddock Lobo', '900', 'Cerqueira César', 'Brasil', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW());

-- ========================================
-- INSERÇÃO DE PESSOAS DE TESTE
-- ========================================
-- Inserir 10 pessoas de teste vinculadas às empresas
INSERT INTO web_people (
  name, email, whatsapp, phone, people_type, role, status,
  description, company_id, client_id, created_at
) VALUES 
('João Silva Santos', 'joao.silva@techsolutions.com.br', '(11) 99999-1111', '(11) 3333-1111', 'Contato Principal', 'DIRETOR', 'ATIVO', 'Diretor de Tecnologia da TechSolutions, responsável por decisões estratégicas de TI.', (SELECT id FROM web_companies WHERE name = 'TechSolutions Ltda' LIMIT 1), 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Maria Oliveira Costa', 'maria.oliveira@techsolutions.com.br', '(11) 98888-2222', '(11) 3333-2222', 'Contato Secundário', 'GERENTE', 'ATIVO', 'Gerente de Projetos na TechSolutions, especialista em metodologias ágeis.', (SELECT id FROM web_companies WHERE name = 'TechSolutions Ltda' LIMIT 1), 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Carlos Eduardo Lima', 'carlos.lima@innovacorp.com.br', '(11) 97777-3333', '(11) 3333-3333', 'Contato Principal', 'CEO', 'ATIVO', 'CEO e fundador da InnovaCorp, visionário em inovação tecnológica.', (SELECT id FROM web_companies WHERE name = 'InnovaCorp' LIMIT 1), 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Ana Paula Rodrigues', 'ana.rodrigues@dataflow.com.br', '(11) 96666-4444', '(11) 3333-4444', 'Contato Secundário', 'ANALISTA', 'ATIVO', 'Analista de Sistemas sênior, especialista em Big Data e Analytics.', (SELECT id FROM web_companies WHERE name = 'DataFlow Systems' LIMIT 1), 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Roberto Fernandes', 'roberto.fernandes@consultmax.com.br', '(11) 95555-5555', '(11) 3333-5555', 'Consultor', 'DIRETOR', 'ATIVO', 'Diretor de Consultoria, especialista em transformação digital empresarial.', (SELECT id FROM web_companies WHERE name = 'ConsultMax' LIMIT 1), 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Fernanda Alves Pereira', 'fernanda.alves@consultmax.com.br', '(11) 94444-6666', '(11) 3333-6666', 'Consultor', 'COORDENADOR', 'ATIVO', 'Coordenadora de Projetos, especialista em gestão de mudanças organizacionais.', (SELECT id FROM web_companies WHERE name = 'ConsultMax' LIMIT 1), 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Pedro Henrique Souza', 'pedro.souza@megastore.com.br', '(11) 93333-7777', '(11) 3333-7777', 'Contato Principal', 'GERENTE', 'ATIVO', 'Gerente de Vendas da MegaStore, responsável pela região metropolitana de SP.', (SELECT id FROM web_companies WHERE name = 'MegaStore Brasil' LIMIT 1), 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Luciana Martins', 'luciana.martins@email.com', '(11) 92222-8888', '(11) 3333-8888', 'Consultor', 'CONTATO', 'PENDENTE', 'Consultora independente interessada em nossos serviços de tecnologia.', NULL, 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Ricardo Gomes Silva', 'ricardo.gomes@logisticflow.com.br', '(11) 91111-9999', '(11) 3333-9999', 'Contato Principal', 'SUPERVISOR', 'ATIVO', 'Supervisor de Operações, responsável pela coordenação de entregas.', (SELECT id FROM web_companies WHERE name = 'LogisticFlow' LIMIT 1), 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW()),

('Juliana Santos Oliveira', 'juliana.santos@empresa.com.br', '(11) 90000-0000', '(11) 3333-0000', 'Contato Secundário', 'ASSISTENTE', 'ATIVO', 'Assistente administrativa, responsável pelo atendimento ao cliente.', NULL, 'ee065908-ecd5-4bc1-a3c9-eee45d34219f', NOW());

-- ========================================
-- RESUMO DOS DADOS INSERIDOS
-- ========================================
-- ✅ 10 Empresas inseridas com diferentes tipos:
--    - 6 Clientes Ativos (TechSolutions, InnovaCorp, DataFlow, MegaStore, LogisticFlow, CleanPro)
--    - 2 Empresas Parceiras (ConsultMax, StrategicPartners)
--    - 1 Possível Cliente/Lead (Fashion Plus)
--    - 1 Cliente Inativo (OldTech Corp)
--
-- ✅ 10 Pessoas inseridas com diferentes tipos:
--    - 5 Contatos Principais
--    - 3 Contatos Secundários
--    - 3 Consultores
--    - Relacionamentos estabelecidos com empresas
--
-- ✅ Todos os dados vinculados ao client_id: ee065908-ecd5-4bc1-a3c9-eee45d34219f
-- ✅ Dados realistas com CNPJs, telefones, emails e endereços brasileiros
-- ✅ Diferentes setores representados (Tecnologia, Consultoria, Varejo, Logística, etc.)
-- 10 empresas e 10 pessoas com relacionamentos variados

-- Inserir empresas de teste
INSERT INTO web_companies (
  name, razao_social, cnpj, email, whatsapp, status, 
  company_type, rua, numero, bairro, cidade, estado, cep,
  client_id, creator_id, created_at
) VALUES 
-- Empresas de Tecnologia
('TechSolutions Ltda', 'TechSolutions Tecnologia Ltda', '12.345.678/0001-90', 'contato@techsolutions.com.br', '(11) 99999-1001', 'ATIVO', 'LTDA', 'Rua das Tecnologias', '100', 'Vila Madalena', 'São Paulo', 'SP', '05433-000', 
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW()),

('InnovaCorp', 'Innova Corporation S.A.', '23.456.789/0001-01', 'admin@innovacorp.com.br', '(11) 98888-2002', 'ATIVO', 'SA', 'Av. Paulista', '1500', 'Bela Vista', 'São Paulo', 'SP', '01310-100',
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW()),

('DataFlow Systems', 'DataFlow Sistemas de Informação Ltda', '34.567.890/0001-12', 'info@dataflow.com.br', '(11) 97777-3003', 'ATIVO', 'LTDA', 'Rua dos Dados', '250', 'Itaim Bibi', 'São Paulo', 'SP', '04542-000',
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW()),

-- Empresas de Consultoria
('ConsultMax', 'Consultoria Máxima Empresarial Ltda', '45.678.901/0001-23', 'contato@consultmax.com.br', '(11) 96666-4004', 'ATIVO', 'LTDA', 'Rua da Consultoria', '75', 'Jardins', 'São Paulo', 'SP', '01401-000',
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW()),

('StrategicPartners', 'Strategic Partners Consultoria S.A.', '56.789.012/0001-34', 'partners@strategic.com.br', '(11) 95555-5005', 'ATIVO', 'SA', 'Av. Faria Lima', '2000', 'Itaim Bibi', 'São Paulo', 'SP', '04538-132',
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW()),

-- Empresas de Varejo
('MegaStore Brasil', 'MegaStore Comércio e Varejo Ltda', '67.890.123/0001-45', 'vendas@megastore.com.br', '(11) 94444-6006', 'ATIVO', 'LTDA', 'Rua do Comércio', '500', 'Centro', 'São Paulo', 'SP', '01010-000',
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW()),

('Fashion Plus', 'Fashion Plus Moda e Estilo Ltda', '78.901.234/0001-56', 'moda@fashionplus.com.br', '(11) 93333-7007', 'ATIVO', 'LTDA', 'Rua Augusta', '1200', 'Consolação', 'São Paulo', 'SP', '01305-100',
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW()),

-- Empresas de Serviços
('CleanPro Services', 'CleanPro Serviços de Limpeza Ltda', '89.012.345/0001-67', 'servicos@cleanpro.com.br', '(11) 92222-8008', 'ATIVO', 'LTDA', 'Rua da Limpeza', '300', 'Vila Olímpia', 'São Paulo', 'SP', '04551-060',
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW()),

('LogisticFlow', 'LogisticFlow Transportes e Logística S.A.', '90.123.456/0001-78', 'logistica@logisticflow.com.br', '(11) 91111-9009', 'ATIVO', 'SA', 'Av. dos Transportes', '800', 'Mooca', 'São Paulo', 'SP', '03101-000',
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW()),

-- Empresa Inativa para teste
('OldTech Corp', 'OldTech Corporation Ltda', '01.234.567/0001-89', 'contato@oldtech.com.br', '(11) 90000-0010', 'INATIVO', 'LTDA', 'Rua Antiga', '50', 'Centro', 'São Paulo', 'SP', '01001-000',
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 auth.uid(), NOW());

-- Inserir pessoas de teste
INSERT INTO web_people (
  name, email, whatsapp, phone, cpf, rg, person_type, categoria, cargo,
  description, cep, rua, numero, bairro, cidade, estado,
  company_id, responsavel_id, client_id, created_at
) VALUES 
-- Pessoas da TechSolutions
('João Silva Santos', 'joao.silva@techsolutions.com.br', '(11) 99999-1111', '(11) 3333-1111', '123.456.789-01', '12.345.678-9', 'CLIENTE', 'CLIENTE', 'DIRETOR',
 'Diretor de Tecnologia da TechSolutions, responsável por decisões estratégicas de TI.', '05433-000', 'Rua das Tecnologias', '100', 'Vila Madalena', 'São Paulo', 'SP',
 (SELECT id FROM web_companies WHERE name = 'TechSolutions Ltda' LIMIT 1),
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW()),

('Maria Oliveira Costa', 'maria.oliveira@techsolutions.com.br', '(11) 98888-2222', '(11) 3333-2222', '234.567.890-12', '23.456.789-0', 'CLIENTE', 'FUNCIONARIO', 'GERENTE',
 'Gerente de Projetos na TechSolutions, especialista em metodologias ágeis.', '05433-000', 'Rua das Tecnologias', '100', 'Vila Madalena', 'São Paulo', 'SP',
 (SELECT id FROM web_companies WHERE name = 'TechSolutions Ltda' LIMIT 1),
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW()),

-- Pessoas da InnovaCorp
('Carlos Eduardo Lima', 'carlos.lima@innovacorp.com.br', '(11) 97777-3333', '(11) 3333-3333', '345.678.901-23', '34.567.890-1', 'CLIENTE', 'CLIENTE', 'PROPRIETARIO',
 'CEO e fundador da InnovaCorp, visionário em inovação tecnológica.', '01310-100', 'Av. Paulista', '1500', 'Bela Vista', 'São Paulo', 'SP',
 (SELECT id FROM web_companies WHERE name = 'InnovaCorp' LIMIT 1),
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW()),

-- Pessoa da DataFlow
('Ana Paula Rodrigues', 'ana.rodrigues@dataflow.com.br', '(11) 96666-4444', '(11) 3333-4444', '456.789.012-34', '45.678.901-2', 'CLIENTE', 'FUNCIONARIO', 'ANALISTA',
 'Analista de Sistemas sênior, especialista em Big Data e Analytics.', '04542-000', 'Rua dos Dados', '250', 'Itaim Bibi', 'São Paulo', 'SP',
 (SELECT id FROM web_companies WHERE name = 'DataFlow Systems' LIMIT 1),
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW()),

-- Pessoas da ConsultMax
('Roberto Fernandes', 'roberto.fernandes@consultmax.com.br', '(11) 95555-5555', '(11) 3333-5555', '567.890.123-45', '56.789.012-3', 'CLIENTE', 'CLIENTE', 'DIRETOR',
 'Diretor de Consultoria, especialista em transformação digital empresarial.', '01401-000', 'Rua da Consultoria', '75', 'Jardins', 'São Paulo', 'SP',
 (SELECT id FROM web_companies WHERE name = 'ConsultMax' LIMIT 1),
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW()),

('Fernanda Alves Pereira', 'fernanda.alves@consultmax.com.br', '(11) 94444-6666', '(11) 3333-6666', '678.901.234-56', '67.890.123-4', 'CLIENTE', 'FUNCIONARIO', 'COORDENADOR',
 'Coordenadora de Projetos, especialista em gestão de mudanças organizacionais.', '01401-000', 'Rua da Consultoria', '75', 'Jardins', 'São Paulo', 'SP',
 (SELECT id FROM web_companies WHERE name = 'ConsultMax' LIMIT 1),
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW()),

-- Pessoa da MegaStore
('Pedro Henrique Souza', 'pedro.souza@megastore.com.br', '(11) 93333-7777', '(11) 3333-7777', '789.012.345-67', '78.901.234-5', 'CLIENTE', 'CLIENTE', 'GERENTE',
 'Gerente de Vendas da MegaStore, responsável pela região metropolitana de SP.', '01010-000', 'Rua do Comércio', '500', 'Centro', 'São Paulo', 'SP',
 (SELECT id FROM web_companies WHERE name = 'MegaStore Brasil' LIMIT 1),
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW()),

-- Pessoa independente (sem empresa)
('Luciana Martins', 'luciana.martins@email.com', '(11) 92222-8888', '(11) 3333-8888', '890.123.456-78', '89.012.345-6', 'LEAD', 'OUTRO', 'CONTATO',
 'Consultora independente interessada em nossos serviços de tecnologia.', '04551-060', 'Rua Independente', '150', 'Vila Olímpia', 'São Paulo', 'SP',
 NULL,
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW()),

-- Pessoa da LogisticFlow
('Ricardo Gomes Silva', 'ricardo.gomes@logisticflow.com.br', '(11) 91111-9999', '(11) 3333-9999', '901.234.567-89', '90.123.456-7', 'CLIENTE', 'FUNCIONARIO', 'SUPERVISOR',
 'Supervisor de Operações, responsável pela coordenação de entregas.', '03101-000', 'Av. dos Transportes', '800', 'Mooca', 'São Paulo', 'SP',
 (SELECT id FROM web_companies WHERE name = 'LogisticFlow' LIMIT 1),
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW()),

-- Pessoa colaboradora interna
('Juliana Santos Oliveira', 'juliana.santos@empresa.com.br', '(11) 90000-0000', '(11) 3333-0000', '012.345.678-90', '01.234.567-8', 'COLABORADOR', 'FUNCIONARIO', 'ASSISTENTE',
 'Assistente administrativa da nossa empresa, responsável pelo atendimento ao cliente.', '01305-100', 'Rua Augusta', '1200', 'Consolação', 'São Paulo', 'SP',
 NULL,
 auth.uid(),
 (SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid() LIMIT 1),
 NOW());

-- Criar alguns relacionamentos empresa-pessoa adicionais
INSERT INTO web_company_people (company_id, person_id, created_at) VALUES
-- João Silva também trabalha na InnovaCorp como consultor
((SELECT id FROM web_companies WHERE name = 'InnovaCorp' LIMIT 1),
 (SELECT id FROM web_people WHERE name = 'João Silva Santos' LIMIT 1),
 NOW()),

-- Maria Oliveira presta consultoria para a DataFlow
((SELECT id FROM web_companies WHERE name = 'DataFlow Systems' LIMIT 1),
 (SELECT id FROM web_people WHERE name = 'Maria Oliveira Costa' LIMIT 1),
 NOW()),

-- Luciana Martins tem interesse na StrategicPartners
((SELECT id FROM web_companies WHERE name = 'StrategicPartners' LIMIT 1),
 (SELECT id FROM web_people WHERE name = 'Luciana Martins' LIMIT 1),
 NOW());

-- Atualizar estatísticas
ANALYZE web_companies;
ANALYZE web_people;
ANALYZE web_company_people;