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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Identificar o usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Token de autorização não fornecido')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) throw new Error('Usuário não autenticado')

    const userId = user.id

    // 2. Buscar Client ID (Empresa) e Role do usuário
    const { data: profile } = await supabaseAdmin
      .from('core_client_users')
      .select('client_id, is_active, role')
      .eq('id', userId)
      .single()

    if (!profile || !profile.is_active) throw new Error('Usuário inativo ou sem empresa.')

    // 3. Verificar se é administrator - se for, retorna TODOS os flows do client
    const isAdministrator = profile.role === 'administrator'

    if (isAdministrator) {
      // Administrators veem TODOS os flows do client, ignorando exclusões e visibilidade (schema public)
      const { data: flows, error: flowsError } = await supabaseAdmin
        .from('flows')
        .select('*')
        .eq('client_id', profile.client_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (flowsError) throw flowsError

      return new Response(JSON.stringify({ flows: flows || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 4. Para usuários não-administrators, aplicar lógica normal de visibilidade
    const { data: teamMembers } = await supabaseAdmin
      .from('core_team_members')
      .select('team_id')
      .eq('user_profile_id', userId)

    const userTeamIds = teamMembers?.map(t => t.team_id) || []

    // 5. Buscar IDs de fluxos EXCLUÍDOS para este usuário (Blacklist) (schema public)
    const { data: exclusions } = await supabaseAdmin
      .from('flow_user_exclusions')
      .select('flow_id')
      .eq('user_id', userId)
    
    const excludedFlowIds = exclusions?.map(e => e.flow_id) || []

    // 6. Buscar IDs de fluxos permitidos via TIMES (schema public)
    let teamFlowIds: string[] = []
    if (userTeamIds.length > 0) {
      const { data: teamAccess } = await supabaseAdmin
        .from('flow_team_access')
        .select('flow_id')
        .in('team_id', userTeamIds)
      teamFlowIds = teamAccess?.map(t => t.flow_id) || []
    }

    // 7. Buscar IDs de fluxos permitidos via PERMISSÃO DIRETA (schema public)
    const { data: directAccess } = await supabaseAdmin
      .from('flow_access')
      .select('flow_id')
      .eq('user_id', userId)
    
    const directFlowIds = directAccess?.map(d => d.flow_id) || []

    // Consolidar IDs permitidos explicitamente (whitelist)
    const allowedIds = [...new Set([...teamFlowIds, ...directFlowIds])]

    // 8. Query Principal nos Fluxos (schema public)
    // Lógica: (Mesma Empresa) E (Não Excluído) E (Ativo) E ( Publico OU Dono OU PermitidoExplicitamente )
    let query = supabaseAdmin
      .from('flows')
      .select('*')
      .eq('client_id', profile.client_id)
      .eq('is_active', true)

    // Filtrar flows excluídos
    if (excludedFlowIds.length > 0) {
      query = query.not('id', 'in', `(${excludedFlowIds.join(',')})`)
    }

    // Para aplicar o OR complexo, usamos a sintaxe .or() do Supabase
    // visibility_type.eq.company, owner_id.eq.userId, id.in.(allowedIds)
    const orConditions = [
      `visibility_type.eq.company`,
      `owner_id.eq.${userId}`
    ]
    
    if (allowedIds.length > 0) {
      orConditions.push(`id.in.(${allowedIds.join(',')})`)
    }

    query = query.or(orConditions.join(','))

    const { data: flows, error: flowsError } = await query

    if (flowsError) throw flowsError

    return new Response(JSON.stringify({ flows: flows || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Erro na Edge Function get-flows:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro desconhecido',
      details: error.stack 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})

