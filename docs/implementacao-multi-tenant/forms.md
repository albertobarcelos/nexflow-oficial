# Guia Multi-Tenant: Formulários

## 1. Objetivo da tela

Gerenciar formulários (forms) do CRM para o cliente atual (FormsManagementPage): criar, editar e listar formulários e configurações de captação.

## 2. Checklist de segurança

- [ ] Usar **useClientAccessGuard()** na FormsManagementPage
- [ ] Usar **useSecureClientQuery()** / **useSecureClientMutation()** para formulários
- [ ] Incluir **client_id** em todas as query keys de formulários
- [ ] Validar dados retornados (formulários, campos) pertencem ao cliente
- [ ] Log de auditoria ao acessar gestão de formulários
- [ ] Testar isolamento entre clientes

## 3. Hooks utilizados

| Hook | Onde está | Seguro? | Ação |
|------|------------|--------|------|
| usePublicContactForms | src/hooks/usePublicContactForms.ts | Parcial | Já usa client_id nas queries; padronizar queryKey com clientId e validação dupla |
| useCustomFields | (se usado em forms) | Parcial | Filtro por client_id e key com clientId |
| useFields | src/hooks/useFields.ts | Parcial | Idem |

**Páginas cobertas:** FormsManagementPage e componentes em src/pages/crm/forms/.

## 4. Implementação passo a passo

1. **useClientAccessGuard**
   - Em FormsManagementPage: useClientAccessGuard(); se `!hasAccess`, exibir erro e não listar/criar formulários.

2. **Query keys com clientId**
   - Formulários públicos: `['public-contact-forms', clientId]` (ou equivalente já usado no hook)
   - Criar/atualizar formulário: mutação deve receber client_id e usar useSecureClientMutation ou garantir client_id no payload.

3. **Leitura**
   - usePublicContactForms: garantir queryKey com clientId e .eq('client_id', clientId) em todas as queries; opcionalmente useSecureClientQuery.

4. **Mutações**
   - Criação/edição de formulários: sempre enviar client_id; validar resultado com client_id correto.

5. **Validação dupla**
   - Para listas de formulários, validar que todo item tem client_id igual ao currentClient.id.

6. **Auditoria**
   - `[AUDIT] Formulários - Client: ...`.

## 5. Query keys recomendadas

- `['public-contact-forms', clientId]`
- `['form', formId]` (ao abrir um formulário específico, validar que form.client_id === currentClient.id)
- `['custom-fields', clientId]` (se usado na página)
- `['fields', clientId]`

## 6. RLS

Tabelas de formulários (e campos customizados, se houver) devem ter RLS por `client_id`. Documentar; não alterar banco.

## 7. Testes sugeridos

- **Unitário:** usePublicContactForms retorna apenas formulários do cliente; criação de formulário inclui client_id.
- **Página:** FormsManagementPage não exibe formulários de outro cliente.
- **Isolamento:** Dois clientes não veem/editam formulários um do outro.
