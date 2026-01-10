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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Admin Client (Service Role) to bypass RLS for complex updates
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Parse Body
    let body;
    try {
      body = await req.json();
    } catch (parseError: any) {
      return new Response(
        JSON.stringify({ error: `Erro ao fazer parse do JSON: ${parseError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { flowId, visibilityType, teamIds, excludedUserIds } = body;

    // Validação dos parâmetros obrigatórios
    if (!flowId) {
      return new Response(
        JSON.stringify({ error: 'flowId é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    if (!visibilityType) {
      return new Response(
        JSON.stringify({ error: 'visibilityType é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar tipos de visibilidade baseados na sua UI
    const validTypes = ['company', 'team', 'user_exclusion'];
    if (!validTypes.includes(visibilityType)) {
      return new Response(
        JSON.stringify({ 
          error: `Tipo de visibilidade inválido: ${visibilityType}. Tipos válidos: ${validTypes.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Normalizar arrays para garantir que são arrays válidos
    const normalizedTeamIds = Array.isArray(teamIds) ? teamIds : [];
    const normalizedExcludedUserIds = Array.isArray(excludedUserIds) ? excludedUserIds : [];

    // Filtrar excludedUserIds removendo administrators e admins de time
    let filteredExcludedUserIds = normalizedExcludedUserIds;
    
    if (normalizedExcludedUserIds.length > 0) {
      // Buscar todos os usuários que são administrators
      const { data: administrators } = await supabaseAdmin
        .from('core_client_users')
        .select('id')
        .eq('role', 'administrator')
        .in('id', normalizedExcludedUserIds);
      
      const adminUserIds = administrators?.map(a => a.id) || [];
      
      // Buscar todos os usuários que são admins de time
      const { data: teamAdmins } = await supabaseAdmin
        .from('core_team_members')
        .select('user_profile_id')
        .eq('role', 'admin')
        .in('user_profile_id', normalizedExcludedUserIds);
      
      const teamAdminUserIds = teamAdmins?.map(ta => ta.user_profile_id) || [];
      
      // Remover administrators e admins de time da lista de exclusão
      const protectedUserIds = [...new Set([...adminUserIds, ...teamAdminUserIds])];
      filteredExcludedUserIds = normalizedExcludedUserIds.filter(
        userId => !protectedUserIds.includes(userId)
      );
      
      // Se havia usuários protegidos na lista, logar aviso (mas não falhar)
      if (protectedUserIds.length > 0) {
        console.warn(`Usuários protegidos removidos da exclusão: ${protectedUserIds.join(', ')}`);
      }
    }

    // Update Main Flow Table (schema public - padrão)
    const { error: flowError } = await supabaseAdmin
      .from('flows')
      .update({ 
        visibility_type: visibilityType,
      })
      .eq('id', flowId);

    if (flowError) {
      console.error("Erro ao atualizar flow:", flowError);
      throw new Error(`Erro ao atualizar flow: ${flowError.message}`);
    }

    // Manage Teams (flow_team_access)
    // Primeiro: Limpar acessos de time antigos para este flow
    const { error: deleteTeamError } = await supabaseAdmin
      .from('flow_team_access')
      .delete()
      .eq('flow_id', flowId);

    if (deleteTeamError) {
      console.error("Erro ao deletar times antigos:", deleteTeamError);
      throw new Error(`Erro ao deletar times antigos: ${deleteTeamError.message}`);
    }

    // Segundo: Se o tipo requer times, inserir os novos
    // (Geralmente 'team' e 'user_exclusion' dependem de seleção de times)
    if (['team', 'user_exclusion'].includes(visibilityType) && normalizedTeamIds.length > 0) {
      const teamInserts = normalizedTeamIds.map((teamId: string) => ({
        flow_id: flowId,
        team_id: teamId
      }));
      
      const { error: teamError } = await supabaseAdmin
        .from('flow_team_access')
        .insert(teamInserts);
      
      if (teamError) {
        console.error("Erro ao inserir times:", teamError);
        throw new Error(`Erro ao inserir times: ${teamError.message}`);
      }
    }

    // Manage Exclusions (flow_user_exclusions)
    // Primeiro: Limpar exclusões antigas
    const { error: deleteExclusionError } = await supabaseAdmin
      .from('flow_user_exclusions')
      .delete()
      .eq('flow_id', flowId);

    if (deleteExclusionError) {
      console.error("Erro ao deletar exclusões antigas:", deleteExclusionError);
      throw new Error(`Erro ao deletar exclusões antigas: ${deleteExclusionError.message}`);
    }

    // Segundo: Se o tipo é exclusão, inserir os usuários bloqueados (já filtrados)
    if (visibilityType === 'user_exclusion' && filteredExcludedUserIds.length > 0) {
      const exclusionInserts = filteredExcludedUserIds.map((userId: string) => ({
        flow_id: flowId,
        user_id: userId
      }));

      const { error: exclusionError } = await supabaseAdmin
        .from('flow_user_exclusions')
        .insert(exclusionInserts);

      if (exclusionError) {
        console.error("Erro ao inserir exclusões:", exclusionError);
        throw new Error(`Erro ao inserir exclusões: ${exclusionError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Visibilidade atualizada com sucesso',
        filteredExcludedCount: normalizedExcludedUserIds.length - filteredExcludedUserIds.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro na Edge Function update-flow-visibility:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message?.includes('obrigatório') || error.message?.includes('inválido') ? 400 : 500
      }
    );
  }
});

