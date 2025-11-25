<!-- b9f6c745-0eeb-4b6e-9bbd-d3a9fff0014b 65572b36-cdeb-485b-8dcd-fbc31a197b5e -->
# Refatoração da Página Flows e Correção de Salvamento

## Objetivo

Refatorar a interface da página /flows, simplificar o fluxo de criação removendo templates, e corrigir o problema crítico de salvamento de flows no Supabase.

## Implementação

### 1. Refatoração Visual da Página /flows (FlowsPage.tsx)

**Arquivo**: `src/pages/crm/flows/FlowsPage.tsx`

**Mudanças**:

- **Remover** o card gigante de criar da grid (linhas 105-114)
- **Adicionar** botão "Criar Novo Flow" no header (canto superior direito, alinhado com o título)
- **Aplicar efeito hover 3D** nos cards existentes:
  - Adicionar `transform: translateY(-5px)` no hover
  - Aumentar `box-shadow` no hover
  - Transição suave (`transition-all duration-300`)
- Manter grid apenas com cards de flows existentes

### 2. Alteração no Fluxo de Criação (Remoção de Templates)

**Arquivo**: `src/pages/crm/flows/FlowsPage.tsx`

**Mudanças**:

- **Remover** import e uso do componente `FlowTemplates`
- **Remover** estado `showTemplates`
- **Criar função** `handleCreateFlow` que:
  - Navega diretamente para `/crm/flow/new/settings` (página de criação)
  - Ou cria um flow rascunho imediatamente e redireciona para edição
- **Conectar** o novo botão "Criar Novo Flow" a esta função

### 3. Correção do Problema de Salvamento (Prioridade Alta)

**Arquivo**: `src/components/crm/flows/NewFlowSettings.tsx`

**Problema identificado**: A função `handleSaveFlow` (linha 187) pode estar falhando por:

- Campos undefined sendo enviados
- Violação de RLS (Row Level Security)
- Estrutura do payload não correspondendo à tabela `web_flows`

**Correções necessárias**:

- **Adicionar logs detalhados** no bloco catch:
  ```typescript
  console.error('❌ Erro completo ao salvar flow:', {
    error,
    flowData: { client_id, name, created_by },
    stagesCount: stages.length
  });
  ```

- **Validar payload antes de enviar**:
  - Garantir que `client_id`, `name` e `created_by` não são undefined
  - Remover campos undefined do objeto de insert
  - Verificar se `flowTitle` não está vazio
- **Verificar estrutura da tabela** `web_flows`:
  - Confirmar campos obrigatórios: `id`, `client_id`, `name`, `created_by`
  - Verificar se `description` é opcional
  - Adicionar `updated_at` se necessário
- **Melhorar tratamento de erros**:
  - Mostrar mensagem de erro mais específica
  - Logar detalhes do erro do Supabase (code, message, details)

**Arquivo adicional a verificar**: Se houver outra função de salvamento na página de edição (`FlowPage.tsx`), aplicar as mesmas correções.

## Observações

- O efeito hover 3D deve ser sutil e elegante
- O botão "Criar Novo Flow" deve seguir o padrão visual de botões primários (laranja/orange-500)
- Manter responsividade mobile
- Os logs de erro devem ser informativos mas não expor dados sensíveis

### To-dos

- [x] 