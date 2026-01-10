import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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

  try {
    // Parse Body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          error: `Erro ao fazer parse do JSON: ${parseError.message}`,
          visibilityType: "company", 
          teamIds: [], 
          excludedUserIds: [] 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { stepId } = body;

    if (!stepId) {
      return new Response(
        JSON.stringify({ 
          error: "stepId é obrigatório",
          visibilityType: "company", 
          teamIds: [], 
          excludedUserIds: [] 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Buscar tipo de visibilidade da etapa
    const { data: step, error: stepError } = await supabase
      .from("steps")
      .select("visibility_type")
      .eq("id", stepId)
      .single();

    if (stepError || !step) {
      console.error("Erro ao buscar etapa:", stepError);
      return new Response(
        JSON.stringify({ 
          visibilityType: "company", 
          teamIds: [], 
          excludedUserIds: [] 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const visibilityType = step.visibility_type || "company";

    // Buscar times com acesso
    const { data: teamAccess, error: teamAccessError } = await supabase
      .from("step_team_access")
      .select("team_id")
      .eq("step_id", stepId);

    const teamIds = teamAccessError 
      ? [] 
      : (teamAccess?.map((t) => t.team_id) || []);

    // Buscar usuários excluídos
    const { data: userExclusions, error: userExclusionsError } = await supabase
      .from("step_user_exclusions")
      .select("user_id")
      .eq("step_id", stepId);

    const excludedUserIds = userExclusionsError
      ? []
      : (userExclusions?.map((u) => u.user_id) || []);

    // Normalizar tipo para o frontend
    const normalizedType = visibilityType === "user_exclusion" ? "user" : visibilityType;

    return new Response(
      JSON.stringify({
        visibilityType: normalizedType,
        teamIds,
        excludedUserIds,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Erro na função get-step-visibility:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        visibilityType: "company", 
        teamIds: [], 
        excludedUserIds: [] 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
