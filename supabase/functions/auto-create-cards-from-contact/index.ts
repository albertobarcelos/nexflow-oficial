// @ts-ignore: Deno runtime imports (available in Supabase Edge Functions)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: ESM import (available in Deno runtime)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore: Deno is available in Supabase Edge Functions runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutoCreateRequest {
  contact_id: string
  client_id: string
  automation_id?: string // Se fornecido, cria apenas para esta regra específica
}

serve(async (req) => {
  // Lidar com preflight requests (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializar Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { contact_id, client_id, automation_id }: AutoCreateRequest = await req.json()

    // Validação dos campos obrigatórios
    if (!contact_id || !client_id) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando: contact_id, client_id' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Buscar o contato (no schema nexflow)
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .eq('client_id', client_id)
      .single()

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ error: 'Contato não encontrado ou acesso negado' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Buscar regras de automação (no schema nexflow)
    let automationQuery = supabaseAdmin
      .from('contact_automations')
      .select('*')
      .eq('client_id', client_id)
      .eq('is_active', true)

    if (automation_id) {
      automationQuery = automationQuery.eq('id', automation_id)
    }

    const { data: automations, error: autoError } = await automationQuery

    if (autoError) {
      console.error('Erro ao buscar automações:', autoError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar regras de automação' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!automations || automations.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Nenhuma regra de automação ativa encontrada',
          cards_created: []
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const createdCards: string[] = []
    const errors: Array<{ automation_id: string; error: string }> = []

    // Processar cada regra de automação
    for (const automation of automations) {
      try {
        // Verificar condições de trigger (se houver)
        if (automation.trigger_conditions && Object.keys(automation.trigger_conditions).length > 0) {
          // Aqui pode-se implementar lógica de validação baseada em trigger_conditions
          // Por exemplo: verificar tags, origem, valor mínimo, etc.
          // Por enquanto, vamos apenas verificar se a estrutura existe
        }

        // Verificar se flow e step existem e pertencem ao mesmo client_id (no schema nexflow)
        const { data: flowData, error: flowError } = await supabaseAdmin
          .from('flows')
          .select('id, client_id, category')
          .eq('id', automation.target_flow_id)
          .eq('client_id', client_id)
          .single()

        if (flowError || !flowData) {
          errors.push({
            automation_id: automation.id,
            error: 'Flow não encontrado ou acesso negado'
          })
          continue
        }

        // Determinar card_type baseado na category do flow
        const cardType = flowData.category === 'finance' ? 'finance' : 'onboarding'

        const { data: stepData, error: stepError } = await supabaseAdmin
          .from('steps')
          .select('id, flow_id')
          .eq('id', automation.target_step_id)
          .eq('flow_id', automation.target_flow_id)
          .single()

        if (stepError || !stepData) {
          errors.push({
            automation_id: automation.id,
            error: 'Step não encontrado ou não pertence ao flow'
          })
          continue
        }

        // Calcular a próxima posição (no schema nexflow)
        const { data: positionData } = await supabaseAdmin
          .from('cards')
          .select('position')
          .eq('step_id', automation.target_step_id)
          .order('position', { ascending: false })
          .limit(1)
          .single()

        const maxPosition = positionData?.position ?? 0
        const nextPosition = maxPosition + 1000

        // Criar o card (no schema nexflow)
        const cardTitle = (contact as any).name || (contact as any).client_name || 'Novo Contato'
        
        const { data: newCard, error: cardError } = await supabaseAdmin
          .from('cards')
          .insert({
            flow_id: automation.target_flow_id,
            step_id: automation.target_step_id,
            client_id: client_id,
            title: cardTitle,
            contact_id: contact_id,
            position: nextPosition,
            field_values: {},
            checklist_progress: {},
            card_type: cardType,
            product: null,
            value: null
          })
          .select('id')
          .single()

        if (cardError || !newCard) {
          console.error('Erro ao criar card:', cardError)
          errors.push({
            automation_id: automation.id,
            error: cardError?.message || 'Erro desconhecido ao criar card'
          })
        } else {
          createdCards.push(newCard.id)
        }
      } catch (error) {
        console.error('Erro ao processar automação:', error)
        errors.push({
          automation_id: automation.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Processamento concluído',
        cards_created: createdCards,
        cards_count: createdCards.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Erro na edge function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

