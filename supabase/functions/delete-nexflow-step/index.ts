import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteStepPayload {
  stepId: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // #region agent log
    console.log(JSON.stringify({
      location: 'delete-nexflow-step/index.ts:20',
      message: 'Edge Function called',
      data: { method: req.method, url: req.url, contentType: req.headers.get('content-type') },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A'
    }));
    // #endregion

    // Parse Body
    let body: DeleteStepPayload;
    try {
      body = await req.json();
      // #region agent log
      console.log(JSON.stringify({
        location: 'delete-nexflow-step/index.ts:30',
        message: 'Body parsed successfully',
        data: { body, stepId: body?.stepId, stepIdType: typeof body?.stepId, bodyKeys: Object.keys(body || {}) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      }));
      // #endregion
    } catch (parseError) {
      // #region agent log
      console.log(JSON.stringify({
        location: 'delete-nexflow-step/index.ts:38',
        message: 'Error parsing JSON',
        data: { error: parseError.message, errorName: parseError.name },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      }));
      // #endregion
      return new Response(
        JSON.stringify({ error: `Erro ao fazer parse do JSON: ${parseError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { stepId } = body || {};

    // #region agent log
    console.log(JSON.stringify({
      location: 'delete-nexflow-step/index.ts:50',
      message: 'Validating stepId',
      data: { stepId, hasStepId: !!stepId, stepIdType: typeof stepId, body, bodyType: typeof body },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A'
    }));
    // #endregion

    if (!stepId || (typeof stepId === 'string' && stepId.trim() === '')) {
      // #region agent log
      console.log(JSON.stringify({
        location: 'delete-nexflow-step/index.ts:82',
        message: 'stepId validation failed',
        data: { stepId, body },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'A'
      }));
      // #endregion
      return new Response(
        JSON.stringify({ error: "stepId é obrigatório" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente com service role para operações no banco
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Validar autenticação do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação não fornecido" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente com token do usuário para validar autenticação
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Obter usuário autenticado
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado", details: userError?.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = user.id;

    // Verificar se step existe e obter informações
    const { data: step, error: stepError } = await supabase
      .schema('nexflow')
      .from('steps')
      .select('id, flow_id, title')
      .eq('id', stepId)
      .single();

    if (stepError || !step) {
      return new Response(
        JSON.stringify({ error: "Etapa não encontrada", details: stepError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar client_id do usuário
    const { data: userData, error: userDataError } = await supabase
      .from('core_client_users')
      .select('client_id')
      .eq('id', userId)
      .single();

    if (userDataError || !userData) {
      return new Response(
        JSON.stringify({ error: "Erro ao buscar dados do usuário", details: userDataError?.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se o flow pertence ao mesmo client_id do usuário
    const { data: flow, error: flowError } = await supabase
      .schema('nexflow')
      .from('flows')
      .select('client_id')
      .eq('id', step.flow_id)
      .single();

    if (flowError || !flow) {
      return new Response(
        JSON.stringify({ error: "Flow não encontrado", details: flowError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (flow.client_id !== userData.client_id) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: etapa não pertence ao seu cliente" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se há cards na etapa
    const { data: cards, error: cardsError } = await supabase
      .schema('nexflow')
      .from('cards')
      .select('id')
      .eq('step_id', stepId)
      .limit(1);

    if (cardsError) {
      return new Response(
        JSON.stringify({ error: "Erro ao verificar cards na etapa", details: cardsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (cards && cards.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Não é possível excluir a etapa: existem cards associados a esta etapa. Mova ou exclua os cards antes de excluir a etapa." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se é a última etapa do flow
    const { data: allSteps, error: allStepsError } = await supabase
      .schema('nexflow')
      .from('steps')
      .select('id')
      .eq('flow_id', step.flow_id);

    if (allStepsError) {
      return new Response(
        JSON.stringify({ error: "Erro ao verificar etapas do flow", details: allStepsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (allSteps && allSteps.length <= 1) {
      return new Response(
        JSON.stringify({ 
          error: "Não é possível excluir a etapa: o flow precisa ter pelo menos uma etapa." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Excluir a etapa
    const { error: deleteError } = await supabase
      .schema('nexflow')
      .from('steps')
      .delete()
      .eq('id', stepId);

    if (deleteError) {
      console.error('Erro ao excluir etapa:', deleteError);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao excluir etapa", 
          details: deleteError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Etapa excluída com sucesso" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Erro na função delete-nexflow-step:", error);
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

