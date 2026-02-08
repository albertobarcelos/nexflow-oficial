-- Adiciona coluna activity_created em card_step_actions para persistir se a atividade obrigatória já foi criada
-- Aplicar manualmente conforme regras do projeto

-- 1. Nova coluna
ALTER TABLE public.card_step_actions
ADD COLUMN IF NOT EXISTS activity_created boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.card_step_actions.activity_created IS
  'Indica se a atividade obrigatória (requireActivityOnClick) já foi criada para este card+processo';

-- 2. Trigger para atualizar ao criar atividade
CREATE OR REPLACE FUNCTION public.set_activity_created_on_card_step_action()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.step_action_id IS NOT NULL THEN
    UPDATE public.card_step_actions
    SET activity_created = true, updated_at = NOW()
    WHERE card_id = NEW.card_id AND step_action_id = NEW.step_action_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_activity_created ON public.card_activities;

CREATE TRIGGER trigger_set_activity_created
  AFTER INSERT ON public.card_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_activity_created_on_card_step_action();

-- 3. Backfill de dados existentes
UPDATE public.card_step_actions csa
SET activity_created = true, updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM public.card_activities ca
  WHERE ca.card_id = csa.card_id AND ca.step_action_id = csa.step_action_id
);
