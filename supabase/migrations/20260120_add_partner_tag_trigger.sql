-- Migration: Adicionar trigger para adicionar tag 'parceiro' automaticamente
-- Data: 2026-01-20
-- Objetivo: Quando um contato é vinculado a uma empresa via contact_companies,
--           adicionar automaticamente 'parceiro' ao contact_type se não tiver

-- Função para adicionar 'parceiro' ao contact_type quando relacionamento é criado
CREATE OR REPLACE FUNCTION public.handle_contact_company_partner_tag()
RETURNS TRIGGER AS $$
DECLARE
  v_current_types TEXT[];
BEGIN
  -- Buscar contact_type atual do contato
  SELECT contact_type INTO v_current_types
  FROM public.contacts
  WHERE id = NEW.contact_id;
  
  -- Se contact_type é NULL, inicializar como array vazio
  IF v_current_types IS NULL THEN
    v_current_types := ARRAY[]::TEXT[];
  END IF;
  
  -- Se 'parceiro' não está no array, adicionar
  IF NOT ('parceiro' = ANY(v_current_types)) THEN
    UPDATE public.contacts
    SET contact_type = array_append(v_current_types, 'parceiro')
    WHERE id = NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função após INSERT em contact_companies
DROP TRIGGER IF EXISTS trigger_add_partner_tag_on_contact_company ON public.contact_companies;
CREATE TRIGGER trigger_add_partner_tag_on_contact_company
AFTER INSERT ON public.contact_companies
FOR EACH ROW
EXECUTE FUNCTION public.handle_contact_company_partner_tag();

-- Comentários
COMMENT ON FUNCTION public.handle_contact_company_partner_tag IS 
'Adiciona automaticamente a tag "parceiro" ao contact_type quando um contato é vinculado a uma empresa via contact_companies.';

COMMENT ON TRIGGER trigger_add_partner_tag_on_contact_company ON public.contact_companies IS 
'Dispara após INSERT em contact_companies para adicionar tag "parceiro" ao contact_type do contato vinculado.';
