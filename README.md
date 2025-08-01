# CRM Partners

Um sistema de CRM (Customer Relationship Management) moderno e eficiente para gerenciamento de parceiros, empresas e oportunidades.

## 🚀 Funcionalidades

### Autenticação

- Sistema de login multi-portal (CRM, Admin, Partner)
- Autenticação segura via Supabase
- Proteção de rotas por perfil de usuário

### Dashboard

- Visão geral das métricas principais
- Contadores de empresas, pessoas e oportunidades
- Lista de tarefas recentes
- Gráficos de performance (em desenvolvimento)

### Gestão de Empresas

- Cadastro completo de empresas
- Busca por nome
- Detalhes da empresa incluindo:
  - Informações básicas (Nome, CNPJ, Descrição)
  - Contatos associados
  - Oportunidades
  - Histórico de interações

### Gestão de Pessoas

- Cadastro de contatos
- Vinculação com empresas
- Histórico de interações
- Informações de contato

### Tarefas

- Sistema de gestão de tarefas
- Categorização
- Atribuição a usuários
- Acompanhamento de status

### Configurações

- Personalização de campos customizados
- Configurações do sistema
- Preferências do usuário

## 🛠 Tecnologias

- **Frontend**:

  - React + Vite
  - TypeScript
  - TailwindCSS
  - Shadcn/ui
  - React Query
  - React Router DOM

- **Backend**:
  - Supabase
    - Autenticação
    - Banco de dados PostgreSQL
    - Realtime subscriptions
    - Storage

## 📁 Estrutura do Projeto

```
src/
├── components/         # Componentes reutilizáveis
│   ├── ui/            # Componentes de UI base
│   └── crm/           # Componentes específicos do CRM
├── features/          # Módulos de funcionalidades
│   └── companies/     # Módulo de empresas
│       ├── components/
│       │   ├── custom-fields/  # Campos personalizados
│       │   ├── details/        # Componentes de detalhes
│       │   │   └── CompanyPopup.tsx
│       │   ├── form/          # Componentes de formulário
│       │   │   ├── CompanyForm.tsx
│       │   │   └── EditCompanyDialog.tsx
│       │   ├── list/          # Componentes de listagem
│       │   │   └── CompanyTable.tsx
│       │   └── related/       # Componentes de relacionamentos
│       │       ├── LinkPartnerDialog.tsx
│       │       └── LinkPersonDialog.tsx
│       ├── hooks/             # Hooks personalizados
│       │   ├── useCompanies.ts
│       │   └── useCompanyRelationships.ts
│       ├── pages/             # Páginas principais
│       │   ├── CompaniesPage.tsx
│       │   ├── CompanyDetailsPage.tsx
│       │   └── CompanyFormPage.tsx
│       └── types/             # Tipos e interfaces
├── hooks/             # Hooks globais
├── layouts/           # Layouts da aplicação
├── lib/              # Bibliotecas e configurações
├── pages/            # Páginas da aplicação
│   ├── auth/         # Páginas de autenticação
│   └── crm/          # Páginas do CRM
├── types/            # Definições de tipos
└── utils/            # Funções utilitárias
```

### 🏢 Módulo de Empresas (Companies)

O módulo de empresas segue uma arquitetura limpa e organizada:

#### 1. Estrutura

```
companies/
├── application/           # Lógica de negócios e hooks
│   ├── useCompanyForm.ts
│   └── useCompanyForm.test.ts
├── components/
│   ├── custom-fields/    # Campos personalizados
│   ├── details/          # Visualização detalhada
│   │   ├── CompanyPopup.tsx
│   │   └── company-popup/  # Componentes modularizados
│   │       ├── index.tsx
│   │       ├── CompanyHeader.tsx
│   │       ├── CompanyTabs.tsx
│   │       ├── hooks.ts
│   │       ├── types.ts
│   │       ├── utils.ts
│   │       └── tabs/      # Componentes de abas
│   │           ├── OverviewTab/
│   │           ├── PeopleTab/
│   │           ├── NotesTab/
│   │           └── AttachmentsTab/
│   ├── form/            # Formulários
│   │   └── CompanyForm.tsx
│   ├── list/            # Componentes de lista
│   └── related/         # Relacionamentos
├── schemas/             # Validação
│   └── companySchema.ts
└── pages/              # Páginas
```

#### 2. Componentes Principais

##### CompanyForm

Componente de formulário para criação e edição de empresas.

- Validação com Zod
- Gestão de estado com React Hook Form
- Carregamento dinâmico de estados/cidades
- Feedback visual com toasts
- Suporte a campos customizados

##### CompanyPopup

Componente modularizado para exibição de detalhes da empresa.

- Arquitetura de componentes modulares
- Sistema de abas (Visão Geral, Pessoas, Notas, Anexos)
- Responsivo (Dialog em desktop, Drawer em mobile)
- Hooks personalizados para queries e estados
- Componentes reutilizáveis para cada seção

##### EntityLinker

HOC para vincular entidades (empresas, pessoas, etc):

- Lista de itens vinculados
- Ações de vincular/desvincular
- Loading state
- Área de rolagem para muitos itens

#### 3. Hooks

##### useCompanyForm

Hook personalizado para gerenciar formulários de empresa:

- Validação integrada
- Carregamento de estados/cidades
- Gestão de estado do formulário
- Submissão e feedback
- Suporte a criação/edição

#### 4. Validação (Zod)

```typescript
const companySchema = z.object({
  name: z.string().min(3),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
  state_id: z.string().uuid(),
  city_id: z.string().uuid(),
  address: z.string().optional(),
});
```

#### 5. Testes

- Testes unitários para hooks
- Cobertura de:
  - Inicialização
  - Carregamento de dados
  - Submissão
  - Estados de loading
  - Validação

#### 6. Funcionalidades

1. **Gestão de Empresas**

   - CRUD completo
   - Validação robusta
   - Feedback visual
   - Campos customizados

2. **Relacionamentos**

   - Vinculação dinâmica
   - Interface intuitiva
   - Gestão de múltiplos vínculos

3. **Localização**

   - Estados/Cidades do Brasil
   - Busca por CEP
   - Endereço completo

4. **UX/UI**
   - Feedback visual
   - Loading states
   - Validação em tempo real
   - Mensagens de erro claras

## 🔐 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase
```

## 🚦 Rotas

- `/` - Seleção de portal
- `/crm/login` - Login do CRM
- `/admin/login` - Login administrativo
- `/partner/login` - Login de parceiros
- `/crm/` - Dashboard
- `/crm/companies` - Gestão de empresas
- `/crm/people` - Gestão de pessoas
- `/crm/tasks` - Gestão de tarefas
- `/crm/settings` - Configurações

## 💾 Estrutura do Banco de Dados

### Tabelas por Domínio

#### 1. Gestão de Clientes e Usuários

- `clients` - Clientes do sistema (multi-tenant)
- `administrators` - Administradores do sistema
- `collaborators` - Colaboradores dos clientes
- `collaborator_invites` - Convites para novos colaboradores
- `licenses` - Licenças dos clientes

#### 2. Empresas e Contatos

- `companies` - Cadastro de empresas
- `company_types` - Tipos de empresas
- `people` - Pessoas/contatos
- `addresses` - Endereços

#### 3. Parceiros

- `partners` - Cadastro de parceiros
- `leads` - Leads gerados

#### 4. Funis e Negócios

- `funnels` - Funis de vendas
- `funnel_stages` - Estágios dos funis
- `deals` - Negócios/oportunidades
- `deal_tags` - Relacionamento entre negócios e tags
- `tags` - Tags para categorização
- `opportunities` - Oportunidades
- `opportunity_categories` - Categorias de oportunidades
- `opportunity_relationships` - Relacionamentos entre oportunidades

#### 5. Gestão de Tarefas

- `tasks` - Tarefas do sistema

#### 6. Campos Customizados

- `field_definitions` - Definições de campos customizados
- `field_values` - Valores dos campos customizados

#### 7. Localização

- `states` - Estados
- `cities` - Cidades

#### 8. Relatórios

- `reports` - Relatórios do sistema

### Relacionamentos Principais

1. **Multi-tenant**:

   - Todas as tabelas possuem `client_id` para isolamento de dados
   - Relacionamento com `clients` para controle de acesso

2. **Empresas e Contatos**:

   - Empresas podem ter múltiplos contatos (`people`)
   - Endereços vinculados a empresas e pessoas

3. **Funis e Negócios**:

   - Funis contêm múltiplos estágios
   - Negócios são associados a estágios e podem ter tags
   - Oportunidades podem ter relacionamentos entre si

4. **Campos Customizados**:
   - Entidades podem ter campos customizados definidos
   - Valores são armazenados separadamente

## 🔄 Fluxos Principais

1. **Cadastro de Empresa**

   - Preenchimento de dados básicos
   - Validação de CNPJ
   - Criação de registro
   - Notificação de sucesso

2. **Gestão de Tarefas**

   - Criação de tarefa
   - Atribuição
   - Acompanhamento
   - Finalização

3. **Autenticação**
   - Seleção de portal
   - Login com credenciais
   - Validação de perfil
   - Redirecionamento para dashboard

## 🚀 Como Executar

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

- Crie um arquivo `.env` na raiz do projeto
- Adicione as variáveis necessárias

4. Execute o projeto:

```bash
npm run dev
```

## 📈 Próximos Passos

- [ ] Implementar gráficos no dashboard
- [ ] Adicionar sistema de notificações
- [ ] Desenvolver área de relatórios
- [ ] Implementar integração com calendário
- [ ] Adicionar sistema de permissões granular
- [ ] Desenvolver API para integrações externas

## 👥 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Arquitetura Multi-tenant

O sistema utiliza uma arquitetura multi-tenant baseada em Row Level Security (RLS) do PostgreSQL, onde:

### 1. Hierarquia de Dados

```
Cliente (client)
  └── Colaboradores (collaborators)
       └── Funis (funnels)
            ├── Estágios (funnel_stages)
            ├── Deals
            └── Tags
```

### 2. Isolamento por Cliente

Cada cliente possui:

- Um registro na tabela `clients`
- Uma licença ativa na tabela `licenses`
- Seus próprios colaboradores em `collaborators`
- Seus próprios funis em `funnels`
- Suas próprias tags em `tags`

### 3. Controle de Acesso

1. **Nível Cliente**:

   - Cada registro em TODAS as tabelas possui um `client_id`
   - O `client_id` é usado para isolar dados entre clientes
   - Políticas RLS garantem que usuários só vejam dados do seu cliente

2. **Nível Colaborador**:

   - Colaboradores são vinculados a um cliente específico
   - O token JWT do usuário contém o `auth.uid()`
   - A tabela `collaborators` mapeia `auth.uid()` para `client_id`

3. **Políticas de Segurança**:
   ```sql
   -- Exemplo de política RLS
   CREATE POLICY "Acesso aos dados do cliente" ON nome_tabela
   FOR ALL USING (
     client_id IN (
       SELECT client_id
       FROM collaborators
       WHERE auth_user_id = auth.uid()
     )
   );
   ```

### 4. Propagação de client_id

1. **Inserção Automática**:

   - Triggers automáticos em tabelas principais
   - Exemplo: Tags herdam `client_id` do funil associado

2. **Validação**:
   - Constraints garantem integridade referencial
   - Foreign keys sempre incluem `client_id`
   - Checks impedem referências entre clientes diferentes

### 5. Exemplo Prático

```plaintext
Cliente A
  ├── Funil 1
  │    ├── Tags: [Tag1, Tag2]
  │    └── Deals: [Deal1, Deal2]
  └── Funil 2
       ├── Tags: [Tag3, Tag4]
       └── Deals: [Deal3]

Cliente B
  └── Funil 1
       ├── Tags: [Tag1] (diferente da Tag1 do Cliente A)
       └── Deals: [Deal1] (diferente do Deal1 do Cliente A)
```

### 6. Benefícios da Estrutura

1. **Segurança**:

   - Isolamento completo entre clientes
   - Impossibilidade de vazamento entre tenants
   - Auditoria facilitada por client_id

2. **Performance**:

   - Índices otimizados por client_id
   - Queries naturalmente particionadas
   - Cache eficiente por tenant

3. **Boas Práticas**
   - Índices otimizados para client_id
   - Triggers para updated_at
   - Validações NOT NULL em campos críticos
4. **Manutenção**:
   - Backups podem ser feitos por cliente
   - Migrações são seguras entre tenants
   - Debugging simplificado com contexto do cliente

## Estrutura do Sistema

### Funis e Deals

O sistema permite criar múltiplos funis de vendas, onde cada funil pertence a um cliente específico. Cada funil contém deals (oportunidades) que podem ser movidas entre diferentes etapas.

### Sistema de Tags

O sistema possui um robusto sistema de tags para categorização de deals:

#### Tabelas Principais:

1. `tags`:

   - Armazena todas as tags disponíveis
   - Cada tag pertence a um funil específico (`funnel_id`)
   - Tags são automaticamente associadas ao cliente do funil (`client_id`)
   - Campos:
     - `id`: UUID - Identificador único
     - `name`: varchar - Nome da tag
     - `description`: text - Descrição opcional
     - `color`: varchar - Cor da tag em formato hex
     - `funnel_id`: UUID - Funil ao qual a tag pertence
     - `client_id`: UUID - Cliente (preenchido automaticamente via trigger)
     - `created_at`: timestamp
     - `updated_at`: timestamp

2. `deal_tags`:
   - Tabela de relacionamento many-to-many entre deals e tags
   - Campos:
     - `deal_id`: UUID - Referência ao deal
     - `tag_id`: UUID - Referência à tag

#### Políticas de Segurança (RLS):

1. Tags:

   - Colaboradores podem ver tags dos clientes aos quais têm acesso
   - Colaboradores podem gerenciar (criar/editar/deletar) tags dos clientes aos quais têm acesso

2. Deal Tags:
   - Colaboradores podem ver relacionamentos de tags dos clientes aos quais têm acesso
   - Colaboradores podem gerenciar relacionamentos de tags dos clientes aos quais têm acesso

#### Funcionalidades:

1. Criação de Tags:

   - Tags são criadas dentro do contexto de um funil
   - O `client_id` é automaticamente preenchido baseado no funil
   - Cada tag pode ter nome, descrição e cor personalizada

2. Associação com Deals:

   - Deals podem ter múltiplas tags
   - Tags podem ser adicionadas/removidas através do DealDialog
   - A interface mostra as tags de forma visual com suas cores

3. Filtragem:
   - Deals podem ser filtrados por tags
   - Tags são exibidas no card do deal para fácil identificação

### Segurança e Permissões

O sistema utiliza Row Level Security (RLS) do PostgreSQL para garantir que:

1. Usuários só podem acessar dados dos clientes aos quais têm permissão
2. Tags são isoladas por cliente, mesmo que em funis diferentes
3. Relacionamentos entre deals e tags respeitam as permissões do usuário

### Componentes Principais

1. `DealDialog`:

   - Interface principal de gerenciamento de deals
   - Gerenciamento de tags
   - Campos customizados do deal

2. `TagSelect`:

   - Componente para seleção e gerenciamento de tags
   - Exibição visual com cores
   - Interface para criar novas tags

3. `useTags` (Hook):

   - Gerenciamento do estado das tags
   - Integração com Supabase para CRUD de tags
   - Cache e otimizações de performance

4. `useFunnel` (Hook):
   - Gerenciamento do estado do funil
   - Integração com sistema de tags
   - CRUD de deals e suas associações

## 🎨 Componentes de UI e Melhores Práticas

### Modais e Diálogos

1. **EditPartnerDialog**:

   - Utiliza o componente base `Dialog` do shadcn/ui
   - Props:
     - `open`: Controla a visibilidade do modal
     - `onOpenChange`: Callback para mudanças de estado
     - `partner`: Dados do parceiro a ser editado
   - Funcionalidades:
     - Fechamento por ESC
     - Fechamento ao clicar fora
     - Botão de fechar minimalista
     - Formulário com validação Zod

2. **Melhores Práticas de UI**:

   - Botões de fechar (X):
     ```tsx
     <Button
       variant="ghost"
       className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 hover:bg-transparent hover:text-red-500 transition-colors"
     >
       <X className="h-4 w-4" />
       <span className="sr-only">Fechar</span>
     </Button>
     ```
   - Centralização de conteúdo
   - Feedback visual em hover states
   - Acessibilidade com `sr-only`
   - Transições suaves

3. **Estado do Modal**:

   ```tsx
   const [isOpen, setIsOpen] = useState(false);

   // Componente
   <Dialog open={isOpen} onOpenChange={setIsOpen}>
     <DialogContent>{/* Conteúdo */}</DialogContent>
   </Dialog>;
   ```

4. **Validação de Formulários**:
   - Uso do React Hook Form com Zod
   - Feedback visual de erros
   - Validação em tempo real
   - Submit apenas com dados válidos

### Boas Práticas de UX

1. **Feedback Visual**:

   - Hover states para interatividade
   - Transições suaves
   - Indicadores de loading
   - Mensagens de sucesso/erro

2. **Acessibilidade**:

   - Labels semânticos
   - Textos para leitores de tela
   - Navegação por teclado
   - Contraste adequado

3. **Performance**:

   - Lazy loading de modais
   - Otimização de re-renders
   - Memoização quando necessário
   - Gestão eficiente de estados

4. **Responsividade**:
   - Layout adaptativo
   - Breakpoints consistentes
   - Mobile-first approach
   - Gestos touch-friendly

## Atualizações Recentes

### Melhorias no Drag and Drop do Funil (07/02/2024)

#### Otimizações de Performance

- Adicionada aceleração por hardware usando `transform-gpu`
- Otimização de re-renders com `willChange`
- Transições suaves com `duration-200` e `ease-in-out`

#### Melhorias Visuais

- Efeito consistente ao arrastar cards:
  - Escala suave (scale-[1.02])
  - Rotação sutil (rotate-1)
  - Sombra elevada (shadow-xl)
- Feedback visual ao passar sobre colunas:
  - Background azul suave
  - Borda sutil com ring
- Transições fluidas em todas as interações

#### Correções de Bugs

- Resolvido problema de "piscar" ao soltar cards
- Corrigida referência à tabela `users` no histórico
- Adicionados índices para melhor performance no banco de dados

#### Boas Práticas Implementadas

- Otimização de cache para reduzir requisições
- Tratamento silencioso de erros não-críticos
- Uso de animações performáticas com GPU

## Validação de CNPJ

A função `validateCNPJ` foi implementada em `src/lib/utils.ts` para validar o formato e os dígitos verificadores do CNPJ. Essa função é utilizada pelo schema de validação (definido com Zod) em `src/features/companies/validation.ts` para garantir que somente CNPJs válidos sejam aceitos nos formulários.

A validação realiza as seguintes etapas:

- Remove caracteres não numéricos
- Verifica se o CNPJ possui 14 dígitos
- Checa se os dígitos não são todos iguais
- Calcula os dígitos verificadores e confirma a validade do CNPJ

### Exemplos de Uso

```typescript
// Validação direta
validateCNPJ("12.345.678/0001-95"); // retorna true/false

// No formulário (via Zod)
const companySchema = z.object({
  document: z.string().refine(validateCNPJ, "CNPJ inválido"),
});
```

## Estrutura do Sistema

### Relacionamentos e Permissões

#### Usuários e Clientes

- Cada usuário está vinculado a um cliente através da tabela `users_clients`
- A tabela `users_clients` contém:
  - `user_id`: ID do usuário (auth.users)
  - `client_id`: ID do cliente (clients)

#### Pessoas

- Ao criar uma nova pessoa, é necessário:
  1. `client_id`: Obtido da tabela `users_clients` usando o ID do usuário logado
  2. `responsavel_id`: ID do usuário logado que está criando a pessoa
  3. Campos obrigatórios:
     - Nome
     - WhatsApp (opcional)
     - Cargo (opcional)

#### Fluxo de Criação de Pessoas

```typescript
// Exemplo de como obter o client_id do usuário logado
const { data: userInfo } = useQuery({
  queryKey: ["user-client", user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from("users_clients")
      .select("client_id")
      .eq("user_id", user?.id)
      .single();
    return data;
  },
});

// Criação da pessoa
await supabase.from("people").insert({
  name: "Nome da Pessoa",
  responsavel_id: user?.id,
  client_id: userInfo.client_id,
  created_at: new Date().toISOString(),
});
```

#### Boas Práticas

1. Sempre verificar se o usuário tem um `client_id` antes de criar registros
2. Usar o React Query para gerenciar o estado e cache das consultas
3. Tratar erros apropriadamente com feedback visual ao usuário
4. Manter a consistência dos dados usando as relações corretas

## Sistema de Gestão de Tarefas

O sistema de gestão de tarefas foi implementado para permitir um acompanhamento eficiente das atividades relacionadas a cada negócio. Principais características:

### Tipos de Tarefas

- Tipos de tarefas personalizáveis armazenados na tabela `task_types`
- Cada tipo possui:
  - Nome descritivo
  - Ícone (usando Lucide React)
  - Cor personalizada
  - Descrição opcional

### Funcionalidades

- Criação, edição e exclusão de tarefas
- Marcação de tarefas como concluídas
- Agendamento com data e hora
- Descrições detalhadas
- Interface intuitiva e responsiva
- Integração com o Supabase para persistência dos dados

### Estrutura do Banco de Dados

```sql
-- Tabela de tipos de tarefas
CREATE TABLE task_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tarefas
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    type_id UUID REFERENCES task_types(id),
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Componentes Principais

- `DealTasksTab`: Interface principal de gerenciamento de tarefas
- `useTasks`: Hook React para interação com o backend
- Tipos TypeScript em `types/tasks.ts`

### Dependências

- `@tanstack/react-query`: Gerenciamento de estado e cache
- `date-fns`: Formatação de datas
- `lucide-react`: Ícones
- `react-hook-form`: Gerenciamento de formulários
- `zod`: Validação de dados

## 🎨 Responsividade Implementada

### Páginas Principais Responsivas

#### 🏠 Home Page

- **Grid responsivo**: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`
- **Cards adaptativos**: Ajuste automático de tamanho e espaçamento
- **Header inteligente**: Estatísticas ocultas em mobile
- **Ações rápidas**: Grid de botões para acesso rápido em mobile

#### 📊 Flow Page (Kanban)

- **Layout dual**:
  - **Mobile**: Layout vertical com scroll, uma coluna por vez
  - **Desktop**: Layout horizontal tradicional com scroll lateral
- **Menu mobile**: Sheet/Drawer com opções principais
- **Cards adaptativos**: Diferentes tamanhos e informações conforme tela
- **Drag & drop**: Funcional em ambos os layouts
- **Botão flutuante**: Para adicionar negócios em mobile

#### ✅ Tasks Page

- **Layouts específicos**:
  - **Mobile**: Cards em coluna única com informações condensadas
  - **Desktop**: Kanban horizontal com três colunas
- **Header responsivo**: Estatísticas visíveis conforme espaço
- **Menu lateral mobile**: Com estatísticas e ações principais
- **TaskColumn adaptativo**: Componente ajusta layout automaticamente

#### 🏢 Companies Page

- **Visualização dupla**:
  - **Mobile**: Cards com informações essenciais e dropdown de ações
  - **Desktop**: Tabela completa com todas as informações
- **Busca responsiva**: Placeholder adaptativo
- **Ações em dropdown**: Menu compacto em mobile, botões em desktop

#### 📈 Dashboard

- **Grid responsivo**: `grid-cols-2 lg:grid-cols-4` para estatísticas
- **Cards adaptativos**: Textos e tamanhos ajustados por tela
- **Layout principal**: Reorganização automática dos blocos
- **Ações rápidas**: Grid especial de cartões para mobile
- **Gráficos responsivos**: Ajuste de número de itens por tela

### 🛠️ Componentes e Hooks

#### `useIsMobile()`

- **Breakpoint**: 768px
- **Hook personalizado** para detecção de mobile
- **Listener de resize**: Atualização automática

#### `useMediaQuery()`

- **Flexível**: Aceita qualquer media query como parâmetro
- **Reativo**: Atualiza automaticamente com mudanças na viewport
- **Usado em**: CompanyPopup para alternar entre Dialog e Drawer

#### Componentes Adaptativos

- **TaskColumn**: Prop `isMobileLayout` para diferentes estilos
- **TaskCard**: Layout compacto em mobile
- **CompanyCard**: Card específico para mobile
- **RecentDeals**: Componente responsivo com prop `isMobile`

### 📱 Padrões de Design Responsivo

#### Grids Responsivos

```css
/* Padrão principal */
grid-cols-2 md:grid-cols-3 lg:grid-cols-4

/* Estatísticas */
grid-cols-2 lg:grid-cols-4

/* Flows e Bases */
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
```

#### Espaçamentos

- **Mobile**: `p-3`, `gap-3`, `space-y-3`
- **Desktop**: `p-4 md:p-6`, `gap-4 md:gap-6`, `space-y-4 md:space-y-6`

#### Tipografia

- **Títulos**: `text-lg md:text-xl`, `text-xl md:text-2xl`
- **Conteúdo**: `text-xs md:text-sm`, `text-sm md:text-base`

#### Navegação Mobile

- **Menu Sheet**: Drawer lateral com navegação principal
- **Botões flutuantes**: Para ações primárias
- **Dropdowns**: Para ações secundárias

### ✨ Melhorias de UX

1. **Touch-friendly**: Botões e áreas clicáveis adequadas para mobile
2. **Performance**: Componentes condicionais evitam renderização desnecessária
3. **Acessibilidade**: Textos legíveis e contrastes adequados
4. **Navegação intuitiva**: Padrões consistentes entre páginas
5. **Loading states**: Estados de carregamento responsivos

## 🔄 Sistema Modular de Flows e Visualizações Duplicadas

### Conceito Revolucionário Modular

Implementamos um sistema **totalmente modular e configurável** onde usuários podem criar flows personalizados com qualquer nome e etapas, mantendo a funcionalidade de **visualizações múltiplas** onde um deal pode existir em múltiplos flows simultaneamente.

### Como Funciona o Sistema Modular

**Criação Totalmente Flexível:**
- ✅ **Flows Personalizados**: Usuários criam flows com qualquer nome e processo
- ✅ **Etapas Modulares**: Definição livre de etapas com nome, cor, tipo e ordem
- ✅ **Templates Reutilizáveis**: 7 templates pré-configurados + possibilidade de salvar novos
- ✅ **Automações Configuráveis**: Sistema de duplicação automática entre qualquer flow
- ✅ **Interface Visual**: FlowBuilder com drag-and-drop para criação intuitiva

### Templates Pré-configurados

**7 Templates Prontos para Uso:**
1. **Vendas Completo**: Lead → Qualificação → Reunião → Proposta → Negociação → Fechamento → Ganho/Perdido
2. **SDR - Prospecção**: Novo Lead → Pesquisa → Primeiro Contato → Follow-up → Reunião Agendada → Qualificado/Não Qualificado
3. **Closer - Vendas**: Reunião Agendada → Reunião Realizada → Proposta → Negociação → Contrato → Assinatura → Fechado/Perdido
4. **Pós-venda**: Boas-vindas → Documentação → Implementação → Treinamento → Go-live → Acompanhamento → Sucesso → Concluído/Cancelado
5. **Suporte ao Cliente**: Ticket Aberto → Triagem → Em Andamento → Aguardando Cliente → Resolvido → Fechado
6. **Gestão de Projetos**: Planejamento → Desenvolvimento → Revisão → Teste → Entrega → Aprovação → Concluído
7. **Flow Simples**: Início → Em Andamento → Concluído

### Automações Modulares Configuráveis

```sql
-- Exemplo: Automação entre flows personalizados criados pelo usuário
INSERT INTO web_flow_automations (source_flow_id, target_flow_id, trigger_stage_id, target_stage_id, automation_type, is_active)
VALUES 
  -- Flow "Meu SDR Personalizado" → Flow "Meu Closer Especializado"
  (user_flow_1, user_flow_2, 'reuniao_agendada', 'inicio_closer', 'duplicate', true),
  -- Flow "Vendas B2B" → Flow "Onboarding Premium"
  (user_flow_3, user_flow_4, 'contrato_assinado', 'boas_vindas', 'duplicate', true);
```

### Funcionalidades Modulares Implementadas

**FlowBuilder Visual:**
- 🎨 Interface drag-and-drop para criação de flows
- ⚙️ Configuração visual de etapas (nome, cor, tipo, ordem)
- 🔄 Configuração de automações entre flows
- 💾 Salvamento de flows como templates reutilizáveis
- 👀 Preview em tempo real do flow sendo criado

**Sistema de Templates:**
- 📋 Templates pré-configurados para casos comuns
- 💾 Salvamento de flows personalizados como templates
- 🏷️ Categorização de templates (sistema/usuário)
- 🔄 Reutilização de templates em novos flows

**Automações Inteligentes:**
- 🎯 Triggers configuráveis (mudança de etapa, tempo, campo)
- 🔄 Tipos de automação (duplicar, mover, notificar)
- ⚡ Execução automática baseada em condições
- 🔗 Sincronização entre visualizações duplicadas

### Benefícios do Sistema Modular

✅ **Flexibilidade Total**: Crie qualquer processo de negócio
✅ **Reutilização**: Templates economizam tempo de configuração
✅ **Escalabilidade**: Sistema cresce com suas necessidades
✅ **Automação**: Duplicação automática mantém sincronização
✅ **Visibilidade**: Controle de acesso por papéis
✅ **Adaptabilidade**: Funciona para qualquer modelo de negócio

### Exemplo Real Modular

**Usuário cria flow "Vendas B2B Personalizado":**
- Etapas: Lead Qualificado → Demo Agendada → Proposta → Negociação → Contrato → Implementação
- Automação: Quando chega em "Contrato" → Duplica para flow "Onboarding Especializado"

**Deal: "Prospect - Empresa ABC"**
- **Flow Principal**: "Vendas B2B Personalizado" em "Proposta"
- **Flow Duplicado**: "Onboarding Especializado" em "Aguardando" (criado automaticamente)
- **Histórico Compartilhado**: Visível em ambos os flows

### Arquivos do Sistema Modular

**Estrutura SQL:**
- `sql/create_modular_flow_system.sql`: Tabelas modulares
- `sql/seed_flow_templates.sql`: Templates pré-configurados

**Hooks React:**
- `src/hooks/useFlowBuilder.ts`: Gestão de criação de flows
- `src/hooks/useFlowViews.ts`: Gestão de visualizações duplicadas

**Componentes:**
- `src/components/flows/FlowBuilder.tsx`: Interface de criação visual
- `src/components/flows/FlowViews.tsx`: Interface de visualizações

### Status: ✅ SISTEMA MODULAR COMPLETO

Sistema **totalmente modular e configurável** com:
- ✅ Criação de flows personalizados
- ✅ Templates pré-configurados e reutilizáveis
- ✅ Interface visual completa (FlowBuilder)
- ✅ Automações configuráveis
- ✅ Duplicação automática funcional
- ✅ Controle de acesso por papéis

**Próximo Passo**: Integração com interface principal para uso em produção.

## Tecnologias Utilizadas

### Frontend

- React 18 com TypeScript
- Vite como bundler
- TailwindCSS para estilização
- React Query para gerenciamento de estado
- React Router para navegação
- Shadcn/ui para componentes base
- React Hook Form para formulários
- React Beautiful DnD para drag and drop
