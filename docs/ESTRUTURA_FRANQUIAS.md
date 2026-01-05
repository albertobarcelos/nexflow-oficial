# Estrutura de Franquias (Unidades/Clãs)

## Hierarquia

```
Cliente (Client)
  └── Franquia (Franchise/Unit/Clã)
      └── Time (Team)
```

## Estrutura de Dados

### Tabela: `core_franchises`

Campos:
- `id` (UUID) - Identificador único
- `client_id` (UUID) - Cliente proprietário da franquia
- `name` (VARCHAR) - Nome da franquia
- `code` (VARCHAR, UNIQUE, opcional) - Código único da franquia (ex: FR001, SP01)
- `description` (TEXT, opcional) - Descrição da franquia
- `is_active` (BOOLEAN) - Status ativo/inativo
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### Tabela: `core_teams` (atualizada)

Novo campo:
- `franchise_id` (UUID, opcional) - Franquia à qual o time pertence

## Casos de Uso

1. **Limitar Visualizações**: Usuários só veem times da sua franquia
2. **Relatórios**: Extrair relatórios por franquia
3. **Organização**: Estrutura hierárquica clara

## Políticas RLS

- Administradores podem gerenciar franquias de qualquer cliente
- Usuários podem visualizar franquias do seu cliente

## Próximos Passos

1. ✅ Criar tabela `core_franchises`
2. ✅ Adicionar `franchise_id` em `core_teams`
3. ⏳ Adicionar tipos TypeScript
4. ⏳ Criar hooks para gerenciar franquias
5. ⏳ Atualizar UI para criar/editar franquias
6. ⏳ Atualizar UI de times para selecionar franquia
7. ⏳ Implementar filtros por franquia
