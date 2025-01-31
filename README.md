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
├── hooks/             # Hooks customizados
├── layouts/           # Layouts da aplicação
├── lib/              # Bibliotecas e configurações
├── pages/            # Páginas da aplicação
│   ├── auth/         # Páginas de autenticação
│   └── crm/          # Páginas do CRM
├── types/            # Definições de tipos
└── utils/            # Funções utilitárias
```

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
   - Interface para visualização e edição de deals
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
   <Dialog 
     open={isOpen} 
     onOpenChange={setIsOpen}
   >
     <DialogContent>
       {/* Conteúdo */}
     </DialogContent>
   </Dialog>
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
