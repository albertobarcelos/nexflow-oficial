# Refatoração do CompanyPopup

## Motivação

O componente `CompanyPopup.tsx` possui mais de 1600 linhas, o que dificulta a manutenção e compreensão do código. A refatoração visa dividir este componente em partes menores e mais gerenciáveis, seguindo as melhores práticas de desenvolvimento React.

## Estrutura Implementada

### Pasta: `/details/company-popup`

#### Componentes:

1. **index.tsx** - Componente principal que orquestra os demais (antigo CompanyPopup)
2. **CompanyHeader.tsx** - Cabeçalho com informações básicas da empresa
3. **CompanyTabs.tsx** - Sistema de abas para organizar as informações
4. **tabs/**
   - **OverviewTab/**
     - **index.tsx** - Componente principal da aba Visão Geral
     - **ContactCard.tsx** - Card de informações de contato
     - **LocationCard.tsx** - Card de informações de localização
     - **PeopleCard.tsx** - Card de pessoas vinculadas (versão resumida)
   - **PeopleTab/**
     - **index.tsx** - Componente principal da aba Pessoas
     - **PersonCard.tsx** - Card de pessoa vinculada
   - **NotesTab/**
     - **index.tsx** - Componente principal da aba Notas
     - **NotesEditor.tsx** - Editor de notas
     - **NotesViewer.tsx** - Visualizador de notas
   - **AttachmentsTab/**
     - **index.tsx** - Componente principal da aba Anexos
     - **AttachmentCard.tsx** - Card de anexo
     - **AttachmentUploader.tsx** - Componente para upload de anexos

#### Utilitários:

1. **utils.ts** - Funções utilitárias como formatFileSize, getCompanyInitials
2. **types.ts** - Tipos e interfaces compartilhados
3. **hooks.ts** - Hooks personalizados para queries e estados

## Status da Refatoração

✅ Concluído:
- Estrutura de pastas e arquivos criada
- Componentes extraídos e implementados
- Tipos e interfaces definidos
- Hooks personalizados implementados
- Funções utilitárias extraídas
- Componente original atualizado para usar a nova estrutura
- Hook `use-media-query` implementado para suporte à responsividade

## Benefícios Alcançados

- **Manutenibilidade**: Componentes menores são mais fáceis de manter e entender
- **Reusabilidade**: Componentes isolados podem ser reutilizados em outros contextos
- **Testabilidade**: Facilita a escrita de testes unitários
- **Performance**: Possibilita otimizações de renderização mais granulares
- **Colaboração**: Facilita o trabalho em equipe, pois diferentes desenvolvedores podem trabalhar em diferentes componentes

## Melhorias Futuras

1. Adicionar testes unitários para cada componente
2. Implementar memoização para otimizar renderizações
3. Adicionar documentação detalhada com Storybook
4. Revisar acessibilidade dos componentes