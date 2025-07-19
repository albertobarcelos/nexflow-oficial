# 🚀 Guia do Sistema Modular de Flows

## 📍 Como Acessar

### 1. **Construtor de Flows** (Criar Flows Personalizados)
- **URL**: `/crm/flows/builder`
- **Menu**: Sidebar → "Construtor de Flows" (ícone Workflow)
- **Função**: Criar flows personalizados com etapas modulares

### 2. **Visualizações de Flows** (Gerenciar Automações)
- **URL**: `/crm/flows/views`
- **Menu**: Sidebar → "Visualizações de Flows" (ícone Eye)
- **Função**: Gerenciar visualizações duplicadas e automações

---

## 🛠️ Como Configurar Etapas do Flow

### No **Construtor de Flows** (`/crm/flows/builder`):

#### **1. Criar Flow do Zero**
1. Acesse o Construtor de Flows
2. Preencha **Nome** e **Descrição** do flow
3. Clique em **"+ Adicionar Etapa"**
4. Configure cada etapa:
   - **Nome**: Ex: "Prospecção", "Proposta", "Fechamento"
   - **Descrição**: Detalhes da etapa
   - **Cor**: Escolha uma cor para identificação visual
   - **Tipo de Etapa**:
     - `active`: Etapa ativa (padrão)
     - `won`: Etapa de vitória/ganho
     - `lost`: Etapa de perda
     - `archived`: Etapa arquivada
   - **Etapa Final**: Marque se é a última etapa do processo

#### **2. Usar Templates Pré-configurados**
1. Selecione um template na seção "Templates Disponíveis":
   - **Vendas Completo**: 7 etapas (Prospecção → Fechamento)
   - **SDR - Prospecção**: 4 etapas focadas em prospecção
   - **Closer - Vendas**: 5 etapas para fechamento
   - **Pós-venda**: 4 etapas de relacionamento
   - **Suporte ao Cliente**: 5 etapas de atendimento
   - **Gestão de Projetos**: 6 etapas de projeto
   - **Flow Simples**: 3 etapas básicas
2. Clique em **"Aplicar Template"**
3. Personalize as etapas conforme necessário

#### **3. Salvar como Template**
- Após criar um flow, você pode salvá-lo como template
- Preencha nome e categoria
- Marque se é template do sistema (admin)

---

## ⚙️ Como Configurar Automações

### No **Construtor de Flows** (`/crm/flows/builder`):

#### **1. Adicionar Automação**
1. Na seção "Automações", clique em **"+ Adicionar Automação"**
2. Configure:
   - **Nome**: Ex: "Duplicar para Pós-venda"
   - **Descrição**: Detalhes da automação
   - **Etapa de Origem**: Selecione a etapa que dispara a automação
   - **Tipo de Automação**:
     - `duplicate`: Duplica o deal para outro flow
     - `move`: Move o deal para outro flow
     - `notify`: Envia notificação
   - **Flow de Destino**: Para onde duplicar/mover (opcional)

#### **2. Tipos de Triggers**
- `stage_change`: Quando deal muda de etapa
- `time_based`: Baseado em tempo
- `field_change`: Quando campo específico muda

### No **Visualizações de Flows** (`/crm/flows/views`):

#### **1. Gerenciar Visualizações Existentes**
- Visualize todas as duplicações ativas
- Sincronize dados entre flows
- Remova visualizações desnecessárias

#### **2. Criar Nova Visualização**
1. Clique em **"+ Nova Visualização"**
2. Selecione:
   - **Deal Original**: Deal que será duplicado
   - **Flow de Destino**: Para onde duplicar
   - **Etapa de Destino**: Etapa inicial no novo flow

#### **3. Filtrar por Papel**
- Visualizações podem ser filtradas por papel do usuário
- Configuração de visibilidade granular

---

## 🎯 Exemplos Práticos

### **Exemplo 1: Flow de Vendas com Pós-venda**
1. Crie flow "Vendas" com etapas: Prospecção → Proposta → Negociação → Fechamento
2. Crie flow "Pós-venda" com etapas: Onboarding → Implementação → Suporte → Renovação
3. Configure automação:
   - **Origem**: Etapa "Fechamento" (tipo `won`)
   - **Tipo**: `duplicate`
   - **Destino**: Flow "Pós-venda", etapa "Onboarding"

### **Exemplo 2: Separação SDR/Closer**
1. Crie flow "SDR" com etapas: Lead → Qualificação → Agendamento
2. Crie flow "Closer" com etapas: Reunião → Proposta → Fechamento
3. Configure automação:
   - **Origem**: Etapa "Agendamento" do flow SDR
   - **Tipo**: `move`
   - **Destino**: Flow "Closer", etapa "Reunião"

---

## 🔧 Funcionalidades Avançadas

### **Templates do Sistema**
- 7 templates pré-configurados
- Podem ser personalizados
- Base para criação rápida

### **Automações Inteligentes**
- Triggers configuráveis
- Sincronização automática de dados
- Notificações personalizadas

### **Controle de Visibilidade**
- Filtros por papel do usuário
- Permissões granulares
- Segurança por cliente

### **Interface Drag & Drop**
- Reordenação visual de etapas
- Interface intuitiva
- Edição em tempo real

---

## 📊 Benefícios

✅ **Flexibilidade**: Crie flows para qualquer processo
✅ **Automação**: Reduza trabalho manual
✅ **Visibilidade**: Acompanhe deals em múltiplos flows
✅ **Eficiência**: Templates aceleram criação
✅ **Controle**: Permissões e filtros avançados
✅ **Integração**: Funciona com sistema existente

---

## 🚀 Próximos Passos

1. **Acesse** `/crm/flows/builder` para criar seu primeiro flow
2. **Experimente** os templates pré-configurados
3. **Configure** automações entre flows
4. **Gerencie** visualizações em `/crm/flows/views`
5. **Personalize** conforme suas necessidades

**Status**: ✅ **SISTEMA COMPLETO E FUNCIONAL**