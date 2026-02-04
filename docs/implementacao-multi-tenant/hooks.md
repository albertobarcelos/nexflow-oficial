# Inventário de Hooks Multi-Tenant

Lista dos hooks do projeto que acessam dados por cliente (`client_id`), com status de segurança e referência ao guia de tela em que são usados.

**Legenda:**

- **Seguro:** Usa padrão useSecureClientQuery/useSecureClientMutation (ou equivalente) com queryKey contendo clientId e validação dupla onde aplicável.
- **Parcial:** Usa getCurrentClientId() e filtra por client_id, mas queryKey pode não incluir clientId ou não há validação dupla.
- **A migrar:** Deve ser refatorado para o padrão seguro (queryKey com clientId, validação dupla, ou uso dos hooks useSecureClientQuery/useSecureClientMutation).

---

## Infraestrutura (já criados)

| Hook | Arquivo | Descrição |
|------|---------|-----------|
| useClientAccessGuard | src/hooks/useClientAccessGuard.ts | Validação de acesso antes de renderizar; retorna hasAccess, currentClient |
| useSecureClientQuery | src/hooks/useSecureClientQuery.ts | Query segura com clientId na key e na queryFn |
| useSecureClientMutation | src/hooks/useSecureClientMutation.ts | Mutação segura com client_id obrigatório |
| useClientStore | src/stores/clientStore.ts | Estado global do cliente (Zustand) + SessionStorage |

---

## Por guia de tela

### Dashboard ([dashboard.md](./dashboard.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useDashboardStats | src/hooks/useDashboardStats.ts | Seguro | useSecureClientQuery; queryKey com clientId |
| useContactFlowData | src/hooks/useContactFlowData.ts | Seguro | useSecureClientQuery; queryKey com clientId |
| useRecentActivities | src/hooks/useRecentActivities.ts | Seguro | useSecureClientQuery; queryKey com clientId |
| useOrganizationTeams | src/hooks/useOrganizationTeams.ts | Seguro | useSecureClientQuery; queryKey com clientId; validateClientIdOnData |
| useOrganizationUsers | src/hooks/useOrganizationUsers.ts | Seguro | useSecureClientQuery; queryKey com clientId; validateClientIdOnData |
| useIndications | (usado em useDashboardStats) | Seguro | queryKey clientId; body client_id; validação dupla |
| useOpportunities | (usado em useDashboardStats) | Parcial | RPC get_contacts com p_client_id; queryKey pode incluir clientId |

### Flows ([flows.md](./flows.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useNexflowFlows | src/hooks/useNexflowFlows.ts | Seguro | useSecureClientQuery + useSecureClientMutation; queryKey clientId; validação dupla; auditoria |
| useNexflowFlow | src/hooks/useNexflowFlows.ts | Seguro | useSecureClientQuery; validação flow.client_id; auditoria |
| useFlowPermissions | src/hooks/useFlowPermissions.ts | Seguro | queryKey com clientId |
| useNexflowCards | src/hooks/useNexflowCards.ts | Seguro | queryKey clientId; filtro e validação client_id |
| useNexflowCardsInfinite | src/hooks/useNexflowCardsInfinite.ts | Seguro | queryKey clientId; createCard via useSecureClientMutation; filtro e validação client_id |
| useFlow | src/hooks/useFlow.ts | Seguro | queryKey com clientId; enabled com clientId |
| useFlows | src/hooks/useFlows.ts | Seguro | queryKey com clientId; enabled com clientId |
| useFlowViews | src/hooks/useFlowViews.ts | Seguro | clientId do store; filtro client_id nas queries; client_id no insert |
| useFlowVisibility | src/hooks/useFlowVisibility.ts | Seguro | useFlowVisibilityData com queryKey clientId |
| useFlowStages | src/hooks/useFlowStages.ts | Seguro | queryKey com clientId; enabled com clientId |
| useFlowBuilder | src/hooks/useFlowBuilder.ts | Parcial | Idem |
| useNexflowPermissions | src/hooks/useNexflowPermissions.ts | Seguro | queryKey com clientId em access e visibility |
| useNexflowSteps | src/hooks/useNexflowSteps.ts | Seguro | queryKey com clientId |
| useNexflowUsers | src/hooks/useNexflowUsers.ts | Seguro | queryKey com clientId; enabled com clientId |
| useCardMessages | src/hooks/useCardMessages.ts | Seguro | queryKey com clientId; enabled com clientId |
| useCardHistory | src/hooks/useCardHistory.ts | Seguro | queryKey com clientId; enabled com clientId |
| useCardTimeline | src/hooks/useCardTimeline.ts | Seguro | queryKey com clientId; enabled com clientId |
| useCardActivities | src/hooks/useCardActivities.ts | Seguro | queryKey com clientId; invalidações com clientId |
| useCardAttachments | src/hooks/useCardAttachments.ts | Seguro | queryKey com clientId; enabled com clientId |
| useCardChildren | src/hooks/useCardChildren.ts | Seguro | queryKey com clientId; enabled com clientId |
| useStepChildCardAutomations | src/hooks/useStepChildCardAutomations.ts | Seguro | queryKey com clientId; enabled com clientId |
| useCreateCardFromContact | src/hooks/useCreateCardFromContact.ts | Seguro | useSecureClientMutation; client_id no insert e validação do contato |
| useCreateCardFromIndication | src/hooks/useCreateCardFromIndication.ts | Parcial | Idem |
| useFlowActivityTypes | src/hooks/useFlowActivityTypes.ts | Seguro | queryKey com clientId; invalidações com clientId |

### Contatos ([contacts.md](./contacts.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useContactsWithIndications | src/hooks/useContactsWithIndications.ts | Seguro | clientId na key; validação dupla na lista unificada |
| useContactDetails | src/hooks/useContactDetails.ts | Seguro | queryKey clientId; filtro e validação dupla |
| useContactCompanies | src/hooks/useContactCompanies.ts | Seguro | queryKey com clientId; invalidação com clientId |
| useContactTimeline | src/hooks/useContactTimeline.ts | Seguro | queryKey com clientId |
| useCreateContact | src/hooks/useCreateContact.ts | Seguro | useSecureClientMutation; validateClientIdOnResult |
| useContactById | src/hooks/useContactById.ts | Seguro | queryKey clientId; filtro e validação dupla |
| useContactsForSelect | src/hooks/useContactsForSelect.ts | Seguro | queryKey com clientId; enabled com clientId |
| useContactAutomations | src/hooks/useContactAutomations.ts | Seguro | queryKey com clientId; enabled com clientId |
| useContactFlowData | src/hooks/useContactFlowData.ts | Seguro | useSecureClientQuery; queryKey com clientId |
| useContactRelationships | src/hooks/useContactRelationships.ts | Seguro | queryKey com clientId; enabled com clientId |
| useIndicationDetails | src/hooks/useIndicationDetails.ts | Seguro | queryKey com clientId; .eq('client_id', clientId) na indicação; enabled com clientId |
| useIndications | src/hooks/useIndications.ts | Seguro | queryKey clientId; body client_id; validação dupla |

### Empresas ([companies.md](./companies.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useCompanies | src/features/companies/hooks/useCompanies.ts | Seguro | useSecureClientQuery + useSecureClientMutation; queryKey com clientId |
| useCompanyRelations | src/hooks/useCompanyRelations.ts | Seguro | useSecureClientQuery; queryKey com clientId; validação dupla |

### Configurações ([configurations.md](./configurations.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useOrganizationUsers | src/hooks/useOrganizationUsers.ts | Seguro | useSecureClientQuery; queryKey com clientId; validateClientIdOnData |
| useOrganizationTeams | src/hooks/useOrganizationTeams.ts | Seguro | useSecureClientQuery; queryKey com clientId; validateClientIdOnData |
| useCompanyUsers | src/hooks/useCompanyUsers.ts | Seguro | useSecureClientQuery; queryKey com clientId; validateClientIdOnData |
| useCompanyTeams | src/hooks/useCompanyTeams.ts | Seguro | useSecureClientQuery; queryKey com clientId; validateClientIdOnData |
| useItems | src/hooks/useItems.ts | Seguro | queryKey clientId; useSecureClientMutation em create/update/delete; validateClientIdOnResult |
| useUsers | src/hooks/useUsers.ts | Seguro | queryKey clientId (store); validação dupla |
| useTeamLevels | src/hooks/useTeamLevels.ts | Seguro | queryKey ['team-levels', clientId, teamId]; clientId do store |
| useTeamMemberLevels | src/hooks/useTeamMemberLevels.ts | Seguro | queryKey ['team-member-levels', clientId, teamMemberId]; clientId do store |
| useGlobalTeamLevels | src/hooks/useGlobalTeamLevels.ts | Parcial | Já usa clientId na key; garantir clientId do store nos consumidores |
| useUsersByTeam | src/hooks/useUsersByTeam.ts | Parcial | Idem |

### Settings ([settings.md](./settings.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useNotificationSettings | src/hooks/useNotificationSettings.ts | Seguro | useSecureClientQuery + useSecureClientMutation; queryKey com clientId; validação dupla |
| useSidebarData | src/hooks/useSidebarData.ts | Seguro | queryKey com clientId; validação dupla em funnels |
| useNotifications | src/hooks/useNotifications.ts | Seguro | queryKey com clientId; validação dupla |

### Conta ([account.md](./account.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useAccountProfile | src/hooks/useAccountProfile.ts | Seguro | queryKey clientId + userId; validação client_id; auditoria; useQuery |

### Formulários ([forms.md](./forms.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| usePublicContactForms | src/hooks/usePublicContactForms.ts | Seguro | useSecureClientQuery + useSecureClientMutation; queryKey clientId; validação dupla |
| useCustomFields | src/hooks/useCustomFields.ts | Seguro | queryKey com clientId; enabled com clientId |
| useCustomFieldValues | src/hooks/useCustomFieldValues.ts | Parcial | Idem |
| useFields | src/hooks/useFields.ts | Parcial | Idem |

---

## Outros hooks (uso indireto ou múltiplas telas)

| Hook | Arquivo | Status | Guia(s) |
|------|---------|--------|---------|
| usePartners | src/hooks/usePartners.ts | Seguro | queryKey com clientId; enabled com clientId; invalidações com clientId |
| usePartnersWithContacts | src/hooks/usePartnersWithContacts.ts | Parcial | Idem |
| usePeople | src/hooks/usePeople.ts | Parcial | Contatos / Deals |
| usePeopleAndPartners | src/hooks/usePeopleAndPartners.ts | Parcial | Idem |
| useOpportunities | src/hooks/useOpportunities.ts | Parcial | RPC get_contacts com p_client_id |
| useOpportunitiesAccess | src/hooks/useOpportunitiesAccess.ts | Parcial | Idem |
| useDealDetails | src/hooks/useDealDetails.ts | Seguro | queryKey com clientId; enabled com clientId |
| useTaskHistory | src/hooks/useTaskHistory.ts | Parcial | Tasks / Cards |
| useHuntersAccess | src/hooks/useHuntersAccess.ts | Parcial | Hunters |
| useFranchises | src/hooks/useFranchises.ts | Parcial | Configurações / Franchises |

---

## Ações gerais recomendadas

1. **Em todos os hooks listados como "Parcial":**
   - Incluir `clientId` (do store ou getCurrentClientId) na **queryKey** de useQuery.
   - Onde retornar listas, adicionar **validação dupla**: filtrar/validar que todo item tem `client_id === clientId`; em caso negativo, logar e lançar erro.

2. **Onde houver useQuery direto com dados por cliente:**
   - Considerar refatorar para **useSecureClientQuery** (queryFn(supabase, clientId) e queryKey com clientId).

3. **Onde houver useMutation com insert/update por cliente:**
   - Garantir **client_id** no payload e considerar **useSecureClientMutation** com validateClientIdOnResult quando o retorno trouxer client_id.

4. **Páginas:**
   - Garantir **useClientAccessGuard()** no topo e guard clause quando `!hasAccess`.
   - Garantir que **loadClientContext** seja chamado no app (ex.: layout ou rota protegida) para o store ter currentClient antes das queries.

Este inventário deve ser atualizado sempre que novos hooks que toquem em dados por cliente forem criados ou quando um hook for migrado para o padrão seguro.
