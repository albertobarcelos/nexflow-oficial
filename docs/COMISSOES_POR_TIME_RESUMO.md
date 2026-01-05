# Resumo Executivo: Sistema de Comissões por Time

## 🎯 Objetivo

Implementar um sistema completo de comissões por time com as seguintes funcionalidades:

1. **Comissão por Time**: Cada time pode ter comissão definida por **%** ou **valor fixo**
2. **Divisão Interna**: A comissão do time é distribuída internamente por **percentuais**
3. **Níveis Hierárquicos**: Times possuem níveis e cada nível tem seu percentual de comissão
4. **Vinculação a Produtos**: Cada cliente fechado com item específico (ex: "XPTO") tem comissão definida pelo time e distribuída internamente

---

## 📊 Situação Atual

### 📦 Organização de Schemas

O sistema utiliza dois schemas:
- **`public`**: Tabelas core (`core_*`) e web (`web_*`) - sistema base e CRM
- **`nexflow`**: Tabelas do módulo de flows (`nexflow.*`)

**As tabelas de comissão serão criadas no schema `public`**, seguindo o padrão das tabelas relacionadas (`core_teams`, `web_deals`, etc.).

### ✅ O que já existe:

- **Estrutura de Times**: Tabelas `core_teams` e `core_team_members` já existem
- **Estrutura de Negócios**: Tabela `web_deals` com negócios/oportunidades
- **Estrutura de Produtos**: Tabela `web_products` com produtos cadastrados
- **Sistema Multi-tenant**: Isolamento por `client_id` já implementado

### ❌ O que falta:

- Sistema de níveis hierárquicos dentro dos times
- Configuração de comissões por time e produto
- Vinculação de produtos a negócios fechados
- Cálculo automático de comissões
- Distribuição de comissões entre membros
- Aprovação e pagamento de comissões

---

## 🏗️ Solução Proposta

### 1. Estrutura de Dados

#### Novas Tabelas:

1. **`core_team_levels`**: Níveis hierárquicos (Líder, Sênior, Pleno, Júnior)
   - Cada nível tem um percentual de comissão (0-100%)

2. **`core_team_member_levels`**: Vincula membros aos níveis
   - Histórico de mudanças de nível

3. **`core_team_commissions`**: Configuração de comissões
   - Por time e produto específico
   - Tipo: % ou valor fixo

4. **`web_deal_items`**: Itens vendidos em um negócio
   - Produtos, quantidades, preços

5. **`core_commission_calculations`**: Cálculos de comissão
   - Registro de cada cálculo realizado

6. **`core_commission_distributions`**: Distribuição entre membros
   - Quanto cada membro recebe

### 2. Fluxo de Funcionamento

```
1. Cliente fecha negócio (status "won")
   ↓
2. Sistema identifica itens do negócio (produtos vendidos)
   ↓
3. Para cada item (ex: produto "XPTO"):
   ↓
4. Sistema identifica o time responsável
   ↓
5. Sistema busca comissão configurada para aquele produto
   ↓
6. Calcula comissão do time:
   - Se %: comissão = valor_total × (percentual / 100)
   - Se fixo: comissão = valor_fixo
   ↓
7. Busca membros ativos do time e seus níveis
   ↓
8. Distribui comissão internamente:
   - Cada membro recebe: comissão_time × (percentual_nível / 100)
   ↓
9. Registra cálculos e distribuições
   ↓
10. Aguarda aprovação e pagamento
```

### 3. Exemplo Prático

**Cenário:**
- Time "Vendas Premium" fecha negócio de R$ 10.000,00
- Produto vendido: "XPTO"
- Comissão configurada: 5% (R$ 500,00 para o time)

**Membros do Time:**
- Líder (João): Nível 1, 40% → R$ 200,00
- Sênior (Maria): Nível 2, 30% → R$ 150,00
- Pleno (Pedro): Nível 3, 20% → R$ 100,00
- Júnior (Ana): Nível 4, 10% → R$ 50,00

**Total distribuído:** R$ 500,00 (100%)

---

## 📋 Componentes a Desenvolver

### Backend (SQL/Migrations):
- ✅ Migrações de banco de dados (criadas)
- ⏳ Edge Functions para cálculo automático
- ⏳ Triggers para negócios fechados

### Frontend (React/TypeScript):
- ⏳ `TeamCommissionSettings`: Configurar comissões
- ⏳ `TeamLevelsManager`: Gerenciar níveis
- ⏳ `DealItemsManager`: Adicionar itens ao negócio
- ⏳ `CommissionCalculator`: Visualizar cálculos
- ⏳ `CommissionReport`: Relatórios

### Hooks (React Query):
- ⏳ `useTeamCommissions`: CRUD de comissões
- ⏳ `useTeamLevels`: CRUD de níveis
- ⏳ `useDealItems`: Gerenciar itens
- ⏳ `useCommissionCalculations`: Cálculos e aprovações

---

## 🔒 Segurança

- **Multi-tenancy**: Todas as tabelas isoladas por `client_id`
- **RLS Policies**: Políticas de segurança implementadas
- **Permissões**: Apenas administradores podem configurar
- **Auditoria**: Registro de quem aprovou/pagou

---

## 📅 Plano de Implementação

### Fase 1: Estrutura Base (Sprint 1)
- [x] Criar migrações SQL
- [x] Implementar políticas RLS
- [ ] Atualizar tipos TypeScript
- [ ] Criar hooks básicos

### Fase 2: Gestão de Configuração (Sprint 2)
- [ ] Interface de configuração de comissões
- [ ] Interface de gerenciamento de níveis
- [ ] Testes unitários

### Fase 3: Itens de Negócio (Sprint 3)
- [ ] Adicionar itens aos negócios
- [ ] Validações e integrações

### Fase 4: Cálculo Automático (Sprint 4)
- [ ] Edge Function de cálculo
- [ ] Triggers automáticos
- [ ] Validações de distribuição

### Fase 5: Aprovação e Pagamento (Sprint 5)
- [ ] Fluxo de aprovação
- [ ] Marcação de pagamento
- [ ] Notificações

### Fase 6: Relatórios (Sprint 6)
- [ ] Dashboard de comissões
- [ ] Relatórios por time/usuário
- [ ] Exportação de dados

---

## 📝 Arquivos Criados

1. **`docs/COMISSOES_POR_TIME.md`**: Documentação completa e detalhada
2. **`docs/COMISSOES_POR_TIME_RESUMO.md`**: Este resumo executivo
3. **`supabase/migrations/20250127_create_commission_system.sql`**: Migrações SQL prontas para execução

---

## ✅ Próximos Passos

1. **Revisar** a documentação completa
2. **Validar** as migrações SQL antes de executar
3. **Testar** em ambiente de desenvolvimento
4. **Implementar** os componentes frontend
5. **Criar** testes automatizados
6. **Documentar** para a equipe

---

## 🎓 Conceitos Importantes

### Comissão por Time
- Pode ser **percentual** (% do valor da venda)
- Pode ser **valor fixo** (R$ X por venda)
- Configurável por produto específico ou padrão do time

### Níveis Hierárquicos
- Cada time pode ter múltiplos níveis
- Cada nível tem um percentual de comissão
- Membros são atribuídos a níveis
- Permite estrutura organizacional flexível

### Distribuição Interna
- A comissão do time é dividida entre os membros
- Cada membro recebe conforme seu nível
- Soma dos percentuais não deve exceder 100%
- Sistema valida e alerta se necessário

---

**Data**: 2025-01-27  
**Status**: Documentação Completa ✅  
**Próxima Ação**: Revisão e Aprovação da Arquitetura
