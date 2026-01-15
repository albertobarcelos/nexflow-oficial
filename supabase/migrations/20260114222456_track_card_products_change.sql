-- =====================================================
-- FUNÇÃO: Rastrear alteração de produtos no card
-- =====================================================
-- Cria evento 'product_value_change' quando produtos em field_values mudam
-- Detecta mudanças em field_values->>'products' (estrutura JSONB com array de produtos)
CREATE OR REPLACE FUNCTION public.track_card_products_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  old_products JSONB;
  new_products JSONB;
  has_changes BOOLEAN := false;
BEGIN
  -- Extrair produtos do field_values (se existirem)
  old_products := (OLD.field_values->>'products')::jsonb;
  new_products := (NEW.field_values->>'products')::jsonb;

  -- Se ambos forem NULL ou vazios, não há mudança
  IF (old_products IS NULL OR old_products = 'null'::jsonb OR old_products = '[]'::jsonb) 
     AND (new_products IS NULL OR new_products = 'null'::jsonb OR new_products = '[]'::jsonb) THEN
    RETURN NEW;
  END IF;

  -- Verificar se houve mudança comparando os JSONB
  IF old_products IS DISTINCT FROM new_products THEN
    has_changes := true;
  END IF;

  -- Se não houve mudanças, não criar evento
  IF NOT has_changes THEN
    RETURN NEW;
  END IF;

  -- Buscar nome do usuário atual (via auth.uid())
  IF auth.uid() IS NOT NULL THEN
    SELECT COALESCE(name || ' ' || surname, email) INTO user_name
    FROM public.core_client_users
    WHERE id = auth.uid();
  END IF;

  -- Criar evento no histórico
  INSERT INTO public.card_history (
    card_id,
    client_id,
    created_by,
    event_type,
    previous_value,
    new_value,
    details,
    created_at
  ) VALUES (
    NEW.id,
    NEW.client_id,
    auth.uid(),
    'product_value_change',
    jsonb_build_object('products', COALESCE(old_products, '[]'::jsonb)),
    jsonb_build_object('products', COALESCE(new_products, '[]'::jsonb)),
    jsonb_build_object(
      'user_name', user_name,
      'changed_at', NEW.updated_at,
      'products_count', jsonb_array_length(COALESCE(new_products, '[]'::jsonb))
    ),
    COALESCE(NEW.updated_at, NOW())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Rastrear alteração de produtos
-- =====================================================
-- Trigger que detecta mudanças em field_values->>'products'
DROP TRIGGER IF EXISTS trigger_track_card_products_change ON public.cards;
CREATE TRIGGER trigger_track_card_products_change
AFTER UPDATE OF field_values ON public.cards
FOR EACH ROW
WHEN (
  -- Só criar evento se field_values mudou E se há produtos no novo valor
  (OLD.field_values->>'products') IS DISTINCT FROM (NEW.field_values->>'products')
)
EXECUTE FUNCTION public.track_card_products_change();

-- Comentário explicativo
COMMENT ON FUNCTION public.track_card_products_change() IS 
'Rastreia mudanças na estrutura de produtos armazenada em field_values.products. Cria eventos product_value_change no histórico quando produtos são adicionados, removidos ou modificados.';
