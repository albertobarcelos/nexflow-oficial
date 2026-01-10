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

/**
 * Verifica se o usuário tem permissão para gerenciar tags
 * Apenas administrators, leaders e admins de time podem gerenciar
 */
async function canUserManageTags(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ hasAccess: boolean; clientId?: string }> {
  // 1. Verificar se é administrator
  const { data: clientUser, error: userError } = await supabase
    .from('core_client_users')
    .select('role, client_id')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('Erro ao buscar usuário:', userError);
    return { hasAccess: false };
  }

  if (!clientUser) {
    return { hasAccess: false };
  }

  if (clientUser.role === 'administrator') {
    return { hasAccess: true, clientId: clientUser.client_id };
  }

  // 2. Verificar se é leader ou admin de time
  const { data: teamMembers, error: teamError } = await supabase
    .from('core_team_members')
    .select('role')
    .eq('user_profile_id', userId)
    .in('role', ['leader', 'admin']);

  if (teamError) {
    console.error('Erro ao buscar membros de time:', teamError);
    return { hasAccess: false };
  }

  if ((teamMembers?.length ?? 0) > 0) {
    return { hasAccess: true, clientId: clientUser.client_id };
  }

  return { hasAccess: false };
}

/**
 * Verifica se o flow existe e pertence ao mesmo client do usuário
 */
async function validateFlowAccess(
  supabase: ReturnType<typeof createClient>,
  flowId: string,
  userClientId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const { data: flow, error } = await supabase
      .from('flows')
      .select('id, client_id')
      .eq('id', flowId)
      .single();

    if (error) {
      console.error('Erro ao buscar flow:', error);
      return { isValid: false, error: `Flow não encontrado: ${error.message}` };
    }

    if (!flow) {
      console.error('Flow não encontrado:', flowId);
      return { isValid: false, error: 'Flow não encontrado' };
    }

    if (flow.client_id !== userClientId) {
      console.error('Acesso negado - client_id não corresponde:', {
        flowClientId: flow.client_id,
        userClientId
      });
      return { isValid: false, error: 'Acesso negado: flow não pertence ao seu cliente' };
    }

    return { isValid: true };
  } catch (err: any) {
    console.error('Erro em validateFlowAccess:', err);
    return { isValid: false, error: `Erro ao validar acesso: ${err.message || 'Erro desconhecido'}` };
  }
}

/**
 * Valida cor hexadecimal
 */
function isValidColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com autenticação do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar cliente com service role para acessar todas as tabelas (incluindo schema nexflow)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Criar cliente com token do usuário apenas para validar autenticação
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Obter usuário autenticado
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const url = new URL(req.url);
    const flowId = url.searchParams.get('flowId');

    // GET - Listar tags (todos podem ver)
    if (req.method === 'GET') {
      if (!flowId) {
        return new Response(
          JSON.stringify({ error: 'flowId é obrigatório' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Verificar acesso ao flow
      const { data: clientUser, error: clientUserError } = await supabase
        .from('core_client_users')
        .select('client_id')
        .eq('id', user.id)
        .single();

      if (clientUserError) {
        console.error('Erro ao buscar clientUser:', clientUserError);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar dados do usuário', details: clientUserError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!clientUser) {
        return new Response(
          JSON.stringify({ error: 'Usuário não encontrado' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { isValid, error: validationError } = await validateFlowAccess(
        supabase,
        flowId,
        clientUser.client_id
      );

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: validationError }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Buscar tags
      console.log('Buscando tags para flowId:', flowId);
      const { data: tags, error: tagsError } = await supabase
        .from('flow_tags')
        .select('*')
        .eq('flow_id', flowId)
        .order('created_at', { ascending: true });

      if (tagsError) {
        console.error('Erro ao buscar tags:', tagsError);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar tags', details: tagsError.message, code: tagsError.code }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Tags encontradas:', tags?.length || 0);

      return new Response(
        JSON.stringify({ tags: tags || [] }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar permissão para operações de escrita
    const { hasAccess, clientId } = await canUserManageTags(supabase, user.id);

    if (!hasAccess || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado: apenas administrators, leaders e admins de time podem gerenciar tags' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // POST - Criar tag
    if (req.method === 'POST') {
      console.log('POST - Criar tag iniciado');
      let body: any;
      try {
        body = await req.json();
        console.log('Body recebido:', body);
      } catch (parseError: any) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        return new Response(
          JSON.stringify({ error: `Erro ao fazer parse do JSON: ${parseError.message || 'JSON inválido'}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { flowId: bodyFlowId, name, color } = body;
      console.log('Dados extraídos:', { bodyFlowId, name, color });

      if (!bodyFlowId || !name) {
        return new Response(
          JSON.stringify({ error: 'flowId e name são obrigatórios' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Validar acesso ao flow
      const { isValid, error: validationError } = await validateFlowAccess(
        supabase,
        bodyFlowId,
        clientId
      );

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: validationError }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Validar cor
      const tagColor = color || '#94a3b8';
      if (!isValidColor(tagColor)) {
        return new Response(
          JSON.stringify({ error: 'Cor inválida. Use formato hexadecimal (#RRGGBB)' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Verificar se já existe tag com mesmo nome no flow
      const { data: existingTag } = await supabase
        .from('flow_tags')
        .select('id')
        .eq('flow_id', bodyFlowId)
        .eq('name', name.trim())
        .single();

      if (existingTag) {
        return new Response(
          JSON.stringify({ error: 'Já existe uma tag com este nome neste flow' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Criar tag
      const { data: newTag, error: createError } = await supabase
        .from('flow_tags')
        .insert({
          flow_id: bodyFlowId,
          name: name.trim(),
          color: tagColor,
        })
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar tag:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar tag', details: createError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ tag: newTag }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // PUT - Atualizar tag
    if (req.method === 'PUT') {
      let body: any;
      try {
        body = await req.json();
      } catch (parseError: any) {
        return new Response(
          JSON.stringify({ error: `Erro ao fazer parse do JSON: ${parseError.message || 'JSON inválido'}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { id, name, color } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'id da tag é obrigatório' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Buscar tag existente
      const { data: existingTag, error: fetchError } = await supabase
        .from('flow_tags')
        .select('flow_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingTag) {
        return new Response(
          JSON.stringify({ error: 'Tag não encontrada' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Validar acesso ao flow
      const { isValid, error: validationError } = await validateFlowAccess(
        supabase,
        existingTag.flow_id,
        clientId
      );

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: validationError }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Preparar dados para atualização
      const updateData: Record<string, any> = {};
      if (name !== undefined) {
        updateData.name = name.trim();
      }
      if (color !== undefined) {
        if (!isValidColor(color)) {
          return new Response(
            JSON.stringify({ error: 'Cor inválida. Use formato hexadecimal (#RRGGBB)' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        updateData.color = color;
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'Nenhum campo para atualizar' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Verificar constraint única se nome foi alterado
      if (name !== undefined) {
        const { data: duplicateTag } = await supabase
          .from('flow_tags')
          .select('id')
          .eq('flow_id', existingTag.flow_id)
          .eq('name', name.trim())
          .neq('id', id)
          .single();

        if (duplicateTag) {
          return new Response(
            JSON.stringify({ error: 'Já existe uma tag com este nome neste flow' }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Atualizar tag
      const { data: updatedTag, error: updateError } = await supabase
        .from('flow_tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar tag:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar tag', details: updateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ tag: updatedTag }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // DELETE - Deletar tag
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const tagId = url.searchParams.get('id');

      if (!tagId) {
        return new Response(
          JSON.stringify({ error: 'id da tag é obrigatório' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Buscar tag existente
      const { data: existingTag, error: fetchError } = await supabase
        .from('flow_tags')
        .select('flow_id')
        .eq('id', tagId)
        .single();

      if (fetchError || !existingTag) {
        return new Response(
          JSON.stringify({ error: 'Tag não encontrada' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Validar acesso ao flow
      const { isValid, error: validationError } = await validateFlowAccess(
        supabase,
        existingTag.flow_id,
        clientId
      );

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: validationError }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Verificar se há cards usando esta tag
      const { data: cardTags, error: cardTagsError } = await supabase
        .from('card_tags')
        .select('card_id')
        .eq('tag_id', tagId)
        .limit(1);

      if (cardTagsError) {
        console.error('Erro ao verificar uso da tag:', cardTagsError);
        return new Response(
          JSON.stringify({ error: 'Erro ao verificar uso da tag', details: cardTagsError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (cardTags && cardTags.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Não é possível deletar esta tag pois ela está sendo usada em cards' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Deletar tag
      const { error: deleteError } = await supabase
        .from('flow_tags')
        .delete()
        .eq('id', tagId);

      if (deleteError) {
        console.error('Erro ao deletar tag:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Erro ao deletar tag', details: deleteError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Erro na função manage-flow-tags:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro desconhecido',
        details: error.stack || 'Sem detalhes adicionais'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

