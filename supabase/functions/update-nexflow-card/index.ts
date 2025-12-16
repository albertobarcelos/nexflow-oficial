import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateCardPayload {
  cardId: string;
  title?: string;
  fieldValues?: Record<string, unknown>;
  checklistProgress?: Record<string, Record<string, boolean>>;
  assignedTo?: string | null;
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

    const { cardId, title, fieldValues, checklistProgress, assignedTo, stepId, position, movementHistory, parentCardId, status } = body;

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
    if (assignedTo !== undefined) updatePayload.assigned_to = assignedTo;
    if (stepId !== undefined) updatePayload.step_id = stepId;
    if (position !== undefined) updatePayload.position = position;
    if (movementHistory !== undefined) updatePayload.movement_history = movementHistory;
    if (parentCardId !== undefined) updatePayload.parent_card_id = parentCardId;
    if (status !== undefined) updatePayload.status = status;

    // Atualizar card
    const { data: updatedCard, error: updateError } = await supabase
      .schema('nexflow')
      .from('cards')
      .update(updatePayload)
      .eq('id', cardId)
      .select('*')
      .single();

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
      assignedTo: updatedCard.assigned_to ?? null,
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

