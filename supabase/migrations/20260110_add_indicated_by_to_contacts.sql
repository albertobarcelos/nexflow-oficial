-- Adicionar campo indicated_by na tabela contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS indicated_by UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Adicionar campo contact_type para identificar tipo de contato
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS contact_type TEXT DEFAULT 'cliente' 
CHECK (contact_type IN ('cliente', 'parceiro', 'outro'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_contacts_indicated_by ON public.contacts(indicated_by);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type ON public.contacts(contact_type);

-- Comentários
COMMENT ON COLUMN public.contacts.indicated_by IS 'ID do contato que indicou este contato (auto-referência)';
COMMENT ON COLUMN public.contacts.contact_type IS 'Tipo do contato: cliente, parceiro ou outro';

