# Guias de Implementação Multi-Tenant (Seguro)

Índice e convenções para implementação segura de funcionalidades multi-tenant no CRM NexFlow.

## Referência externa

- **Guia completo:** Consulte o arquivo externo `guia-implementacao-multi-tenant-seguro.md` para as 5 camadas de segurança, exemplos de código e checklist detalhado. Os exemplos do guia usam a terminologia "tenant"; neste projeto aplicamos o mesmo padrão usando **client**.

## Mapeamento Tenant ↔ Client

No NexFlow a unidade de isolamento é o **client** (cliente/empresa), não "tenant". A equivalência é:

| Guia (tenant)     | NexFlow (código)        |
|-------------------|--------------------------|
| `tenant_id`       | `client_id`              |
| `tenants`         | `core_clients`           |
| `currentTenant`   | `currentClient` (id + nome) |
| `useTenantAccessGuard` | `useClientAccessGuard` |
| `useSecureTenantQuery` | `useSecureClientQuery` |
| `useSecureTenantMutation` | `useSecureClientMutation` |

O `client_id` do usuário autenticado é obtido via `getCurrentClientId()` (em `src/lib/supabase.ts` e `src/lib/supabase/rls.ts`), a partir da tabela `core_client_users`.

## Infraestrutura base

Antes de implementar por tela, utilize:

- **Store:** `src/stores/clientStore.ts` – estado global do cliente ativo (Zustand) e persistência em SessionStorage.
- **Guard:** `src/hooks/useClientAccessGuard.ts` – validação de acesso antes de renderizar qualquer página.
- **Query segura:** `src/hooks/useSecureClientQuery.ts` – consultas com `client_id` na queryKey e na query.
- **Mutation segura:** `src/hooks/useSecureClientMutation.ts` – mutações com `client_id` obrigatório e validação.

Padrão de query key: `['recurso', clientId, ...params]` (ex.: `['dashboard-stats', clientId]`, `['flows', clientId]`).

## Guias por tela

Cada guia descreve objetivo, checklist de segurança, hooks utilizados, implementação passo a passo, query keys, RLS e testes sugeridos.

| Tela | Documento | Páginas cobertas |
|------|-----------|-------------------|
| Dashboard / Home | [dashboard.md](./dashboard.md) | Home, Dashboard (legado) |
| Flows | [flows.md](./flows.md) | FlowsPage, Board, Builder, ProcessBuilder, FlowViews, NewNexflow |
| Contatos | [contacts.md](./contacts.md) | ContactsPage, ContactsList, ContactDetails |
| Empresas | [companies.md](./companies.md) | CompanyRelationsPage |
| Configurações | [configurations.md](./configurations.md) | UsersPage, TeamsPage, UnitsPage, ItemsPage |
| Settings | [settings.md](./settings.md) | GeneralSettings, Notifications, Team, Profile, Pipeline |
| Conta | [account.md](./account.md) | AccountProfile |
| Formulários | [forms.md](./forms.md) | FormsManagementPage |

## Inventário de hooks

O arquivo [hooks.md](./hooks.md) lista os hooks do projeto que acessam dados por cliente, com status (seguro / a migrar) e referência ao guia de tela em que são usados.

## Fluxo de segurança por tela

1. **useClientAccessGuard()** no topo do componente; se `!hasAccess`, exibir erro e não renderizar dados.
2. Todas as consultas via **useSecureClientQuery** (ou hook que o utilize), com `clientId` na queryKey.
3. Todas as mutações via **useSecureClientMutation** (ou equivalente), com `client_id` no payload.
4. Validação dupla: conferir que os dados retornados pertencem ao `client_id` atual.
5. Log de auditoria em acessos sensíveis (ex.: `[AUDIT] Página X - Client: ...`).

Nenhuma alteração no banco de dados é feita por estes guias; as políticas RLS devem estar configuradas manualmente para isolamento por `client_id`.

## Problemas conhecidos

- **Erro ao criar empresa (ccu.user_id):** Veja [../troubleshooting.md](../troubleshooting.md#erro-ao-criar-empresa-ccuuser_id).
