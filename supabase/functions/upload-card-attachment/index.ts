// @ts-ignore - JSR imports são específicos do Deno runtime e funcionam no Supabase Edge Functions
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - JSR imports são específicos do Deno runtime e funcionam no Supabase Edge Functions
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validar autenticação
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

    // Criar cliente Supabase com service role para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Criar cliente com token do usuário para validar autenticação
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verificar autenticação do usuário
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

    // Obter client_id do usuário
    const { data: clientUser, error: clientUserError } = await supabaseAdmin
      .from('core_client_users')
      .select('client_id, name, surname, email')
      .eq('id', user.id)
      .single();

    if (clientUserError || !clientUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado ou sem cliente associado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const clientId = clientUser.client_id;

    // Parse FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const cardId = formData.get('cardId') as string | null;

    if (!file || !cardId) {
      return new Response(
        JSON.stringify({ error: 'Arquivo e cardId são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar se o card existe e pertence ao cliente
    const { data: card, error: cardError } = await supabaseAdmin
      .schema('nexflow')
      .from('cards')
      .select('id, client_id, step_id')
      .eq('id', cardId)
      .eq('client_id', clientId)
      .single();

    if (cardError || !card) {
      return new Response(
        JSON.stringify({ error: 'Card não encontrado ou sem permissão de acesso' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Preparar nome do arquivo para storage
    const fileExt = file.name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileNameStorage = `${clientId}/${cardId}/${timestamp}_${randomStr}.${fileExt}`;

    // Upload para storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('card-attachments')
      .upload(fileNameStorage, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return new Response(
        JSON.stringify({ error: `Erro ao fazer upload: ${uploadError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabaseAdmin.storage
      .from('card-attachments')
      .getPublicUrl(fileNameStorage);

    // Inserir registro em nexflow.card_attachments (sem join cross-schema)
    const { data: attachment, error: insertError } = await supabaseAdmin
      .schema('nexflow')
      .from('card_attachments')
      .insert({
        card_id: cardId,
        user_id: user.id,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        client_id: clientId,
      })
      .select('*')
      .single();

    if (insertError || !attachment) {
      // Se falhar ao inserir, tentar deletar o arquivo do storage
      await supabaseAdmin.storage
        .from('card-attachments')
        .remove([fileNameStorage]);

      return new Response(
        JSON.stringify({ error: `Erro ao registrar anexo: ${insertError?.message || 'Erro desconhecido'}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Preparar nome do usuário para o histórico
    const userName = `${clientUser.name || ''} ${clientUser.surname || ''}`.trim() || clientUser.email || 'Usuário';

    // Registrar no histórico do card
    const historyDetails = {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      user_name: userName,
      uploaded_at: new Date().toISOString(),
      attachment_id: attachment.id,
    };

    const { error: historyError } = await supabaseAdmin
      .schema('nexflow')
      .from('card_history')
      .insert({
        card_id: cardId,
        client_id: clientId,
        action_type: 'attachment_uploaded',
        details: historyDetails,
        created_by: user.id,
        from_step_id: card.step_id,
        to_step_id: card.step_id, // Mesmo step, apenas registro de ação
      });

    if (historyError) {
      console.error('Erro ao registrar histórico:', historyError);
      // Não falhar a requisição se o histórico não for registrado
    }

    // Formatar resposta com dados do usuário (já temos clientUser da validação inicial)
    const response = {
      id: attachment.id,
      card_id: attachment.card_id,
      user_id: attachment.user_id,
      file_url: attachment.file_url,
      file_name: attachment.file_name,
      file_size: attachment.file_size,
      file_type: attachment.file_type,
      created_at: attachment.created_at,
      client_id: attachment.client_id,
      user: {
        id: clientUser.id || user.id,
        name: clientUser.name,
        surname: clientUser.surname,
        email: clientUser.email,
      },
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

