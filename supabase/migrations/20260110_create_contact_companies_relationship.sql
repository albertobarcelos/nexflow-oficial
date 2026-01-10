-- Tabela de relacionamento N:N entre contacts e web_companies
CREATE TABLE IF NOT EXISTS public.contact_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.web_companies(id) ON DELETE CASCADE,
  role TEXT, -- Cargo/função do contato na empresa
  is_primary BOOLEAN DEFAULT false, -- Indica se é o contato principal da empresa
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID NOT NULL REFERENCES public.core_clients(id) ON DELETE CASCADE,
  UNIQUE(contact_id, company_id)
);

-- Índices para performance
CREATE INDEX idx_contact_companies_contact_id ON public.contact_companies(contact_id);
CREATE INDEX idx_contact_companies_company_id ON public.contact_companies(company_id);
CREATE INDEX idx_contact_companies_client_id ON public.contact_companies(client_id);

-- Comentários
COMMENT ON TABLE public.contact_companies IS 'Relacionamento N:N entre contatos e empresas. Permite que um contato pertença a várias empresas.';
COMMENT ON COLUMN public.contact_companies.role IS 'Cargo/função do contato na empresa específica';
COMMENT ON COLUMN public.contact_companies.is_primary IS 'Indica se este é o contato principal da empresa';

