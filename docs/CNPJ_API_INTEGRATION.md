# Integração da API de CNPJ - Sistema de Preenchimento Automático

## Visão Geral
Sistema robusto de consulta automática de CNPJ que preenche automaticamente os campos do formulário de empresas. Utiliza múltiplas APIs com sistema de fallback para garantir alta disponibilidade.

## Campos Preenchidos Automaticamente
Ao sair do campo CNPJ (onBlur), o sistema consulta as APIs e preenche:

### Dados da Empresa
- **Razão Social** (`razao_social`)
- **Nome Fantasia** (`name`)

### Localização
- **Estado** (`state_id`) - busca automática no banco
- **Cidade** (`city_id`) - busca automática no banco
- **CEP** (`address.cep`)
- **Rua** (`address.rua`)
- **Número** (`address.numero`)
- **Complemento** (`address.complemento`)
- **Bairro** (`address.bairro`)

### Contato
- **Email** (`email`)
- **WhatsApp** (`whatsapp`)
- **Celular** (`celular`)

## Arquivos Implementados

### 1. `src/hooks/useCnpjApi.ts`
Hook principal para consulta de CNPJ com:
- **Múltiplas APIs**: BrasilAPI (principal), ReceitaWS, CNPJ.ws
- **Sistema de Fallback**: Tenta APIs em sequência até obter sucesso
- **Validação de CNPJ**: Algoritmo completo de validação
- **Tratamento de Erros**: Logs detalhados e feedback ao usuário
- **Adaptadores**: Normaliza respostas de diferentes APIs

### 2. `src/utils/locationUtils.ts`
Utilitário para busca de localização:
- **Busca por UF e Município**: Encontra IDs no Supabase
- **Normalização**: Remove acentos e padroniza nomes
- **Cache**: Otimização de consultas repetidas

### 3. `src/components/crm/CompanyForm.tsx`
Formulário integrado com:
- **Evento onBlur**: Dispara consulta ao sair do campo CNPJ
- **Feedback Visual**: Spinner e texto "Consultando..." durante carregamento
- **Preenchimento Automático**: Popula todos os campos relacionados
- **Expansão Automática**: Abre seção de endereço quando dados são encontrados

## Instruções de Uso

1. **Acesse** o formulário de Nova Empresa
2. **Digite** um CNPJ válido no campo correspondente
3. **Saia do campo** (Tab, Enter ou clique fora)
4. **Aguarde** o carregamento (indicador visual aparece)
5. **Verifique** os campos preenchidos automaticamente

## Regras de Negócio

### Validação de CNPJ
- Formato: 14 dígitos numéricos
- Algoritmo de validação completo
- Rejeita CNPJs com dígitos repetidos

### Sistema de APIs (Ordem de Prioridade)
1. **BrasilAPI** - API principal, mais confiável
2. **ReceitaWS** - API alternativa
3. **CNPJ.ws** - API de backup

### Tratamento de Erros
- **CORS**: Configuração adequada de headers
- **Timeout**: Tentativa em múltiplas APIs
- **Dados Incompletos**: Validação de campos essenciais
- **Feedback**: Mensagens claras ao usuário

## Feedback Visual

### Durante Carregamento
- Campo CNPJ desabilitado
- Spinner ao lado do label
- Texto "Consultando..." exibido

### Sucesso
- Toast verde: "Dados da empresa encontrados via [API]!"
- Campos preenchidos automaticamente
- Seção de endereço expandida

### Erro
- Toast vermelho com mensagem específica
- Campo CNPJ reabilitado
- Logs detalhados no console

## Configuração Técnica

### APIs Utilizadas
```typescript
// BrasilAPI (Principal)
https://brasilapi.com.br/api/cnpj/v1/{cnpj}

// ReceitaWS (Alternativa)
https://www.receitaws.com.br/v1/cnpj/{cnpj}

// CNPJ.ws (Backup)
https://www.cnpj.ws/cnpj/{cnpj}
```

### Headers de Requisição
```typescript
{
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  mode: 'cors'
}
```

## Exemplo de Uso

```typescript
// Hook de consulta
const { consultarCnpj, isLoading: isLoadingCnpj } = useCnpjApi();

// Função de consulta
const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
  const cnpj = e.target.value;
  if (cnpj && cnpj.replace(/\D/g, '').length === 14) {
    const data = await consultarCnpj(cnpj);
    if (data) {
      // Preencher campos automaticamente
      setValue('razao_social', data.nome);
      setValue('name', data.fantasia || data.nome);
      // ... outros campos
    }
  }
};
```

## Limitações Conhecidas

### APIs Externas
- Dependem de conectividade com internet
- Podem ter limitações de rate limiting
- Sujeitas a instabilidades temporárias

### Dados
- Nem todos os CNPJs possuem dados completos
- Algumas empresas podem não ter telefone/email público
- Endereços podem estar desatualizados

## Melhorias Implementadas (v2.0)

### Robustez
- ✅ **Múltiplas APIs**: Sistema de fallback com 3 APIs
- ✅ **Logs Detalhados**: Console logs para debugging
- ✅ **Validação Rigorosa**: Verificação de dados essenciais
- ✅ **Headers CORS**: Configuração adequada para evitar bloqueios

### Performance
- ✅ **Tentativas Sequenciais**: Para em caso de sucesso
- ✅ **Adaptadores Otimizados**: Normalização eficiente de dados
- ✅ **Feedback Imediato**: Indicadores visuais responsivos

### Experiência do Usuário
- ✅ **Mensagens Específicas**: Indica qual API foi utilizada
- ✅ **Tratamento de Erros**: Mensagens claras e acionáveis
- ✅ **Preenchimento Inteligente**: Expansão automática de seções

## Plano de Manutenção

### Monitoramento
- Verificar logs de erro regularmente
- Monitorar taxa de sucesso das APIs
- Acompanhar feedback dos usuários

### Atualizações
- Adicionar novas APIs conforme disponibilidade
- Otimizar algoritmos de validação
- Melhorar tratamento de casos edge

### Testes
- Testar com CNPJs de diferentes tipos de empresa
- Validar comportamento em cenários de erro
- Verificar performance em diferentes conexões

---

**Última atualização**: Dezembro 2024  
**Versão**: 2.0 - Sistema Multi-API com Fallback Robusto