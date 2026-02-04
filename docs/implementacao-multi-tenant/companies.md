# Guia Multi-Tenant: Empresas / Relações

## 1. Objetivo da tela

Visualizar e gerenciar relações entre empresas, parceiros e contatos do cliente atual (CompanyRelationsPage).

## 2. Checklist de segurança

- [x] Usar **useClientAccessGuard()** na CompanyRelationsPage
- [x] Usar **useSecureClientQuery()** / **useSecureClientMutation()** nas operações de dados
- [x] Incluir **client_id** em todas as query keys
- [x] Validar dados retornados pertencem ao cliente (validação dupla)
- [x] Log de auditoria ao acessar a página
- [ ] Testar isolamento entre clientes

## 3. Hooks utilizados

| Hook | Onde está | Seguro? | Observação |
|------|------------|--------|------------|
| useCompanies | src/features/companies/hooks/useCompanies.ts | Sim | useSecureClientQuery + useSecureClientMutation; queryKey `['companies', clientId]`; validação dupla |
| useCompanyRelations | src/hooks/useCompanyRelations.ts | Sim | useSecureClientQuery; queryKey `['company-relations', clientId]`; validação dupla em empresas e contact_companies |

**Componentes:** CompanyRelationsTable usa apenas os hooks acima (sem consulta direta ao Supabase).

**Páginas cobertas:** CompanyRelationsPage.

## 4. Implementação passo a passo

1. **useClientAccessGuard**
   - Em CompanyRelationsPage: `const { hasAccess, accessError, currentClient } = useClientAccessGuard();` e guard `if (!hasAccess) return <Erro />`.

2. **Query keys**
   - useCompanies: `['companies', clientId]` (já usa getCurrentClientId; adicionar clientId na key).
   - useCompanyRelations: `['company-relations', clientId]` (ou equivalente com clientId no array).

3. **Leitura**
   - Garantir que useCompanyRelations e useCompanies filtram por client_id em todas as queries e que a queryKey inclui clientId para cache isolado.

4. **Mutações**
   - useCompanies.createCompany já insere client_id; pode ser migrado para useSecureClientMutation com validateClientIdOnResult.

5. **Validação dupla**
   - Para listas de empresas e relações, validar que todo item tem client_id igual ao currentClient.id.

6. **Auditoria**
   - `[AUDIT] Relações de empresas - Client: ${currentClient?.name}`.

## 5. Query keys recomendadas

- `['companies', clientId]`
- `['company-relations', clientId]`

## 6. RLS

Estado das políticas RLS (documentação; nenhuma alteração de banco é feita pelo código):

| Tabela | RLS por client_id | Observação |
|--------|-------------------|------------|
| **web_companies** | Sim | Políticas SELECT/INSERT/UPDATE/DELETE com `client_id = get_current_client_id()`. |
| **contact_companies** | Não | Possui coluna `client_id`, mas **não possui políticas RLS** na análise atual. Recomenda-se adicionar manualmente políticas (SELECT/INSERT/UPDATE/DELETE) com `client_id = get_current_client_id()` para isolamento no banco. |
| **contacts** | Não | Possui coluna `client_id`, mas **não possui políticas RLS** na análise atual. Recomenda-se adicionar manualmente políticas com `client_id = get_current_client_id()` para isolamento no banco. |

O código aplica filtro explícito `.eq('client_id', clientId)` em todas as queries e validação dupla nos retornos; as políticas RLS acima reforçam o isolamento no banco.

## 7. Testes sugeridos

- **Unitário:** useCompanies retorna apenas empresas do cliente; useCompanyRelations idem.
- **Página:** CompanyRelationsPage não exibe dados sem hasAccess; não exibe relações de outro cliente.
- **Isolamento:** Dois clientes não veem empresas/relações um do outro.
