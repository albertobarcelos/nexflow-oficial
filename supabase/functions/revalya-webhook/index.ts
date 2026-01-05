import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validar token do Revalya
    const authHeader = req.headers.get("Authorization");
    const expectedToken = Deno.env.get("REVALYA_WEBHOOK_SECRET");
    
    if (!expectedToken) {
      console.error("REVALYA_WEBHOOK_SECRET não configurado");
      return new Response(
        JSON.stringify({ error: "Webhook secret não configurado" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = await req.json();
    
    // Estrutura esperada do Revalya:
    // {
    //   event: "payment.received",
    //   payment_id: "xxx",
    //   card_id: "card_123", // ID do card no sistema (deve estar no metadata)
    //   amount: 10000.00,
    //   payment_date: "2025-01-27",
    //   payment_method: "pix",
    //   status: "confirmed",
    //   metadata: { card_id: "uuid-do-card", ... }
    // }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Extrair card_id do payload (pode estar em metadata ou diretamente)
    const cardId = payload.card_id || payload.metadata?.card_id;
    
    if (!cardId) {
      return new Response(
        JSON.stringify({ error: "card_id não encontrado no payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Verificar se card existe e obter client_id
    const { data: card, error: cardError } = await supabase
      .schema("nexflow")
      .from("cards")
      .select("id, client_id, assigned_team_id, status")
      .eq("id", cardId)
      .single();

    if (cardError || !card) {
      console.error("Erro ao buscar card:", cardError);
      return new Response(
        JSON.stringify({ error: "Card não encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Verificar se pagamento já existe
    const { data: existingPayment } = await supabase
      .from("web_payments")
      .select("id")
      .eq("revalya_payment_id", payload.payment_id)
      .single();

    let paymentId: string;

    if (existingPayment) {
      // Atualizar pagamento existente
      const { data: updatedPayment, error: updateError } = await supabase
        .from("web_payments")
        .update({
          payment_amount: payload.amount,
          payment_status: payload.status,
          payment_date: payload.payment_date,
          payment_method: payload.payment_method,
          revalya_sync_at: new Date().toISOString(),
          revalya_sync_status: "synced",
          revalya_metadata: payload.metadata || {},
          confirmed_at: payload.status === "confirmed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPayment.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      paymentId = updatedPayment.id;
    } else {
      // Criar novo pagamento
      const { data: newPayment, error: insertError } = await supabase
        .from("web_payments")
        .insert({
          card_id: cardId,
          payment_reference: payload.payment_id,
          payment_date: payload.payment_date,
          payment_amount: payload.amount,
          payment_method: payload.payment_method,
          payment_status: payload.status,
          revalya_payment_id: payload.payment_id,
          revalya_sync_at: new Date().toISOString(),
          revalya_sync_status: "synced",
          revalya_metadata: payload.metadata || {},
          confirmed_at: payload.status === "confirmed" ? new Date().toISOString() : null,
          client_id: card.client_id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      paymentId = newPayment.id;
    }

    // 4. Se pagamento confirmado, calcular comissão
    if (payload.status === "confirmed") {
      // Chamar função de cálculo de comissão
      const { error: calcError } = await supabase.functions.invoke(
        "calculate-commission",
        {
          body: {
            payment_id: paymentId,
            card_id: cardId,
          },
        }
      );

      if (calcError) {
        console.error("Erro ao calcular comissão:", calcError);
        // Não falhar o webhook, apenas logar o erro
      }
    }

    // 5. Registrar log de integração
    await supabase.from("revalya_integration_log").insert({
      sync_type: "payment_received",
      revalya_payment_id: payload.payment_id,
      card_id: cardId,
      payment_id: paymentId,
      status: "success",
      revalya_data: payload,
      client_id: card.client_id,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        payment_id: paymentId,
        commission_calculated: payload.status === "confirmed"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro no webhook do Revalya:", error);
    
    // Registrar erro no log
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const payload = await req.json().catch(() => ({}));
      
      await supabase.from("revalya_integration_log").insert({
        sync_type: "payment_received",
        revalya_payment_id: payload.payment_id || "unknown",
        status: "error",
        error_message: error instanceof Error ? error.message : String(error),
        revalya_data: payload,
        client_id: payload.client_id || null,
      });
    } catch (logError) {
      console.error("Erro ao registrar log:", logError);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
