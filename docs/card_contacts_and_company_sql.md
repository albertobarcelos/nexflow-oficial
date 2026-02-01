# SQL para Contatos múltiplos e Empresa no Card

Este documento contém o SQL das migrações aplicadas no Supabase para habilitar **múltiplos contatos** e **empresa** no card (CardDetails).

**Status:** As migrações `create_card_contacts_table` e `add_company_id_to_cards` foram aplicadas via MCP Supabase. Os tipos TypeScript foram regenerados e o `src/types/database.ts` está atualizado.

---

## 1. Tabela `card_contacts` (N:N card ↔ contatos)

Permite vincular **mais de um contato** a um card. Os contatos vêm da tabela `contacts` (filtrados por `client_id`).

```sql
-- Tabela de junção card ↔ contatos (N:N)
CREATE TABLE IF NOT EXISTS public.card_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.core_clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(card_id, contact_id)
);

-- Índices para consultas
CREATE INDEX IF NOT EXISTS idx_card_contacts_card_id ON public.card_contacts(card_id);
CREATE INDEX IF NOT EXISTS idx_card_contacts_contact_id ON public.card_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_card_contacts_client_id ON public.card_contacts(client_id);

COMMENT ON TABLE public.card_contacts IS 'Vinculação N:N entre cards e contatos (múltiplos contatos por card)';
```

**Nota:** O campo `cards.contact_id` continua existindo e pode ser usado como "contato principal" para compatibilidade com código existente.

---

## 2. Coluna `company_id` na tabela `cards`

Permite atribuir **uma empresa** (web_companies) ao card.

```sql
-- Adiciona coluna company_id em cards (uma empresa por card)
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.web_companies(id) ON DELETE SET NULL;

-- Índice opcional para filtros por empresa
CREATE INDEX IF NOT EXISTS idx_cards_company_id ON public.cards(company_id) WHERE company_id IS NOT NULL;

COMMENT ON COLUMN public.cards.company_id IS 'Empresa (web_companies) vinculada ao card';
```

---

## 3. Após aplicar o SQL

1. **Regenerar tipos TypeScript do Supabase:**
   - Via CLI: `supabase gen types typescript --local > src/types/database.ts` (ou conforme seu fluxo)
   - Ou usar o MCP `generate_typescript_types` se configurado

2. O frontend já utiliza essas estruturas quando presentes no schema; não é necessário alterar código após a migração além da regeneração de tipos.
