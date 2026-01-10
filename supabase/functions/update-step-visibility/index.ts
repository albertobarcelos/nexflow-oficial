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
    // Parse Body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: `Erro ao fazer parse do JSON: ${parseError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { stepId, flowId, visibilityType, teamIds, excludedUserIds } = body;

    if (!stepId) {
      return new Response(
        JSON.stringify({ error: "stepId é obrigatório" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!flowId) {
      return new Response(
        JSON.stringify({ error: "flowId é obrigatório" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Validar se o step pertence ao flow
    const { data: step, error: stepError } = await supabase
      .from("steps")
      .select("flow_id")
      .eq("id", stepId)
      .single();

    if (stepError || !step) {
      return new Response(
        JSON.stringify({ error: "Step não encontrado" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (step.flow_id !== flowId) {
      return new Response(
        JSON.stringify({ error: "Step não pertence ao flow especificado" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mapeamento user -> user_exclusion para o banco
    const apiType = visibilityType === "user" ? "user_exclusion" : visibilityType;

    // Normalizar arrays
    const normalizedTeamIds = Array.isArray(teamIds) ? teamIds : [];
    const normalizedExcludedUserIds = Array.isArray(excludedUserIds) ? excludedUserIds : [];

    // Atualizar tipo de visibilidade da etapa
    const { error: updateError } = await supabase
      .from("steps")
      .update({ visibility_type: apiType })
      .eq("id", stepId);

    if (updateError) {
      console.error("Erro ao atualizar visibility_type da etapa:", updateError);
      throw new Error(`Erro ao atualizar etapa: ${updateError.message}`);
    }

    // Remover todos os acessos de times existentes
    const { error: deleteTeamError } = await supabase
      .from("step_team_access")
      .delete()
      .eq("step_id", stepId);

    if (deleteTeamError) {
      throw new Error(`Erro ao deletar times antigos: ${deleteTeamError.message}`);
    }

    // Adicionar novos acessos de times (se houver)
    if (normalizedTeamIds.length > 0) {
      const teamAccessData = normalizedTeamIds.map((teamId: string) => ({
        step_id: stepId,
        team_id: teamId,
      }));

      const { error: teamAccessError } = await supabase
        .from("step_team_access")
        .insert(teamAccessData);

      if (teamAccessError) {
        console.error("Erro ao inserir acessos de times:", teamAccessError);
        throw new Error(`Erro ao inserir times: ${teamAccessError.message}`);
      }
    }

    // Remover todas as exclusões de usuários existentes
    const { error: deleteExclusionError } = await supabase
      .from("step_user_exclusions")
      .delete()
      .eq("step_id", stepId);

    if (deleteExclusionError) {
      throw new Error(`Erro ao deletar exclusões antigas: ${deleteExclusionError.message}`);
    }

    // Adicionar novas exclusões de usuários (se houver)
    if (normalizedExcludedUserIds.length > 0) {
      const userExclusionsData = normalizedExcludedUserIds.map((userId: string) => ({
        step_id: stepId,
        user_id: userId,
      }));

      const { error: userExclusionsError } = await supabase
        .from("step_user_exclusions")
        .insert(userExclusionsData);

      if (userExclusionsError) {
        console.error("Erro ao inserir exclusões de usuários:", userExclusionsError);
        throw new Error(`Erro ao inserir exclusões: ${userExclusionsError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Visibilidade da etapa atualizada com sucesso' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Erro na função update-step-visibility:", error);
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
