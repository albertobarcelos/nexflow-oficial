# Interface de Configuração de Times, Usuários e Níveis

## 📋 Visão Geral

Interface completa para gerenciar a estrutura hierárquica dos times, incluindo:
- **Níveis do Time**: Configuração de níveis hierárquicos (1, 2, 3, 4, 5...) com percentuais de comissão
- **Membros do Time**: Gerenciamento de usuários e atribuição de níveis
- **Organização**: Interface clara e intuitiva para configurar toda a estrutura

---

## 🏗️ Estrutura Criada

### 1. Hooks

#### `useTeamLevels.ts`
Hook para gerenciar níveis do time:
- `useTeamLevels(teamId)`: Buscar níveis de um time
- `useCreateTeamLevel()`: Criar novo nível
- `useUpdateTeamLevel()`: Atualizar nível existente
- `useDeleteTeamLevel()`: Deletar nível
- `useReorderTeamLevels()`: Reordenar níveis (atualizar level_order)

#### `useTeamMemberLevels.ts`
Hook para gerenciar membros e seus níveis:
- `useTeamMemberLevels(teamMemberId)`: Buscar histórico de níveis de um membro
- `useTeamMembersWithLevels(teamId)`: Buscar membros do time com seus níveis atuais
- `useAssignLevelToMember()`: Atribuir nível a um membro
- `useRemoveLevelFromMember()`: Remover nível de um membro (finalizar)

---

### 2. Componentes

#### `TeamLevelsManager.tsx`
Componente para gerenciar níveis do time:
- Lista todos os níveis do time
- Criar, editar e deletar níveis
- Reordenar níveis (mover para cima/baixo)
- Configurar percentuais de comissão (one_time e recurring)
- Visualizar ordem hierárquica

**Funcionalidades:**
- Tabela com todos os níveis
- Dialog para criar/editar nível
- Confirmação antes de deletar
- Validação de percentuais (0-100%)

#### `TeamMembersAndLevelsManager.tsx`
Componente para gerenciar membros e atribuir níveis:
- Lista todos os membros do time
- Mostra nível atual de cada membro
- Atribuir/alterar nível de um membro
- Remover nível de um membro
- Adicionar novos membros ao time

**Funcionalidades:**
- Tabela com membros e seus níveis
- Select para atribuir/alterar nível
- Botão para remover nível
- Dialog para adicionar membro

#### `AddTeamMemberDialog.tsx`
Dialog para adicionar membro ao time:
- Selecionar usuário disponível
- Selecionar papel no time (admin, leader, member, ec, ev, sdr, ep)
- Validação de usuário já no time

#### `TeamConfigurationPage.tsx`
Página principal que integra tudo:
- Seleção de time
- Abas para "Níveis do Time" e "Membros e Níveis"
- Interface organizada e clara

---

## 🎯 Fluxo de Uso

### 1. Configurar Níveis do Time

1. Acessar aba **"Configuração"** na página de Usuários
2. Selecionar um time
3. Ir para aba **"Níveis do Time"**
4. Clicar em **"Novo Nível"**
5. Preencher:
   - Nome do nível (ex: "Nível 1", "Líder", "Sênior")
   - Ordem (1 = mais alto)
   - % Comissão Implantação (one_time)
   - % Comissão Mensalidade (recurring)
   - Descrição (opcional)
6. Salvar

**Exemplo:**
- Nome: "Nível 1"
- Ordem: 1
- Implantação: 20%
- Mensalidade: 8%

### 2. Adicionar Membros ao Time

1. Na aba **"Membros e Níveis"**
2. Clicar em **"Adicionar Membro"**
3. Selecionar usuário
4. Selecionar papel (EC, EV, SDR, EP, etc.)
5. Salvar

### 3. Atribuir Níveis aos Membros

1. Na aba **"Membros e Níveis"**
2. Para cada membro, usar o **Select** para atribuir nível
3. O membro receberá o nível selecionado
4. Para remover nível, clicar no botão de remover

**Observação:** Quando um novo nível é atribuído, o nível anterior é automaticamente finalizado (effective_to é preenchido).

---

## 📊 Estrutura de Dados

### Níveis do Time (`core_team_levels`)

```typescript
{
  id: string;
  team_id: string;
  name: string; // "Nível 1", "Líder", etc.
  level_order: number; // 1 = mais alto
  commission_one_time_percentage: number; // Para billing_type = 'one_time'
  commission_recurring_percentage: number; // Para billing_type = 'recurring'
  description: string | null;
  is_active: boolean;
  client_id: string;
}
```

### Membros e Níveis (`core_team_member_levels`)

```typescript
{
  id: string;
  team_member_id: string;
  team_level_id: string;
  effective_from: string; // Data de início
  effective_to: string | null; // NULL = nível atual
  client_id: string;
}
```

---

## ✅ Validações

1. **Níveis:**
   - Nome obrigatório
   - Ordem deve ser número positivo
   - Percentuais entre 0 e 100%
   - Não pode ter dois níveis com mesma ordem

2. **Membros:**
   - Usuário não pode estar duplicado no time
   - Papel deve ser válido (admin, leader, member, ec, ev, sdr, ep)

3. **Atribuição de Níveis:**
   - Nível deve existir no time
   - Quando atribuir novo nível, o anterior é finalizado automaticamente

---

## 🎨 Interface

### Aba "Níveis do Time"

- Tabela com colunas:
  - Ordem
  - Nome
  - % Implantação
  - % Mensalidade
  - Status
  - Ações (Editar, Deletar)

- Botão "Novo Nível" no topo

### Aba "Membros e Níveis"

- Tabela com colunas:
  - Membro (avatar + nome)
  - Papel no Time
  - Nível Atual
  - Comissão (mostra % de implantação e mensalidade do nível)
  - Ações (Select para atribuir/alterar nível, botão para remover)

- Botão "Adicionar Membro" no topo

---

## 🔄 Próximos Passos

1. ✅ Interface de configuração criada
2. ⏳ Testar interface e corrigir bugs
3. ⏳ Criar interface para configurar comissões por item
4. ⏳ Integrar com cálculo de comissões

---

**Última atualização:** 2025-01-27
