# Guia Multi-Tenant: Contatos

## 1. Objetivo da tela

Listar e filtrar contatos (com indicações), abrir detalhes do contato e lista alternativa, com criação de contato e de card a partir de contato, isolados por cliente.

## 2. Checklist de segurança

- [x] Usar **useClientAccessGuard()** em ContactsPage, ContactsList e ContactDetails
- [x] Usar **useSecureClientQuery()** / **useSecureClientMutation()** para operações de contatos (create contact, create card from contact)
- [x] Incluir **client_id** em todas as query keys dos hooks de contatos
- [x] Validar dados retornados (contatos, indicações) pertencem ao cliente (validação dupla)
- [x] Log de auditoria em acesso à lista e ao detalhe do contato
- [ ] Testar isolamento entre clientes (testes E2E ou integração)

## 3. Hooks utilizados

| Hook | Onde está | Seguro? | Ação |
|------|------------|--------|------|
| useContactsWithIndications | src/hooks/useContactsWithIndications.ts | Seguro | clientId na key; validação dupla |
| useContactDetails | src/hooks/useContactDetails.ts | Seguro | queryKey clientId; filtro e validação dupla |
| useContactFlowData | src/hooks/useContactFlowData.ts | Seguro | useSecureClientQuery |
| useContactCompanies | src/hooks/useContactCompanies.ts | Seguro | queryKey com clientId |
| useContactTimeline | src/hooks/useContactTimeline.ts | Seguro | queryKey com clientId |
| useCreateContact | src/hooks/useCreateContact.ts | Seguro | useSecureClientMutation |
| useCreateCardFromContact | src/hooks/useCreateCardFromContact.ts | Seguro | useSecureClientMutation |
| useContactById | src/hooks/useContactById.ts | Seguro | queryKey clientId; validação dupla |
| useContactsForSelect | src/hooks/useContactsForSelect.ts | Seguro | queryKey com clientId |
| useIndications | src/hooks/useIndications.ts | Seguro | queryKey clientId; validação dupla |

**Páginas cobertas:** ContactsPage, ContactsList, ContactDetails.

## 4. Implementação passo a passo

1. **useClientAccessGuard**
   - Em ContactsPage, ContactsList e ContactDetails: chamar useClientAccessGuard(); se `!hasAccess`, exibir erro e não carregar dados.

2. **Query keys com clientId**
   - Contatos/indicações: useOpportunities `['contacts', clientId, ...]`; useIndications `['indications', clientId]`; validação dupla em useContactsWithIndications.
   - Detalhe: `['contact-details', clientId, contactId]` — filtro e validação dupla no hook.
   - Companies: `['contact-companies', clientId, contactId]`; timeline: `['contact-timeline', clientId, contactId]`; contacts-for-select: `['contacts-for-select', clientId, excludeContactId]`.

3. **Leitura**
   - useContactsWithIndications: queryFn deve usar .eq('client_id', clientId) (ou equivalente na tabela de indicações/contatos). Usar useSecureClientQuery ou garantir key + filtro + validação dupla.

4. **Mutações**
   - useCreateContact: sempre enviar client_id no insert; usar useSecureClientMutation.
   - useCreateCardFromContact: idem para a criação do card (client_id obrigatório).

5. **Validação dupla**
   - Para listas de contatos/indicações, após receber dados, validar que todo item tem client_id correto.

6. **Auditoria**
   - Log ao acessar lista de contatos e ao abrir detalhe: `[AUDIT] Contatos - Client: ...` e `[AUDIT] Contato :id - Client: ...`.

## 5. Query keys recomendadas

- `['contacts-with-indications', clientId, filterTypes?]`
- `['contact-details', contactId]` (validar client_id no resultado)
- `['contact-flow-data', clientId, period]`
- `['contact-companies', clientId, contactId?]`
- `['contact-timeline', clientId, contactId]`
- `['contacts-for-select', clientId]`

## 6. RLS

Tabelas de contatos, indicações e cards devem ter RLS por `client_id`. **Não alterar banco pelo código;** alterações são manuais.

- **contacts:** Deve ter RLS habilitado e política que restrinja por `client_id` usando `core_client_users` e `auth.uid()` (SELECT/INSERT/UPDATE/DELETE), análogo à política de `cards` (ex.: `client_id IN (SELECT client_id FROM core_client_users WHERE id = auth.uid())`).
- **cards:** Já possui RLS com política "Manage cards based on Client ID".
- **core_indications:** Garantir que as migrations de RLS estejam aplicadas e que as políticas filtrem por `client_id` do usuário atual.
- **contact_indications:** Se utilizada, garantir RLS por `client_id`.

## 7. Testes sugeridos

- **Unitário:** useContactsWithIndications retorna apenas contatos do cliente; useCreateContact insere com client_id correto.
- **Página:** ContactsPage com guard não renderiza lista quando !hasAccess; ContactDetails não exibe dados de contato de outro cliente.
- **Isolamento:** Dois clientes não veem contatos um do outro.
