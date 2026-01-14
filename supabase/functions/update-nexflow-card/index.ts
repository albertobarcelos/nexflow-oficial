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
  parentCardId?: string | null;
  status?: 'inprogress' | 'completed' | 'canceled';
  product?: string | null;
  value?: number | null;
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

    const { cardId, title, fieldValues, checklistProgress, assignedTo, assignedTeamId, stepId, position, parentCardId, status, product, value } = body;
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
      .from('cards')
      .select('client_id, flow_id, step_id')
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

    // Verificar se o card é um card congelado (apenas se estiver em etapa freezing)
    // Cards filhos (com parent_card_id) não são automaticamente congelados
    // Cards congelados não podem ser editados, apenas visualizados
    const { data: cardStep, error: cardStepError } = await supabase
      .from('cards')
      .select('parent_card_id, step_id')
      .eq('id', cardId)
      .single();

    if (!cardStepError && cardStep) {
      // Verificar se o card está em uma etapa freezing
      const { data: currentStepData, error: stepDataError } = await supabase
        .from('steps')
        .select('step_type')
        .eq('id', cardStep.step_id)
        .single();

      // Card é congelado APENAS se estiver em etapa freezing
      // Cards filhos (com parent_card_id) não são congelados a menos que estejam em freezing
      const isFrozenCard = !stepDataError && currentStepData?.step_type === 'freezing';

      if (isFrozenCard) {
        // Cards congelados não podem ser editados
        return new Response(
          JSON.stringify({ 
            error: "Este card está congelado e não pode ser editado. Apenas visualização permitida." 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
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
    let targetStep: { flow_id: string; step_type: string; position: number } | null = null;
    let finalStepId = stepId; // Variável para armazenar o stepId final (pode ser modificado pela lógica de freezing)
    let autoStatus: 'inprogress' | 'completed' | 'canceled' | undefined = undefined; // Status automático baseado no step_type
    
    if (stepId) {
      const { data: step, error: stepError } = await supabase
        .from('steps')
        .select('flow_id, step_type, position')
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

      targetStep = step;

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

      // Atualizar status automaticamente baseado no step_type quando o card está mudando de etapa
      // Sempre sobrescrever o status quando o card é movido para uma etapa finisher ou fail
      if (stepId !== card.step_id) {
        if (step.step_type === 'finisher') {
          // Sempre definir como 'completed' quando cai em etapa finisher
          autoStatus = 'completed';
        } else if (step.step_type === 'fail') {
          // Sempre definir como 'canceled' quando cai em etapa fail
          autoStatus = 'canceled';
        }
      } else {
        // Se o card já está na etapa atual, verificar se precisa corrigir o status
        // Caso especial: se card está em etapa fail mas status é completed, forçar canceled
        if (step.step_type === 'fail' && card.status === 'completed') {
          autoStatus = 'canceled';
        } else if (step.step_type === 'finisher' && card.status !== 'completed') {
          autoStatus = 'completed';
        }
      }
      
      // Garantir que se status é explicitamente passado e a etapa é fail, sempre aplicar canceled
      if (step.step_type === 'fail' && status === 'canceled') {
        autoStatus = 'canceled';
      }

      // Lógica de freezing: quando card cai em etapa freezing
      // O card fica congelado na etapa freezing (não editável) e o original vai para a próxima etapa
      // IMPORTANTE: Cards não podem voltar para etapa freezing - só podem entrar nela uma vez
      if (step.step_type === 'freezing' && stepId !== card.step_id) {
        // Verificar se o card já foi congelado antes (tem parent_card_id ou já existe um card congelado apontando para ele)
        const { data: currentCardFull, error: currentCardFullError } = await supabase
          .from('cards')
          .select('parent_card_id')
          .eq('id', cardId)
          .single();

        if (!currentCardFullError && currentCardFull) {
          // Se o card já tem parent_card_id, significa que ele já foi congelado antes
          if (currentCardFull.parent_card_id !== null) {
            return new Response(
              JSON.stringify({ error: "Este card já foi congelado anteriormente e não pode retornar para uma etapa de congelamento." }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          // Verificar se já existe um card congelado apontando para este card (indicando que já foi congelado)
          const { data: existingFrozenCard, error: frozenCheckError } = await supabase
            .from('cards')
            .select('id')
            .eq('parent_card_id', cardId)
            .limit(1)
            .maybeSingle();

          if (!frozenCheckError && existingFrozenCard) {
            return new Response(
              JSON.stringify({ error: "Este card já foi congelado anteriormente e não pode retornar para uma etapa de congelamento." }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }

        // Buscar próxima etapa
        const { data: nextStep, error: nextStepError } = await supabase
          .from('steps')
          .select('id, position')
          .eq('flow_id', card.flow_id)
          .gt('position', step.position)
          .order('position', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!nextStep || nextStepError) {
          return new Response(
            JSON.stringify({ error: "Não há próxima etapa para mover o card original após congelamento." }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // O card fica na etapa freezing (congelado, não editável)
        // O card original será movido para a próxima etapa em uma segunda atualização
        // Por enquanto, deixamos o card na freezing e retornamos indicando que precisa de segunda atualização
        // Mas na verdade, vamos fazer diferente: criar um clone na freezing e mover o original
        
        // Buscar dados completos do card atual
        const { data: currentCard, error: currentCardError } = await supabase
          .from('cards')
          .select('*')
          .eq('id', cardId)
          .single();

        if (currentCardError || !currentCard) {
          return new Response(
            JSON.stringify({ error: "Erro ao buscar dados do card", details: currentCardError?.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Criar card congelado na etapa freezing (clone que aponta para o original)
        // Este card congelado não pode ser editado e compartilha o histórico do original
        const { data: frozenCard, error: frozenCardError } = await supabase
          .from('cards')
          .insert({
            flow_id: currentCard.flow_id,
            step_id: stepId, // Etapa freezing
            client_id: currentCard.client_id,
            title: currentCard.title, // Mesmo título do original
            field_values: currentCard.field_values,
            checklist_progress: currentCard.checklist_progress,
            parent_card_id: cardId, // Aponta para o original - histórico compartilhado via parent_card_id
            assigned_to: currentCard.assigned_to,
            assigned_team_id: currentCard.assigned_team_id,
            agents: currentCard.agents,
            status: currentCard.status, // Manter status do original
            position: 0,
          })
          .select('*')
          .single();

        if (frozenCardError) {
          console.error('Erro ao criar card congelado:', frozenCardError);
          return new Response(
            JSON.stringify({ error: "Erro ao criar card congelado", details: frozenCardError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Mover card original para a próxima etapa
        finalStepId = nextStep.id;
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
    
    if (finalStepId !== undefined) updatePayload.step_id = finalStepId;
    if (position !== undefined) updatePayload.position = position;
    if (parentCardId !== undefined) updatePayload.parent_card_id = parentCardId;
    // Priorizar status automático (baseado no step_type) sobre o status fornecido pelo frontend
    if (autoStatus !== undefined) {
      updatePayload.status = autoStatus;
    } else if (status !== undefined) {
      updatePayload.status = status;
    }
    if (product !== undefined) updatePayload.product = product;
    if (value !== undefined) updatePayload.value = value;

    // #region agent log
    console.log(JSON.stringify({
      location: 'update-nexflow-card/index.ts:318',
      message: 'About to update card in database',
      data: { cardId, updatePayload, finalStepId, hasAssignedTeamIdInPayload: 'assigned_team_id' in updatePayload, assignedTeamIdValue: updatePayload.assigned_team_id },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    }));
    // #endregion

    // Se stepId está mudando, registrar no histórico antes de atualizar
    // IMPORTANTE: Registrar histórico para TODAS as mudanças de step, incluindo finisher e fail
    // Nota: Se houver erro de permissão, apenas logar e continuar (não falhar a atualização)
    const isStepChanging = finalStepId !== undefined && finalStepId !== card.step_id;
    
    // Log para diagnóstico
    if (stepId && stepId !== card.step_id) {
      console.log('Verificando registro de histórico:', {
        stepId,
        finalStepId,
        currentStepId: card.step_id,
        isStepChanging,
        stepType: targetStep?.step_type,
        autoStatus,
      });
    }
    
    // NOTA: O histórico de mudanças de etapa agora é registrado automaticamente
    // pelo trigger track_card_stage_change() no banco de dados.
    // Não é mais necessário inserir manualmente aqui.
    if (isStepChanging) {
      console.log('Card mudando de etapa - histórico será registrado automaticamente pelo trigger:', {
        cardId,
        fromStepId: card.step_id,
        toStepId: finalStepId,
        userId,
      });
    }
    
    if (stepId && stepId !== card.step_id) {
      // Log quando o histórico não deveria ser registrado (para diagnóstico)
      console.warn('Histórico NÃO será registrado (condição não atendida):', {
        stepId,
        finalStepId,
        currentStepId: card.step_id,
        isStepChanging,
        reason: finalStepId === undefined ? 'finalStepId é undefined' : 'finalStepId === card.step_id',
      });
    }

    // Atualizar card
    const { data: updatedCard, error: updateError } = await supabase
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
      movementHistory: [], // Histórico agora é buscado da tabela card_history via hook useCardHistory
      parentCardId: updatedCard.parent_card_id ?? null,
      assignedTo: assignedToValue,
      assignedTeamId: assignedTeamIdValue,
      assigneeType: assigneeType,
      // agents não será usado atualmente - campo será criado futuramente
      // agents: Array.isArray(updatedCard.agents) ? updatedCard.agents : [],
      position: updatedCard.position ?? 0,
      status: updatedCard.status ?? null,
      createdAt: updatedCard.created_at,
      cardType: updatedCard.card_type ?? 'onboarding',
      product: updatedCard.product ?? null,
      value: updatedCard.value ? Number(updatedCard.value) : null,
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

