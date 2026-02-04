# Guia Multi-Tenant: Settings (Geral, Notificações, Time, Perfil, Pipeline)

## 1. Objetivo da tela

Configurações gerais do CRM, notificações, time, perfil do usuário e pipeline/flows (GeneralSettings, NotificationSettings, TeamSettings, ProfileSettings, PipelineSettings, NewFlowSettings).

## 2. Checklist de segurança

- [x] Usar **useClientAccessGuard()** onde a tela exibe ou altera dados por cliente
- [x] Usar **useSecureClientQuery()** / **useSecureClientMutation()** para dados isolados por client_id
- [x] Incluir **client_id** em todas as query keys de dados do cliente
- [x] Validar dados retornados pertencem ao cliente
- [x] Log de auditoria em acessos sensíveis
- [ ] Testar isolamento onde aplicável

## 3. Hooks utilizados

| Hook | Onde está | Seguro? | Ação |
|------|------------|--------|------|
| useNotificationSettings | src/hooks/useNotificationSettings.ts | Seguro | useSecureClientQuery + useSecureClientMutation; queryKey com clientId |
| useNotifications | src/hooks/useNotifications.ts | Seguro | QueryKey com clientId; validação dupla; invalidações por clientId |
| useSidebarData | src/hooks/useSidebarData.ts | Seguro | Funnels via web_flows; key ['funnels', clientId]; validação dupla |
| useFlowPermissions | src/hooks/useFlowPermissions.ts | Seguro | queryKey com clientId |
| useAccountProfile | src/hooks/useAccountProfile.ts | Parcial | Perfil pode referenciar organizationId/client_id; validar escopo |
| useCustomFields | (se usado em settings) | Parcial | Garantir filtro por client_id |
| useFields | src/hooks/useFields.ts | Parcial | Idem |

**Páginas cobertas:** GeneralSettings, NotificationSettings, TeamSettings, ProfileSettings, PipelineSettings, NewFlowSettings.

## 4. Implementação passo a passo

1. **useClientAccessGuard**
   - Em telas que carregam dados do cliente (notificações, pipeline, etc.): usar useClientAccessGuard e guard clause.

2. **Query keys**
   - Notificações: `['notification-settings', clientId]`, `['notifications', clientId, limit]`
   - Sidebar/funnels: já usa collaborator.client_id; padronizar key com clientId
   - Pipeline/flow settings: keys que incluam clientId para flows/stages

3. **Leitura e mutações**
   - useNotificationSettings: leituras e updates devem filtrar por client_id e incluir client_id no payload de insert/update.
   - Configurações de pipeline: flows/stages por client_id; mutações com client_id.

4. **Validação dupla**
   - Para listas (ex.: notificações, opções de pipeline), validar client_id nos itens.

5. **Auditoria**
   - Log ao acessar configurações sensíveis: `[AUDIT] Settings (notifications/pipeline) - Client: ...`.

## 5. Query keys recomendadas

- `['notification-settings', clientId]`
- `['notifications', clientId, limit]`
- `['notifications', 'unread-count', clientId]`
- `['funnels', clientId]` (sidebar)
- `['flow-permissions', clientId]` (ou por flowId já validado)

## 6. RLS

**Não alterar o banco por este guia.** Apenas documentar o estado atual das políticas.

### Tabelas já com RLS por client_id

- **notifications:** SELECT e UPDATE restritos a `user_id = auth.uid()` e `client_id = get_user_client_id()`. INSERT permitido para o sistema (authenticated). As políticas garantem isolamento por cliente.
- **user_notification_settings:** SELECT, INSERT e UPDATE restritos a `user_id = auth.uid()` e `client_id = get_user_client_id()`. Sem `get_user_client_id()` não há acesso.

### Tabelas de pipeline/flows

- **web_flows** (e **web_flow_stages** quando aplicável): devem possuir RLS por `client_id` para isolamento. Verificar manualmente no banco se as políticas existem e usam `get_user_client_id()` ou equivalente. O frontend usa `client_id` na queryKey e validação dupla; a segurança definitiva é garantida pelo RLS no Postgres.

## 7. Testes sugeridos

- **Unitário:** useNotificationSettings retorna apenas configurações do cliente; mutações incluem client_id.
- **Página:** Settings não exibem/alteram dados de outro cliente.
- **Isolamento:** Dois clientes não veem configurações um do outro.
