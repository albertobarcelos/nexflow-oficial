// ==============================================
// RLS (ROW LEVEL SECURITY) - SISTEMA MULTI-TENANT
// ==============================================

import { supabase } from '../supabase';
import { logger } from '../config';

/**
 * Função para obter o client_id do usuário autenticado
 * Esta função é usada nas políticas RLS
 */
export async function getCurrentClientId(): Promise<string | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      logger.error('Erro ao obter usuário autenticado:', userError);
      return null;
    }

    if (!user) {
      logger.debug('Usuário não autenticado');
      return null;
    }

    // Buscar o client_id do usuário na tabela core_client_users
    const { data: clientUser, error: clientError } = await supabase
      .from('core_client_users')
      .select('client_id')
      .eq('id', user.id)
      .single();

    if (clientError) {
      logger.error('Erro ao buscar dados do cliente:', clientError);
      return null;
    }

    if (!clientUser) {
      logger.warn('Usuário não encontrado na tabela core_client_users:', user.id);
      return null;
    }

    logger.debug('Client ID obtido:', clientUser.client_id);
    return clientUser.client_id;
  } catch (error) {
    logger.error('Erro inesperado ao obter client_id:', error);
    return null;
  }
}

/**
 * Função para verificar se o usuário tem acesso a um cliente específico
 */
export async function hasAccessToClient(clientId: string): Promise<boolean> {
  try {
    const currentClientId = await getCurrentClientId();
    return currentClientId === clientId;
  } catch (error) {
    logger.error('Erro ao verificar acesso ao cliente:', error);
    return false;
  }
}

/**
 * Função para obter dados completos do usuário autenticado
 */
export async function getCurrentUserWithClient() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logger.debug('Usuário não autenticado');
      return null;
    }

    const { data: clientUser, error: clientError } = await supabase
      .from('core_client_users')
      .select(`
        *,
        core_clients:client_id (
          id,
          name,
          company_name,
          status,
          license_id,
          created_at
        )
      `)
      .eq('id', user.id)
      .single();

    if (clientError) {
      logger.error('Erro ao buscar dados completos do usuário:', clientError);
      return null;
    }

    return clientUser;
  } catch (error) {
    logger.error('Erro inesperado ao obter dados do usuário:', error);
    return null;
  }
}

/**
 * Função para verificar permissões do usuário
 */
export async function checkUserPermission(permission: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      logger.debug('Usuário não autenticado para verificar permissão');
      return false;
    }

    const { data: clientUser } = await supabase
      .from('core_client_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!clientUser) {
      logger.warn('Usuário não encontrado para verificar permissão');
      return false;
    }

    // Administradores têm todas as permissões
    if (clientUser.role === 'administrator') {
      return true;
    }

    // Definir permissões por role
    const rolePermissions: Record<string, string[]> = {
      administrator: ['*'], // Todas as permissões
      closer: [
        'read_companies',
        'write_companies',
        'read_people',
        'write_people',
        'read_deals',
        'write_deals',
        'read_tasks',
        'write_tasks',
      ],
      partnership_director: [
        'read_companies',
        'write_companies',
        'read_people',
        'write_people',
        'read_deals',
        'write_deals',
        'read_tasks',
        'write_tasks',
        'manage_partners',
      ],
      partner: [
        'read_companies',
        'read_people',
        'read_deals',
        'read_tasks',
      ],
    };

    const userPermissions = rolePermissions[clientUser.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  } catch (error) {
    logger.error('Erro ao verificar permissão do usuário:', error);
    return false;
  }
}

/**
 * SQL para criar as políticas RLS
 * Este código deve ser executado no Supabase SQL Editor
 */
export const RLS_POLICIES = `
-- =====================================================
-- POLÍTICAS RLS PARA SISTEMA MULTI-TENANT
-- =====================================================

-- Habilitar RLS em todas as tabelas WEB
ALTER TABLE web_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_flows ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS em tabelas CORE (proteção adicional)
ALTER TABLE core_client_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter o client_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth.get_current_client_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT client_id 
    FROM core_client_users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS PARA TABELAS WEB
-- =====================================================

-- WEB_COMPANIES
CREATE POLICY "Users can view companies from their tenant" 
ON web_companies FOR SELECT 
USING (client_id = auth.get_current_client_id());

CREATE POLICY "Users can insert companies to their tenant" 
ON web_companies FOR INSERT 
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can update companies from their tenant" 
ON web_companies FOR UPDATE 
USING (client_id = auth.get_current_client_id())
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can delete companies from their tenant" 
ON web_companies FOR DELETE 
USING (client_id = auth.get_current_client_id());

-- WEB_PEOPLE
CREATE POLICY "Users can view people from their tenant" 
ON web_people FOR SELECT 
USING (client_id = auth.get_current_client_id());

CREATE POLICY "Users can insert people to their tenant" 
ON web_people FOR INSERT 
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can update people from their tenant" 
ON web_people FOR UPDATE 
USING (client_id = auth.get_current_client_id())
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can delete people from their tenant" 
ON web_people FOR DELETE 
USING (client_id = auth.get_current_client_id());

-- WEB_DEALS
CREATE POLICY "Users can view deals from their tenant" 
ON web_deals FOR SELECT 
USING (client_id = auth.get_current_client_id());

CREATE POLICY "Users can insert deals to their tenant" 
ON web_deals FOR INSERT 
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can update deals from their tenant" 
ON web_deals FOR UPDATE 
USING (client_id = auth.get_current_client_id())
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can delete deals from their tenant" 
ON web_deals FOR DELETE 
USING (client_id = auth.get_current_client_id());

-- WEB_TASKS
CREATE POLICY "Users can view tasks from their tenant" 
ON web_tasks FOR SELECT 
USING (client_id = auth.get_current_client_id());

CREATE POLICY "Users can insert tasks to their tenant" 
ON web_tasks FOR INSERT 
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can update tasks from their tenant" 
ON web_tasks FOR UPDATE 
USING (client_id = auth.get_current_client_id())
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can delete tasks from their tenant" 
ON web_tasks FOR DELETE 
USING (client_id = auth.get_current_client_id());

-- WEB_FUNNELS
CREATE POLICY "Users can view funnels from their tenant" 
ON web_funnels FOR SELECT 
USING (client_id = auth.get_current_client_id());

CREATE POLICY "Users can insert funnels to their tenant" 
ON web_funnels FOR INSERT 
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can update funnels from their tenant" 
ON web_funnels FOR UPDATE 
USING (client_id = auth.get_current_client_id())
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can delete funnels from their tenant" 
ON web_funnels FOR DELETE 
USING (client_id = auth.get_current_client_id());

-- WEB_FUNNEL_STAGES
CREATE POLICY "Users can view funnel_stages from their tenant" 
ON web_funnel_stages FOR SELECT 
USING (client_id = auth.get_current_client_id());

CREATE POLICY "Users can insert funnel_stages to their tenant" 
ON web_funnel_stages FOR INSERT 
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can update funnel_stages from their tenant" 
ON web_funnel_stages FOR UPDATE 
USING (client_id = auth.get_current_client_id())
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can delete funnel_stages from their tenant" 
ON web_funnel_stages FOR DELETE 
USING (client_id = auth.get_current_client_id());

-- WEB_FLOWS
CREATE POLICY "Users can view flows from their tenant" 
ON web_flows FOR SELECT 
USING (client_id = auth.get_current_client_id());

CREATE POLICY "Users can insert flows to their tenant" 
ON web_flows FOR INSERT 
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can update flows from their tenant" 
ON web_flows FOR UPDATE 
USING (client_id = auth.get_current_client_id())
WITH CHECK (client_id = auth.get_current_client_id());

CREATE POLICY "Users can delete flows from their tenant" 
ON web_flows FOR DELETE 
USING (client_id = auth.get_current_client_id());

-- =====================================================
-- POLÍTICAS PARA TABELAS CORE
-- =====================================================

-- CORE_CLIENT_USERS - Usuários só podem ver seus próprios dados
CREATE POLICY "Users can view their own profile" 
ON core_client_users FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON core_client_users FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =====================================================
-- GRANTS E PERMISSÕES
-- =====================================================

-- Conceder acesso às funções auxiliares
GRANT EXECUTE ON FUNCTION auth.get_current_client_id() TO authenticated;
`;

/**
 * Função para executar as políticas RLS no Supabase
 * ATENÇÃO: Execute manualmente no SQL Editor do Supabase
 */
export function logRLSInstructions() {
  logger.warn(`
🔒 POLÍTICAS RLS PRECISAM SER APLICADAS MANUALMENTE

Para aplicar as políticas de segurança RLS:

1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o código SQL contido na constante RLS_POLICIES
4. Verifique se todas as políticas foram criadas corretamente

⚠️  CRÍTICO: Sem estas políticas, os dados não estarão isolados por tenant!
  `);
} 