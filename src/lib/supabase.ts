import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { appConfig, logger } from './config';
import { logRLSInstructions } from './supabase/rls';

// Usar configurações centralizadas
const supabaseUrl = appConfig.supabase.url;
const supabaseKey = appConfig.supabase.anonKey;

// Validação já é feita no config.ts
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'nexflow-crm',
    },
  },
  // Configurar realtime baseado na config
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Log da inicialização
logger.info('🔗 Cliente Supabase inicializado', {
  url: supabaseUrl,
  realtimeEnabled: appConfig.app.enableRealtime,
});

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
 * Função para buscar empresas com relacionamentos (Confia na RLS para segurança)
 */
export const getCompaniesWithRelations = async () => {
  return await supabase
    .from('web_companies')
    .select(`
      *,
      city:web_cities(name),
      state:web_states(name, uf),
      creator:core_client_users(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false });
};

/**
 * Função para buscar pessoas com relacionamentos (Confia na RLS para segurança)
 */
export const getPeopleWithRelations = async () => {
  return await supabase
    .from('web_people')
    .select(`
      *,
      company:web_companies(name, email)
    `)
    .order('created_at', { ascending: false });
};

/**
 * Função para buscar deals com relacionamentos (Confia na RLS para segurança)
 */
export const getDealsWithRelations = async () => {
  return await supabase
    .from('web_deals')
    .select(`
      *,
      company:web_companies(name),
      stage:web_funnel_stages(name, color),
      funnel:web_funnels(name)
    `)
    .order('created_at', { ascending: false });
};

/**
 * Função para buscar tarefas com relacionamentos (Confia na RLS para segurança)
 */
export const getTasksWithRelations = async () => {
  return await supabase
    .from('web_tasks')
    .select(`
      *,
      deal:web_deals(title),
      created_by_person:web_people!web_tasks_created_by_fkey(name, email)
    `)
    .order('due_date', { ascending: true });
};

/**
 * Obtém o core_client_id do usuário autenticado
 * ATUALIZADO: Usa a nova estrutura RLS
 */
export async function getCurrentClientId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    logger.warn('getCurrentClientId: Usuário não autenticado.');
    return null;
  }

  const { data: clientUser, error } = await supabase
    .from('core_client_users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  if (error) {
    logger.error('Erro ao buscar client_id:', { userId: user.id, error });
    logRLSInstructions('core_client_users');
    return null;
  }
  
  if (!clientUser) {
    logger.warn('getCurrentClientId: Nenhum registro encontrado em core_client_users para o usuário.', { userId: user.id });
    logRLSInstructions('core_client_users');
    return null;
  }

  return clientUser.client_id;
}

/**
 * Obtém dados do usuário autenticado com informações do cliente  
 * ATUALIZADO: Usa a nova estrutura RLS
 */
export async function getCurrentUserWithClient() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select(`
      *,
      core_clients:client_id (*)
    `)
    .eq('id', user.id)
    .single();

  return clientUser;
}

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 * ATUALIZADO: Sistema de permissões aprimorado
 */
export async function checkUserPermission(permission: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data: clientUser } = await supabase
    .from('core_client_users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!clientUser) return false;

  // Administradores têm todas as permissões
  if (clientUser.role === 'administrator') return true;

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
}

// Exportar funções RLS para facilitar o uso
export { 
  getCurrentClientId as getRLSClientId,
  hasAccessToClient,
  getCurrentUserWithClient as getRLSUserWithClient,
  checkUserPermission as checkRLSPermission,
  logRLSInstructions
} from './supabase/rls';

// Log das instruções RLS na inicialização (desenvolvimento)
if (appConfig.app.debugMode) {
  logRLSInstructions();
} 
