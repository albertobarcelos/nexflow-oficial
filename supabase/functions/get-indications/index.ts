// @ts-ignore - JSR imports são específicos do Deno runtime e funcionam no Supabase Edge Functions
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - JSR imports são específicos do Deno runtime e funcionam no Supabase Edge Functions
import { createClient } from "jsr:@supabase/supabase-js@2";

// Declaração de tipo para Deno (necessário para TypeScript no editor)
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verifica se o usuário tem permissão para acessar indicações
 * Apenas administrators, leaders e admins de time podem acessar
 */
async function canUserAccessIndications(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ hasAccess: boolean; clientId?: string }> {
  // 1. Verificar se é administrator
  const { data: clientUser, error: userError } = await supabase
    .from('core_client_users')
    .select('role, client_id')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('Erro ao buscar usuário:', userError);
    return { hasAccess: false };
  }

  if (!clientUser) {
    return { hasAccess: false };
  }

  if (clientUser.role === 'administrator') {
    return { hasAccess: true, clientId: clientUser.client_id };
  }

  // 2. Verificar se é leader ou admin de time
  const { data: teamMembers, error: teamError } = await supabase
    .from('core_team_members')
    .select('role')
    .eq('user_profile_id', userId)
    .in('role', ['leader', 'admin']);

  if (teamError) {
    console.error('Erro ao buscar membros de time:', teamError);
    return { hasAccess: false };
  }

  if ((teamMembers?.length ?? 0) > 0) {
    return { hasAccess: true, clientId: clientUser.client_id };
  }

  return { hasAccess: false };
}

/**
 * Verifica se o cliente tem isHunting = true
 */
async function checkClientIsHunting(
  supabase: ReturnType<typeof createClient>,
  clientId: string
): Promise<boolean> {
  const { data: client, error } = await supabase
    .from('core_clients')
    .select('isHunting')
    .eq('id', clientId)
    .single();

  if (error) {
    console.error('Erro ao buscar cliente:', error);
    return false;
  }

  return client?.isHunting === true;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // A edge function não requer body - a autenticação vem automaticamente via header Authorization
    // quando invocada através de supabase.functions.invoke()
    
    // Criar cliente Supabase com autenticação do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Obter usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar permissão de acesso
    const { hasAccess, clientId } = await canUserAccessIndications(supabase, user.id);

    if (!hasAccess || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado: apenas administrators, leaders e admins de time podem acessar' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar se o cliente tem isHunting = true
    const isHunting = await checkClientIsHunting(supabase, clientId);

    if (!isHunting) {
      return new Response(
        JSON.stringify({ error: 'Cliente não possui acesso ao módulo Hunters' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar indicações da tabela public.core_indications
    const { data: indications, error: indicationsError } = await supabase
      .from('core_indications')
      .select(`
        id,
        client_id,
        hunter_id,
        related_card_ids,
        status,
        responsible,
        indication_name,
        cnpj_cpf,
        phone,
        description,
        created_at,
        updated_at
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (indicationsError) {
      console.error('Erro ao buscar indicações:', indicationsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar indicações', details: indicationsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar informações dos hunters (se necessário)
    // Nota: Assumindo que existe uma tabela nexhunters.hunters
    const hunterIds = [...new Set(indications?.map(i => i.hunter_id) || [])];
    
    let huntersMap: Record<string, any> = {};
    if (hunterIds.length > 0) {
      // Tentar buscar hunters do schema nexhunters
      const { data: hunters } = await supabase
        .schema('nexhunters')
        .from('hunters')
        .select('id, name, email')
        .in('id', hunterIds);

      if (hunters) {
        huntersMap = hunters.reduce((acc, hunter) => {
          acc[hunter.id] = hunter;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Enriquecer indicações com dados do hunter
    const enrichedIndications = indications?.map(indication => ({
      ...indication,
      hunter: huntersMap[indication.hunter_id] || null
    })) || [];

    return new Response(
      JSON.stringify({
        indications: enrichedIndications,
        count: enrichedIndications.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erro na função get-indications:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

