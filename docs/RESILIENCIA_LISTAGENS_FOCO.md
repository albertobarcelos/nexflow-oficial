# Resiliência de listagens ao trocar aba/foco

Este documento descreve as configurações e padrões adotados no projeto para evitar que listagens e dados parem de funcionar quando o usuário troca de aba do navegador ou de abas internas (Tabs) da aplicação.

## Problema

- **Perda de foco da aba do navegador:** o navegador reduz a execução de timers em abas em segundo plano; o Realtime do Supabase depende de heartbeats; a conexão pode cair de forma silenciosa. Ao voltar, refetches em massa podem falhar se o cliente Supabase estiver em falha.
- **Troca de aba interna (Radix Tabs):** por padrão o `TabsContent` desmonta o conteúdo da aba inativa. Ao trocar de aba (ex.: Informações ↔ Processos no detalhe do card), as listagens são desmontadas; ao voltar, remontam e disparam nova busca — que pode falhar se a rede estiver em pausa.

## Soluções implementadas

### 1. Supabase Realtime: worker + heartbeatCallback

**Arquivo:** `src/lib/supabase.ts`

- **`worker: true`** — os heartbeats do Realtime rodam em Web Worker, reduzindo o impacto do throttling da aba em segundo plano (ver [Realtime - Silent Disconnections](https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794)).
- **`heartbeatCallback`** — quando o status é `'disconnected'`, o cliente chama `supabase.realtime.connect()` para tentar reconectar explicitamente.

### 2. TanStack Query: defaults e SoftReloadOnFocus

**Arquivo:** `src/main.tsx`

- **defaultOptions.queries:**
  - **staleTime:** 5 minutos — evita que todo refocus considere os dados imediatamente obsoletos e dispare refetch em massa.
  - **gcTime:** 30 minutos (antigo cacheTime) — mantém dados no cache por mais tempo.
  - **refetchOnWindowFocus:** true — com staleTime > 0, só refetch quando os dados estiverem stale após voltar o foco.
  - **retry:** 3 tentativas com **retryDelay** em backoff exponencial (até 30s).
- **SoftReloadOnFocus:** ao voltar o foco da aba, apenas **refetch** das queries ativas (`refetchQueries({ type: 'active' })`), sem invalidar todas as queries em massa, reduzindo pico de falhas e dando tempo ao Realtime para reconectar.

### 3. Persistência de Tabs com forceMount

Para evitar desmontar conteúdo de abas que contêm listagens:

- **CardDetailsSidebar** (`src/features/nexflow/card-details/components/CardDetailsSidebar.tsx`): os dois `TabsContent` (informacoes e processos) usam **forceMount** e **className** com **data-[state=inactive]:hidden** — o conteúdo permanece no DOM, apenas oculto por CSS quando a aba está inativa.
- **NotificationBell** (`src/components/crm/notifications/NotificationBell.tsx`): `TabsContent` "Novas" e "Lidas" com o mesmo padrão.
- **ContactDetailsPanel** (`src/components/crm/contacts/ContactDetailsPanel.tsx`): abas Informações, Empresas e Histórico com forceMount + data-[state=inactive]:hidden.

Padrão: `<TabsContent value="..." forceMount className="... data-[state=inactive]:hidden">`.

### 4. Inscrições Realtime (useEffect)

- **useNotifications:** o canal era criado dentro de uma função async; no cleanup, o canal podia ainda ser null (race). Foi corrigido com **useRef** para o canal e flag **cancelled**: o cleanup remove o canal da ref; se o setup async terminar após o cleanup, o canal recém-criado é removido e não é atribuído à ref.
- **Demais hooks** (useCardActivities, useCardMessages, useCardAttachments, useDashboardStats, useRecentActivities, CollaboratorsList): o canal é criado de forma síncrona no useEffect e removido no return; ao mudar dependências (ex.: cardId), o cleanup remove o canal anterior. Nenhuma alteração necessária.

### 5. Indicadores de rede pausada (opcional)

Não implementado nesta fase. Em componentes que renderizam listagens críticas, pode-se expor **isPaused** e/ou **fetchStatus === 'paused'** do `useQuery`/`useInfiniteQuery` e mostrar um aviso ("Offline — dados podem estar desatualizados") com botão "Tentar novamente" que chama `refetch()`.

## Restrições

- Nenhuma alteração em tabelas do banco; apenas configuração do cliente Supabase, QueryClient, componentes UI e hooks.
- Regras de banco não foram alteradas; apenas regras de negócio no código (quando reconectar, quando refetch).
