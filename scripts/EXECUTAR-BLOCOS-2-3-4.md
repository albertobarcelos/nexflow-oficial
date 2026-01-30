# Execução dos blocos 2, 3 e 4 (INSERT em public.cards)

O bloco 1 já foi executado com sucesso via MCP. Para concluir a importação do CSV:

## Via Supabase SQL Editor

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → **SQL Editor**.
2. Execute **na ordem**:
   - Cole o conteúdo de `scripts/stmt2.sql` → Run.
   - Cole o conteúdo de `scripts/stmt3.sql` → Run.
   - Cole o conteúdo de `scripts/stmt4_fixed.sql` → Run.

## Via MCP user-supabase (execute_sql)

Se você usa o MCP Supabase no Cursor/outro ambiente:

- **Bloco 2:** `arguments` = conteúdo de `mcp-stmt2.json` (chave `query`).
- **Bloco 3:** `arguments` = conteúdo de `mcp-stmt3.json` (chave `query`).
- **Bloco 4:** `arguments` = conteúdo de `mcp-stmt4_fixed.json` (chave `query`).

Cada arquivo `mcp-stmtN.json` já contém `{"query": "<SQL do bloco N>"}` pronto para a ferramenta `execute_sql`.

## Arquivos

| Bloco | SQL | JSON (para MCP) |
|-------|-----|-----------------|
| 2     | `scripts/stmt2.sql`       | `mcp-stmt2.json` (na raiz do projeto) |
| 3     | `scripts/stmt3.sql`       | `mcp-stmt3.json` |
| 4     | `scripts/stmt4_fixed.sql` | `mcp-stmt4_fixed.json` |

Após rodar os três blocos, a importação do CSV em `public.cards` estará concluída.
