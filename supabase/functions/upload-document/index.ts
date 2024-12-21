import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const clientId = formData.get('clientId')

    if (!file || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing file or client ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileExt = file.name.split('.').pop()
    const fileName = `${clientId}/${crypto.randomUUID()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('documents')
      .eq('id', clientId)
      .single()

    if (clientError) {
      throw clientError
    }

    const documents = client.documents || []
    documents.push({
      name: file.name,
      path: fileName,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    })

    const { error: updateError } = await supabase
      .from('clients')
      .update({ documents })
      .eq('id', clientId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        message: 'Document uploaded successfully',
        document: documents[documents.length - 1]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})