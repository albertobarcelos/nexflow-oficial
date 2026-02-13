# Bug: Ícones do card somem ao atualizar pontos

## Descrição do problema

Ao adicionar ou alterar os pontos (chamas/strikes) de um card no Nexflow, os ícones do rodapé do card no board (contato, empresa, setas de hierarquia, etc.) desapareciam. Os ícones só voltavam após dar F5 na página.

**Onde ocorria:** componente `KanbanCardPreview`, na área do rodapé que exibe indicadores (possui card pai, possui filhos, contato, empresa, produto/valor, chamas/strikes, checklist, tempo desde última movimentação).

## Causa raiz

1. **Resposta da API incompleta**  
   A Edge Function `update-nexflow-card` retornava um objeto `card` mapeado para o frontend **sem** os campos `contactId`, `companyId` e `indicationId`. O `.select('*')` do Supabase trazia esses dados do banco, mas o `mappedCard` enviado na resposta não os incluía.

2. **Substituição total do card no cache**  
   No hook `useNexflowCardsInfinite`, no `onSuccess` da mutação de atualização de card, o cache era atualizado **substituindo** o card pelo `result.card` retornado pela API. Como esse objeto não tinha `contactId` nem `companyId`, o card no cache passava a tê-los como `undefined`/`null`.

3. **Preview dependia desses campos**  
   O `KanbanCardPreview` decide se mostra cada ícone com base em `card.contactId`, `card.companyId`, `card.parentCardId`, etc. Com esses campos vazios após o update, as condições ficavam falsas e os ícones deixavam de ser renderizados.

## Evidência (debug)

- Log no `onSuccess`: `result.card` tinha `hasContactId: false` e `contactId: null`.
- Log no preview: antes do update o card tinha `contactId` preenchido; logo após o `onSuccess`, o preview recebia o mesmo card com `contactId: null`.

## Correção aplicada

### 1. Edge Function `update-nexflow-card`

No mapeamento da resposta (`mappedCard`), foram incluídos os campos que faltavam, usando o row retornado pelo `.select('*')`:

- `contactId`: `(updatedCard as { contact_id?: string | null }).contact_id ?? null`
- `companyId`: `(updatedCard as { company_id?: string | null }).company_id ?? null`
- `indicationId`: `(updatedCard as { indication_id?: string | null }).indication_id ?? null`

Assim, a API passa a devolver um card completo para o frontend.

### 2. Hook `useNexflowCardsInfinite`

- **Mapeamento do card no frontend:** ao montar `updatedCard` a partir de `data.card`, foram adicionados `contactId`, `companyId` e `indicationId` (com fallback `?? null`), para que o tipo `NexflowCard` e o cache fiquem alinhados com a API.

- **Merge defensivo no `onSuccess`:** ao atualizar o cache com o card retornado pelo servidor, o card é **mesclado** com o card anterior (do cache) para os campos que podem não vir na resposta (ex.: versão antiga da Edge Function ou resposta parcial):
  - `contactId`: usa o da API se existir; senão mantém o do card anterior.
  - `companyId`: idem.
  - `indicationId`: idem.

Assim, mesmo sem redeploy da Edge Function, o cache preserva `contactId`/`companyId`/`indicationId` e os ícones continuam visíveis após atualizar pontos.

## Arquivos alterados

| Arquivo | Alteração |
|--------|-----------|
| `supabase/functions/update-nexflow-card/index.ts` | Inclusão de `contactId`, `companyId` e `indicationId` em `mappedCard`. |
| `src/hooks/useNexflowCardsInfinite.ts` | Inclusão dos mesmos campos no `updatedCard` construído a partir de `data.card` e merge defensivo no `onSuccess` ao escrever no cache. |

## Resumo

- **Bug:** ícones do rodapé do card sumiam ao atualizar pontos e só voltavam com F5.
- **Causa:** a resposta da atualização não trazia `contactId`/`companyId`/`indicationId`, e o cache substituía o card inteiro por essa resposta incompleta.
- **Correção:** (1) API passa a retornar esses campos no `card`; (2) frontend mapeia e inclui no tipo; (3) no `onSuccess`, o card no cache é atualizado em merge com o anterior para preservar esses campos quando a API não os enviar.
