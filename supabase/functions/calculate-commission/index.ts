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
    const { payment_id, card_id } = await req.json();

    if (!payment_id || !card_id) {
      return new Response(
        JSON.stringify({ error: "payment_id e card_id são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Buscar pagamento e card
    const { data: payment, error: paymentError } = await supabase
      .from("web_payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (paymentError || !payment) {
      throw new Error("Pagamento não encontrado");
    }

    if (payment.payment_status !== "confirmed") {
      return new Response(
        JSON.stringify({ error: "Pagamento não está confirmado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Buscar card e verificar se está completo
    const { data: card, error: cardError } = await supabase
      .schema("nexflow")
      .from("cards")
      .select("id, client_id, assigned_team_id, status, step_id")
      .eq("id", card_id)
      .single();

    if (cardError || !card) {
      throw new Error("Card não encontrado");
    }

    // Verificar se card está completo (status = 'completed' e em step finisher)
    if (card.status !== "completed") {
      return new Response(
        JSON.stringify({ 
          message: "Card não está completo, comissão não será calculada",
          card_status: card.status 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se está em step finisher
    const { data: step, error: stepError } = await supabase
      .schema("nexflow")
      .from("steps")
      .select("step_type")
      .eq("id", card.step_id)
      .single();

    if (stepError || !step || step.step_type !== "finisher") {
      return new Response(
        JSON.stringify({ 
          message: "Card não está em step finisher, comissão não será calculada"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!card.assigned_team_id) {
      return new Response(
        JSON.stringify({ error: "Card não tem time atribuído" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Buscar itens do card
    const { data: cardItems, error: itemsError } = await supabase
      .schema("nexflow")
      .from("card_items")
      .select("*")
      .eq("card_id", card_id);

    if (itemsError) {
      throw itemsError;
    }

    if (!cardItems || cardItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "Card não tem itens, comissão não será calculada" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const calculations = [];

    // 4. Para cada item, calcular comissão
    for (const item of cardItems) {
      // Buscar comissão do time para aquele item
      const { data: commission, error: commissionError } = await supabase
        .from("core_team_commissions")
        .select("*")
        .eq("team_id", card.assigned_team_id)
        .eq("is_active", true)
        .or(
          `item_id.eq.${item.item_id},item_code.eq.${item.item_code}`
        )
        .order("item_id", { ascending: false }) // Priorizar item_id específico
        .limit(1)
        .single();

      if (commissionError || !commission) {
        console.warn(`Comissão não encontrada para item ${item.item_code || item.item_id}`);
        continue;
      }

      // Calcular comissão baseada no valor do pagamento
      let teamCommissionAmount = 0;
      if (commission.commission_type === "percentage") {
        teamCommissionAmount = payment.payment_amount * (commission.commission_value / 100);
      } else {
        teamCommissionAmount = commission.commission_value;
      }

      // Criar cálculo de comissão
      const { data: calculation, error: calcError } = await supabase
        .from("core_commission_calculations")
        .insert({
          card_id: card_id,
          card_item_id: item.id,
          payment_id: payment_id,
          payment_amount: payment.payment_amount,
          payment_date: payment.payment_date,
          team_id: card.assigned_team_id,
          item_code: item.item_code,
          team_commission_type: commission.commission_type,
          team_commission_value: commission.commission_value,
          team_commission_amount: teamCommissionAmount,
          status: "pending",
          client_id: card.client_id,
        })
        .select()
        .single();

      if (calcError) {
        console.error("Erro ao criar cálculo:", calcError);
        continue;
      }

      calculations.push(calculation.id);

      // 5. Distribuir entre membros do time
      await distributeCommission(
        supabase,
        calculation.id,
        teamCommissionAmount,
        card.assigned_team_id,
        card.client_id
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        calculations_created: calculations.length,
        calculation_ids: calculations
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao calcular comissão:", error);
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

async function distributeCommission(
  supabase: any,
  calculationId: string,
  totalAmount: number,
  teamId: string,
  clientId: string
) {
  // Buscar membros ativos do time
  const { data: members, error: membersError } = await supabase
    .from("core_team_members")
    .select("id, user_profile_id")
    .eq("team_id", teamId);

  if (membersError || !members || members.length === 0) {
    console.error("Erro ao buscar membros ou time sem membros:", membersError);
    return;
  }

  const distributions = [];
  let totalPercentage = 0;

  for (const member of members) {
    // Buscar nível atual do membro
    const { data: memberLevel, error: levelError } = await supabase
      .from("core_team_member_levels")
      .select(`
        *,
        core_team_levels!inner(commission_percentage)
      `)
      .eq("team_member_id", member.id)
      .is("effective_to", null) // Nível ativo
      .single();

    if (levelError || !memberLevel) {
      console.warn(`Nível não encontrado para membro ${member.id}`);
      continue;
    }

    // Acessar commission_percentage do nível
    const { data: level, error: levelDataError } = await supabase
      .from("core_team_levels")
      .select("commission_percentage")
      .eq("id", memberLevel.team_level_id)
      .single();

    if (levelDataError || !level) {
      console.warn(`Erro ao buscar nível ${memberLevel.team_level_id}`);
      continue;
    }

    const percentage = level.commission_percentage;
    const amount = totalAmount * (percentage / 100);

    distributions.push({
      calculation_id: calculationId,
      user_id: member.user_profile_id,
      level_id: memberLevel.team_level_id,
      distribution_percentage: percentage,
      distribution_amount: amount,
      status: "pending",
      client_id: clientId,
    });

    totalPercentage += percentage;
  }

  // Validar que não excede 100%
  if (totalPercentage > 100) {
    console.warn(`Atenção: Distribuição excede 100% (${totalPercentage}%)`);
  }

  // Criar distribuições
  if (distributions.length > 0) {
    const { error: distError } = await supabase
      .from("core_commission_distributions")
      .insert(distributions);

    if (distError) {
      console.error("Erro ao criar distribuições:", distError);
    }

    // Atualizar total_distributed no cálculo
    await supabase
      .from("core_commission_calculations")
      .update({
        total_distributed_percentage: totalPercentage,
        total_distributed_amount: totalAmount * (totalPercentage / 100),
      })
      .eq("id", calculationId);
  }
}
