-- Create deal_history table
CREATE TABLE IF NOT EXISTS public.deal_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
    user_id uuid,
    description text NOT NULL,
    details jsonb,
    type text,
    created_at timestamp with time zone DEFAULT now(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE public.deal_history ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Verificar se a policy já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'deal_history' 
        AND policyname = 'Tenant isolation for deal_history'
    ) THEN
        -- Criar a policy apenas se não existir
        CREATE POLICY "Tenant isolation for deal_history"
        ON public.deal_history
        USING (client_id IN (
            SELECT client_id FROM collaborators WHERE auth_user_id = auth.uid()
        ));
    END IF;
END $$;

-- Add indexes for better performance (IF NOT EXISTS adicionado)
CREATE INDEX IF NOT EXISTS idx_deal_history_deal_id ON public.deal_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_history_user_id ON public.deal_history(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_history_client_id ON public.deal_history(client_id);

-- Add comments
COMMENT ON TABLE public.deal_history IS 'Histórico de alterações em negócios';
COMMENT ON COLUMN public.deal_history.deal_id IS 'ID do negócio';
COMMENT ON COLUMN public.deal_history.user_id IS 'ID do usuário que realizou a ação';
COMMENT ON COLUMN public.deal_history.description IS 'Descrição da ação realizada';
COMMENT ON COLUMN public.deal_history.details IS 'Detalhes adicionais em formato JSON';
COMMENT ON COLUMN public.deal_history.type IS 'Tipo da ação (ex: created, updated, stage_changed)';
COMMENT ON COLUMN public.deal_history.client_id IS 'ID do cliente (multi-tenant)';
