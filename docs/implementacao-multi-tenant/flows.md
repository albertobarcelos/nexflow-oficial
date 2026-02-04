# Guia Multi-Tenant: Flows

## 1. Objetivo da tela

Permitir listar, criar, editar, excluir e visualizar flows (pipelines), além de acessar board, builder e processos por flow, com isolamento total por cliente.

## 2. Checklist de segurança

- [x] Usar **useClientAccessGuard()** em todas as páginas de flows
- [x] Usar **useSecureClientQuery()** para leitura e **useSecureClientMutation()** para escrita
- [x] Incluir **client_id** em todas as query keys
- [x] Validar dados retornados (flows, steps, cards) pertencem ao cliente correto
- [x] Log de auditoria em acesso a lista de flows e a flow específico
- [ ] Testar isolamento entre clientes

## 3. Hooks utilizados

| Hook | Onde está | Seguro? | Ação |
|------|------------|--------|------|
| useNexflowFlows | src/hooks/useNexflowFlows.ts | Seguro | useSecureClientQuery + useSecureClientMutation; queryKey com clientId; validação dupla; auditoria |
| useNexflowFlow | src/hooks/useNexflowFlows.ts | Seguro | useSecureClientQuery; validação flow.client_id; auditoria |
| useFlowPermissions | src/hooks/useFlowPermissions.ts | Seguro | queryKey com clientId |
| useNexflowCards | src/hooks/useNexflowCards.ts | Seguro | queryKey com clientId; filtro e validação client_id |
| useNexflowCardsInfinite | src/hooks/useNexflowCardsInfinite.ts | Seguro | queryKey com clientId; createCard via useSecureClientMutation; filtro e validação client_id |
| useFlow | src/hooks/useFlow.ts | Parcial | Idem |
| useFlows | src/hooks/useFlows.ts | Parcial | Idem |
| useFlowViews | src/hooks/useFlowViews.ts | Parcial | Idem |
| useFlowVisibility | src/hooks/useFlowVisibility.ts | Seguro | useFlowVisibilityData com queryKey clientId |
| useFlowStages | src/hooks/useFlowStages.ts | Parcial | Idem |
| useFlowBuilder | src/hooks/useFlowBuilder.ts | Parcial | Idem |
| useNexflowPermissions | src/hooks/useNexflowPermissions.ts | Parcial | Idem |
| useNexflowSteps | src/hooks/useNexflowSteps.ts | Seguro | queryKey com clientId |

**Páginas cobertas:** FlowsPage, NewNexflowPage, NexflowBuilderPage, NexflowBoardPage, ProcessBuilderPage, FlowViewsPage, FlowBuilderPage.

## 4. Implementação passo a passo

1. **useClientAccessGuard em cada página**
   - FlowsPage, NexflowBoardPage, NexflowBuilderPage, ProcessBuilderPage, FlowViewsPage, NewNexflowPage, FlowBuilderPage: no topo, `const { hasAccess, accessError, currentClient } = useClientAccessGuard();` e guard clause `if (!hasAccess) return <Erro ... />`.

2. **Query keys com clientId**
   - Lista de flows: `['nexflow', 'flows', clientId]` (e variantes como `['nexflow', 'flow', flowId]` devem ser usadas apenas após garantir que o flow pertence ao client).
   - Cards: `['nexflow', 'cards', clientId, flowId?, stepId?]`.
   - Permissões: `['nexflow', 'permissions', 'access', flowId]` — garantir que o flow já foi validado como do cliente.

3. **Leitura (useSecureClientQuery)**
   - Refatorar useNexflowFlows para usar useSecureClientQuery com queryFn que recebe (supabase, clientId) e faz `.eq('client_id', clientId)` em flows.
   - useNexflowCards / useNexflowCardsInfinite: queryFn deve filtrar por client_id (direto na tabela cards ou via flow).

4. **Mutações (useSecureClientMutation)**
   - Criar flow, atualizar flow, deletar flow, criar/atualizar steps, mover cards: todas devem receber clientId e incluir `client_id` no payload; usar useSecureClientMutation.

5. **Validação dupla**
   - Após buscar flows ou cards, filtrar/validar que todo item tem `client_id === currentClient.id`; se algum não tiver, logar e lançar erro.

6. **Auditoria**
   - Log ao acessar lista de flows e ao abrir um flow específico: `[AUDIT] Flows - Client: ...` e `[AUDIT] Flow :flowId - Client: ...`.

## 5. Query keys recomendadas

- `['nexflow', 'flows', clientId]`
- `['nexflow', 'flow', flowId]` (usar apenas quando flowId for do cliente)
- `['nexflow', 'cards', clientId, flowId?, stepId?]`
- `['nexflow', 'permissions', 'access', flowId]`
- `['nexflow', 'permissions', 'visibility', flowId]`
- `['nexflow', 'steps', flowId]`
- `['nexflow', 'step-fields', stepId]`

Sempre que a lista for por cliente, o primeiro parâmetro após o recurso deve ser `clientId`.

## 6. RLS

Tabelas: `flows`, `steps`, `cards`, `step_fields`, e demais relacionadas devem ter RLS por `client_id` (ou por `flow_id` com flow restrito a client_id). **Não alterar banco.**

### Políticas existentes (documentação)

- **flows:** política "Users can access flows based on client_id" — qual e with_check usam `core_client_users.client_id`. Isolamento por cliente OK.
- **cards:** política "Manage cards based on Client ID" — mesma lógica. OK.
- **steps:** política "Enable all access for steps" — apenas `auth.role() = 'authenticated'`. Não há coluna `client_id`; o acesso seguro a steps depende do app solicitar steps apenas para flows já validados como do cliente (via useNexflowFlow / useNexflowSteps com flow do cliente).
- **step_fields:** política "Enable all access for fields" — mesmo padrão. Isolamento via step → flow no app.

## 7. Testes sugeridos

- **Unitário:** useNexflowFlows retorna apenas flows do client_id atual; useNexflowCards não retorna cards de outro cliente.
- **Página:** FlowsPage com guard não renderiza lista quando !hasAccess.
- **Isolamento:** Dois clientes não veem flows/cards um do outro; criar flow em um cliente e verificar que o outro não o lista.
