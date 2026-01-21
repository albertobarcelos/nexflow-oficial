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
      console.error('[get-contact-history] Token de autorização não fornecido');
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[get-contact-history] Variáveis de ambiente não configuradas');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      console.error('[get-contact-history] Erro ao validar token:', userError.message);
      return new Response(
        JSON.stringify({ error: 'Token inválido', details: userError.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!user) {
      console.error('[get-contact-history] Usuário não encontrado após validação do token');
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[get-contact-history] Usuário autenticado:', user.id);

    // 2. Buscar Client ID do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('core_client_users')
      .select('client_id, is_active')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[get-contact-history] Erro ao buscar perfil do usuário:', profileError.message, 'User ID:', user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar dados do usuário', 
          details: profileError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile) {
      console.error('[get-contact-history] Perfil não encontrado para usuário:', user.id);
      return new Response(
        JSON.stringify({ error: 'Perfil do usuário não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile.is_active) {
      console.error('[get-contact-history] Usuário inativo:', user.id);
      return new Response(
        JSON.stringify({ error: 'Usuário inativo' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const clientId = profile.client_id;
    console.log('[get-contact-history] Client ID obtido:', clientId);

    // 3. Obter parâmetros da requisição
    let contactId: string;
    
    try {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        contactId = url.searchParams.get('contactId') || '';
      } else {
        const requestData: GetContactHistoryRequest = await req.json();
        contactId = requestData.contactId;
      }
    } catch (parseError) {
      console.error('[get-contact-history] Erro ao parsear body da requisição:', parseError);
      return new Response(
        JSON.stringify({ error: 'Formato de requisição inválido' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!contactId) {
      console.error('[get-contact-history] contactId não fornecido');
      return new Response(
        JSON.stringify({ error: 'contactId é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[get-contact-history] Buscando histórico para contato:', contactId);

    // 4. Validar que o contato pertence ao client_id
    const { data: contactValidation, error: validationError } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('client_id', clientId)
      .single();

    if (validationError) {
      console.error('[get-contact-history] Erro ao validar contato:', validationError.message, 'Contact ID:', contactId, 'Client ID:', clientId);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao validar contato', 
          details: validationError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!contactValidation) {
      console.error('[get-contact-history] Contato não encontrado ou sem permissão. Contact ID:', contactId, 'Client ID:', clientId);
      return new Response(
        JSON.stringify({ error: 'Contato não encontrado ou sem permissão de acesso' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 5. Chamar função SQL via RPC
    console.log('[get-contact-history] Chamando função RPC get_contact_history com:', { p_contact_id: contactId, p_client_id: clientId });
    const { data: history, error: rpcError } = await supabaseAdmin.rpc(
      'get_contact_history',
      {
        p_contact_id: contactId,
        p_client_id: clientId
      }
    );

    if (rpcError) {
      console.error('[get-contact-history] Erro ao chamar get_contact_history:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code,
        contactId,
        clientId
      });
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar histórico do contato',
          details: rpcError.message,
          code: rpcError.code
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[get-contact-history] Histórico obtido com sucesso. Total de cards:', Array.isArray(history) ? history.length : 0);

    // 6. Retornar dados
    return new Response(
      JSON.stringify({ history: history || [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[get-contact-history] Erro não tratado na Edge Function:', {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });
    return new Response(
      JSON.stringify({
        error: error?.message || 'Erro desconhecido',
        details: error?.stack || 'Sem detalhes disponíveis'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
