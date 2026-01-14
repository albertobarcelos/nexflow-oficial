-- =====================================================
-- ADICIONAR FOREIGN KEYS FALTANTES EM CARD_HISTORY
-- =====================================================
-- Adiciona foreign keys para permitir joins automáticos
-- com core_client_users, step_fields e card_activities
-- =====================================================

-- 1. Adicionar foreign key para created_by → core_client_users
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'card_history_created_by_fkey'
      AND table_name = 'card_history'
  ) THEN
    ALTER TABLE public.card_history
    ADD CONSTRAINT card_history_created_by_fkey
    FOREIGN KEY (created_by) 
    REFERENCES public.core_client_users(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key card_history_created_by_fkey criada com sucesso';
  ELSE
    RAISE NOTICE 'Foreign key card_history_created_by_fkey já existe';
  END IF;
END $$;

-- 2. Verificar e criar foreign key para field_id → step_fields
-- A coluna foi criada com REFERENCES, mas pode não ter constraint nomeada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name LIKE '%field_id%'
      AND table_name = 'card_history'
  ) THEN
    -- Verificar se há constraint sem nome (criada pelo REFERENCES inline)
    IF EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'card_history'
        AND kcu.column_name = 'field_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
      RAISE NOTICE 'Foreign key para field_id já existe (sem nome específico)';
    ELSE
      ALTER TABLE public.card_history
      ADD CONSTRAINT card_history_field_id_fkey
      FOREIGN KEY (field_id) 
      REFERENCES public.step_fields(id) 
      ON DELETE SET NULL;
      
      RAISE NOTICE 'Foreign key card_history_field_id_fkey criada com sucesso';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key para field_id já existe';
  END IF;
END $$;

-- 3. Verificar e criar foreign key para activity_id → card_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name LIKE '%activity_id%'
      AND table_name = 'card_history'
  ) THEN
    -- Verificar se há constraint sem nome (criada pelo REFERENCES inline)
    IF EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'card_history'
        AND kcu.column_name = 'activity_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
      RAISE NOTICE 'Foreign key para activity_id já existe (sem nome específico)';
    ELSE
      ALTER TABLE public.card_history
      ADD CONSTRAINT card_history_activity_id_fkey
      FOREIGN KEY (activity_id) 
      REFERENCES public.card_activities(id) 
      ON DELETE SET NULL;
      
      RAISE NOTICE 'Foreign key card_history_activity_id_fkey criada com sucesso';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key para activity_id já existe';
  END IF;
END $$;

-- Comentários
COMMENT ON CONSTRAINT card_history_created_by_fkey ON public.card_history IS 'Foreign key para usuário que criou o evento';
COMMENT ON CONSTRAINT card_history_field_id_fkey ON public.card_history IS 'Foreign key para campo alterado (eventos field_update)';
COMMENT ON CONSTRAINT card_history_activity_id_fkey ON public.card_history IS 'Foreign key para atividade relacionada (eventos activity)';
