alter table if exists nexflow.steps
add column if not exists color text not null default '#2563eb';

update nexflow.steps
set color = '#2563eb'
where color is null;

