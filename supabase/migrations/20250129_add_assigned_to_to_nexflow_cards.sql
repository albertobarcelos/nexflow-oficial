-- Adicionar coluna assigned_to na tabela nexflow.cards
alter table nexflow.cards
add column if not exists assigned_to uuid;

-- Adicionar foreign key para core_client_users
alter table nexflow.cards
add constraint nexflow_cards_assigned_to_fkey
foreign key (assigned_to)
references public.core_client_users(id)
on delete set null;

-- Adicionar índice para performance em consultas por responsável
create index if not exists idx_nexflow_cards_assigned_to 
on nexflow.cards(assigned_to);

-- Migração de dados: mover assigned_to de field_values para coluna relacional (se existir)
-- Isso limpa dados antigos que possam estar no JSONB
update nexflow.cards
set assigned_to = (field_values->>'assigned_to')::uuid
where field_values ? 'assigned_to'
  and (field_values->>'assigned_to')::uuid is not null;

-- Remover assigned_to do JSONB após migração
update nexflow.cards
set field_values = field_values - 'assigned_to'
where field_values ? 'assigned_to';

