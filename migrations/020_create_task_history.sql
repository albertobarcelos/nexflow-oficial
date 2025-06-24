-- Criar tabela de histórico das tarefas
CREATE TABLE IF NOT EXISTS public.task_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    action_type varchar(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'assigned', 'deleted'
    description text NOT NULL,
    field_changes jsonb, -- Mudanças específicas nos campos
    old_values jsonb, -- Valores anteriores
    new_values jsonb, -- Novos valores
    metadata jsonb, -- Informações adicionais
    created_at timestamp with time zone DEFAULT now(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON public.task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_client_id ON public.task_history(client_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON public.task_history(created_at);
CREATE INDEX IF NOT EXISTS idx_task_history_action_type ON public.task_history(action_type);

-- Habilitar RLS
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- Política de RLS para visualização
CREATE POLICY "Users can view task history from their client"
    ON public.task_history FOR SELECT
    USING (
        client_id IN (
            SELECT client_id FROM public.collaborators
            WHERE auth_user_id = auth.uid()
        )
    );

-- Política de RLS para inserção
CREATE POLICY "Users can insert task history for their client"
    ON public.task_history FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT client_id FROM public.collaborators
            WHERE auth_user_id = auth.uid()
        )
    );

-- Função para automaticamente definir client_id baseado na tarefa
CREATE OR REPLACE FUNCTION public.set_task_history_client_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_id IS NULL THEN
        SELECT client_id INTO NEW.client_id
        FROM public.tasks
        WHERE id = NEW.task_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para definir client_id automaticamente
CREATE TRIGGER set_task_history_client_id_on_insert
    BEFORE INSERT ON public.task_history
    FOR EACH ROW
    EXECUTE FUNCTION public.set_task_history_client_id();

-- Função para registrar mudanças automaticamente nas tarefas
CREATE OR REPLACE FUNCTION public.log_task_changes()
RETURNS TRIGGER AS $$
DECLARE
    change_description text;
    field_changes jsonb := '{}';
    old_vals jsonb := '{}';
    new_vals jsonb := '{}';
    current_user_id uuid;
BEGIN
    -- Obter o usuário atual
    current_user_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        -- Tarefa criada
        INSERT INTO public.task_history (
            task_id, user_id, action_type, description, 
            field_changes, new_values, metadata
        ) VALUES (
            NEW.id, current_user_id, 'created', 
            'Tarefa criada: ' || NEW.title,
            jsonb_build_object('created', true),
            row_to_json(NEW)::jsonb,
            jsonb_build_object(
                'created_at', NEW.created_at,
                'task_type', 'standard'
            )
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Verificar mudanças específicas
        IF OLD.title != NEW.title THEN
            field_changes := field_changes || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title));
            old_vals := old_vals || jsonb_build_object('title', OLD.title);
            new_vals := new_vals || jsonb_build_object('title', NEW.title);
        END IF;
        
        IF OLD.description != NEW.description OR (OLD.description IS NULL AND NEW.description IS NOT NULL) OR (OLD.description IS NOT NULL AND NEW.description IS NULL) THEN
            field_changes := field_changes || jsonb_build_object('description', jsonb_build_object('old', OLD.description, 'new', NEW.description));
            old_vals := old_vals || jsonb_build_object('description', OLD.description);
            new_vals := new_vals || jsonb_build_object('description', NEW.description);
        END IF;
        
        IF OLD.completed != NEW.completed OR (OLD.completed IS NULL AND NEW.completed IS NOT NULL) OR (OLD.completed IS NOT NULL AND NEW.completed IS NULL) THEN
            field_changes := field_changes || jsonb_build_object('completed', jsonb_build_object('old', OLD.completed, 'new', NEW.completed));
            old_vals := old_vals || jsonb_build_object('completed', OLD.completed);
            new_vals := new_vals || jsonb_build_object('completed', NEW.completed);
            
            IF NEW.completed = true THEN
                change_description := 'Tarefa marcada como concluída';
            ELSE
                change_description := 'Tarefa marcada como pendente';
            END IF;
        END IF;
        
        IF OLD.assigned_to != NEW.assigned_to OR (OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL) OR (OLD.assigned_to IS NOT NULL AND NEW.assigned_to IS NULL) THEN
            field_changes := field_changes || jsonb_build_object('assigned_to', jsonb_build_object('old', OLD.assigned_to, 'new', NEW.assigned_to));
            old_vals := old_vals || jsonb_build_object('assigned_to', OLD.assigned_to);
            new_vals := new_vals || jsonb_build_object('assigned_to', NEW.assigned_to);
            
            IF NEW.assigned_to IS NOT NULL THEN
                change_description := 'Tarefa atribuída';
            ELSE
                change_description := 'Atribuição removida da tarefa';
            END IF;
        END IF;
        
        IF OLD.due_date != NEW.due_date THEN
            field_changes := field_changes || jsonb_build_object('due_date', jsonb_build_object('old', OLD.due_date, 'new', NEW.due_date));
            old_vals := old_vals || jsonb_build_object('due_date', OLD.due_date);
            new_vals := new_vals || jsonb_build_object('due_date', NEW.due_date);
            change_description := 'Data de vencimento alterada';
        END IF;
        
        -- Se houve mudanças, registrar no histórico
        IF field_changes != '{}' THEN
            IF change_description IS NULL THEN
                change_description := 'Tarefa atualizada: ' || NEW.title;
            END IF;
            
            INSERT INTO public.task_history (
                task_id, user_id, action_type, description,
                field_changes, old_values, new_values,
                metadata
            ) VALUES (
                NEW.id, current_user_id, 'updated', 
                change_description,
                field_changes, old_vals, new_vals,
                jsonb_build_object(
                    'updated_at', NEW.updated_at,
                    'change_count', jsonb_object_keys(field_changes)
                )
            );
        END IF;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Tarefa deletada
        INSERT INTO public.task_history (
            task_id, user_id, action_type, description,
            old_values, metadata
        ) VALUES (
            OLD.id, current_user_id, 'deleted',
            'Tarefa excluída: ' || OLD.title,
            row_to_json(OLD)::jsonb,
            jsonb_build_object(
                'deleted_at', now(),
                'was_completed', OLD.completed
            )
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger para registrar mudanças automaticamente
CREATE TRIGGER task_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.log_task_changes();

-- Comentários para documentação
COMMENT ON TABLE public.task_history IS 'Histórico de alterações das tarefas';
COMMENT ON COLUMN public.task_history.task_id IS 'ID da tarefa';
COMMENT ON COLUMN public.task_history.user_id IS 'ID do usuário que realizou a ação';
COMMENT ON COLUMN public.task_history.action_type IS 'Tipo da ação realizada';
COMMENT ON COLUMN public.task_history.description IS 'Descrição da alteração';
COMMENT ON COLUMN public.task_history.field_changes IS 'Campos específicos que foram alterados';
COMMENT ON COLUMN public.task_history.old_values IS 'Valores anteriores dos campos';
COMMENT ON COLUMN public.task_history.new_values IS 'Novos valores dos campos';
COMMENT ON COLUMN public.task_history.metadata IS 'Informações adicionais sobre a alteração'; 