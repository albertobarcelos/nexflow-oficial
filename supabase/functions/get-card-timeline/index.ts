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

interface GetCardTimelineRequest {
  cardId: string;
  parentCardId?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Buscar Client ID do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('core_client_users')
      .select('client_id, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
      return new Response(
        JSON.stringify({ error: 'Usuário inativo ou sem empresa' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const clientId = profile.client_id;

    // 3. Obter parâmetros da requisição
    let requestData: GetCardTimelineRequest;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const cardId = url.searchParams.get('cardId');
      const parentCardId = url.searchParams.get('parentCardId');
      
      if (!cardId) {
        return new Response(
          JSON.stringify({ error: 'cardId é obrigatório' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      requestData = { cardId, parentCardId: parentCardId || null };
    } else {
      requestData = await req.json();
      
      if (!requestData.cardId) {
        return new Response(
          JSON.stringify({ error: 'cardId é obrigatório' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // 4. Determinar card alvo (para cards congelados, usar parent)
    let targetCardId = requestData.parentCardId || requestData.cardId;

    if (!requestData.parentCardId) {
      // Verificar se está em etapa freezing
      const { data: cardData, error: cardError } = await supabaseAdmin
        .from('cards')
        .select('parent_card_id, step_id')
        .eq('id', requestData.cardId)
        .eq('client_id', clientId)
        .single();

      if (!cardError && cardData) {
        // Buscar tipo da etapa
        const { data: stepData } = await supabaseAdmin
          .from('steps')
          .select('step_type')
          .eq('id', cardData.step_id)
          .single();

        if (stepData?.step_type === 'freezing' && cardData.parent_card_id) {
          targetCardId = cardData.parent_card_id;
        }
      }
    }

    // 5. Validar que o card pertence ao client_id
    const { data: cardValidation, error: validationError } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('id', targetCardId)
      .eq('client_id', clientId)
      .single();

    if (validationError || !cardValidation) {
      return new Response(
        JSON.stringify({ error: 'Card não encontrado ou sem permissão de acesso' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 6. Chamar função SQL via RPC
    const { data: timeline, error: rpcError } = await supabaseAdmin.rpc(
      'get_card_timeline',
      {
        p_card_id: targetCardId,
        p_client_id: clientId
      }
    );

    if (rpcError) {
      console.error('Erro ao chamar get_card_timeline:', rpcError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar timeline do card',
          details: rpcError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 7. Retornar dados
    return new Response(
      JSON.stringify({ timeline: timeline || [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro na Edge Function get-card-timeline:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro desconhecido',
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
