-- Adicionar campo para identificar se movimento foi avanço ou regresso
ALTER TABLE public.card_history
ADD COLUMN IF NOT EXISTS movement_direction TEXT DEFAULT 'forward'
CHECK (movement_direction IN ('forward', 'backward', 'same'));

-- Adicionar campo para armazenar posição do step (para calcular direção)
ALTER TABLE public.card_history
ADD COLUMN IF NOT EXISTS from_step_position INTEGER,
ADD COLUMN IF NOT EXISTS to_step_position INTEGER;

-- Função para calcular direção do movimento automaticamente
CREATE OR REPLACE FUNCTION public.calculate_movement_direction()
RETURNS TRIGGER AS $$
DECLARE
  from_pos INTEGER;
  to_pos INTEGER;
BEGIN
  -- Buscar posições dos steps
  IF NEW.from_step_id IS NOT NULL THEN
    SELECT position INTO from_pos FROM public.steps WHERE id = NEW.from_step_id;
  END IF;
  
  IF NEW.to_step_id IS NOT NULL THEN
    SELECT position INTO to_pos FROM public.steps WHERE id = NEW.to_step_id;
  END IF;
  
  -- Calcular direção
  IF from_pos IS NULL OR to_pos IS NULL THEN
    NEW.movement_direction := 'same';
  ELSIF to_pos > from_pos THEN
    NEW.movement_direction := 'forward';
  ELSIF to_pos < from_pos THEN
    NEW.movement_direction := 'backward';
  ELSE
    NEW.movement_direction := 'same';
  END IF;
  
  -- Armazenar posições
  NEW.from_step_position := from_pos;
  NEW.to_step_position := to_pos;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular direção automaticamente
DROP TRIGGER IF EXISTS trigger_calculate_movement_direction ON public.card_history;
CREATE TRIGGER trigger_calculate_movement_direction
BEFORE INSERT OR UPDATE ON public.card_history
FOR EACH ROW
EXECUTE FUNCTION public.calculate_movement_direction();

-- Índice para consultas por direção
CREATE INDEX IF NOT EXISTS idx_card_history_movement_direction 
ON public.card_history(movement_direction);

-- Comentários
COMMENT ON COLUMN public.card_history.movement_direction IS 'Direção do movimento: forward (avanço), backward (regresso), same (mesma posição)';
COMMENT ON COLUMN public.card_history.from_step_position IS 'Posição do step de origem (para cálculo de direção)';
COMMENT ON COLUMN public.card_history.to_step_position IS 'Posição do step de destino (para cálculo de direção)';

