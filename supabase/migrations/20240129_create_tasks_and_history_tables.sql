-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    due_date timestamp with time zone NOT NULL,
    completed boolean DEFAULT false,
    deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
    assigned_to uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Create deal_history table
CREATE TABLE IF NOT EXISTS public.deal_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    description text NOT NULL,
    details jsonb,
    type text,
    created_at timestamp with time zone DEFAULT now(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON public.tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_deal_history_deal_id ON public.deal_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_history_user_id ON public.deal_history(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_history_client_id ON public.deal_history(client_id);

-- Add RLS policies for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks from their client"
    ON public.tasks FOR SELECT
    USING (
        client_id IN (
            SELECT client_id FROM public.collaborators
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tasks for their client"
    ON public.tasks FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT client_id FROM public.collaborators
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks from their client"
    ON public.tasks FOR UPDATE
    USING (
        client_id IN (
            SELECT client_id FROM public.collaborators
            WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        client_id IN (
            SELECT client_id FROM public.collaborators
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks from their client"
    ON public.tasks FOR DELETE
    USING (
        client_id IN (
            SELECT client_id FROM public.collaborators
            WHERE auth_user_id = auth.uid()
        )
    );

-- Add RLS policies for deal_history
ALTER TABLE public.deal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history from their client"
    ON public.deal_history FOR SELECT
    USING (
        client_id IN (
            SELECT client_id FROM public.collaborators
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert history for their client"
    ON public.deal_history FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT client_id FROM public.collaborators
            WHERE auth_user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tasks updated_at
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add function to automatically add client_id to tasks
CREATE OR REPLACE FUNCTION public.set_task_client_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_id IS NULL THEN
        SELECT client_id INTO NEW.client_id
        FROM public.deals
        WHERE id = NEW.deal_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tasks client_id
CREATE TRIGGER set_task_client_id_on_insert
    BEFORE INSERT ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_task_client_id();

-- Add function to automatically add client_id to deal_history
CREATE OR REPLACE FUNCTION public.set_deal_history_client_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_id IS NULL THEN
        SELECT client_id INTO NEW.client_id
        FROM public.deals
        WHERE id = NEW.deal_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for deal_history client_id
CREATE TRIGGER set_deal_history_client_id_on_insert
    BEFORE INSERT ON public.deal_history
    FOR EACH ROW
    EXECUTE FUNCTION public.set_deal_history_client_id();
