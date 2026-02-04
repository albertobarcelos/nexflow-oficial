# Guia Multi-Tenant: Formulários

## 1. Objetivo da tela

Gerenciar formulários (forms) do CRM para o cliente atual (FormsManagementPage): criar, editar e listar formulários e configurações de captação.

## 2. Checklist de segurança

- [x] Usar **useClientAccessGuard()** na FormsManagementPage
- [x] Usar **useSecureClientQuery()** / **useSecureClientMutation()** para formulários
- [x] Incluir **client_id** em todas as query keys de formulários
- [x] Validar dados retornados (formulários, campos) pertencem ao cliente
- [x] Log de auditoria ao acessar gestão de formulários
- [ ] Testar isolamento entre clientes

## 3. Hooks utilizados

| Hook | Onde está | Seguro? | Ação |
|------|------------|--------|------|
| usePublicContactForms | src/hooks/usePublicContactForms.ts | Seguro | useSecureClientQuery + useSecureClientMutation; queryKey clientId; validação dupla |
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

A tabela **public_opportunity_forms** já possui RLS ativo por `client_id`:

- **SELECT:** o usuário só vê registros em que existe uma linha em `core_client_users` com `id = auth.uid()` e `client_id = public_opportunity_forms.client_id`.
- **INSERT:** permitido apenas para usuários que estejam em `core_client_users` com o mesmo `client_id` do registro inserido e com `role = 'administrator'`.
- **UPDATE:** mesma regra que INSERT (administrador do cliente).
- **DELETE:** mesma regra que INSERT (administrador do cliente).

Nenhuma alteração de banco ou de políticas é feita pelos guias; as políticas devem ser mantidas manualmente. Tabelas de campos customizados (se usadas na página de formulários) também devem ter RLS por `client_id`.

## 7. Testes sugeridos

- **Unitário:** usePublicContactForms retorna apenas formulários do cliente; criação de formulário inclui client_id.
- **Página:** FormsManagementPage não exibe formulários de outro cliente.
- **Isolamento:** Dois clientes não veem/editam formulários um do outro.
