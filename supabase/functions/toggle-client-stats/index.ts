import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Inicializar Supabase Admin (Bypass RLS)
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

    // 3. Receber o ID do Cliente
    const { clientId } = await req.json()

    if (!clientId) {
      throw new Error('O campo clientId é obrigatório.')
    }

    // 4. Buscar o Status Atual
    const { data: client, error: fetchError } = await supabaseAdmin
      .from('core_clients')
      .select('status, name')
      .eq('id', clientId)
      .single()

    if (fetchError) throw fetchError
    if (!client) throw new Error('Cliente não encontrado.')

    // 5. Lógica de Toggle (Alternância)
    // Se for 'active', vira 'inactive'. Qualquer outra coisa vira 'active'.
    // IMPORTANTE: Certifique-se que seu enum 'client_status' no banco aceita o valor 'inactive'.
    const newStatus = client.status === 'active' ? 'inactive' : 'active'

    // 6. Atualizar no Banco
    const { data: updatedClient, error: updateError } = await supabaseAdmin
      .from('core_clients')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      })
      .eq('id', clientId)
      .select()
      .single()

    if (updateError) throw updateError

    // 7. Retornar Sucesso
    return new Response(
      JSON.stringify({ 
        message: `Status do cliente '${client.name}' alterado para ${newStatus}.`,
        client: updatedClient 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
