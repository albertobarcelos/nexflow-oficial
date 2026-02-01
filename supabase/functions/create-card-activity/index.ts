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

interface CreateCardActivityPayload {
  card_id: string;
  activity_type_id: string;
  title: string;
  description?: string | null;
  start_at: string; // ISO 8601 string
  end_at: string; // ISO 8601 string
  assignee_id?: string | null; // Se não fornecido, usa creator_id
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse Body
    let body: CreateCardActivityPayload;
    try {
      body = await req.json();
    } catch (parseError: any) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao fazer parse do JSON: ${parseError.message}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { card_id, activity_type_id, title, description, start_at, end_at, assignee_id } = body;

    // Validações básicas
    if (!card_id) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "card_id é obrigatório" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!activity_type_id) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "activity_type_id é obrigatório" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!title || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "title é obrigatório e não pode estar vazio" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!start_at || !end_at) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "start_at e end_at são obrigatórios" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar que end_at > start_at
    const startAt = new Date(start_at);
    const endAt = new Date(end_at);
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "start_at e end_at devem ser datas válidas" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (endAt <= startAt) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "A data de término deve ser posterior à data de início" 
        }),
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
        JSON.stringify({ 
          success: false,
          error: "Token de autenticação não fornecido" 
        }),
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
        headers: { Authorization: authHeader },
      },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Obter usuário autenticado
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Usuário não autenticado" 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar informações do usuário para obter client_id
    const { data: clientUser, error: userError } = await supabase
      .from('core_client_users')
      .select('id, client_id')
      .eq('id', user.id)
      .single();

    if (userError || !clientUser) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Erro ao buscar informações do usuário" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const clientId = clientUser.client_id;

    // Validar que o card existe e pertence ao mesmo client_id
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, flow_id, client_id')
      .eq('id', card_id)
      .single();

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Card não encontrado" 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (card.client_id !== clientId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Acesso negado ao card" 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar que o tipo de atividade existe e pertence ao mesmo flow e client_id
    const { data: activityType, error: activityTypeError } = await supabase
      .from('flow_activity_types')
      .select('id, flow_id, active, client_id')
      .eq('id', activity_type_id)
      .single();

    if (activityTypeError || !activityType) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Tipo de atividade não encontrado" 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (activityType.flow_id !== card.flow_id) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "O tipo de atividade não pertence ao flow do card" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (activityType.client_id !== clientId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Acesso negado ao tipo de atividade" 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!activityType.active) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "O tipo de atividade está inativo" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar assignee_id se fornecido
    let finalAssigneeId = assignee_id || user.id;
    if (assignee_id) {
      const { data: assignee, error: assigneeError } = await supabase
        .from('core_client_users')
        .select('id, client_id')
        .eq('id', assignee_id)
        .single();

      if (assigneeError || !assignee) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Usuário responsável não encontrado" 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (assignee.client_id !== clientId) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "O usuário responsável não pertence ao mesmo cliente" 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      finalAssigneeId = assignee_id;
    }

    // Criar a atividade
    const { data: activity, error: insertError } = await supabase
      .from('card_activities')
      .insert({
        card_id,
        activity_type_id,
        title: title.trim(),
        description: description?.trim() || null,
        start_at: start_at,
        end_at: end_at,
        assignee_id: finalAssigneeId,
        creator_id: user.id,
        client_id: clientId,
        completed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar atividade:', insertError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Erro ao criar atividade: ${insertError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        activity 
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('Erro inesperado na Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Erro inesperado: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
