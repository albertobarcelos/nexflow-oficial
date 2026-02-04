# Guia Multi-Tenant: Configurações (Users, Teams, Units, Items)

## 1. Objetivo da tela

Gerenciar usuários, times, unidades e itens do cliente atual (UsersPage, TeamsPage, UnitsPage, ItemsPage) dentro do CRM.

## 2. Checklist de segurança

- [ ] Usar **useClientAccessGuard()** em cada página de configuração
- [ ] Usar **useSecureClientQuery()** / **useSecureClientMutation()** onde houver dados por cliente
- [ ] Incluir **client_id** em todas as query keys
- [ ] Validar dados retornados pertencem ao cliente
- [ ] Log de auditoria ao acessar configurações
- [ ] Testar isolamento entre clientes

## 3. Hooks utilizados

| Hook | Onde está | Seguro? | Ação |
|------|------------|--------|------|
| useOrganizationUsers | src/hooks/useOrganizationUsers.ts | Parcial | QueryKey com clientId; filtro por client_id |
| useOrganizationTeams | src/hooks/useOrganizationTeams.ts | Parcial | Idem |
| useCompanyUsers | src/hooks/useCompanyUsers.ts | Parcial | Idem |
| useCompanyTeams | src/hooks/useCompanyTeams.ts | Parcial | Idem |
| useItems | src/hooks/useItems.ts | Parcial | Já usa client_id; padronizar key com clientId |
| useUsers | src/hooks/useUsers.ts | Parcial | Idem |
| useTeamLevels | src/hooks/useTeamLevels.ts | Parcial | Idem |
| useTeamMemberLevels | src/hooks/useTeamMemberLevels.ts | Parcial | Idem |
| useGlobalTeamLevels | src/hooks/useGlobalTeamLevels.ts | Parcial | Idem |

**Páginas cobertas:** UsersPage, TeamsPage, UnitsPage, ItemsPage (e componentes como CompanyUsersManager).

## 4. Implementação passo a passo

1. **useClientAccessGuard**
   - Em UsersPage, TeamsPage, UnitsPage, ItemsPage: chamar useClientAccessGuard(); se `!hasAccess`, exibir mensagem e não renderizar dados sensíveis.

2. **Query keys com clientId**
   - Users: `['organization-users', clientId]` ou `['company-users', clientId]`
   - Teams: `['organization-teams', clientId]` ou `['company-teams', clientId]`
   - Items: `['items', clientId]` (useItems já usa variables.client_id em algumas keys; padronizar)
   - Team levels: incluir clientId na key (ex.: `['team-levels', clientId, teamId]`)

3. **Leitura**
   - Todos os hooks que buscam usuários/times/itens do cliente devem filtrar por client_id e usar queryKey que inclua clientId.

4. **Mutações**
   - Criação/edição de usuários, times, unidades, itens: sempre enviar client_id; usar useSecureClientMutation ou garantir validação no hook existente.

5. **Validação dupla**
   - Para listas (usuários, times, itens), validar que todo item pertence ao client_id atual.

6. **Auditoria**
   - `[AUDIT] Configurações (users/teams/units/items) - Client: ...`.

## 5. Query keys recomendadas

- `['organization-users', clientId]`
- `['organization-teams', clientId]`
- `['company-users', clientId]`
- `['company-teams', clientId]`
- `['items', clientId]`
- `['team-levels', clientId, teamId?]`
- `['user-client', userId]` (UsersPage: dados do cliente do usuário; validar que é o mesmo client)

## 6. RLS

Tabelas de usuários por cliente, times, unidades, itens devem ter RLS por `client_id`. Documentar políticas; não alterar banco.

## 7. Testes sugeridos

- **Unitário:** useOrganizationUsers e useOrganizationTeams retornam apenas dados do client_id atual.
- **Página:** UsersPage/TeamsPage/ItemsPage não exibem dados de outro cliente.
- **Isolamento:** Dois clientes não veem usuários/times/itens um do outro.
