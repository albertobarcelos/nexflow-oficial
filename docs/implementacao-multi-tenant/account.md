# Guia Multi-Tenant: Conta / Perfil

## 1. Objetivo da tela

Exibir e editar o perfil da conta do usuário (AccountProfile), com dados do cliente/organização ao qual está vinculado.

## 2. Checklist de segurança

- [x] Usar **useClientAccessGuard()** quando a tela exibir dados do cliente
- [x] Incluir **client_id** em query keys quando os dados forem por cliente (useAccountProfile: `['account-profile', clientId, userId]`)
- [x] Validar que dados do perfil/cliente pertencem ao usuário atual (validação `data.client_id === clientId` no hook)
- [x] Log de auditoria ao acessar perfil (`[AUDIT] Perfil da conta - Client: ...`)
- [ ] Testar que um usuário não vê/altera perfil de outro cliente

## 3. Hooks utilizados

| Hook | Onde está | Seguro? | Ação |
|------|------------|--------|------|
| useAccountProfile | src/hooks/useAccountProfile.ts | Seguro | queryKey clientId + userId; validação client_id; auditoria; useQuery |

**Páginas cobertas:** AccountProfilePage.

## 4. Implementação passo a passo

1. **useClientAccessGuard**
   - Em AccountProfile: useClientAccessGuard() para garantir contexto do cliente carregado; se a tela mostrar dados da organização (cliente), não exibir dados sensíveis sem hasAccess.

2. **Query keys**
   - Perfil do usuário: pode usar `['account-profile', userId]` — o dado deve vir de core_client_users e já está vinculado ao usuário; para dados da organização, usar `['account-profile', clientId]` ou incluir clientId na key.

3. **Leitura**
   - useAccountProfile: garantir que busca apenas o usuário autenticado e seu client_id (getCurrentUserWithClient ou equivalente); não expor dados de outros clientes.

4. **Mutações**
   - Atualização de perfil: garantir que só atualiza o registro do usuário atual (e que RLS restringe por user id / client_id).

5. **Validação**
   - Validar que organizationId/client_id retornado é o mesmo do currentClient ou do getCurrentClientId().

6. **Auditoria**
   - `[AUDIT] Perfil da conta - Client: ...`.

## 5. Query keys recomendadas

- `['account-profile', userId]` (dados do usuário; RLS garante escopo)
- `['user-client', userId]` (client_id do usuário; usado em UsersPage e pode ser reutilizado)

## 6. RLS

core_client_users e core_clients: usuário só acessa seu próprio registro e o cliente ao qual está vinculado. **Não alterar banco.**

Resumo das políticas consultadas (somente leitura):

- **core_client_users:** SELECT permitido quando `id = auth.uid()` OU `is_administrator()` OU (`is_user_active()` E `client_id = get_my_client_id_safe()`); UPDATE quando `is_administrator()` OU `id = auth.uid()`.
- **core_clients:** acesso via reseller (`reseller_id` em `core_reseller_users`) ou quando o usuário é administrador em `core_client_users`; usuário comum acessa apenas via JOIN na própria linha de `core_client_users`.

## 7. Testes sugeridos

- **Unitário:** useAccountProfile retorna apenas dados do usuário atual e do seu client_id.
- **Página:** AccountProfile não exibe dados de outro cliente ou de outro usuário.
- **Isolamento:** Usuário A do cliente 1 não vê dados do cliente 2 no perfil.
