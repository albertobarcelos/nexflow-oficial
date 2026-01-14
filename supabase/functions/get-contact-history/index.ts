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

interface GetContactHistoryRequest {
  contactId: string;
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
    let contactId: string;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      contactId = url.searchParams.get('contactId') || '';
    } else {
      const requestData: GetContactHistoryRequest = await req.json();
      contactId = requestData.contactId;
    }

    if (!contactId) {
      return new Response(
        JSON.stringify({ error: 'contactId é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 4. Validar que o contato pertence ao client_id
    const { data: contactValidation, error: validationError } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('client_id', clientId)
      .single();

    if (validationError || !contactValidation) {
      return new Response(
        JSON.stringify({ error: 'Contato não encontrado ou sem permissão de acesso' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 5. Chamar função SQL via RPC
    const { data: history, error: rpcError } = await supabaseAdmin.rpc(
      'get_contact_history',
      {
        p_contact_id: contactId,
        p_client_id: clientId
      }
    );

    if (rpcError) {
      console.error('Erro ao chamar get_contact_history:', rpcError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar histórico do contato',
          details: rpcError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 6. Retornar dados
    return new Response(
      JSON.stringify({ history: history || [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro na Edge Function get-contact-history:', error);
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
