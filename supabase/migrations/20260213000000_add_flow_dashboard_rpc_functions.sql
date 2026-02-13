-- =====================================================
-- FUNÇÕES RPC PARA DASHBOARDS DINÂMICOS POR FLOW
-- =====================================================
-- get_flow_sales_metrics: métricas para flows categoria finance (vendas)
-- get_flow_onboarding_metrics: métricas para flows categoria onboarding
-- Aplicar manualmente no Supabase (regra do projeto: sem alteração automática no banco).
-- =====================================================

-- =====================================================
-- FUNÇÃO: get_flow_sales_metrics
-- =====================================================
-- Retorna funnel por etapa, valor em aberto, valor ganho e taxa de conversão.
-- Fontes: flows, steps, cards, card_items. Respeita client_id do flow.
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_flow_sales_metrics(p_flow_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_funnel jsonb;
  v_total_open NUMERIC := 0;
  v_total_won NUMERIC := 0;
  v_total_cards BIGINT := 0;
  v_cards_final_step BIGINT := 0;
  v_conversion_rate NUMERIC := 0;
  v_completion_step_id UUID;
BEGIN
  -- Obter client_id do flow (e validar que o flow existe)
  SELECT f.client_id INTO v_client_id
  FROM public.flows f
  WHERE f.id = p_flow_id;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'funnel', '[]'::jsonb,
      'total_open', 0,
      'total_won', 0,
      'conversion_rate', 0
    );
  END IF;

  -- Id da etapa de conclusão (is_completion_step = true), se existir
  SELECT s.id INTO v_completion_step_id
  FROM public.steps s
  WHERE s.flow_id = p_flow_id AND s.is_completion_step = true
  LIMIT 1;

  -- Funil: por cada step (ordenado por position), contagem de cards não cancelados e soma de valor
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'step_id', step_row.id,
      'step_title', step_row.title,
      'position', step_row.position,
      'count', step_row.cnt,
      'total_value', step_row.step_value
    ) ORDER BY step_row.position
  ), '[]'::jsonb) INTO v_funnel
  FROM (
    SELECT
      s.id,
      s.title,
      s.position,
      COUNT(c.id)::BIGINT AS cnt,
      COALESCE(SUM(COALESCE(c.value, (SELECT SUM(ci.total_price) FROM public.card_items ci WHERE ci.card_id = c.id)), 0)), 0)::NUMERIC AS step_value
    FROM public.steps s
    LEFT JOIN public.cards c ON c.step_id = s.id AND c.flow_id = s.flow_id AND c.client_id = v_client_id
      AND c.status IS DISTINCT FROM 'canceled'
    WHERE s.flow_id = p_flow_id
    GROUP BY s.id, s.title, s.position
  ) step_row;

  -- Valor em aberto: cards inprogress (valor do card ou soma de card_items)
  SELECT COALESCE(SUM(
    COALESCE(c.value, (SELECT COALESCE(SUM(ci.total_price), 0) FROM public.card_items ci WHERE ci.card_id = c.id))
  ), 0) INTO v_total_open
  FROM public.cards c
  WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id AND c.status = 'inprogress';

  -- Valor ganho: cards completed (mesmo critério de valor)
  SELECT COALESCE(SUM(
    COALESCE(c.value, (SELECT COALESCE(SUM(ci.total_price), 0) FROM public.card_items ci WHERE ci.card_id = c.id))
  ), 0) INTO v_total_won
  FROM public.cards c
  WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id AND c.status = 'completed';

  -- Total de cards (não cancelados) para conversão
  SELECT COUNT(*) INTO v_total_cards
  FROM public.cards c
  WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id AND c.status IS DISTINCT FROM 'canceled';

  -- Cards que chegaram à etapa final (completion step ou último step por position)
  IF v_completion_step_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_cards_final_step
    FROM public.cards c
    WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id
      AND c.step_id = v_completion_step_id AND c.status IS DISTINCT FROM 'canceled';
  ELSE
    -- Último step por position
    SELECT COUNT(*) INTO v_cards_final_step
    FROM public.cards c
    INNER JOIN (
      SELECT s.id FROM public.steps s
      WHERE s.flow_id = p_flow_id
      ORDER BY s.position DESC NULLS LAST
      LIMIT 1
    ) last_step ON last_step.id = c.step_id
    WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id AND c.status IS DISTINCT FROM 'canceled';
  END IF;

  IF v_total_cards > 0 THEN
    v_conversion_rate := ROUND((v_cards_final_step::NUMERIC / v_total_cards::NUMERIC) * 100, 2);
  END IF;

  RETURN jsonb_build_object(
    'funnel', COALESCE(v_funnel, '[]'::jsonb),
    'total_open', COALESCE(v_total_open, 0),
    'total_won', COALESCE(v_total_won, 0),
    'conversion_rate', v_conversion_rate
  );
END;
$$;

COMMENT ON FUNCTION public.get_flow_sales_metrics IS 'Métricas para dashboard de vendas: funnel por etapa, valor em aberto, valor ganho e taxa de conversão.';

-- =====================================================
-- FUNÇÃO: get_flow_onboarding_metrics
-- =====================================================
-- Retorna cards por status, strikes (points), tempo médio por etapa, atividades por responsável.
-- Fontes: flows, steps, cards, card_history, card_activities, core_client_users.
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_flow_onboarding_metrics(p_flow_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_cards_by_status jsonb;
  v_strikes jsonb;
  v_avg_time_per_step jsonb;
  v_activities_by_assignee jsonb;
BEGIN
  SELECT f.client_id INTO v_client_id
  FROM public.flows f
  WHERE f.id = p_flow_id;

  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object(
      'cards_by_status', '{}'::jsonb,
      'strikes', '{}'::jsonb,
      'avg_time_per_step', '[]'::jsonb,
      'activities_by_assignee', '[]'::jsonb
    );
  END IF;

  -- Cards por status (inprogress, completed, canceled)
  SELECT jsonb_object_agg(COALESCE(status::TEXT, 'unknown'), cnt)
  INTO v_cards_by_status
  FROM (
    SELECT c.status, COUNT(*)::BIGINT AS cnt
    FROM public.cards c
    WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id
    GROUP BY c.status
  ) t;

  -- Strikes: total com points >= 1 e faixas (0, 1-2, 3-5, 6+)
  SELECT jsonb_build_object(
    'with_strikes', (SELECT COUNT(*)::BIGINT FROM public.cards c WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id AND COALESCE(c.points, 0) >= 1),
    'range_0', (SELECT COUNT(*)::BIGINT FROM public.cards c WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id AND COALESCE(c.points, 0) = 0),
    'range_1_2', (SELECT COUNT(*)::BIGINT FROM public.cards c WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id AND COALESCE(c.points, 0) BETWEEN 1 AND 2),
    'range_3_5', (SELECT COUNT(*)::BIGINT FROM public.cards c WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id AND COALESCE(c.points, 0) BETWEEN 3 AND 5),
    'range_6_plus', (SELECT COUNT(*)::BIGINT FROM public.cards c WHERE c.flow_id = p_flow_id AND c.client_id = v_client_id AND COALESCE(c.points, 0) >= 6)
  ) INTO v_strikes;

  -- Tempo médio por etapa: card_history event_type = stage_change, duration_seconds agrupado por from_step_id (tempo na etapa de onde saiu)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'step_id', step_id,
      'step_title', step_title,
      'position', position,
      'avg_duration_seconds', avg_duration_seconds,
      'card_count', card_count
    ) ORDER BY position
  ), '[]'::jsonb) INTO v_avg_time_per_step
  FROM (
    SELECT
      ch.from_step_id AS step_id,
      MAX(s.title) AS step_title,
      MAX(s.position) AS position,
      ROUND(AVG(ch.duration_seconds)::NUMERIC, 0)::BIGINT AS avg_duration_seconds,
      COUNT(DISTINCT ch.card_id)::BIGINT AS card_count
    FROM public.card_history ch
    INNER JOIN public.cards c ON c.id = ch.card_id AND c.flow_id = p_flow_id AND c.client_id = v_client_id
    LEFT JOIN public.steps s ON s.id = ch.from_step_id AND s.flow_id = p_flow_id
    WHERE ch.event_type = 'stage_change'
      AND ch.duration_seconds IS NOT NULL
      AND ch.from_step_id IS NOT NULL
    GROUP BY ch.from_step_id
  ) avg_row;

  -- Atividades por responsável: realizadas, pendentes, atrasadas
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'assignee_id', assignee_id,
      'assignee_name', assignee_name,
      'realized', realized,
      'pending', pending,
      'overdue', overdue
    )
  ), '[]'::jsonb) INTO v_activities_by_assignee
  FROM (
    SELECT
      ca.assignee_id,
      TRIM(COALESCE(u.name, '') || ' ' || COALESCE(u.surname, '')) AS assignee_name,
      COUNT(*) FILTER (WHERE ca.completed = true)::BIGINT AS realized,
      COUNT(*) FILTER (WHERE ca.completed = false AND (ca.end_at IS NULL OR ca.end_at >= NOW()))::BIGINT AS pending,
      COUNT(*) FILTER (WHERE ca.completed = false AND ca.end_at IS NOT NULL AND ca.end_at < NOW())::BIGINT AS overdue
    FROM public.card_activities ca
    INNER JOIN public.cards c ON c.id = ca.card_id AND c.flow_id = p_flow_id AND c.client_id = v_client_id
    LEFT JOIN public.core_client_users u ON u.id = ca.assignee_id
    WHERE ca.client_id = v_client_id
    GROUP BY ca.assignee_id, u.name, u.surname
  ) act_row;

  RETURN jsonb_build_object(
    'cards_by_status', COALESCE(v_cards_by_status, '{}'::jsonb),
    'strikes', COALESCE(v_strikes, '{}'::jsonb),
    'avg_time_per_step', COALESCE(v_avg_time_per_step, '[]'::jsonb),
    'activities_by_assignee', COALESCE(v_activities_by_assignee, '[]'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION public.get_flow_onboarding_metrics IS 'Métricas para dashboard de onboarding: cards por status, strikes, tempo médio por etapa e atividades por responsável.';
