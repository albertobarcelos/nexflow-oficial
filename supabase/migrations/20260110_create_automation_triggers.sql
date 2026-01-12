-- Trigger para automação de parceiros
DROP TRIGGER IF EXISTS trigger_handle_partner_contact ON public.contacts;
CREATE TRIGGER trigger_handle_partner_contact
AFTER INSERT OR UPDATE ON public.contacts
FOR EACH ROW
WHEN ('parceiro' = ANY(NEW.contact_type))
EXECUTE FUNCTION public.handle_partner_contact_automation();

-- Trigger para automação de clientes
DROP TRIGGER IF EXISTS trigger_handle_client_contact ON public.contacts;
CREATE TRIGGER trigger_handle_client_contact
AFTER INSERT ON public.contacts
FOR EACH ROW
WHEN ('cliente' = ANY(NEW.contact_type))
EXECUTE FUNCTION public.handle_client_contact_automation();

-- Comentários
COMMENT ON TRIGGER trigger_handle_partner_contact ON public.contacts IS 
'Dispara automação quando um contato tipo "parceiro" é criado ou atualizado. Cria ou atualiza card no flow "Parceiros".';

COMMENT ON TRIGGER trigger_handle_client_contact ON public.contacts IS 
'Dispara automação quando um contato tipo "cliente" é criado. Cria automaticamente um card no flow "Vendas" na primeira etapa.';

