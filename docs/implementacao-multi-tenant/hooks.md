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
| useDashboardStats | src/hooks/useDashboardStats.ts | Parcial | Incluir clientId na queryKey |
| useContactFlowData | src/hooks/useContactFlowData.ts | Parcial | Idem |
| useRecentActivities | src/hooks/useRecentActivities.ts | Parcial | Idem |
| useOrganizationTeams | src/hooks/useOrganizationTeams.ts | Parcial | Idem |
| useOrganizationUsers | src/hooks/useOrganizationUsers.ts | Parcial | Idem |
| useIndications | (usado em useDashboardStats) | A verificar | Garantir filtro por client_id |
| useOpportunities | (usado em useDashboardStats) | Parcial | Já filtra por client_id |

### Flows ([flows.md](./flows.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useNexflowFlows | src/hooks/useNexflowFlows.ts | Seguro | useSecureClientQuery + useSecureClientMutation; queryKey clientId; validação dupla; auditoria |
| useNexflowFlow | src/hooks/useNexflowFlows.ts | Seguro | useSecureClientQuery; validação flow.client_id; auditoria |
| useFlowPermissions | src/hooks/useFlowPermissions.ts | Seguro | queryKey com clientId |
| useNexflowCards | src/hooks/useNexflowCards.ts | Seguro | queryKey clientId; filtro e validação client_id |
| useNexflowCardsInfinite | src/hooks/useNexflowCardsInfinite.ts | Seguro | queryKey clientId; createCard via useSecureClientMutation; filtro e validação client_id |
| useFlow | src/hooks/useFlow.ts | Parcial | Idem |
| useFlows | src/hooks/useFlows.ts | Parcial | Idem |
| useFlowViews | src/hooks/useFlowViews.ts | Parcial | Idem |
| useFlowVisibility | src/hooks/useFlowVisibility.ts | Seguro | useFlowVisibilityData com queryKey clientId |
| useFlowStages | src/hooks/useFlowStages.ts | Parcial | Idem |
| useFlowBuilder | src/hooks/useFlowBuilder.ts | Parcial | Idem |
| useNexflowPermissions | src/hooks/useNexflowPermissions.ts | Parcial | Idem |
| useNexflowSteps | src/hooks/useNexflowSteps.ts | Seguro | queryKey com clientId |
| useNexflowUsers | src/hooks/useNexflowUsers.ts | Parcial | Idem |
| useCardMessages | src/hooks/useCardMessages.ts | Parcial | Idem |
| useCardHistory | src/hooks/useCardHistory.ts | Parcial | Idem |
| useCardTimeline | src/hooks/useCardTimeline.ts | Parcial | Idem |
| useCardActivities | src/hooks/useCardActivities.ts | Parcial | Idem |
| useCardAttachments | src/hooks/useCardAttachments.ts | Parcial | Idem |
| useCardChildren | src/hooks/useCardChildren.ts | Parcial | Idem |
| useStepChildCardAutomations | src/hooks/useStepChildCardAutomations.ts | Parcial | Idem |
| useCreateCardFromContact | src/hooks/useCreateCardFromContact.ts | Seguro | useSecureClientMutation; client_id no insert e validação do contato |
| useCreateCardFromIndication | src/hooks/useCreateCardFromIndication.ts | Parcial | Idem |
| useFlowActivityTypes | src/hooks/useFlowActivityTypes.ts | Parcial | QueryKey com clientId |

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
| useContactAutomations | src/hooks/useContactAutomations.ts | Parcial | Idem |
| useContactFlowData | src/hooks/useContactFlowData.ts | Seguro | useSecureClientQuery; queryKey com clientId |
| useContactRelationships | src/hooks/useContactRelationships.ts | Parcial | Idem |
| useIndicationDetails | src/hooks/useIndicationDetails.ts | Parcial | Validar escopo por client |
| useIndications | src/hooks/useIndications.ts | Seguro | queryKey clientId; body client_id; validação dupla |

### Empresas ([companies.md](./companies.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useCompanies | src/features/companies/hooks/useCompanies.ts | Parcial | Já usa client_id; queryKey com clientId |
| useCompanyRelations | src/hooks/useCompanyRelations.ts | Parcial | Idem |

### Configurações ([configurations.md](./configurations.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useOrganizationUsers | src/hooks/useOrganizationUsers.ts | Parcial | QueryKey com clientId |
| useOrganizationTeams | src/hooks/useOrganizationTeams.ts | Parcial | Idem |
| useCompanyUsers | src/hooks/useCompanyUsers.ts | Parcial | Idem |
| useCompanyTeams | src/hooks/useCompanyTeams.ts | Parcial | Idem |
| useItems | src/hooks/useItems.ts | Parcial | Idem |
| useUsers | src/hooks/useUsers.ts | Seguro | queryKey clientId; enabled com clientId; validação dupla na lista |
| useTeamLevels | src/hooks/useTeamLevels.ts | Parcial | Idem |
| useTeamMemberLevels | src/hooks/useTeamMemberLevels.ts | Parcial | Idem |
| useGlobalTeamLevels | src/hooks/useGlobalTeamLevels.ts | Parcial | Idem |
| useUsersByTeam | src/hooks/useUsersByTeam.ts | Parcial | Idem |

### Settings ([settings.md](./settings.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useNotificationSettings | src/hooks/useNotificationSettings.ts | Parcial | QueryKey com clientId; mutações com client_id |
| useSidebarData | src/hooks/useSidebarData.ts | Parcial | Funnels por client_id; key com clientId |
| useNotifications | src/hooks/useNotifications.ts | Parcial | Idem |

### Conta ([account.md](./account.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| useAccountProfile | src/hooks/useAccountProfile.ts | Seguro | queryKey clientId + userId; validação client_id; auditoria; useQuery |

### Formulários ([forms.md](./forms.md))

| Hook | Arquivo | Status | Observação |
|------|---------|--------|------------|
| usePublicContactForms | src/hooks/usePublicContactForms.ts | Parcial | QueryKey com clientId; validação dupla |
| useCustomFields | src/hooks/useCustomFields.ts | Parcial | Idem |
| useCustomFieldValues | src/hooks/useCustomFieldValues.ts | Parcial | Idem |
| useFields | src/hooks/useFields.ts | Parcial | Idem |

---

## Outros hooks (uso indireto ou múltiplas telas)

| Hook | Arquivo | Status | Guia(s) |
|------|---------|--------|---------|
| usePartners | src/hooks/usePartners.ts | Parcial | Contatos / Parceiros |
| usePartnersWithContacts | src/hooks/usePartnersWithContacts.ts | Parcial | Idem |
| usePeople | src/hooks/usePeople.ts | Parcial | Contatos / Deals |
| usePeopleAndPartners | src/hooks/usePeopleAndPartners.ts | Parcial | Idem |
| useOpportunities | src/hooks/useOpportunities.ts | Parcial | Dashboard / Deals |
| useOpportunitiesAccess | src/hooks/useOpportunitiesAccess.ts | Parcial | Idem |
| useDealDetails | src/hooks/useDealDetails.ts | Parcial | Deals |
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
