create table if not exists nexflow.cards (
    id uuid primary key default gen_random_uuid(),
    flow_id uuid not null references nexflow.flows(id) on delete cascade,
    step_id uuid not null references nexflow.steps(id) on delete cascade,
    client_id uuid not null,
    title text not null,
    field_values jsonb not null default '{}'::jsonb,
    checklist_progress jsonb not null default '{}'::jsonb,
    position integer not null default 0,
    created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_nexflow_cards_flow_id on nexflow.cards(flow_id);
create index if not exists idx_nexflow_cards_step_id on nexflow.cards(step_id);
create index if not exists idx_nexflow_cards_client_id on nexflow.cards(client_id);
create index if not exists idx_nexflow_cards_position on nexflow.cards(step_id, position);

