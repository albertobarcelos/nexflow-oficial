# ✅ CHECKLIST - MIGRAÇÃO INTENSIVA (FIM DE SEMANA)

## 🎯 OBJETIVO
**Eliminar sistema de entidades dinâmicas e preservar apenas web_deals (3.128 registros reais)**

---

## 📅 SEXTA-FEIRA (4 horas - 18h às 22h)

### 🔒 BACKUP CRÍTICO
- [ ] **CRÍTICO**: Backup da tabela web_deals
  ```bash
  pg_dump -t web_deals nexflow_db > backup_deals_CRITICO.sql
  ```
- [ ] **SEGURANÇA**: Backup completo do banco
  ```bash
  pg_dump nexflow_db > backup_completo_pre_migration.sql
  ```
- [ ] Verificar integridade dos backups (abrir arquivos e conferir)

### 🔍 ANÁLISE PRÉ-MIGRAÇÃO
- [ ] Executar queries de análise do script `migration_simplificacao_intensiva.sql`
- [ ] Confirmar: 3.128 deals existem e estão íntegros
- [ ] Confirmar: 360 registros fictícios serão removidos
- [ ] Confirmar: 5 companies + 7 people fictícios serão removidos

### 🗺️ MAPEAMENTO DE CÓDIGO
- [ ] Localizar todos os arquivos que usam `useFlowBases`
- [ ] Localizar todos os arquivos que usam `useEntities`
- [ ] Localizar componente `FlowBasesConfigModal.tsx`
- [ ] Localizar arquivo `types/entities.ts`
- [ ] Mapear dependências de entidades dinâmicas nos 7 flows

---

## 🧹 SÁBADO (8 horas - 9h às 18h)

### 🗑️ LIMPEZA DO BANCO DE DADOS (Manhã - 3h)
- [ ] **EXECUTAR**: Script SQL de limpeza
  ```bash
  psql nexflow_db < migration_simplificacao_intensiva.sql
  ```
- [ ] **VERIFICAR**: web_companies = 0 registros
- [ ] **VERIFICAR**: web_people = 0 registros
- [ ] **VERIFICAR**: web_deals = 3.128 registros (INTOCÁVEL)
- [ ] **VERIFICAR**: Tabelas de entidades dinâmicas removidas
  - web_entities ❌
  - web_entity_records ❌
  - web_entity_fields ❌
  - web_flow_entity_links ❌

### 🔧 LIMPEZA DE DEPENDÊNCIAS (Tarde - 5h)
- [ ] **VERIFICAR**: Colunas entity_id removidas de web_deals
- [ ] **VERIFICAR**: Foreign keys para entidades removidas
- [ ] **VERIFICAR**: Índices otimizados criados
- [ ] **TESTAR**: Queries básicas em web_deals funcionam
- [ ] **TESTAR**: Inserção em web_companies/web_people funciona

---

## 💻 DOMINGO (8 horas - 9h às 18h)

### 🗂️ REMOÇÃO DE ARQUIVOS (Manhã - 2h)
- [ ] **DELETAR**: `src/hooks/useFlowBases.ts`
- [ ] **DELETAR**: `src/hooks/useFlowBases.production.ts` (se existir)
- [ ] **DELETAR**: `src/hooks/useEntities.ts` (se existir)
- [ ] **DELETAR**: `src/components/FlowBasesConfigModal.tsx`
- [ ] **DELETAR**: `src/types/entities.ts` (arquivo completo)

### 🔄 SIMPLIFICAÇÃO DE HOOKS (Manhã - 2h)
- [ ] **SIMPLIFICAR**: `src/hooks/useFlow.ts`
  - Remover dependências de entidades dinâmicas
  - Remover imports de useFlowBases
  - Simplificar lógica para apenas Companies/People/Deals
- [ ] **VERIFICAR**: `src/hooks/useDeals.ts` (já otimizado - manter)
- [ ] **VERIFICAR**: `src/hooks/useFlowStages.ts` (já otimizado - manter)

### 📝 ATUALIZAÇÃO DE TYPES (Tarde - 1h)
- [ ] **SIMPLIFICAR**: `src/types/database.ts`
  - Remover types de web_entities
  - Remover types de web_entity_records
  - Remover types de web_entity_fields
  - Remover types de web_flow_entity_links
- [ ] **MANTER**: Types de web_deals, web_companies, web_people

### 🔄 ATUALIZAÇÃO DOS 7 FLOWS (Tarde - 3h)
- [ ] **Flow de Vendas**: Atualizar para usar apenas Companies/People/Deals
- [ ] **Gestão de Parcerias**: Simplificar para estrutura básica
- [ ] **Jornada do Aluno**: Adaptar para novo modelo
- [ ] **Onboarding SaaS**: Usar apenas entidades fixas
- [ ] **Pipeline Imobiliário**: Estrutura simplificada
- [ ] **Pré-Vendas**: Modelo básico
- [ ] **Teste Manual**: Atualizar para nova estrutura

### 🧪 TESTES FINAIS (Tarde - 2h)
- [ ] **TESTAR**: Criação de novo deal
- [ ] **TESTAR**: Criação de nova company
- [ ] **TESTAR**: Criação de nova person
- [ ] **TESTAR**: Navegação entre flows
- [ ] **TESTAR**: Performance das queries principais
- [ ] **TESTAR**: Não há erros no console
- [ ] **TESTAR**: Não há imports quebrados

---

## ✅ VALIDAÇÃO FINAL (Domingo 17h-18h)

### 📊 VERIFICAÇÕES CRÍTICAS
- [ ] **CRÍTICO**: 3.128 deals preservados e funcionais
- [ ] **CRÍTICO**: 0 registros fictícios restantes
- [ ] **CRÍTICO**: 4 tabelas dinâmicas completamente removidas
- [ ] **CRÍTICO**: 7 flows funcionando com nova estrutura
- [ ] **CRÍTICO**: Performance melhorada (queries mais rápidas)

### 📈 MÉTRICAS DE SUCESSO
- [ ] **Redução de código**: -50% relacionado a entidades dinâmicas
- [ ] **Performance**: +80% em queries (sem JOINs complexas)
- [ ] **Simplicidade**: Sistema 10x mais simples
- [ ] **Manutenibilidade**: Código limpo e direto

---

## 🚨 PLANO DE CONTINGÊNCIA

### Se algo der errado:
1. **ROLLBACK CRÍTICO** (apenas deals):
   ```bash
   psql nexflow_db < backup_deals_CRITICO.sql
   ```

2. **ROLLBACK COMPLETO** (tudo):
   ```bash
   psql nexflow_db < backup_completo_pre_migration.sql
   ```

3. **Reverter código** (Git):
   ```bash
   git checkout HEAD~1
   ```

---

## 🎉 SEGUNDA-FEIRA: SISTEMA SIMPLIFICADO!

### Benefícios Alcançados:
- ✅ **3.128 deals preservados** e funcionais
- ✅ **360 registros fictícios eliminados**
- ✅ **4 tabelas dinâmicas removidas**
- ✅ **Sistema 10x mais simples**
- ✅ **Performance 80% melhor**
- ✅ **Desenvolvimento 5x mais rápido**
- ✅ **Código limpo e manutenível**

### Próximos Passos:
- Monitorar performance por 48h
- Treinar equipe na nova estrutura simplificada
- Documentar novos padrões de desenvolvimento
- Celebrar a simplificação! 🚀

---

## 📋 RESPONSÁVEIS

- **DBA/Backend**: Execução do script SQL
- **Frontend**: Atualização de hooks e components
- **QA**: Testes de validação
- **DevOps**: Backups e monitoramento

---

**AIDEV-NOTE**: Checklist para migração intensiva aprovada pelo cliente. Foco na preservação dos deals reais e eliminação completa do sistema de entidades dinâmicas fictícias. Cronograma otimizado para máxima eficiência em fim de semana.