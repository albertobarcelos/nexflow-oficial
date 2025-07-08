# 🔗 Sistema de Vinculação de Entidades aos Flows

## 📋 Visão Geral

O sistema de vinculação de entidades permite configurar quais bases de dados (entidades) estarão disponíveis em cada flow do CRM. Esta funcionalidade é essencial para organizar e estruturar os dados de forma lógica e eficiente.

## 🎯 Funcionalidades Implementadas

### ✅ **Modal de Configuração de Entidades**
- Interface moderna e intuitiva dividida em dois painéis
- Painel esquerdo: Entidades disponíveis para vinculação
- Painel direito: Entidades já vinculadas ao flow
- Funcionalidade de drag & drop para reordenação (em desenvolvimento)

### ✅ **Pesquisa e Filtros**
- Barra de pesquisa para filtrar entidades por nome ou descrição
- Contadores dinâmicos de entidades disponíveis e vinculadas
- Indicadores visuais para entidades já vinculadas

### ✅ **Configurações Avançadas**
- **Entidade Principal**: Marca uma entidade como prioritária no formulário
- **Obrigatório**: Define se a entidade deve ser preenchida obrigatoriamente
- **Modo Avançado**: Toggle para mostrar/ocultar configurações detalhadas

### ✅ **Gestão de Entidades**
- Vincular novas entidades com um clique
- Desvincular entidades existentes
- Ícones e cores automáticas baseadas no tipo de entidade
- Validação para evitar duplicatas

## 🏗️ Arquitetura Técnica

### **Componentes Principais**

#### `FlowBasesConfigModal.tsx`
Modal principal para configuração de entidades com:
- Interface responsiva e moderna
- Drag & drop context para reordenação
- Estados de loading e error handling
- Validações em tempo real

#### `useFlowBases.ts`
Hook personalizado que gerencia:
- Busca de entidades disponíveis
- Entidades vinculadas ao flow
- Operações de CRUD (vincular/desvincular/atualizar)
- Cache e invalidação de queries

#### `FlowBasesTestButton.tsx`
Componente de teste para demonstrar a funcionalidade

### **Estrutura de Dados**

```typescript
interface DatabaseBase {
  id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  color?: string;
  is_system: boolean;
  is_active: boolean;
}

interface FlowBase {
  id: string;
  flow_id: string;
  entity_id: string;
  is_required: boolean;
  is_primary: boolean;
  order_index: number;
  entity?: DatabaseBase;
}
```

### **Integração com Supabase**

Por enquanto, as configurações são armazenadas temporariamente no campo `description` da tabela `web_flows` como JSON. Em produção, seria recomendado criar uma tabela dedicada:

```sql
-- Tabela futura para configurações de entidades
CREATE TABLE web_flow_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES web_flows(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES web_entities(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(flow_id, entity_id)
);
```

## 🎨 Interface do Usuário

### **Design System**
- Seguindo padrões do Shadcn/UI
- Cores semânticas para diferentes tipos de entidade
- Ícones contextuais (Lucide React)
- Estados de loading e feedback visual

### **Responsividade**
- Layout adaptativo para desktop e mobile
- Grid responsivo (1 coluna em mobile, 2 em desktop)
- Componentes otimizados para touch

### **Acessibilidade**
- Labels semânticos
- Suporte a navegação por teclado
- Estados de foco visíveis
- Feedback para screen readers

## 🚀 Como Usar

### **1. Acessar Configurações**
```tsx
// No FormBuilderModal
<Button onClick={() => setBasesConfigOpen(true)}>
  <Database className="w-4 h-4 mr-2" />
  Configurar Bases
</Button>
```

### **2. Vincular Entidade**
1. Abrir o modal de configuração
2. Selecionar entidade no dropdown
3. Clicar em "Vincular"
4. Configurar como obrigatória/principal se necessário

### **3. Gerenciar Vinculações**
- **Reordenar**: Arrastar e soltar (em desenvolvimento)
- **Configurar**: Usar toggles de obrigatório/principal
- **Remover**: Botão de lixeira em cada entidade

## 📊 Entidades Padrão

O sistema inclui 5 tipos de entidades pré-configuradas:

| Entidade | Ícone | Cor | Descrição |
|----------|-------|-----|-----------|
| **Empresas** | Building2 | Azul | Empresas e organizações |
| **Pessoas** | Users | Verde | Contatos e pessoas físicas |
| **Parceiros** | Handshake | Laranja | Parceiros de negócio |
| **Cursos** | GraduationCap | Roxo | Programas educacionais |
| **Imóveis** | Home | Vermelho | Portfólio imobiliário |

## 🔧 Configurações Avançadas

### **Entidade Principal**
- Apenas uma entidade pode ser principal por flow
- Aparece como campo prioritário nos formulários
- Automaticamente marcada como obrigatória

### **Entidades Obrigatórias**
- Devem ser preenchidas para criar um deal
- Validação no frontend e backend
- Feedback visual para usuário

### **Ordem de Exibição**
- Define sequência nos formulários
- Navegação no sidebar do flow
- Drag & drop para reordenar (futuro)

## 🧪 Como Testar

### **1. Via Página Overview**
1. Navegar para `/crm/overview`
2. Procurar seção "Configurar Entidades"
3. Clicar em "Configurar Entidades" para qualquer flow
4. Testar vinculação/desvinculação

### **2. Via Configurações do Flow**
1. Entrar em qualquer flow
2. Clicar no ícone de configurações (⚙️)
3. Ir para aba "Formulário Inicial"
4. Clicar em "Configurar Bases"

## 🔮 Roadmap Futuro

### **Próximas Funcionalidades**
- [ ] Drag & drop funcional para reordenação
- [ ] Campos personalizados por entidade
- [ ] Validações condicionais
- [ ] Templates de configuração
- [ ] Importação/exportação de configurações

### **Melhorias Técnicas**
- [ ] Migração para tabela dedicada no banco
- [ ] Cache avançado com React Query
- [ ] Otimização de performance
- [ ] Testes automatizados
- [ ] Documentação da API

## 🐛 Problemas Conhecidos

1. **Reordenação**: Drag & drop mostra toast mas não persiste a ordem
2. **Configurações**: Toggles de obrigatório/principal são simulados
3. **Dados Mock**: Usando dados estáticos até criar tabela real

## 📝 Notas de Desenvolvimento

### **Decisões Arquiteturais**
- Uso do React Query para cache e sincronização
- Componentes modulares e reutilizáveis
- Separação clara entre UI e lógica de negócio
- TypeScript para type safety

### **Padrões de Código**
- Hooks personalizados para lógica complexa
- Componentes controlados vs não-controlados
- Error boundaries para tratamento de erros
- Lazy loading para performance

---

## 👥 Contribuição

Para contribuir com melhorias:

1. Seguir padrões estabelecidos
2. Adicionar testes para novas funcionalidades
3. Documentar mudanças significativas
4. Revisar impacto em outros componentes

---

**Status**: ✅ Funcional para demonstração | 🚧 Em desenvolvimento para produção 