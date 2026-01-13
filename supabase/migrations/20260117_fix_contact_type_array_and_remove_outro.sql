-- Migration: Corrigir contact_type para TEXT[] e remover 'outro' das opções
-- Data: 2026-01-17

-- 1. Remover a constraint CHECK atual (se existir)
ALTER TABLE public.contacts
DROP CONSTRAINT IF EXISTS contacts_contact_type_check;

-- 2. Remover o índice antigo (será recriado como GIN)
DROP INDEX IF EXISTS idx_contacts_contact_type;
DROP INDEX IF EXISTS idx_contacts_contact_type_gin;

-- 3. Remover triggers temporariamente (serão recriados depois)
DROP TRIGGER IF EXISTS trigger_handle_partner_contact ON public.contacts;
DROP TRIGGER IF EXISTS trigger_handle_client_contact ON public.contacts;

-- 4. Se a coluna ainda for TEXT, converter para TEXT[]
DO $$
BEGIN
  -- Verificar se a coluna é TEXT e converter para TEXT[]
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'contacts' 
      AND column_name = 'contact_type'
      AND data_type = 'text'
      AND udt_name = 'text'
  ) THEN
    -- Remover o default antes de alterar o tipo
    ALTER TABLE public.contacts
    ALTER COLUMN contact_type DROP DEFAULT;

    -- Criar coluna temporária
    ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS contact_type_temp TEXT[];

    -- Converter valores existentes para arrays e remover 'outro'
    UPDATE public.contacts
    SET contact_type_temp = CASE
      WHEN contact_type IS NULL THEN NULL
      WHEN contact_type = '' THEN NULL
      WHEN contact_type = 'outro' THEN NULL  -- Remove 'outro'
      ELSE ARRAY[contact_type]::TEXT[]
    END
    WHERE contact_type_temp IS NULL;

    -- Alterar a coluna original para TEXT[]
    ALTER TABLE public.contacts
    ALTER COLUMN contact_type TYPE TEXT[] USING contact_type_temp;

    -- Remover a coluna temporária
    ALTER TABLE public.contacts
    DROP COLUMN IF EXISTS contact_type_temp;
  ELSE
    -- Se já for TEXT[], apenas remover valores 'outro' existentes
    UPDATE public.contacts
    SET contact_type = array_remove(contact_type, 'outro')
    WHERE 'outro' = ANY(contact_type);
  END IF;
END $$;

-- 5. Recriar triggers
CREATE TRIGGER trigger_handle_partner_contact
AFTER INSERT OR UPDATE ON public.contacts
FOR EACH ROW
WHEN ('parceiro' = ANY(NEW.contact_type))
EXECUTE FUNCTION public.handle_partner_contact_automation();

CREATE TRIGGER trigger_handle_client_contact
AFTER INSERT ON public.contacts
FOR EACH ROW
WHEN ('cliente' = ANY(NEW.contact_type))
EXECUTE FUNCTION public.handle_client_contact_automation();

-- 6. Criar função auxiliar para validar tipos permitidos (apenas cliente e parceiro)
CREATE OR REPLACE FUNCTION public.validate_contact_types(types TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Se for NULL ou array vazio, permitir
  IF types IS NULL OR array_length(types, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se todos os tipos são válidos (apenas cliente e parceiro)
  RETURN NOT EXISTS (
    SELECT 1
    FROM unnest(types) AS type
    WHERE type NOT IN ('cliente', 'parceiro')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Adicionar constraint usando a função de validação
ALTER TABLE public.contacts
ADD CONSTRAINT contacts_contact_type_check 
CHECK (public.validate_contact_types(contact_type));

-- 8. Criar índice GIN para busca eficiente em arrays
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type_gin 
ON public.contacts USING GIN (contact_type);

-- 9. Atualizar comentários
COMMENT ON COLUMN public.contacts.contact_type IS 
'Tipo(s) do contato: array de valores permitidos (cliente, parceiro). Um contato pode ter múltiplos tipos.';

COMMENT ON FUNCTION public.validate_contact_types IS 
'Valida se todos os tipos no array são permitidos: cliente ou parceiro.';
