// Declaração de tipo para Deno (necessário para TypeScript local)
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

// @ts-ignore - Módulos JSR são resolvidos em runtime pelo Deno, não pelo TypeScript local
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - Módulos JSR são resolvidos em runtime pelo Deno, não pelo TypeScript local
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[get-steps] Iniciando requisição - Método: ${req.method}`);

  try {
    // Parse Body
    let body;
    try {
      body = await req.json();
      console.log(`[get-steps] Body recebido:`, { flowId: body?.flowId });
    } catch (parseError) {
      console.error(`[get-steps] Erro ao fazer parse do JSON:`, parseError);
      return new Response(
        JSON.stringify({ error: `Erro ao fazer parse do JSON: ${parseError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { flowId } = body;

    if (!flowId) {
      console.error(`[get-steps] flowId não fornecido`);
      return new Response(
        JSON.stringify({ error: "flowId é obrigatório" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente com token do usuário (não service role)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[get-steps] Token de autenticação não fornecido`);
      return new Response(
        JSON.stringify({ error: "Token de autenticação não fornecido" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[get-steps] Variáveis de ambiente não configuradas`);
      return new Response(
        JSON.stringify({ error: "Configuração do servidor inválida" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente com service role para acessar todas as tabelas
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Criar cliente com token do usuário apenas para validar autenticação
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Obter usuário autenticado usando cliente com token do usuário
    console.log(`[get-steps] Verificando autenticação do usuário`);
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error(`[get-steps] Erro ao obter usuário:`, userError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado", details: userError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = user.id;
    console.log(`[get-steps] Usuário autenticado: ${userId}`);

    // Buscar client_id do usuário
    console.log(`[get-steps] Buscando client_id do usuário ${userId}`);
    const { data: userData, error: userDataError } = await supabase
      .from("core_client_users")
      .select("client_id")
      .eq("id", userId)
      .single();

    if (userDataError || !userData) {
      console.error(`[get-steps] Erro ao buscar dados do usuário:`, {
        error: userDataError,
        userId,
        hasUserData: !!userData
      });
      return new Response(
        JSON.stringify({ 
          error: "Erro ao buscar dados do usuário",
          details: userDataError?.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userClientId = userData.client_id;
    console.log(`[get-steps] Client ID do usuário: ${userClientId}`);

    // Buscar team_ids do usuário
    console.log(`[get-steps] Buscando times do usuário`);
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from("core_team_members")
      .select("team_id")
      .eq("user_profile_id", userId);

    if (teamMembersError) {
      console.warn(`[get-steps] Erro ao buscar times do usuário (continuando):`, teamMembersError);
    }

    const userTeamIds = teamMembersError 
      ? [] 
      : (teamMembers?.map((tm) => tm.team_id) || []);
    console.log(`[get-steps] Usuário está em ${userTeamIds.length} time(s):`, userTeamIds);

    // Verificar se o flow pertence ao mesmo client do usuário
    console.log(`[get-steps] Verificando acesso ao flow ${flowId}`);
    const { data: flowData, error: flowError } = await supabase
      .from("flows")
      .select("client_id")
      .eq("id", flowId)
      .single();

    if (flowError || !flowData) {
      console.error(`[get-steps] Erro ao buscar flow:`, {
        error: flowError,
        flowId,
        hasFlowData: !!flowData
      });
      return new Response(
        JSON.stringify({ 
          error: "Flow não encontrado",
          details: flowError?.message 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (flowData.client_id !== userClientId) {
      console.warn(`[get-steps] Acesso negado: flow client (${flowData.client_id}) != user client (${userClientId})`);
      return new Response(
        JSON.stringify({ error: "Acesso negado ao flow" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[get-steps] Acesso ao flow autorizado`);

    // Buscar todas as etapas do flow
    console.log(`[get-steps] Buscando todas as etapas do flow`);
    const { data: allSteps, error: stepsError } = await supabase
      .from("steps")
      .select("*")
      .eq("flow_id", flowId)
      .order("position", { ascending: true });

    if (stepsError || !allSteps) {
      console.error(`[get-steps] Erro ao buscar etapas:`, {
        error: stepsError,
        flowId,
        hasSteps: !!allSteps
      });
      return new Response(
        JSON.stringify({ 
          error: "Erro ao buscar etapas do flow",
          details: stepsError?.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[get-steps] Encontradas ${allSteps.length} etapa(s) no flow`);

    // Filtrar etapas baseado nas permissões
    console.log(`[get-steps] Filtrando etapas baseado nas permissões`);
    const visibleSteps: typeof allSteps = [];
    let stepIndex = 0;

    for (const step of allSteps) {
      stepIndex++;
      const visibilityType = step.visibility_type || "company";
      console.log(`[get-steps] Processando step ${stepIndex}/${allSteps.length} (${step.id}): visibility_type=${visibilityType}`);

      // Se visibility_type = "company": todos podem ver
      if (visibilityType === "company") {
        console.log(`[get-steps] Step ${step.id}: company - permitindo acesso`);
        visibleSteps.push(step);
        continue;
      }

      // Se visibility_type = "team": verificar se usuário está em algum time permitido
      if (visibilityType === "team") {
        const { data: teamAccess, error: teamAccessError } = await supabase
          .from("step_team_access")
          .select("team_id")
          .eq("step_id", step.id);

        if (teamAccessError) {
          console.error(`[get-steps] Erro ao buscar acesso de times para step ${step.id}:`, teamAccessError);
          continue;
        }

        const allowedTeamIds = teamAccess?.map((t) => t.team_id) || [];
        console.log(`[get-steps] Step ${step.id}: team - times permitidos:`, allowedTeamIds);
        
        // Se não há times configurados, todos podem ver
        if (allowedTeamIds.length === 0) {
          console.log(`[get-steps] Step ${step.id}: nenhum time configurado - permitindo acesso`);
          visibleSteps.push(step);
          continue;
        }

        // Verificar se usuário está em algum time permitido
        const isInAllowedTeams = userTeamIds.some((teamId) => allowedTeamIds.includes(teamId));
        console.log(`[get-steps] Step ${step.id}: usuário em time permitido? ${isInAllowedTeams}`);
        if (isInAllowedTeams) {
          visibleSteps.push(step);
        }
        continue;
      }

      // Se visibility_type = "user_exclusion": verificar time E verificar se não está excluído
      if (visibilityType === "user_exclusion") {
        const { data: teamAccess, error: teamAccessError } = await supabase
          .from("step_team_access")
          .select("team_id")
          .eq("step_id", step.id);

        if (teamAccessError) {
          console.error(`[get-steps] Erro ao buscar acesso de times para step ${step.id}:`, teamAccessError);
          continue;
        }

        const allowedTeamIds = teamAccess?.map((t) => t.team_id) || [];
        console.log(`[get-steps] Step ${step.id}: user_exclusion - times permitidos:`, allowedTeamIds);
        
        // Se não há times configurados, todos podem ver (exceto se estiverem excluídos)
        if (allowedTeamIds.length === 0) {
          console.log(`[get-steps] Step ${step.id}: nenhum time configurado - verificando exclusões`);
          // Verificar se usuário está excluído
          const { data: userExclusions, error: userExclusionsError } = await supabase
            .from("step_user_exclusions")
            .select("user_id")
            .eq("step_id", step.id)
            .eq("user_id", userId);

          if (userExclusionsError) {
            console.error(`[get-steps] Erro ao buscar exclusões para step ${step.id}:`, userExclusionsError);
            continue;
          }

          const isExcluded = (userExclusions?.length || 0) > 0;
          console.log(`[get-steps] Step ${step.id}: usuário excluído? ${isExcluded}`);
          if (!isExcluded) {
            visibleSteps.push(step);
          }
          continue;
        }

        // Verificar se usuário está em algum time permitido
        const isInAllowedTeams = userTeamIds.some((teamId) => allowedTeamIds.includes(teamId));
        console.log(`[get-steps] Step ${step.id}: usuário em time permitido? ${isInAllowedTeams}`);
        if (!isInAllowedTeams) {
          console.log(`[get-steps] Step ${step.id}: acesso negado - usuário não está em time permitido`);
          continue;
        }

        // Verificar se usuário está excluído
        const { data: userExclusions, error: userExclusionsError } = await supabase
          .from("step_user_exclusions")
          .select("user_id")
          .eq("step_id", step.id)
          .eq("user_id", userId);

        if (userExclusionsError) {
          console.error(`[get-steps] Erro ao buscar exclusões para step ${step.id}:`, userExclusionsError);
          continue;
        }

        const isExcluded = (userExclusions?.length || 0) > 0;
        console.log(`[get-steps] Step ${step.id}: usuário excluído? ${isExcluded}`);
        if (!isExcluded) {
          visibleSteps.push(step);
        } else {
          console.log(`[get-steps] Step ${step.id}: acesso negado - usuário está excluído`);
        }
      } else {
        console.warn(`[get-steps] Step ${step.id}: visibility_type desconhecido: ${visibilityType}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[get-steps] Filtragem concluída: ${visibleSteps.length}/${allSteps.length} etapa(s) visíveis em ${duration}ms`);

    return new Response(
      JSON.stringify({ steps: visibleSteps }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[get-steps] Erro não tratado após ${duration}ms:`, {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        details: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

