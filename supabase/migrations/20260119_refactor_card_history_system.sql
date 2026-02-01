-- =====================================================
-- REFATORAÇÃO DO SISTEMA DE HISTÓRICO DE CARDS
-- =====================================================
-- Adiciona suporte para rastreamento granular de eventos
-- com tipos de evento, duração, valores anteriores/novos
-- =====================================================

-- Adicionar coluna event_type para categorizar eventos
ALTER TABLE public.card_history
ADD COLUMN IF NOT EXISTS event_type TEXT 
CHECK (event_type IN (
  'stage_change', 
  'field_update', 
  'activity', 
  'status_change', 
  'freeze', 
  'unfreeze', 
  'checklist_completed'
));

-- Adicionar coluna duration_seconds para tempo na etapa anterior
ALTER TABLE public.card_history
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Adicionar colunas para rastrear valores anteriores e novos (para edições)
ALTER TABLE public.card_history
ADD COLUMN IF NOT EXISTS previous_value JSONB,
ADD COLUMN IF NOT EXISTS new_value JSONB;

-- Adicionar coluna field_id para referenciar campo alterado (para field_update)
ALTER TABLE public.card_history
ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES public.step_fields(id) ON DELETE SET NULL;

-- Adicionar coluna activity_id para referenciar atividade (para activity)
ALTER TABLE public.card_history
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES public.card_activities(id) ON DELETE SET NULL;

-- Criar índice para consultas por event_type
CREATE INDEX IF NOT EXISTS idx_card_history_event_type 
ON public.card_history(card_id, event_type);

-- Criar índice para consultas por duration_seconds
CREATE INDEX IF NOT EXISTS idx_card_history_duration_seconds 
ON public.card_history(card_id, duration_seconds) 
WHERE duration_seconds IS NOT NULL;

-- Criar índice composto para performance em queries de timeline
CREATE INDEX IF NOT EXISTS idx_card_history_card_created 
ON public.card_history(card_id, created_at DESC);

-- Comentários para documentação
COMMENT ON COLUMN public.card_history.event_type IS 'Tipo de evento: stage_change, field_update, activity, status_change, freeze, unfreeze, checklist_completed';
COMMENT ON COLUMN public.card_history.duration_seconds IS 'Tempo em segundos que o card permaneceu na etapa anterior (calculado automaticamente)';
COMMENT ON COLUMN public.card_history.previous_value IS 'Valor anterior do campo/item alterado (JSONB)';
COMMENT ON COLUMN public.card_history.new_value IS 'Novo valor do campo/item alterado (JSONB)';
COMMENT ON COLUMN public.card_history.field_id IS 'ID do campo alterado (para eventos do tipo field_update)';
COMMENT ON COLUMN public.card_history.activity_id IS 'ID da atividade relacionada (para eventos do tipo activity)';
