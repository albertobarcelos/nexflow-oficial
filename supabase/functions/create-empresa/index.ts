import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Lidar com preflight requests (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Inicializar Supabase Admin
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

    // 3. Ler o Body (JSON)
    // Extraímos os campos obrigatórios e opcionais baseados no seu schema SQL
    const { 
      name, 
      email, 
      company_name, 
      cpf_cnpj, 
      phone, 
      contact_name, 
      address, 
      city, 
      state, 
      postal_code, 
      license_id, 
     
    } = await req.json()

    // 4. Validação dos campos NOT NULL (obrigatórios no banco)
    if (!name || !email || !company_name || !cpf_cnpj) {
      throw new Error('Campos obrigatórios faltando: name, email, company_name, cpf_cnpj')
    }

    // 5. Preparar objeto de inserção
    // O Supabase ignora campos undefined, então podemos passar tudo direto
    const newClientData = {
      name,
      email,
      company_name,
      cpf_cnpj,
      phone,           // Opcional
      contact_name,    // Opcional
      address,         // Opcional
      city,            // Opcional
      state,           // Opcional
      postal_code,     // Opcional
      license_id,      // Opcional (FK)
      
      
      // status, created_at, updated_at são preenchidos automaticamente pelo default do banco
    }

    // 6. Inserir na tabela core_clients
    const { data: createdClient, error: insertError } = await supabaseAdmin
      .from('core_clients')
      .insert(newClientData)
      .select()
      .single()

    // Tratamento específico para erro de duplicidade (ex: email já existe)
    if (insertError) {
      if (insertError.code === '23505') { // Código Postgres para violação de unicidade
        throw new Error('Já existe um cliente cadastrado com este e-mail.')
      }
      throw insertError
    }

    // 7. Se license_id foi fornecido, criar vínculo em core_client_license
    if (license_id) {
      try {
        // Buscar informações da licença para obter user_quantity
        const { data: licenseData, error: licenseError } = await supabaseAdmin
          .from('core_licenses')
          .select('user_quantity')
          .eq('id', license_id)
          .single()

        if (licenseError) {
          console.error('Erro ao buscar licença:', licenseError)
          // Continuar mesmo se não encontrar a licença, usar valores padrão
        }

        // Calcular data de expiração (1 ano a partir de hoje)
        const startDate = new Date()
        const expirationDate = new Date()
        expirationDate.setFullYear(expirationDate.getFullYear() + 1)

        // Criar registro em core_client_license
        const clientLicenseData = {
          client_id: createdClient.id,
          license_id: license_id,
          type: 'premium' as const,
          status: 'active' as const,
          start_date: startDate.toISOString(),
          expiration_date: expirationDate.toISOString(),
          user_limit: licenseData?.user_quantity || 10, // Usar user_quantity da licença ou padrão 10
          can_use_nexhunters: true,
        }

        const { error: clientLicenseError } = await supabaseAdmin
          .from('core_client_license')
          .insert(clientLicenseData)

        if (clientLicenseError) {
          console.error('Erro ao criar vínculo de licença:', clientLicenseError)
          // Não falhar a criação do cliente se o vínculo falhar, apenas logar o erro
        }
      } catch (error) {
        console.error('Erro ao processar vínculo de licença:', error)
        // Continuar mesmo se houver erro no vínculo
      }
    }

    // 8. Retornar Sucesso
    return new Response(
      JSON.stringify({ 
        message: 'Cliente criado com sucesso.',
        client: createdClient 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201 // Created
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
