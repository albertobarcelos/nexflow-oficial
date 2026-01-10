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
    } catch (parseError: any) {
      return new Response(
        JSON.stringify({ 
          error: `Erro ao fazer parse do JSON: ${parseError.message}`,
          visibilityType: "company", 
          teamIds: [], 
          excludedUserIds: [] 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { flowId } = body;

    if (!flowId) {
      return new Response(
        JSON.stringify({ 
          error: "flowId é obrigatório",
          visibilityType: "company", 
          teamIds: [], 
          excludedUserIds: [] 
        }),
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

    // 1. Buscar dados do flow (schema public - padrão)
    const { data: flow, error: flowError } = await supabase
      .from('flows')
      .select('visibility_type')
      .eq('id', flowId)
      .single();

    if (flowError || !flow) {
      console.error("Erro ao buscar flow:", flowError);
      return new Response(
        JSON.stringify({ 
          error: flowError?.message || 'Flow não encontrado',
          visibilityType: "company", 
          teamIds: [], 
          excludedUserIds: [] 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const visibilityType = flow.visibility_type || "company";

    // 2. Buscar times vinculados (schema public - padrão)
    const { data: teamAccess, error: teamAccessError } = await supabase
      .from('flow_team_access')
      .select('team_id')
      .eq('flow_id', flowId);

    const teamIds = teamAccessError 
      ? [] 
      : (teamAccess?.map(t => t.team_id) || []);

    // 3. Buscar exclusões de usuários (schema public - padrão)
    const { data: userExclusions, error: userExclusionsError } = await supabase
      .from('flow_user_exclusions')
      .select('user_id')
      .eq('flow_id', flowId);

    const excludedUserIds = userExclusionsError
      ? []
      : (userExclusions?.map(u => u.user_id) || []);

    // Normalizar tipo para o frontend
    const normalizedType = visibilityType === "user_exclusion" ? "user" : visibilityType;

    return new Response(
      JSON.stringify({ 
        visibilityType: normalizedType,
        teamIds,
        excludedUserIds
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Erro na função get-flow-visibility:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        visibilityType: "company", 
        teamIds: [], 
        excludedUserIds: [] 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

