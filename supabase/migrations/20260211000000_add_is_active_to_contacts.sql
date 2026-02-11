-- =====================================================
-- Adiciona coluna is_active à tabela public.contacts
-- Usada para desativar contatos (soft delete) na listagem
-- =====================================================

-- Só adiciona se a coluna ainda não existir (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.contacts
    ADD COLUMN is_active boolean NOT NULL DEFAULT true;

    COMMENT ON COLUMN public.contacts.is_active IS 'Quando false, o contato não aparece na listagem de contatos ativos';
  END IF;
END
$$;
