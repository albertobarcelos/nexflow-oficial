# Guia Multi-Tenant: Dashboard / Home

## 1. Objetivo da tela

Exibir visão geral do desempenho e métricas do CRM (indicadores, cards completos/cancelados, atividades recentes, gráfico de contatos no fluxo) para o cliente atual, com filtros por período, time e usuário.

## 2. Checklist de segurança

Antes de implementar ou revisar a tela:

- [ ] Usar **useClientAccessGuard()** para validação inicial
- [ ] Usar **useSecureClientQuery()** (ou hooks que o utilizem) para todas as consultas
- [ ] Incluir **client_id** em todas as query keys
- [ ] Validar dados retornados pertencem ao cliente correto (validação dupla onde aplicável)
- [ ] Adicionar logs de auditoria em acesso à página
- [ ] Testar isolamento com múltiplos clientes

## 3. Hooks utilizados

| Hook | Onde está | Seguro? | Ação |
|------|------------|--------|------|
| useDashboardStats | src/hooks/useDashboardStats.ts | Não | Migrar para useSecureClientQuery ou incluir clientId na queryKey e validar |
| useContactFlowData | src/hooks/useContactFlowData.ts | Não | Idem |
| useRecentActivities | src/hooks/useRecentActivities.ts | Não | Idem |
| useOrganizationTeams | src/hooks/useOrganizationTeams.ts | Não | Idem |
| useOrganizationUsers | src/hooks/useOrganizationUsers.ts | Não | Idem |
| useIndications | usados indiretamente em useDashboardStats | Não | Garantir filtro por client_id no hook |
| useOpportunities | usados indiretamente em useDashboardStats | Não | Garantir filtro por client_id no hook |

**Páginas cobertas:** `src/pages/crm/home/Home.tsx`, `src/pages/crm/Dashboard.tsx` (legado).

## 4. Implementação passo a passo

1. **Guard no topo do componente**
   - No início de `Home` (e se ainda usado, `Dashboard`), chamar `useClientAccessGuard()`.
   - Se `!hasAccess`, exibir mensagem de erro (`accessError`) e não renderizar dados.
   - Exemplo:
     ```tsx
     const { hasAccess, accessError, currentClient } = useClientAccessGuard();
     if (!hasAccess) return <div className="...">Erro: {accessError}</div>;
     ```

2. **Garantir contexto do cliente carregado**
   - O layout ou a rota protegida deve chamar `loadClientContext()` do store (ex.: em `CRMLayout` ou `ProtectedRoute`) para que `currentClient` esteja disponível antes das queries.

3. **Queries com client_id na key**
   - Em `useDashboardStats`: usar queryKey `['dashboard-cards-stats', clientId, period, teamId, userId]` e obter `clientId` do store ou de `getCurrentClientId()` no início da queryFn.
   - Em `useContactFlowData`, `useRecentActivities`, `useOrganizationTeams`, `useOrganizationUsers`: incluir `clientId` na queryKey e garantir que a queryFn filtre por `client_id`.

4. **Migrar para useSecureClientQuery (recomendado)**
   - Para cada dado que hoje vem de useQuery direto, criar (ou refatorar) um useSecureClientQuery com:
     - queryKey: `['nome-recurso', clientId, ...params]`
     - queryFn: `async (supabase, clientId) => { ... .eq('client_id', clientId) ... }`
   - Ou manter os hooks atuais mas garantindo que internamente usam getCurrentClientId(), que a queryKey inclui clientId e que há validação dupla se os dados forem listas.

5. **Validação dupla**
   - Para listas (ex.: atividades recentes, times, usuários), após receber os dados, validar que todo item tem `client_id === currentClient.id`; em caso negativo, logar e lançar erro.

6. **Auditoria**
   - Em `useEffect` ou na montagem da página, registrar: `console.log(\`[AUDIT] Dashboard acessado - Client: ${currentClient?.name}\`)` (ou usar logger do projeto).

## 5. Query keys recomendadas

- `['dashboard-cards-stats', clientId, period, teamId?, userId?]`
- `['contact-flow-data', clientId, period]`
- `['recent-activities', clientId, limit, teamId?, userId?]`
- `['organization-teams', clientId]`
- `['organization-users', clientId]`

Para o Dashboard legado (contagem de companies/people/deals):

- `['dashboard-stats', clientId]`

## 6. RLS

As tabelas usadas (ex.: `flows`, `steps`, `cards`, `core_client_users` com filtro por `client_id`, etc.) devem ter políticas RLS que restrinjam as linhas ao `client_id` do usuário autenticado. Não alterar o banco pelos guias; apenas garantir que as políticas existam e documentar aqui.

- `flows`: filtro por `client_id`
- `steps`: via `flow_id` (flows já filtrados por client)
- `cards`: filtro por `client_id` ou via flow
- `core_client_users`: usuário vê apenas seu próprio registro (e client_id)

## 7. Testes sugeridos

- **Unitário:** Hook useDashboardStats retorna métricas apenas para o client_id do usuário; com clientId null, não dispara query ou retorna valores zerados.
- **Página:** Home com useClientAccessGuard não renderiza conteúdo quando não há cliente.
- **Isolamento:** Com dois usuários de client_id diferente, cada um vê apenas suas métricas; trocar de conta e verificar que os números mudam.
