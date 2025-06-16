import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL e chave anônima são necessárias');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// =====================================================
// TIPOS AUXILIARES PARA A NOVA ARQUITETURA
// =====================================================

// CORE Types
export type CoreClient = Database['public']['Tables']['core_clients']['Row'];
export type CoreClientInsert = Database['public']['Tables']['core_clients']['Insert'];
export type CoreClientUpdate = Database['public']['Tables']['core_clients']['Update'];

export type CoreClientUser = Database['public']['Tables']['core_client_users']['Row'];
export type CoreClientUserInsert = Database['public']['Tables']['core_client_users']['Insert'];
export type CoreClientUserUpdate = Database['public']['Tables']['core_client_users']['Update'];

export type CoreLicense = Database['public']['Tables']['core_licenses']['Row'];
export type CoreLicenseInsert = Database['public']['Tables']['core_licenses']['Insert'];
export type CoreLicenseUpdate = Database['public']['Tables']['core_licenses']['Update'];

export type CoreClientLicense = Database['public']['Tables']['core_client_license']['Row'];
export type CoreClientLicenseInsert = Database['public']['Tables']['core_client_license']['Insert'];
export type CoreClientLicenseUpdate = Database['public']['Tables']['core_client_license']['Update'];

// WEB Types (CRM)
export type WebCompany = Database['public']['Tables']['web_companies']['Row'];
export type WebCompanyInsert = Database['public']['Tables']['web_companies']['Insert'];
export type WebCompanyUpdate = Database['public']['Tables']['web_companies']['Update'];

export type WebPerson = Database['public']['Tables']['web_people']['Row'];
export type WebPersonInsert = Database['public']['Tables']['web_people']['Insert'];
export type WebPersonUpdate = Database['public']['Tables']['web_people']['Update'];

export type WebDeal = Database['public']['Tables']['web_deals']['Row'];
export type WebDealInsert = Database['public']['Tables']['web_deals']['Insert'];
export type WebDealUpdate = Database['public']['Tables']['web_deals']['Update'];

export type WebTask = Database['public']['Tables']['web_tasks']['Row'];
export type WebTaskInsert = Database['public']['Tables']['web_tasks']['Insert'];
export type WebTaskUpdate = Database['public']['Tables']['web_tasks']['Update'];

export type WebFunnel = Database['public']['Tables']['web_funnels']['Row'];
export type WebFunnelInsert = Database['public']['Tables']['web_funnels']['Insert'];
export type WebFunnelUpdate = Database['public']['Tables']['web_funnels']['Update'];

export type WebFunnelStage = Database['public']['Tables']['web_funnel_stages']['Row'];
export type WebFunnelStageInsert = Database['public']['Tables']['web_funnel_stages']['Insert'];
export type WebFunnelStageUpdate = Database['public']['Tables']['web_funnel_stages']['Update'];

export type WebCity = Database['public']['Tables']['web_cities']['Row'];
export type WebCityInsert = Database['public']['Tables']['web_cities']['Insert'];
export type WebCityUpdate = Database['public']['Tables']['web_cities']['Update'];

export type WebState = Database['public']['Tables']['web_states']['Row'];
export type WebStateInsert = Database['public']['Tables']['web_states']['Insert'];
export type WebStateUpdate = Database['public']['Tables']['web_states']['Update'];

// =====================================================
// ALIASES PARA COMPATIBILIDADE (TEMPORÁRIO)
// =====================================================

// Mapeamento das tabelas antigas para as novas
export type Client = CoreClient;
export type ClientInsert = CoreClientInsert;
export type ClientUpdate = CoreClientUpdate;

export type Collaborator = CoreClientUser;
export type CollaboratorInsert = CoreClientUserInsert;
export type CollaboratorUpdate = CoreClientUserUpdate;

export type Company = WebCompany;
export type CompanyInsert = WebCompanyInsert;
export type CompanyUpdate = WebCompanyUpdate;

export type Contact = WebPerson;
export type ContactInsert = WebPersonInsert;
export type ContactUpdate = WebPersonUpdate;

export type Opportunity = WebDeal;
export type OpportunityInsert = WebDealInsert;
export type OpportunityUpdate = WebDealUpdate;

export type Task = WebTask;
export type TaskInsert = WebTaskInsert;
export type TaskUpdate = WebTaskUpdate;

// =====================================================
// FUNÇÕES AUXILIARES PARA QUERIES
// =====================================================

/**
 * Função para buscar empresas com relacionamentos
 */
export const getCompaniesWithRelations = async (clientId: string) => {
  return await supabase
    .from('web_companies')
    .select(`
      *,
      city:web_cities(name),
      state:web_states(name, uf),
      creator:core_client_users(first_name, last_name, email)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
};

/**
 * Função para buscar pessoas com relacionamentos
 */
export const getPeopleWithRelations = async (clientId: string) => {
  return await supabase
    .from('web_people')
    .select(`
      *,
      company:web_companies(name, email)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
};

/**
 * Função para buscar deals com relacionamentos
 */
export const getDealsWithRelations = async (clientId: string) => {
  return await supabase
    .from('web_deals')
    .select(`
      *,
      company:web_companies(name),
      stage:web_funnel_stages(name, color),
      funnel:web_funnels(name)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
};

/**
 * Função para buscar tarefas com relacionamentos
 */
export const getTasksWithRelations = async (clientId: string) => {
  return await supabase
    .from('web_tasks')
    .select(`
      *,
      deal:web_deals(title),
      created_by_person:web_people!web_tasks_created_by_fkey(name, email)
    `)
    .eq('client_id', clientId)
    .order('due_date', { ascending: true });
};

/**
 * Obtém o core_client_id do usuário autenticado
 */
export async function getCurrentClientId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('core_client_id')
    .eq('auth_user_id', user.id)
    .single();

  return clientUser?.core_client_id || null;
}

/**
 * Obtém dados do usuário autenticado com informações do cliente
 */
export async function getCurrentUserWithClient() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select(`
      *,
      core_clients:core_client_id (*)
    `)
    .eq('auth_user_id', user.id)
    .single();

  return clientUser;
}

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 */
export async function checkUserPermission(permission: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('permissions, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!clientUser) return false;

  // Administradores têm todas as permissões
  if (clientUser.role === 'administrator') return true;

  // Verificar permissões específicas
  const permissions = clientUser.permissions as Record<string, boolean>;
  return permissions?.[permission] === true;
} 
