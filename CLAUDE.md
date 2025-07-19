# CLAUDE.md - Documentação Técnica do Projeto
## 📋 HISTÓRICO DE CORREÇÕES

### ✅ 2025-01-15 - Correção de Erros de Notas e Tabela Companies
**Problemas**: 
1. Erro de banco de dados: `relation "public.companies" does not exist`
2. Erro de hook: `Cannot read properties of undefined (reading 'mutateAsync')`
3. **Novo erro**: `relation "public.web_company_notes" does not exist`
4. **Erro de campos**: `Could not find the 'priority' column of 'web_company_notes' in the schema cache`
5. **Erro de edição**: Função `handleEditNote` apenas fazia `console.log` sem implementar edição real

**Causas**: 
- Referências à tabela antiga `companies` em vez de `web_companies`
- Hook `useCompanyNotes` já estava implementado corretamente, mas outras funções ainda usavam tabela antiga
- **Tabela `web_company_notes` não existia no banco de dados**
- **Hook e componentes tentando usar campos inexistentes na tabela**
- **Funcionalidade de edição não estava implementada, apenas placeholder**

**Soluções implementadas**:
1. **Correção de referências à tabela companies**:
   - `src/components/crm/partners/NewIndicationDialog.tsx`: `companies` → `web_companies`
   - `src/components/crm/companies/QuickCompanyCreate.tsx`: `companies` → `web_companies`
   - `src/hooks/usePeopleAndPartners.ts`: `companies` → `web_companies` (linha 110)
   - `src/features/companies/components/related/LinkPersonDialog.tsx`: `companies` → `web_companies`

2. **Criação da tabela web_company_notes**:
   - ✅ **Tabela criada** com estrutura completa:
     - `id` (UUID, PK)
     - `company_id` (FK para web_companies)
     - `client_id` (FK para core_clients)
     - `content` (TEXT)
     - `created_by` (FK para auth.users)
     - `created_at`, `updated_at` (timestamps)
   - ✅ **Índices** para performance otimizada
   - ✅ **RLS (Row Level Security)** implementado
   - ✅ **Políticas de segurança** para CRUD baseado em client_id
   - ✅ **Trigger** para atualização automática de updated_at

3. **Simplificação do hook useCompanyNotes**:
   - Removidos campos inexistentes: `title`, `priority`, `status`, `updated_by`
   - Mantidos apenas campos existentes: `content`, `company_id`, `client_id`, `created_by`
   - Mutations ajustadas para estrutura real da tabela

4. **Simplificação dos componentes de notas**:
   - `NotesTab` - Removidos filtros complexos, mantida ordenação por data
   - `AddNoteCard` - Removidos campos de título, prioridade e status
   - `NoteCard` - Removidos badges e campos inexistentes

5. **Implementação da edição de notas**:
   - `NotesTab` - Adicionado estado `editingNoteId` e funções `handleUpdateNote`, `handleCancelEdit`
   - `NoteCard` - Implementada edição inline com `Textarea`, estados de loading e validação
   - Botões de salvar e cancelar quando em modo de edição
   - Validação para não salvar conteúdo vazio

**Arquivos alterados**:
- `src/components/crm/partners/NewIndicationDialog.tsx`
- `src/components/crm/companies/QuickCompanyCreate.tsx`
- `src/hooks/usePeopleAndPartners.ts`
- `src/features/companies/components/related/LinkPersonDialog.tsx`
- `src/features/companies/components/details/company-popup/hooks.ts`
- `src/features/companies/components/details/company-popup/tabs/NotesTab/index.tsx`
- `src/features/companies/components/details/company-popup/components/AddNoteCard.tsx`
- `src/features/companies/components/details/company-popup/components/NoteCard.tsx`
- **Migration**: `create_web_company_notes_table` (Supabase)

**Benefícios**:
- ✅ Eliminação do erro `relation "public.companies" does not exist`
- ✅ Funcionalidade de notas totalmente operacional
- ✅ Consistência na nomenclatura de tabelas (todas com prefixo `web_`)
- ✅ Hook `useCompanyNotes` alinhado com estrutura real da tabela
- ✅ Interface limpa focada no conteúdo das notas
- ✅ Segurança implementada com RLS
- ✅ Performance otimizada com índices
- ✅ Edição inline funcional com interface intuitiva
- ✅ Funcionalidade completa de CRUD para notas

### ✅ 2025-01-15 - Correção de Warnings de Acessibilidade e Erros de Banco
**Problemas**: 
1. Warnings de acessibilidade do Radix UI Drawer
   - `Missing Description or aria-describedby={undefined} for {DialogContent}`
   - `DialogContent requires a DialogTitle for the component to be accessible for screen reader users`
2. Erros de banco de dados
   - `column core_client_users.name does not exist`
   - `Could not find a relationship between 'company_people' and 'web_people'`

**Causas**: 
1. Componente `CompanyPopup` usando `Drawer` sem elementos de acessibilidade obrigatórios
2. Consultas usando campo `name` inexistente na tabela `core_client_users`
3. Consultas usando tabela `company_people` em vez de `web_company_people`

**Soluções Implementadas**:
1. **Correção de Acessibilidade do Drawer**:
   - Adicionado `DrawerTitle` e `DrawerDescription` envolvidos em `VisuallyHidden`
   - Importações atualizadas no `CompanyPopup`
   - Mantido design visual sem alterações

2. **Correção de Consultas de Usuários**:
   - Alterado campo `name` para `first_name, last_name` em `useLocationData.ts`
   - Baseado na estrutura real da tabela `core_client_users`

3. **Correção de Relacionamentos de Tabelas**:
   - Corrigido `company_people` para `web_company_people` em:
     - `company-popup/hooks.ts`
     - `useCompanyRelationships.ts` (múltiplas consultas)

**Arquivos alterados**:
- `src/features/companies/components/details/company-popup/index.tsx`
- `src/features/companies/components/details/company-popup/hooks/useLocationData.ts`
- `src/features/companies/components/details/company-popup/hooks.ts`
- `src/features/companies/hooks/useCompanyRelationships.ts`

**Benefícios**:
- ✅ Warnings de acessibilidade eliminados
- ✅ Conformidade com WCAG para Drawer
- ✅ Consultas de usuários funcionando corretamente
- ✅ Relacionamentos de tabelas corrigidos
- ✅ Compatibilidade com screen readers mantida

**Status**: ✅ Implementado e testado

### ✅ 2025-01-15 - Correção de Erro de Importação - useMediaQuery
**Problema**: `Uncaught SyntaxError: The requested module '/src/hooks/use-media-query.ts' does not provide an export named 'useMediaQuery'`

**Causa**: Duplicação de arquivos - existiam dois arquivos:
- `src/hooks/use-media-query.ts` (vazio)
- `src/hooks/use-media-query.tsx` (com implementação)

**Solução Implementada**:
1. **Movida implementação para arquivo .ts**: Transferido o código do arquivo `.tsx` para o `.ts`
2. **Removido arquivo duplicado**: Deletado `use-media-query.tsx`
3. **Mantida exportação correta**: `export function useMediaQuery`

**Arquivos alterados**:
- `src/hooks/use-media-query.ts` (implementação movida)
- `src/hooks/use-media-query.tsx` (removido)

**Benefícios**:
- ✅ Erro de importação resolvido
- ✅ Estrutura de arquivos limpa
- ✅ Hook funcionando corretamente
- ✅ Responsividade do CompanyPopup restaurada

**Status**: ✅ Implementado e testado

### ✅ 2025-01-15 - Correção de Acessibilidade - DialogContent
**Problema**: Warnings de acessibilidade do Radix UI Dialog
- `DialogContent requires a DialogTitle for the component to be accessible for screen reader users`
- `Missing Description or aria-describedby={undefined} for {DialogContent}`

**Causa**: O componente `CompanyPopup` estava usando `DialogContent` sem os elementos obrigatórios de acessibilidade

**Solução Implementada**:
1. **Criado componente VisuallyHidden**: `src/components/ui/visually-hidden.tsx`
   - Oculta visualmente elementos mantendo acessibilidade para screen readers
   - Usa técnicas CSS padrão (clip, clipPath, position absolute)

2. **Adicionado DialogTitle e DialogDescription ocultos**:
   - `DialogTitle`: "Detalhes da empresa {nome}" ou "Detalhes da empresa"
   - `DialogDescription`: Descrição completa das funcionalidades do modal
   - Envolvidos em `VisuallyHidden` para não afetar o design visual

**Arquivos alterados**:
- `src/components/ui/visually-hidden.tsx` (novo)
- `src/features/companies/components/details/company-popup/index.tsx`

**Benefícios**:
- ✅ Conformidade total com padrões de acessibilidade WCAG
- ✅ Compatibilidade com screen readers
- ✅ Eliminação de warnings do Radix UI
- ✅ Manutenção do design visual existente

**Status**: ✅ Implementado e testado

### ✅ 2024-12-19 - Configuração da Fonte Poppins
**Implementação**: Configurada a fonte Poppins como padrão do projeto
**Alterações realizadas**:
- Adicionado Google Fonts no `index.html` com preconnect para otimização
- Configurado `fontFamily.sans` no `tailwind.config.ts` com Poppins como primeira opção
- Mantido fallback para fontes do sistema (ui-sans-serif, system-ui, sans-serif)
**Benefícios**:
- Interface mais moderna e consistente
- Melhor legibilidade e experiência visual
- Carregamento otimizado com preconnect
**Arquivos alterados**: 
- `index.html` (importação Google Fonts)
- `tailwind.config.ts` (configuração fontFamily)
**Status**: ✅ Implementado e testado

### ✅ 2024-12-19 - Correção do Popup de Empresa
**Problema**: O popup da empresa não abria ao clicar na linha da tabela
**Causa**: Incompatibilidade nas props passadas para o componente `CompanyPopup`
**Solução**: 
- Corrigido as props no `CompaniesPage.tsx`:
  - `isOpen` → `open`
  - `onClose` → `onOpenChange`
- O componente `CompanyPopup` espera `open` e `onOpenChange`, mas estava recebendo `isOpen` e `onClose`
**Arquivos alterados**: `src/pages/crm/companies/CompaniesPage.tsx`
**Status**: ✅ Resolvido

### ✅ Correções Realizadas - Console Errors (Janeiro 2025)

**Problemas Identificados e Resolvidos:**

1. **Erro de Sintaxe - CompanyPopup.tsx**
   - ❌ Problema: Tag `<div>` não fechada causando erro de build
   - ✅ Solução: Adicionado `</div>` antes de `</DialogContent>`
   - 📍 Arquivo: `src/features/companies/components/details/CompanyPopup.tsx`

2. **Warnings React Router v7**
   - ❌ Problema: Flags `v7_startTransition` e `v7_relativeSplatPath` ausentes
   - ✅ Solução: Adicionadas flags future no `createBrowserRouter`
   - 📍 Arquivo: `src/routes/index.tsx`

3. **Erro de Tabelas Supabase**
   - ❌ Problema: Consultas usando `states` e `cities` em vez de `web_states` e `web_cities`
   - ✅ Solução: Corrigidos nomes de tabelas em todos os arquivos afetados:
     - `src/features/companies/application/useCompanyForm.ts`
     - `src/components/crm/settings/custom-fields/components/AddressField.tsx`
     - `src/hooks/useLocationData.ts`
     - `src/hooks/useLocation.ts`
     - `src/hooks/useAddressFields.ts`
     - `src/components/ui/company-quick-form.tsx`

4. **Políticas RLS Supabase**
   - ❌ Problema: Warning sobre políticas RLS não aplicadas
   - ✅ Solução: Políticas RLS já estavam aplicadas no banco de dados
   - 📍 Status: Verificado e confirmado funcionamento

5. **Erro de Importação de Hooks - CompanyPopup (Fevereiro 2025)**
   - ❌ Problema: Erro `Uncaught SyntaxError` indicando que o módulo não exporta `useCompanyContact`
   - 🔍 Causa: Importações incorretas de hooks em vários componentes da pasta `company-popup`
   - ✅ Solução: Corrigido o caminho de importação em todos os arquivos afetados:
     - `src/features/companies/components/details/company-popup/tabs/OverviewTab/ContactCard.tsx`
     - `src/features/companies/components/details/company-popup/tabs/OverviewTab/LocationCard.tsx`
     - `src/features/companies/components/details/company-popup/tabs/OverviewTab/DealsCard.tsx`
     - `src/features/companies/components/details/company-popup/tabs/OverviewTab/PeopleCard.tsx`
     - `src/features/companies/components/details/company-popup/tabs/NotesTab/index.tsx`
     - `src/features/companies/components/details/company-popup/tabs/PeopleTab/index.tsx`
     - `src/features/companies/components/details/company-popup/tabs/AttachmentsTab/index.tsx`
     - `src/features/companies/components/details/company-popup/index.tsx`
   - 📝 Detalhes: Alterado o caminho de importação de `../../hooks` para `../../hooks/index` para garantir que os hooks sejam importados corretamente

6. **Erro filteredNotes is not defined no componente NotesTab**
   - ❌ Problema: `Uncaught ReferenceError: filteredNotes is not defined` na linha 51 do componente NotesTab
   - 🔍 Causa: Variável `filteredNotes` estava sendo usada no JSX mas não estava definida no componente
   - ✅ Solução: Implementação completa da lógica de filtragem e ordenação de notas
   - 📍 Arquivo: `src/features/companies/components/details/company-popup/tabs/NotesTab/index.tsx`
   - 📝 Detalhes: Adicionados estados de filtro, lógica de ordenação e componentes UI necessários

**Resultado:**
- ✅ Build executado com sucesso
- ✅ Erros de console resolvidos
- ✅ Aplicação funcionando corretamente
- ✅ Warnings do React Router eliminados
- ✅ Componente NotesTab totalmente funcional

## 📋 Resumo do Projeto

**NexFlow Oficial** é um sistema CRM (Customer Relationship Management) moderno desenvolvido para gestão de parceiros, empresas, oportunidades e fluxos de trabalho. O projeto utiliza uma arquitetura fullstack com React/TypeScript no frontend e Supabase como backend-as-a-service.

### Propósito Principal
- Gestão completa de relacionamentos comerciais
- Automação de fluxos de trabalho (flows)
- Sistema multi-tenant com diferentes perfis de usuário
- Dashboard analítico para tomada de decisões

## 🏗️ Arquitetura Geral

### Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite como bundler
- TailwindCSS + Shadcn/ui para estilização
- React Query (@tanstack/react-query) para gerenciamento de estado
- React Router DOM para navegação
- React Hook Form + Zod para formulários e validação

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Row Level Security (RLS) para segurança de dados
- Edge Functions para lógica customizada

**Ferramentas de Desenvolvimento:**
- ESLint + TypeScript ESLint para linting
- Vitest para testes
- Lovable Tagger para desenvolvimento

### Arquitetura de Pastas

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Shadcn/ui)
│   ├── admin/          # Componentes administrativos
│   ├── auth/           # Componentes de autenticação
│   ├── crm/            # Componentes específicos do CRM
│   └── [módulos]/      # Componentes por funcionalidade
├── features/           # Módulos de funcionalidades (Domain-Driven)
├── hooks/              # Custom hooks globais
├── layouts/            # Layouts da aplicação
├── lib/                # Configurações e utilitários
├── pages/              # Páginas da aplicação
├── types/              # Definições TypeScript
└── contexts/           # Contextos React
```

## 🔧 Decisões de Arquitetura

### Framework e Bibliotecas Críticas

1. **React Query**: Escolhido para cache inteligente, sincronização de estado servidor/cliente e otimização de performance
2. **Supabase**: Backend-as-a-Service para reduzir complexidade de infraestrutura
3. **Shadcn/ui**: Sistema de design consistente e acessível
4. **React Hook Form**: Performance otimizada para formulários complexos
5. **Zod**: Validação type-safe em runtime

### Autenticação e Autorização

- **Supabase Auth**: Sistema de autenticação integrado
- **RLS (Row Level Security)**: Segurança a nível de banco de dados
- **Multi-tenant**: Isolamento por `client_id`
- **Perfis de usuário**: administrator, closer, partnership_director, partner

### Banco de Dados

- **PostgreSQL** via Supabase
- **Nomenclatura**: Prefixos por módulo (core_, crm_, flow_)
- **Relacionamentos**: Foreign keys bem definidas
- **Auditoria**: created_at, updated_at em todas as tabelas

## 📝 Padrões de Código

### Nomenclatura

**Arquivos e Pastas:**
- PascalCase para componentes: `CompanyForm.tsx`
- camelCase para hooks: `useCompanies.ts`
- kebab-case para utilitários: `format-date.ts`
- Pastas em lowercase: `components/`, `hooks/`

**Variáveis e Funções:**
- camelCase: `getUserData`, `isLoading`
- UPPER_CASE para constantes: `API_BASE_URL`
- Prefixos descritivos: `use` para hooks, `is/has` para booleans

**Componentes:**
- PascalCase para nomes
- Props interface com sufixo `Props`
- Export default para componente principal
- Export named para utilitários

### Otimizações Aplicadas

**NOTA DE OTIMIZAÇÃO (Dezembro 2024)**: Os hooks `useDeals.ts` e `useFlowStages.ts` foram otimizados com React Query para reduzir chamadas ao Supabase e melhorar performance. Padrão aplicado: queries unificadas, cache otimizado e mutations com invalidação automática.

**CORREÇÃO CRÍTICA (Dezembro 2024)**: Hook `useLocation.ts` corrigido para incluir funções `getCitiesByState` e `fetchCitiesByStateId` que estavam faltando, causando erro "getCitiesByState is not a function" no PersonForm. Adicionadas também funções utilitárias `getStateName` e `getCityName` para consistência com outros componentes.

**CORREÇÃO DE NOMENCLATURA (Dezembro 2024)**: Corrigido nome da tabela de relacionamento no hook `usePeople.ts` e demais componentes de `company_people` para `web_company_people` para seguir o padrão de nomenclatura do projeto onde TODAS as tabelas do CRM devem começar com "web_". Criada a tabela `web_company_people` no Supabase com RLS e triggers apropriados. Isso resolveu o erro de chave estrangeira não encontrada ao buscar pessoas vinculadas a empresas.

## 🎨 Melhorias de Design - CompanyPopup (2025)

### Redesign Completo do Modal de Empresa
**Data**: Janeiro 2025  
**Arquivo**: `src/features/companies/components/details/CompanyPopup.tsx`

#### ✨ Principais Melhorias Implementadas:

1. **Header com Gradiente Moderno**
   - Background gradiente azul profissional (blue-600 → indigo-800)
   - Avatar da empresa com iniciais automáticas
   - Informações hierárquicas com badges e métricas
   - Botões de ação rápida (Editar, Favoritar)

2. **Layout Responsivo em Grid**
   - Grid 2 colunas em desktop, 1 coluna em mobile
   - Cards com sombras e hover effects

### 🚀 Refatoração Completa - Sistema de Campos Editáveis (Fevereiro 2025)

**Data**: Fevereiro 2025  
**Escopo**: Refatoração completa do popup de empresas com sistema de edição inline

#### 📋 Componentes Criados:

1. **EditableField.tsx** - Sistema de campos editáveis universal
   - ✅ Suporte a múltiplos tipos: text, email, tel, textarea, select, combobox
   - ✅ Validação em tempo real (email, telefone, CNPJ, CEP)
   - ✅ Máscaras automáticas (telefone, CNPJ, CEP)
   - ✅ Ícone de lápis para edição inline
   - ✅ Estados de loading e erro
   - ✅ Campos obrigatórios com indicação visual

2. **useCepApi.ts** - Hook para consulta de CEP
   - ✅ Integração com API ViaCEP
   - ✅ Preenchimento automático de endereço
   - ✅ Validação de CEP
   - ✅ Tratamento de erros com toast

3. **useLocationData.ts** - Hook para dados de localização
   - ✅ `useStates()` - Busca estados do banco
   - ✅ `useCities(stateId)` - Busca cidades por estado
   - ✅ `useUsers()` - Busca usuários para responsável
   - ✅ Cache otimizado com React Query

4. **useUpdateCompany.ts** - Hook para atualização de empresas
   - ✅ Mutations otimizadas com Supabase
   - ✅ Invalidação automática de cache
   - ✅ Feedback visual com toasts
   - ✅ Tratamento de erros

#### 🎯 OverviewTab - Refatoração Completa:

**Seções Organizadas:**
1. **Dados Básicos**
   - Nome da empresa (obrigatório)
   - CNPJ (com máscara)
   - Razão social
   - Categoria (dropdown)
   - Origem
   - Responsável (combobox com busca)
   - Setor
   - Descrição (textarea)

2. **Informações para Contato**
   - E-mail (com validação)
   - WhatsApp/Celular (com máscara)
   - Telefone (com máscara)
   - Website

3. **Dados do Endereço**
   - CEP (com integração ViaCEP)
   - Estado (combobox com busca)
   - Cidade (combobox dependente do estado)
   - Bairro
   - Rua
   - Número
   - Complemento

#### 🎨 PeopleTab - Ilustração para Estado Vazio:

1. **EmptyPeopleIllustration.tsx**
   - ✅ Ilustração SVG customizada
   - ✅ Mensagem explicativa
   - ✅ Botão de ação "Adicionar Pessoa"
   - ✅ Dicas visuais para o usuário
   - ✅ Design responsivo e acessível

#### 📝 NotesTab - Sistema de Tarefas:

1. **NoteCard.tsx** - Componente de nota individual
   - ✅ Layout estilo tarefa com avatar do criador
   - ✅ Badges de prioridade (baixa, média, alta)
   - ✅ Badges de status (pendente, em andamento, concluída)
   - ✅ Informações de criação e edição
   - ✅ Menu de ações (editar, excluir)
   - ✅ Formatação de data relativa

2. **AddNoteCard.tsx** - Formulário de nova nota
   - ✅ Interface expansível (+ Adicionar nova nota)
   - ✅ Campos: título, conteúdo, prioridade, status
   - ✅ Dropdowns com preview visual
   - ✅ Validação e estados de loading
   - ✅ Cancelamento e reset automático

#### 🔧 Atualizações de Tipos:

**types.ts** - Interface Company expandida:
```typescript
interface Company {
  // Campos básicos existentes
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  
  // Novos campos adicionados
  razao_social: string | null;
  telefone: string | null;
  celular: string | null;
  categoria: string | null;
  origem: string | null;
  creator_id: string | null;
  setor: string | null;
  cep: string | null;
  bairro: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  city_id: string | null;
  state_id: string | null;
  updated_at: string | null;
}
```

#### 📊 Benefícios da Refatoração:

1. **UX Melhorada**
   - Edição inline sem modais adicionais
   - Feedback visual imediato
   - Validação em tempo real
   - Preenchimento automático de endereço

2. **Performance Otimizada**
   - Cache inteligente com React Query
   - Mutations otimizadas
   - Carregamento assíncrono de dados

3. **Manutenibilidade**
   - Componentes reutilizáveis
   - Hooks especializados
   - Separação clara de responsabilidades
   - Tipagem forte com TypeScript

4. **Acessibilidade**
   - Navegação por teclado
   - Labels apropriados
   - Estados visuais claros
   - Feedback para screen readers

**Status**: ✅ Implementado e testado  
**Arquivos Principais**:
- `src/features/companies/components/details/company-popup/components/EditableField.tsx`
- `src/features/companies/components/details/company-popup/components/EmptyPeopleIllustration.tsx`
- `src/features/companies/components/details/company-popup/components/NoteCard.tsx`
- `src/features/companies/components/details/company-popup/components/AddNoteCard.tsx`
- `src/features/companies/components/details/company-popup/tabs/OverviewTab/index.tsx`
- `src/features/companies/components/details/company-popup/tabs/PeopleTab/index.tsx`
- `src/features/companies/components/details/company-popup/tabs/NotesTab/index.tsx`
- `src/hooks/useCepApi.ts`
- `src/features/companies/components/details/company-popup/hooks/useLocationData.ts`
- `src/features/companies/components/details/company-popup/hooks/useUpdateCompany.ts`
   - Transições suaves (300ms)
   - Espaçamentos consistentes

3. **Cards Temáticos com Ícones**
   - **Contato**: Ícone azul, links interativos
   - **Localização**: Ícone verde, informações estruturadas
   - **Pessoas**: Ícone roxo, avatars e badges de status

4. **Micro-interações Avançadas**
   - Hover states com mudança de cores
   - Ícones que mudam de cor no hover
   - Links externos com indicador visual
   - Estados vazios com call-to-action

### Funcionalidade de Edição In-Place (Fevereiro 2025)
**Data**: Fevereiro 2025  
**Arquivos**: 
- `src/features/companies/components/details/company-popup/tabs/OverviewTab/ContactCard.tsx`
- `src/features/companies/components/details/company-popup/tabs/OverviewTab/LocationCard.tsx`

#### ✨ Funcionalidades Implementadas:

1. **Edição In-Place de Informações de Contato**
   - Botão de edição em cada card
   - Formulário inline para edição de dados
   - Campos para e-mail, telefone, celular, WhatsApp e website
   - Botões de salvar e cancelar com feedback visual

2. **Edição In-Place de Informações de Localização**
   - Botão de edição no card de localização
   - Formulário inline para edição de endereço
   - Campos para rua, número, complemento, bairro, cidade, estado e CEP
   - Botões de salvar e cancelar com feedback visual

3. **Hooks Personalizados para Gerenciamento de Estado**
   - `useCompanyContact`: Gerencia estado e operações de edição de contato
   - `useCompanyLocationEdit`: Gerencia estado e operações de edição de localização
   - Integração com React Query para cache e sincronização
   - Feedback visual com toast para sucesso e erro

4. **Componentes Modulares de Edição**
   - `ContactEditor.tsx`: Componente para edição de informações de contato
   - `LocationEditor.tsx`: Componente para edição de informações de localização
   - Design consistente com o restante da aplicação
   - Responsividade e acessibilidade

5. **Tipografia e Hierarquia Visual**
   - Títulos com tamanhos diferenciados
   - Cores semânticas (azul/contato, verde/localização, roxo/pessoas)
   - Badges informativos com contadores
   - Textos truncados para responsividade

#### 🔧 Componentes Utilizados:
- `Avatar` com fallback de iniciais
- `Badge` com variantes customizadas  
- `Card` com sombras e hover effects
- `Button` com ícones e estados
- Ícones Lucide React temáticos

#### 📱 Responsividade:
- Modal adaptável (max-w-4xl)
- Grid responsivo (lg:grid-cols-2)
- Textos truncados em telas pequenas
- Avatars e espaçamentos otimizados

#### 🎯 Resultado:
Interface moderna, profissional e alinhada com tendências de design 2025, mantendo funcionalidade e melhorando significativamente a experiência do usuário.

**ANÁLISE DE SIMPLIFICAÇÃO (Dezembro 2024) - APROVADA PELO CLIENTE**: Identificada complexidade excessiva no sistema de entidades dinâmicas:
- 12 entidades dinâmicas com apenas 360 registros (DADOS FICTÍCIOS)
- 6 de 7 flows sem entidades vinculadas
- Duplicação entre tabelas fixas (web_companies, web_people, web_deals) e sistema dinâmico
- **ESTRATÉGIA FINAL**: Migração intensiva aprovada - remoção completa de entidades dinâmicas, preservação apenas de web_deals (3.128 registros reais)
- Documentação completa em `PLANO_MIGRACAO_SIMPLIFICACAO.md` e `migration_simplificacao_intensiva.sql`

### Estrutura de Componentes

```typescript
// AIDEV-NOTE: Padrão para componentes React
import React from 'react';
import { ComponentProps } from './types';

interface ComponentNameProps {
  // Props tipadas
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // Hooks no topo
  // Estados locais
  // Funções auxiliares
  // useEffect
  
  return (
    // JSX limpo e semântico
  );
}
```

### Hooks Customizados

```typescript
// AIDEV-NOTE: Padrão para hooks customizados
export function useCustomHook(params: HookParams) {
  // React Query ou useState
  // Lógica de negócio
  // Return object com dados e funções
  
  return {
    data,
    isLoading,
    error,
    actions: {
      create,
      update,
      delete
    }
  };
}
```

### Formatação e Estilo

- **Indentação**: 2 espaços
- **Aspas**: Simples para strings, duplas para JSX
- **Semicolons**: Obrigatórios
- **Trailing commas**: Sempre em objetos/arrays multi-linha
- **Imports**: Agrupados (React, libs, internos)

## 📚 Glossário de Termos

### Termos Técnicos

- **Flow**: Fluxo de trabalho automatizado
- **Entity**: Entidade genérica do sistema (empresa, pessoa, deal)
- **Deal**: Oportunidade de negócio
- **Client**: Empresa cliente do sistema (multi-tenant)
- **Core**: Módulo base do sistema
- **RLS**: Row Level Security (Supabase)
- **Portal**: Interface específica por tipo de usuário

### Siglas e Abreviações

- **CRM**: Customer Relationship Management
- **UI**: User Interface
- **UX**: User Experience
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **HOC**: Higher-Order Component
- **RQ**: React Query
- **SB**: Supabase

### Nomenclatura de Banco

- **core_**: Tabelas do sistema base
- **crm_**: Tabelas do módulo CRM
- **flow_**: Tabelas de fluxos de trabalho
- **web_**: Tabelas para funcionalidades web

## 🏷️ Anchor Comments Padrões

### AIDEV-NOTE
Explica o propósito e contexto de funções/arquivos críticos:

```typescript
// AIDEV-NOTE: Hook responsável por gerenciar autenticação multi-tenant
// Integra com Supabase Auth e aplica RLS baseado em client_id
export function useAuth() {
  // implementação
}
```

### AIDEV-TODO
Marca melhorias e funcionalidades pendentes:

```typescript
// AIDEV-TODO: Implementar cache local para dados offline
// AIDEV-TODO: Adicionar validação de CPF/CNPJ mais robusta
```

### AIDEV-QUESTION
Marca dúvidas técnicas ou decisões arquiteturais:

```typescript
// AIDEV-QUESTION: Devemos mover esta lógica para um hook separado?
// AIDEV-QUESTION: Performance: usar useMemo aqui?
```

## 🚫 Regras de Proteção

### NUNCA TOCAR SEM AUTORIZAÇÃO EXPLÍCITA:

1. **Arquivos de Teste**
   - `src/test/`
   - `*.test.ts`, `*.spec.ts`
   - `setup.ts`, `mockEntityData.ts`

2. **Migrations e Banco**
   - `supabase/migrations/`
   - `sql/`
   - Qualquer arquivo `.sql`

3. **Configurações de Segurança**
   - `.env`, `.env.local`
   - `supabase/config.toml`
   - Configurações de RLS
   - Políticas de segurança

4. **Configurações de Build**
   - `vite.config.ts`
   - `tsconfig.json`, `tsconfig.*.json`
   - `package.json` (dependências)
   - `tailwind.config.ts`
   - `eslint.config.js`

5. **Arquivos de Sistema**
   - `.gitignore`
   - `.windsurfrules`
   - `bun.lockb`, `package-lock.json`

### CONTRATOS DE API
- Nunca alterar tipos em `src/types/database.ts` sem versionamento
- Manter compatibilidade com versões anteriores
- Documentar breaking changes

## ✅ Checklist Obrigatório - PR

### Antes de Qualquer Pull Request:

#### 🔍 Código
- [ ] Código segue padrões de nomenclatura estabelecidos
- [ ] Funções não excedem 20 linhas (exceto casos justificados)
- [ ] Anchor comments adicionados em código crítico
- [ ] Imports organizados e otimizados
- [ ] Sem console.logs em produção

#### 🧪 Qualidade
- [ ] TypeScript sem erros
- [ ] ESLint sem warnings críticos
- [ ] Componentes testados manualmente
- [ ] Performance verificada (React DevTools)
- [ ] Responsividade testada

#### 🔒 Segurança
- [ ] Nenhum secret/key exposto
- [ ] RLS respeitado em queries
- [ ] Validação de entrada implementada
- [ ] Autorização verificada

#### 📚 Documentação
- [ ] README.md atualizado se necessário
- [ ] CLAUDE.md atualizado com mudanças estruturais
- [ ] Comentários explicativos em lógica complexa
- [ ] Tipos TypeScript documentados

#### 🔄 Integração
- [ ] Build local executado com sucesso
- [ ] Não quebra funcionalidades existentes
- [ ] Migrations aplicadas se necessário
- [ ] Dependências atualizadas no package.json

### Comandos de Verificação:

```bash
# Verificar tipos
npm run build

# Verificar linting
npm run lint

# Executar testes
npm run test

# Verificar build de produção
npm run build:dev
```

## 🔄 Atualizações da Documentação

Este arquivo deve ser atualizado sempre que:
- Novas dependências forem adicionadas
- Padrões de código forem alterados
- Nova arquitetura for implementada
- Regras de segurança forem modificadas
- Novos módulos forem criados

## 🔄 SISTEMA MODULAR DE FLOWS E VISUALIZAÇÕES DUPLICADAS

### Arquitetura Modular Implementada (Dezembro 2024)

**AIDEV-NOTE**: Sistema totalmente modular e configurável que permite aos usuários criar flows personalizados com visualizações múltiplas de deals entre equipes, mantendo histórico compartilhado e sincronização automática.

#### Estrutura de Dados Modular

**Tabelas Principais:**
1. `web_flows`: Flows criados pelos usuários
2. `web_flow_stages`: Etapas modulares dos flows
3. `web_deal_flow_views`: Visualizações duplicadas de deals
4. `web_flow_automations`: Automações entre flows
5. `web_flow_templates`: Templates de flows (sistema + usuário)
6. `web_flow_role_configs`: Configurações de visibilidade por papel

**Sistema Totalmente Configurável pelo Usuário:**
- ✅ **Criação de Flows Personalizados**: Usuários podem criar qualquer flow com qualquer nome e etapas
- ✅ **Templates Pré-configurados**: 7 templates prontos (Vendas, SDR, Closer, Pós-venda, Suporte, Projetos, Simples)
- ✅ **Etapas Modulares**: Usuários definem nome, descrição, cor, tipo e ordem das etapas
- ✅ **Automações Configuráveis**: Sistema de duplicação automática entre flows configurável
- ✅ **Salvamento como Template**: Flows criados podem ser salvos como templates reutilizáveis

#### Funcionalidades Modulares Implementadas

**FlowBuilder Visual:**
- Interface drag-and-drop para criação de flows
- Configuração visual de etapas e automações
- Preview em tempo real do flow sendo criado
- Validação automática de configurações

**Templates Dinâmicos:**
1. **Vendas Completo**: Flow completo com 7 etapas (Lead → Ganho/Perdido)
2. **SDR - Prospecção**: Flow especializado para SDRs (6 etapas)
3. **Closer - Vendas**: Flow para Closers (7 etapas)
4. **Pós-venda**: Flow de onboarding (8 etapas)
5. **Suporte ao Cliente**: Flow para tickets (6 etapas)
6. **Gestão de Projetos**: Flow para projetos internos (7 etapas)
7. **Flow Simples**: Template básico com 3 etapas

**Automações Configuráveis:**
- `duplicate`: Duplicar deal para outro flow
- `move`: Mover deal para outro flow
- `notify`: Notificar sobre mudança
- Triggers: `stage_change`, `time_based`, `field_change`

**Tipos de Etapas Suportados:**
- `active`: Etapas em andamento
- `won`: Etapas de sucesso/ganho
- `lost`: Etapas de insucesso/perda
- `archived`: Etapas arquivadas

#### Benefícios do Sistema Modular

1. **Flexibilidade Total**: Usuários criam flows personalizados para qualquer processo
2. **Reutilização**: Templates podem ser salvos e reutilizados
3. **Escalabilidade**: Sistema cresce com as necessidades do usuário
4. **Automação Inteligente**: Duplicação automática mantém sincronização
5. **Visibilidade Controlada**: Cada papel vê apenas o que precisa
6. **Adaptabilidade**: Sistema se adapta a qualquer modelo de negócio

#### Arquivos Implementados

**SQL:**
- `sql/create_modular_flow_system.sql`: Estrutura completa do sistema
- `sql/seed_flow_templates.sql`: Templates pré-configurados

**Hooks:**
- `src/hooks/useFlowBuilder.ts`: Gestão de criação de flows
- `src/hooks/useFlowViews.ts`: Gestão de visualizações duplicadas

**Componentes:**
- `src/components/flows/FlowBuilder.tsx`: Interface de criação visual
- `src/components/flows/FlowViews.tsx`: Interface de visualizações

#### Exemplo Prático

Deal "Prospect - Empresa XYZ":
- **Visualização Principal**: Flow personalizado "Vendas B2B" (Qualificação)
- **Visualização Duplicada**: Flow "Closer Especializado" (Reunião Realizada)
- **Visualização Duplicada**: Flow "Onboarding Premium" (Boas-vindas)
- **Histórico Compartilhado**: 5 atividades visíveis em todos os flows

### Regras de Implementação

**AIDEV-NOTE**: Sistema crítico modular - qualquer modificação deve preservar:
1. Integridade referencial entre tabelas modulares
2. Sincronização automática entre visualizações
3. Histórico compartilhado universal
4. Automações configuráveis
5. Templates e configurações de usuário
6. Flexibilidade total do sistema

**Última atualização**: Sistema de Flows e Visualizações Duplicadas implementado (Dezembro 2024)
**Próxima revisão**: A ser definida conforme evolução do projeto

Hooks otimizados com React Query para gerenciamento de estado e cache em useDeals.ts e useFlowStages.ts, reduzindo chamadas ao Supabase e melhorando performance.

## 🧭 SISTEMA DE NAVEGAÇÃO - SIDEBAR

### Estrutura do Sidebar (Dezembro 2024)

**AIDEV-NOTE**: O sistema de navegação utiliza um cabeçalho horizontal (`Sidebar.tsx`) no layout CRM, não um sidebar vertical tradicional.

#### Componentes de Navegação

**Arquivo Principal**: `src/components/crm/sidebar/Sidebar.tsx`
- **Tipo**: Cabeçalho horizontal responsivo
- **Localização**: Integrado no `CRMLayout.tsx` dentro do header
- **Funcionalidade**: Menu de navegação principal do sistema CRM

**Itens de Menu Base (Sempre Visíveis):**
1. **Início** (`/`) - Ícone: `Home`
2. **Visão Geral** (`/overview`) - Ícone: `BarChart3`
3. **Tarefas** (`/tasks`) - Ícone: `CheckSquare`
4. **Relatórios** (`/reports`) - Ícone: `FileText`

**Itens Condicionais:**
- **Empresas** (`/companies`) - Ícone: `Building2`
- **Pessoas** (`/people`) - Ícone: `Users`

**Aparecem quando:**
- Usuário está dentro de um "flow" (`/flow/` + id nos parâmetros)
- **OU** usuário está nas próprias páginas de Empresas/Pessoas

#### Lógica Condicional Implementada

**AIDEV-NOTE**: "Empresas" e "Pessoas" aparecem quando o usuário está dentro de um flow específico OU nas próprias páginas.

**Condição de Exibição:**
```typescript
// Detecta se está em um flow específico
const isInFlow = location.pathname.includes('/flow/') && params.id;

// Detecta se está nas páginas de Empresas ou Pessoas
const isInCompaniesOrPeople = location.pathname.includes('/companies') || location.pathname.includes('/people');

// Itens condicionais aparecem em flows OU nas páginas específicas
const conditionalItems = (isInFlow || isInCompaniesOrPeople) ? [
  { name: 'Empresas', href: '/companies', icon: Building2 },
  { name: 'Pessoas', href: '/people', icon: Users }
] : [];
```

**Motivação**: Evitar poluição visual do menu principal, mantendo foco nas funcionalidades essenciais na tela inicial.

#### Páginas Funcionais com Integração Supabase

- **CompaniesPage** (`/crm/companies`): Listagem, busca, CRUD completo
- **PeoplePage** (`/crm/people`): Listagem, busca, CRUD completo
- **CompanyDetailsPage** (`/crm/companies/:id`): Detalhes e edição
- **EditPersonPage** (`/crm/people/:id/edit`): Edição de pessoas

#### Funcionalidades Removidas

**Negócios/Deals (Dezembro 2024):**
- ❌ **Arquivo Removido**: `src/pages/crm/deals/DealsPage.tsx`
- ❌ **Diretório Removido**: `src/pages/crm/deals/`
- ❌ **Rota Removida**: `/deals` do `src/routes/index.tsx`
- ❌ **Item de Menu Removido**: "Negócios" do sidebar

**Justificativa**: Funcionalidade considerada desnecessária e redundante com o sistema de flows.

#### Arquivos Duplicados Removidos

- **CompanyForm duplicado**: `src/components/crm/companies/CompanyForm.tsx` (stub)
- **CompanyFormPage**: `src/features/companies/pages/CompanyFormPage.tsx.new` (não utilizado)

#### Outros Componentes de Sidebar

**CRMSidebar.tsx**: Componente alternativo não utilizado no layout principal
**MainMenuItems.tsx**: Componente modular para itens de menu (não utilizado no layout atual)

#### Regras de Modificação

**AIDEV-NOTE**: Para futuras alterações no sistema de navegação:

1. **Arquivo Principal**: Sempre modificar `src/components/crm/sidebar/Sidebar.tsx`
2. **Itens Base**: Manter "Início", "Visão Geral", "Tarefas", "Relatórios" sempre visíveis
3. **Itens Condicionais**: Usar lógica de detecção de contexto (flows, projetos, etc.)
4. **Responsividade**: Manter comportamento mobile-first
5. **Ícones**: Usar biblioteca `lucide-react` para consistência
6. **Rotas**: Sempre atualizar `src/routes/index.tsx` junto com mudanças de menu
7. **Não criar** arquivos duplicados - usar sempre a estrutura em `features/`

#### Estrutura de Arquivos

```
src/components/crm/sidebar/
├── Sidebar.tsx              # ✅ Componente principal (cabeçalho horizontal)
├── CRMSidebar.tsx          # ⚠️  Componente alternativo (não usado)
└── MainMenuItems.tsx       # ⚠️  Componente modular (não usado)
```

**Última atualização**: Sistema de navegação otimizado (Dezembro 2024)
**Próxima revisão**: A ser definida conforme necessidades de UX