-- Tabela para armazenar dados detalhados de indicações
CREATE TABLE IF NOT EXISTS public.contact_indications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  indicated_by_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL, -- Opcional: se já virou card
  commission_amount NUMERIC(10,2), -- Valor da comissão
  commission_percentage NUMERIC(5,2), -- Percentual da comissão
  indication_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT, -- Observações
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  client_id UUID NOT NULL REFERENCES public.core_clients(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_contact_indications_contact_id ON public.contact_indications(contact_id);
CREATE INDEX idx_contact_indications_indicated_by ON public.contact_indications(indicated_by_contact_id);
CREATE INDEX idx_contact_indications_card_id ON public.contact_indications(card_id);
CREATE INDEX idx_contact_indications_client_id ON public.contact_indications(client_id);
CREATE INDEX idx_contact_indications_status ON public.contact_indications(status);

-- Comentários
COMMENT ON TABLE public.contact_indications IS 'Armazena dados detalhados de indicações entre contatos, incluindo comissões e status';
COMMENT ON COLUMN public.contact_indications.contact_id IS 'ID do contato que foi indicado';
COMMENT ON COLUMN public.contact_indications.indicated_by_contact_id IS 'ID do contato parceiro que fez a indicação';
COMMENT ON COLUMN public.contact_indications.card_id IS 'ID do card/negócio gerado a partir desta indicação (opcional)';
COMMENT ON COLUMN public.contact_indications.commission_amount IS 'Valor da comissão em reais';
COMMENT ON COLUMN public.contact_indications.commission_percentage IS 'Percentual da comissão';
COMMENT ON COLUMN public.contact_indications.status IS 'Status da indicação: pending, confirmed, paid, cancelled';

