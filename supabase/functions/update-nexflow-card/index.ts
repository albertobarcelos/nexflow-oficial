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

interface UpdateCardPayload {
  cardId: string;
  title?: string;
  fieldValues?: Record<string, unknown>;
  checklistProgress?: Record<string, Record<string, boolean>>;
  assignedTo?: string | null; // Campo Responsável
  assignedTeamId?: string | null; // Campo Time
  // agents?: string[]; // Não será usado atualmente - será criado campo específico futuramente
  stepId?: string;
  position?: number;
  movementHistory?: Array<{
    id: string;
    fromStepId: string | null;
    toStepId: string;
    movedAt: string;
    movedBy?: string | null;
  }>;
  parentCardId?: string | null;
  status?: 'inprogress' | 'completed' | 'canceled';
}

/**
 * Verifica se o usuário tem permissão para alterar o título do card
 * Apenas administrators, leaders e admins de time podem alterar o título
 */
async function canUserEditTitle(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  // 1. Verificar se é administrator
  const { data: clientUser, error: userError } = await supabase
    .from('core_client_users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('Erro ao buscar usuário:', userError);
    return false;
  }

  if (clientUser?.role === 'administrator') {
    return true;
  }

  // 2. Verificar se é leader ou admin de time
  const { data: teamMembers, error: teamError } = await supabase
    .from('core_team_members')
    .select('role')
    .eq('user_profile_id', userId)
    .in('role', ['leader', 'admin']);

  if (teamError) {
    console.error('Erro ao buscar membros de time:', teamError);
    return false;
  }

  return (teamMembers?.length ?? 0) > 0;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse Body
    let body: UpdateCardPayload;
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

    const { cardId, title, fieldValues, checklistProgress, assignedTo, assignedTeamId, stepId, position, movementHistory, parentCardId, status } = body;
    // NOTA: agents não será processado atualmente - será criado campo específico futuramente

    // #region agent log
    console.log(JSON.stringify({
      location: 'update-nexflow-card/index.ts:100',
      message: 'Edge Function received payload',
      data: { 
        cardId, 
        assignedTo, 
        assignedTeamId, 
        stepId, 
        hasAssignedTeamId: typeof assignedTeamId !== 'undefined',
        assignedTeamIdType: typeof assignedTeamId,
        assignedTeamIdValue: assignedTeamId
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    }));
    // #endregion

    if (!cardId) {
      return new Response(
        JSON.stringify({ error: "cardId é obrigatório" }),
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

    // Verificar se card existe e pertence ao mesmo client_id do usuário
    const { data: card, error: cardError } = await supabase
      .schema('nexflow')
      .from('cards')
      .select('client_id, flow_id')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ error: "Card não encontrado", details: cardError?.message }),
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

    // Verificar se card pertence ao mesmo client_id
    if (card.client_id !== userData.client_id) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: card não pertence ao seu cliente" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Se está tentando alterar o título, verificar permissões
    if (title !== undefined && title !== null) {
      const canEdit = await canUserEditTitle(supabase, userId);
      if (!canEdit) {
        return new Response(
          JSON.stringify({ 
            error: "Acesso negado: apenas administrators, leaders e admins de time podem alterar o título do card" 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validar stepId se fornecido
    if (stepId) {
      const { data: step, error: stepError } = await supabase
        .schema('nexflow')
        .from('steps')
        .select('flow_id')
        .eq('id', stepId)
        .single();

      if (stepError || !step) {
        return new Response(
          JSON.stringify({ error: "Step não encontrado", details: stepError?.message }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Verificar se step pertence ao mesmo flow_id do card
      if (step.flow_id !== card.flow_id) {
        return new Response(
          JSON.stringify({ error: "Step não pertence ao mesmo flow do card" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Construir payload de atualização
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updatePayload.title = title;
    if (fieldValues !== undefined) updatePayload.field_values = fieldValues;
    if (checklistProgress !== undefined) updatePayload.checklist_progress = checklistProgress;
    
    // Campo Responsável (assigned_to) - independente do campo Time
    if (assignedTo !== undefined) {
      updatePayload.assigned_to = assignedTo;
    }
    
    // Campo Time (assigned_team_id) - independente do campo Responsável
    if (assignedTeamId !== undefined) {
      // #region agent log
      console.log(JSON.stringify({
        location: 'update-nexflow-card/index.ts:301',
        message: 'Processing assignedTeamId',
        data: { assignedTeamId, cardId, willSetToNull: assignedTeamId === null },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      }));
      // #endregion
      updatePayload.assigned_team_id = assignedTeamId;
    }

    // #region agent log
    console.log(JSON.stringify({
      location: 'update-nexflow-card/index.ts:310',
      message: 'Update payload before database update',
      data: { 
        updatePayload, 
        hasAssignedTeamId: 'assigned_team_id' in updatePayload,
        assignedTeamIdValue: updatePayload.assigned_team_id,
        assignedToValue: updatePayload.assigned_to
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    }));
    // #endregion
    
    // NOTA: Campo agents não será usado atualmente
    // Futuramente será criado um campo específico para agents
    // Por enquanto, não atualizamos a coluna agents
    // if (agents !== undefined) {
    //   updatePayload.agents = agents;
    // }
    
    if (stepId !== undefined) updatePayload.step_id = stepId;
    if (position !== undefined) updatePayload.position = position;
    if (movementHistory !== undefined) updatePayload.movement_history = movementHistory;
    if (parentCardId !== undefined) updatePayload.parent_card_id = parentCardId;
    if (status !== undefined) updatePayload.status = status;

    // #region agent log
    console.log(JSON.stringify({
      location: 'update-nexflow-card/index.ts:318',
      message: 'About to update card in database',
      data: { cardId, updatePayload, hasAssignedTeamIdInPayload: 'assigned_team_id' in updatePayload, assignedTeamIdValue: updatePayload.assigned_team_id },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    }));
    // #endregion

    // Atualizar card
    const { data: updatedCard, error: updateError } = await supabase
      .schema('nexflow')
      .from('cards')
      .update(updatePayload)
      .eq('id', cardId)
      .select('*')
      .single();

    // #region agent log
    if (updateError) {
      console.log(JSON.stringify({
        location: 'update-nexflow-card/index.ts:327',
        message: 'Database update error',
        data: { cardId, error: updateError.message, code: updateError.code, updatePayload },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      }));
    } else {
      console.log(JSON.stringify({
        location: 'update-nexflow-card/index.ts:333',
        message: 'Database update successful - raw card from DB',
        data: { cardId: updatedCard.id, assigned_to: updatedCard.assigned_to, assigned_team_id: updatedCard.assigned_team_id, hasAssignedTeamId: updatedCard.assigned_team_id !== null },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      }));
    }
    // #endregion

    if (updateError) {
      console.error('Erro ao atualizar card:', updateError);
      return new Response(
        JSON.stringify({ 
          error: "Erro ao atualizar card", 
          details: updateError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mapear resposta para formato esperado pelo frontend
    const assignedToValue = updatedCard.assigned_to ?? null;
    const assignedTeamIdValue = updatedCard.assigned_team_id ?? null;
    const assigneeType = assignedToValue ? 'user' : assignedTeamIdValue ? 'team' : 'unassigned';

    // #region agent log
    console.log(JSON.stringify({
      location: 'update-nexflow-card/index.ts:307',
      message: 'Card updated - response mapping',
      data: { cardId: updatedCard.id, assignedToValue, assignedTeamIdValue, assigneeType, rawAssignedTeamId: updatedCard.assigned_team_id },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    }));
    // #endregion
    
    const mappedCard = {
      id: updatedCard.id,
      flowId: updatedCard.flow_id,
      stepId: updatedCard.step_id,
      clientId: updatedCard.client_id,
      title: updatedCard.title,
      fieldValues: updatedCard.field_values ?? {},
      checklistProgress: updatedCard.checklist_progress ?? {},
      movementHistory: Array.isArray(updatedCard.movement_history) 
        ? updatedCard.movement_history 
        : [],
      parentCardId: updatedCard.parent_card_id ?? null,
      assignedTo: assignedToValue,
      assignedTeamId: assignedTeamIdValue,
      assigneeType: assigneeType,
      // agents não será usado atualmente - campo será criado futuramente
      // agents: Array.isArray(updatedCard.agents) ? updatedCard.agents : [],
      position: updatedCard.position ?? 0,
      status: updatedCard.status ?? null,
      createdAt: updatedCard.created_at,
    };

    return new Response(
      JSON.stringify({ success: true, card: mappedCard }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Erro na função update-nexflow-card:", error);
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

