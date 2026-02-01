-- Migration: Alterar contact_type de TEXT para TEXT[] para suportar múltiplos tipos
-- Data: 2026-01-16

-- 1. Remover a constraint CHECK atual
ALTER TABLE public.contacts
DROP CONSTRAINT IF EXISTS contacts_contact_type_check;

-- 2. Remover o índice antigo (será recriado como GIN)
DROP INDEX IF EXISTS idx_contacts_contact_type;

-- 3. Criar função auxiliar para validar tipos permitidos
CREATE OR REPLACE FUNCTION public.validate_contact_types(types TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Se for NULL ou array vazio, permitir
  IF types IS NULL OR array_length(types, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se todos os tipos são válidos
  RETURN NOT EXISTS (
    SELECT 1
    FROM unnest(types) AS type
    WHERE type NOT IN ('cliente', 'parceiro', 'outro')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Migrar dados existentes: converter valores únicos para arrays
-- Primeiro, criar uma coluna temporária
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS contact_type_temp TEXT[];

-- Converter valores existentes para arrays
UPDATE public.contacts
SET contact_type_temp = CASE
  WHEN contact_type IS NULL THEN NULL
  WHEN contact_type = '' THEN NULL
  ELSE ARRAY[contact_type]::TEXT[]
END
WHERE contact_type_temp IS NULL;

-- 5. Alterar a coluna original para TEXT[]
ALTER TABLE public.contacts
ALTER COLUMN contact_type TYPE TEXT[] USING contact_type_temp;

-- 6. Remover a coluna temporária
ALTER TABLE public.contacts
DROP COLUMN IF EXISTS contact_type_temp;

-- 7. Adicionar constraint usando a função de validação
ALTER TABLE public.contacts
ADD CONSTRAINT contacts_contact_type_check 
CHECK (public.validate_contact_types(contact_type));

-- 8. Criar índice GIN para busca eficiente em arrays
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type_gin 
ON public.contacts USING GIN (contact_type);

-- 9. Atualizar comentário
COMMENT ON COLUMN public.contacts.contact_type IS 
'Tipo(s) do contato: array de valores permitidos (cliente, parceiro, outro). Um contato pode ter múltiplos tipos.';

COMMENT ON FUNCTION public.validate_contact_types IS 
'Valida se todos os tipos no array são permitidos: cliente, parceiro ou outro.';
