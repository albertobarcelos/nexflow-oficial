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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface GetCardStepHistoryRequest {
  cardId: string;
  currentStepId?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
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
    let requestData: GetCardStepHistoryRequest;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const cardId = url.searchParams.get('cardId');
      const currentStepId = url.searchParams.get('currentStepId');
      
      if (!cardId) {
        return new Response(
          JSON.stringify({ error: 'cardId é obrigatório' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      requestData = { cardId, currentStepId: currentStepId || null };
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

    // 4. Validar que o card pertence ao client_id
    const { data: cardValidation, error: validationError } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('id', requestData.cardId)
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

    // 5. Buscar snapshots de valores históricos
    let query = supabaseAdmin
      .from('card_step_values')
      .select(`
        id,
        card_id,
        step_id,
        field_values,
        created_at,
        updated_at,
        steps:step_id (
          id,
          title,
          position
        )
      `)
      .eq('card_id', requestData.cardId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // Filtrar etapa atual se fornecida
    if (requestData.currentStepId) {
      query = query.neq('step_id', requestData.currentStepId);
    }

    const { data: stepValues, error: stepValuesError } = await query;

    if (stepValuesError) {
      console.error('Erro ao buscar histórico de valores:', stepValuesError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar histórico de valores',
          details: stepValuesError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!stepValues || stepValues.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // 6. Processar cada snapshot e buscar informações dos campos
    const stepHistories = await Promise.all(
      stepValues.map(async (stepValue: any) => {
        const step = stepValue.steps as { id: string; title: string; position: number } | null;

        if (!step) {
          return null;
        }

        // Buscar campos da etapa para obter labels e tipos
        const { data: stepFields } = await supabaseAdmin
          .from('step_fields')
          .select('id, label, field_type, slug')
          .eq('step_id', stepValue.step_id);

        // Mapear valores dos campos com informações dos step_fields
        const fields: any[] = [];
        const fieldValues = (stepValue.field_values as Record<string, unknown>) || {};

        // Tipo para informação do campo
        interface FieldInfo {
          label: string | null;
          field_type: string | null;
          slug: string | null;
        }

        interface FieldInfoWithId extends FieldInfo {
          id: string;
        }

        // Criar mapa de field_id -> step_field para lookup rápido
        const fieldMap = new Map<string, FieldInfo>(
          (stepFields || []).map((sf: any) => [
            sf.id,
            { label: sf.label, field_type: sf.field_type, slug: sf.slug } as FieldInfo,
          ])
        );

        // Também criar mapa por slug para campos que usam slug como chave
        const fieldMapBySlug = new Map<string, FieldInfoWithId>(
          (stepFields || []).map((sf: any) => [
            sf.slug,
            { id: sf.id, label: sf.label, field_type: sf.field_type, slug: sf.slug } as FieldInfoWithId,
          ])
        );

        // Processar cada valor em field_values
        Object.entries(fieldValues).forEach(([key, value]) => {
          // Tentar encontrar campo por ID primeiro
          let fieldInfo: FieldInfo | undefined = fieldMap.get(key);

          // Se não encontrou por ID, tentar por slug
          if (!fieldInfo) {
            const foundBySlug: FieldInfoWithId | undefined = fieldMapBySlug.get(key);
            if (foundBySlug) {
              fieldInfo = {
                label: foundBySlug.label,
                field_type: foundBySlug.field_type,
                slug: foundBySlug.slug,
              };
            }
          }

          // Se encontrou o campo, adicionar à lista
          if (fieldInfo) {
            fields.push({
              field_id: key,
              label: fieldInfo.label || key,
              value: value,
              field_type: fieldInfo.field_type || 'text',
              slug: fieldInfo.slug,
            });
          } else {
            // Campo não encontrado em step_fields, mas ainda assim incluir
            // (pode ser campo removido ou sistema)
            fields.push({
              field_id: key,
              label: key,
              value: value,
              field_type: 'text',
              slug: null,
            });
          }
        });

        return {
          step_id: stepValue.step_id,
          step_name: step.title,
          step_position: step.position,
          field_values: fieldValues,
          created_at: stepValue.created_at,
          updated_at: stepValue.updated_at,
          fields: fields,
        };
      })
    );

    // Filtrar nulls e ordenar por posição da etapa (mais recente primeiro)
    const filteredHistories = stepHistories
      .filter((sh): sh is any => sh !== null)
      .sort((a, b) => b.step_position - a.step_position);

    // 7. Retornar dados
    return new Response(
      JSON.stringify({ success: true, data: filteredHistories }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Erro na Edge Function get-card-step-history:', error);
    return new Response(
      JSON.stringify({
        success: false,
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
