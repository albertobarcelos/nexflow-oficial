# Estrutura de Níveis Globais e Configuração de Times

## 🎯 Nova Lógica

### 1. Níveis Globais (Aba "Configuração")
- Níveis são **globais**, não específicos por time
- Definir critérios para subir/descer de nível automaticamente
- Cada nível tem percentuais de comissão (implantação e mensalidade)

### 2. Times
- Time tem apenas **um nível atual** (não múltiplos níveis)
- Vincular qual nível o time está atualmente

### 3. Membros do Time
- Configurar usuários vinculados ao time
- Definir papel de cada membro (EC, EV, SDR, EP, etc.)
- Definir percentual de divisão de cada membro dentro do time

---

## 📊 Estrutura de Banco de Dados

### `core_team_levels` (Níveis Globais)
```sql
- id
- name (ex: "Nível 1", "Nível 2")
- level_order (1 = mais alto)
- commission_one_time_percentage
- commission_recurring_percentage
- promotion_criteria (JSONB) - Critérios para subir de nível
- demotion_criteria (JSONB) - Critérios para descer de nível
- client_id (NULL = global, ou específico de cliente)
```

### `core_teams` (Times)
```sql
- id
- name
- current_level_id (FK para core_team_levels) - Nível atual do time
- client_id
```

### `core_team_members` (Membros)
```sql
- id
- team_id
- user_profile_id
- role (EC, EV, SDR, EP, etc.)
- division_percentage (DECIMAL) - % de divisão dentro do time
```

---

## 🔄 Fluxo

1. **Configuração** → Criar níveis globais com critérios
2. **Times** → Vincular nível atual do time
3. **Times → Editar** → Configurar membros com papéis e percentuais
