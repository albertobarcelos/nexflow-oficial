# Plano de Implementação: Correção de Bug de Carregamento ao Trocar de Aba

## Visão Geral

Este documento descreve o plano para aplicar as correções validadas nas rotas de **Hunters** e **Contatos** em todas as outras rotas da aplicação que apresentam o mesmo problema: dados param de carregar quando o usuário troca de aba e retorna.

## Problema Identificado

Quando o usuário troca de aba do navegador e retorna:
- Estado de acesso (`hasAccess`) é resetado
- Permissões são re-verificadas desnecessariamente
- Queries React Query ficam desabilitadas durante re-verificações
- Dados param de carregar

## Soluções Validadas

### ✅ Rotas que já funcionam
- `src/pages/crm/contacts/ContactsPage.tsx`
- `src/pages/crm/hunters/HuntersPage.tsx`
- `src/pages/crm/ContactsList.tsx`

### ✅ Hooks corrigidos
- `src/hooks/useOpportunities.ts`
- `src/hooks/useHuntersAccess.ts`

## Padrões de Correção

### Padrão 1: Persistência de Estado de Acesso em Páginas

**Quando aplicar:** Páginas que verificam acesso com `useState` e `useEffect`

**Arquivos de referência:**
- `src/pages/crm/contacts/ContactsPage.tsx` (linhas 19-27, 49-54, 96-98)
- `src/pages/crm/hunters/HuntersPage.tsx` (linhas 14-19, 26-32, 119-122)

**Passos:**

1. **Modificar inicialização do estado `hasAccess`:**
   ```typescript
   // ANTES:
   const [hasAccess, setHasAccess] = useState(false);
   
   // DEPOIS:
   const [hasAccess, setHasAccess] = useState(() => {
     const stored = sessionStorage.getItem('{page-name}-has-access');
     return stored === 'true';
   });
   ```

2. **Ajustar estado de loading:**
   ```typescript
   // ANTES:
   const [loading, setLoading] = useState(true);
   
   // DEPOIS:
   const [loading, setLoading] = useState(!hasAccess);
   ```

3. **Adicionar early return no useEffect de verificação:**
   ```typescript
   useEffect(() => {
     // Adicionar no início do useEffect
     if (hasAccess) {
       setLoading(false);
       return;
     }
     
     // ... resto da verificação de acesso
   }, [hasAccess, navigate, toast]); // Adicionar hasAccess nas dependências
   ```

4. **Salvar estado quando acesso é confirmado:**
   ```typescript
   // Dentro da função checkAccess, quando todas as validações passam:
   setHasAccess(true);
   sessionStorage.setItem('{page-name}-has-access', 'true');
   ```

5. **Salvar estado quando acesso é negado (opcional, para limpar cache):**
   ```typescript
   // Quando acesso é negado:
   setHasAccess(false);
   sessionStorage.setItem('{page-name}-has-access', 'false');
   ```

**Exemplo completo:**
```typescript
export function MinhaPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 1. Carregar estado inicial do sessionStorage
  const [hasAccess, setHasAccess] = useState(() => {
    const stored = sessionStorage.getItem('minha-page-has-access');
    return stored === 'true';
  });
  
  // 2. Inicializar loading baseado no estado carregado
  const [loading, setLoading] = useState(!hasAccess);
  
  useEffect(() => {
    // 3. Pular verificação se já tem acesso
    if (hasAccess) {
      setLoading(false);
      return;
    }
    
    const checkAccess = async () => {
      try {
        // ... verificação de acesso ...
        
        // 4. Salvar quando acesso confirmado
        setHasAccess(true);
        sessionStorage.setItem('minha-page-has-access', 'true');
      } catch (error) {
        // ... tratamento de erro ...
        setHasAccess(false);
        sessionStorage.setItem('minha-page-has-access', 'false');
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [hasAccess, navigate, toast]);
  
  // ... resto do componente
}
```

### Padrão 2: Persistência de Permissões em Hooks

**Quando aplicar:** Hooks que verificam permissões e podem resetar estado

**Arquivos de referência:**
- `src/hooks/useOpportunities.ts` (linhas 68-97, 121-129, 196-206)
- `src/hooks/useHuntersAccess.ts` (linhas 13-19, 26-32, 76-81)

**Passos:**

1. **Criar função para carregar do sessionStorage:**
   ```typescript
   const loadPermissionsFromStorage = (): PermissionType => {
     try {
       const stored = sessionStorage.getItem('{hook-name}-permissions');
       if (stored) {
         const parsed = JSON.parse(stored);
         const storedTimestamp = sessionStorage.getItem('{hook-name}-permissions-timestamp');
         if (storedTimestamp) {
           const age = Date.now() - parseInt(storedTimestamp, 10);
           if (age < 60 * 60 * 1000) { // 1 hora
             return parsed;
           }
         }
       }
     } catch (e) {
       // Ignore errors
     }
     return defaultPermissions;
   };
   ```

2. **Inicializar estado do storage:**
   ```typescript
   const [userPermissions, setUserPermissions] = useState(loadPermissionsFromStorage);
   const [isLoadingPermissions, setIsLoadingPermissions] = useState(() => {
     const stored = loadPermissionsFromStorage();
     return !isValid(stored); // isValid verifica se tem dados válidos
   });
   ```

3. **Usar ref para rastrear se já foi carregado:**
   ```typescript
   const hasLoadedPermissionsRef = useRef(isValid(loadPermissionsFromStorage()));
   ```

4. **Pular re-verificação se já tem permissões válidas:**
   ```typescript
   useEffect(() => {
     const hasValidPermissions = isValid(userPermissions);
     if (enabled && hasValidPermissions && hasLoadedPermissionsRef.current) {
       return; // Skip re-checking
     }
     
     const checkPermissions = async () => {
       // ... verificação de permissões ...
       
       // 5. Salvar quando confirmado
       setUserPermissions(newPermissions);
       sessionStorage.setItem('{hook-name}-permissions', JSON.stringify(newPermissions));
       sessionStorage.setItem('{hook-name}-permissions-timestamp', Date.now().toString());
       hasLoadedPermissionsRef.current = true;
     };
     
     if (enabled) {
       if (!hasValidPermissions) {
         setIsLoadingPermissions(true);
       }
       checkPermissions();
     }
   }, [enabled, userPermissions]);
   ```

**Exemplo completo:**
```typescript
export function useMinhasPermissoes() {
  const loadPermissionsFromStorage = (): Permissions => {
    try {
      const stored = sessionStorage.getItem('useMinhasPermissoes-permissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        const timestamp = sessionStorage.getItem('useMinhasPermissoes-permissions-timestamp');
        if (timestamp) {
          const age = Date.now() - parseInt(timestamp, 10);
          if (age < 60 * 60 * 1000) {
            return parsed;
          }
        }
      }
    } catch (e) {}
    return { hasAccess: false, role: null };
  };
  
  const [permissions, setPermissions] = useState(loadPermissionsFromStorage);
  const [isLoading, setIsLoading] = useState(() => !permissions.hasAccess);
  const hasLoadedRef = useRef(permissions.hasAccess);
  
  useEffect(() => {
    if (permissions.hasAccess && hasLoadedRef.current) {
      setIsLoading(false);
      return;
    }
    
    const checkPermissions = async () => {
      // ... verificação ...
      const newPermissions = { hasAccess: true, role: 'admin' };
      setPermissions(newPermissions);
      sessionStorage.setItem('useMinhasPermissoes-permissions', JSON.stringify(newPermissions));
      sessionStorage.setItem('useMinhasPermissoes-permissions-timestamp', Date.now().toString());
      hasLoadedRef.current = true;
    };
    
    checkPermissions();
  }, [permissions]);
  
  return { permissions, isLoading };
}
```

### Padrão 3: Desabilitar refetchOnWindowFocus em Queries

**Quando aplicar:** Todos os hooks com `useQuery` ou `useInfiniteQuery`

**Passos:**

1. **Adicionar `refetchOnWindowFocus: false` em cada query:**
   ```typescript
   const query = useQuery({
     queryKey: ['...'],
     queryFn: async () => { ... },
     staleTime: 1000 * 30,
     refetchOnWindowFocus: false, // Fix: Disable auto refetch, rely on soft reload
   });
   ```

**Nota:** O QueryClient padrão em `src/main.tsx` já tem `refetchOnWindowFocus: false`, mas é recomendado adicionar explicitamente em cada query para clareza.

## Rotas que Precisam de Correção

### Prioridade Alta

#### 1. Páginas de Configurações
- [ ] `src/pages/crm/configurations/UsersPage.tsx`
- [ ] `src/pages/crm/configurations/TeamsPage.tsx`
- [ ] `src/pages/crm/configurations/UnitsPage.tsx`
- [ ] `src/pages/crm/configurations/ItemsPage.tsx`

**Verificar:** Se têm verificação de acesso própria

#### 2. Páginas de Flows
- [ ] `src/pages/crm/flows/FlowsPage.tsx` - Verificar se precisa de persistência adicional
- [ ] `src/pages/crm/flows/NexflowBuilderPage.tsx` - Verificar verificação de acesso
- [ ] `src/pages/crm/flows/NexflowBoardPage.tsx` - Já usa hooks corrigidos, verificar se precisa mais

#### 3. Páginas de Settings
- [ ] `src/pages/crm/settings/Settings.tsx`
- [ ] `src/pages/crm/account/AccountProfile.tsx` - Verificar se queries precisam de correção

### Prioridade Média

#### 4. Outros Hooks de Permissões
- [ ] Verificar outros hooks que verificam permissões e podem precisar de persistência

#### 5. Queries sem refetchOnWindowFocus
- [ ] Verificar todos os hooks com `useQuery` que ainda não têm `refetchOnWindowFocus: false`

## Checklist de Implementação

Para cada rota/hook que precisa de correção:

### Para Páginas:
- [ ] Identificar se tem verificação de acesso com `useState` e `useEffect`
- [ ] Aplicar Padrão 1 (Persistência de Estado de Acesso)
- [ ] Testar: trocar de aba, voltar, verificar se dados carregam
- [ ] Verificar se queries usadas têm `refetchOnWindowFocus: false`

### Para Hooks:
- [ ] Identificar se verifica permissões e pode resetar estado
- [ ] Aplicar Padrão 2 (Persistência de Permissões)
- [ ] Verificar se queries têm `refetchOnWindowFocus: false`
- [ ] Testar em páginas que usam o hook

### Para Queries:
- [ ] Adicionar `refetchOnWindowFocus: false` em todas as queries
- [ ] Verificar se não quebra funcionalidade existente

## Ordem de Implementação Recomendada

1. **Fase 1: Páginas de Configurações** (mais críticas, usadas frequentemente)
   - UsersPage
   - TeamsPage
   - UnitsPage
   - ItemsPage

2. **Fase 2: Páginas de Flows** (funcionalidade core)
   - FlowsPage
   - NexflowBuilderPage
   - NexflowBoardPage

3. **Fase 3: Páginas de Settings** (menos críticas)
   - Settings
   - AccountProfile

4. **Fase 4: Outros Hooks** (se necessário)
   - Verificar e corrigir hooks adicionais

5. **Fase 5: Queries Restantes** (garantir consistência)
   - Adicionar `refetchOnWindowFocus: false` em todas as queries

## Testes

Para cada correção aplicada:

1. **Teste básico:**
   - Abrir a página/rota
   - Aguardar dados carregarem
   - Trocar para outra aba
   - Aguardar 5-10 segundos
   - Voltar para a aba
   - Verificar se dados continuam carregando

2. **Teste de persistência:**
   - Abrir a página
   - Verificar acesso/permissões
   - Fechar e reabrir a página (sem trocar de aba)
   - Verificar se estado é mantido

3. **Teste de expiração:**
   - Modificar timestamp no sessionStorage para mais de 1 hora atrás
   - Recarregar página
   - Verificar se re-verifica permissões

## Validação

Após implementar todas as correções:

- [ ] Todas as rotas listadas foram corrigidas
- [ ] Testes básicos passaram em todas as rotas
- [ ] Não há regressões (funcionalidades quebradas)
- [ ] Logs de debug foram removidos (se aplicável)
- [ ] Documentação atualizada

## Notas Importantes

1. **Nomes de chaves no sessionStorage:**
   - Use padrão: `{page-name}-has-access` para páginas
   - Use padrão: `{hook-name}-permissions` para hooks
   - Seja consistente com nomes

2. **Validade do cache:**
   - Permissões: 1 hora (60 * 60 * 1000 ms)
   - Acesso: sem expiração (mas pode ser limpo manualmente)

3. **Soft Reload:**
   - Já implementado em `src/main.tsx`
   - Não precisa modificar, apenas garantir que queries não têm `refetchOnWindowFocus: true`

4. **Compatibilidade:**
   - Verificar se `sessionStorage` está disponível (navegador)
   - Tratar erros de storage graciosamente

## Exemplo de Nomenclatura

### Páginas:
- `contacts-page-has-access`
- `hunters-page-has-access`
- `users-page-has-access`
- `teams-page-has-access`

### Hooks:
- `useOpportunities-permissions`
- `useHuntersAccess-has-access`
- `useFlowPermissions-permissions`

## Referências

- **Arquivos corrigidos e validados:**
  - `src/pages/crm/contacts/ContactsPage.tsx`
  - `src/pages/crm/hunters/HuntersPage.tsx`
  - `src/pages/crm/ContactsList.tsx`
  - `src/hooks/useOpportunities.ts`
  - `src/hooks/useHuntersAccess.ts`

- **Infraestrutura:**
  - `src/main.tsx` (componente `SoftReloadOnFocus`)

## Próximos Passos

1. Revisar este plano
2. Priorizar rotas para correção
3. Implementar correções seguindo os padrões
4. Testar cada correção
5. Validar todas as rotas
6. Remover logs de debug (se aplicável)
7. Atualizar documentação

