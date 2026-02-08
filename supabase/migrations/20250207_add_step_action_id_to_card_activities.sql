-- Adiciona coluna step_action_id em card_activities para vincular atividades aos processos
-- Aplicar manualmente conforme regras do projeto

ALTER TABLE public.card_activities
ADD COLUMN IF NOT EXISTS step_action_id uuid REFERENCES public.step_actions(id);

CREATE INDEX IF NOT EXISTS idx_card_activities_step_action_id
ON public.card_activities(step_action_id);

COMMENT ON COLUMN public.card_activities.step_action_id IS 'Vincula a atividade ao processo (step_action) que a gerou quando requireActivityOnClick está ativo';
