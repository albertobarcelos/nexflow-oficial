# Integração com Revalya - Sistema de Comissões

## 📋 Visão Geral

Esta documentação descreve como configurar a integração entre o **Revalya** (sistema financeiro) e o **Nexflow** para cálculo automático de comissões baseado em pagamentos recebidos.

**Fluxo Principal:**
```
Revalya → Webhook → Nexflow → Cálculo de Comissão → Distribuição para Time
```

### Arquivo de Exemplo

Para referência rápida, consulte: [`INTEGRACAO_REVALYA_EXEMPLO.json`](./INTEGRACAO_REVALYA_EXEMPLO.json)

---

## ⚡ Resumo Rápido para Implementação

### Configuração Básica

| Item | Valor |
|------|-------|
| **URL** | `https://[SEU-PROJETO].supabase.co/functions/v1/revalya-webhook` |
| **Método** | `POST` |
| **Content-Type** | `application/json` |
| **Authorization** | `Bearer {REVALYA_WEBHOOK_SECRET}` |

### Payload Mínimo Obrigatório

```json
{
  "event": "payment.received",
  "payment_id": "ID-UNICO-REVALYA",
  "card_id": "UUID-DO-CARD-NEXFLOW",
  "amount": 10000.00,
  "payment_date": "2025-01-27",
  "payment_method": "pix",
  "status": "confirmed"
}
```

### Quando Enviar

- ✅ Quando um pagamento é **recebido e confirmado** (`status: "confirmed"`)
- ✅ Quando o status muda de `pending` → `confirmed`
- ✅ Quando há atualização de valor ou data

### O que Acontece

1. Nexflow recebe o webhook
2. Valida autenticação e dados
3. Cria/atualiza registro de pagamento
4. **Se `status = "confirmed"`**: Calcula comissão automaticamente
5. Distribui comissão entre membros do time

---

## 🔗 Configuração do Webhook

### URL do Endpoint

```
https://[SEU-PROJETO].supabase.co/functions/v1/revalya-webhook
```

**Exemplo:**
```
https://abcdefghijklmnop.supabase.co/functions/v1/revalya-webhook
```

> **Nota:** Substitua `[SEU-PROJETO]` pelo identificador do seu projeto Supabase.

### Método HTTP

```
POST
```

### Headers Obrigatórios

| Header | Valor | Descrição |
|--------|-------|-----------|
| `Content-Type` | `application/json` | Tipo de conteúdo |
| `Authorization` | `Bearer {REVALYA_WEBHOOK_SECRET}` | Token de autenticação |

**Exemplo:**
```
Content-Type: application/json
Authorization: Bearer seu_token_secreto_aqui
```

> **Importante:** O token deve ser configurado no Supabase como variável de ambiente `REVALYA_WEBHOOK_SECRET` nas Edge Functions.

---

## 📦 Estrutura do Payload

### Formato JSON

O Revalya deve enviar um objeto JSON no corpo da requisição com a seguinte estrutura:

```json
{
  "event": "payment.received",
  "payment_id": "REV-2025-001234",
  "card_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 10000.00,
  "payment_date": "2025-01-27",
  "payment_method": "pix",
  "status": "confirmed",
  "metadata": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "installment_number": 1,
    "total_installments": 12,
    "customer_name": "João Silva",
    "customer_document": "123.456.789-00"
  }
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `event` | `string` | Tipo de evento (sempre `"payment.received"`) | `"payment.received"` |
| `payment_id` | `string` | ID único do pagamento no Revalya | `"REV-2025-001234"` |
| `card_id` | `string` | UUID do card no Nexflow (deve estar em `metadata` ou no campo raiz) | `"550e8400-e29b-41d4-a716-446655440000"` |
| `amount` | `number` | Valor do pagamento recebido (em centavos ou reais) | `10000.00` |
| `payment_date` | `string` | Data do recebimento (formato ISO: `YYYY-MM-DD`) | `"2025-01-27"` |
| `payment_method` | `string` | Método de pagamento | `"pix"`, `"boleto"`, `"credit_card"`, etc. |
| `status` | `string` | Status do pagamento | `"confirmed"`, `"pending"`, `"cancelled"`, `"refunded"` |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `metadata` | `object` | Dados adicionais do pagamento | Ver seção abaixo |
| `metadata.card_id` | `string` | UUID do card (alternativa ao campo raiz) | `"550e8400-e29b-41d4-a716-446655440000"` |
| `metadata.installment_number` | `number` | Número da parcela (se parcelado) | `1` |
| `metadata.total_installments` | `number` | Total de parcelas | `12` |
| `metadata.customer_name` | `string` | Nome do cliente | `"João Silva"` |
| `metadata.customer_document` | `string` | CPF/CNPJ do cliente | `"123.456.789-00"` |

---

## 📝 Exemplos de Payloads

### Exemplo 1: Pagamento Único Confirmado (PIX)

```json
{
  "event": "payment.received",
  "payment_id": "REV-2025-001234",
  "card_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 5000.00,
  "payment_date": "2025-01-27",
  "payment_method": "pix",
  "status": "confirmed",
  "metadata": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_name": "Maria Santos",
    "customer_document": "987.654.321-00"
  }
}
```

### Exemplo 2: Pagamento Parcelado (Cartão de Crédito)

```json
{
  "event": "payment.received",
  "payment_id": "REV-2025-001235",
  "card_id": "550e8400-e29b-41d4-a716-446655440001",
  "amount": 1000.00,
  "payment_date": "2025-01-27",
  "payment_method": "credit_card",
  "status": "confirmed",
  "metadata": {
    "card_id": "550e8400-e29b-41d4-a716-446655440001",
    "installment_number": 1,
    "total_installments": 12,
    "customer_name": "Pedro Oliveira",
    "customer_document": "111.222.333-44"
  }
}
```

### Exemplo 3: Pagamento Pendente (Boleto)

```json
{
  "event": "payment.received",
  "payment_id": "REV-2025-001236",
  "card_id": "550e8400-e29b-41d4-a716-446655440002",
  "amount": 3000.00,
  "payment_date": "2025-01-27",
  "payment_method": "boleto",
  "status": "pending",
  "metadata": {
    "card_id": "550e8400-e29b-41d4-a716-446655440002",
    "barcode": "34191.09008 01234.567890 12345.678901 2 98760000030000"
  }
}
```

### Exemplo 4: Atualização de Status (Confirmação Posterior)

```json
{
  "event": "payment.received",
  "payment_id": "REV-2025-001236",
  "card_id": "550e8400-e29b-41d4-a716-446655440002",
  "amount": 3000.00,
  "payment_date": "2025-01-28",
  "payment_method": "boleto",
  "status": "confirmed",
  "metadata": {
    "card_id": "550e8400-e29b-41d4-a716-446655440002",
    "previous_status": "pending"
  }
}
```

### Exemplo 5: Pagamento Cancelado/Estornado

```json
{
  "event": "payment.received",
  "payment_id": "REV-2025-001234",
  "card_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 5000.00,
  "payment_date": "2025-01-27",
  "payment_method": "pix",
  "status": "refunded",
  "metadata": {
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "refund_reason": "Solicitação do cliente"
  }
}
```

---

## 🔄 Fluxo de Processamento

### 1. Recebimento do Webhook

O Nexflow recebe a requisição do Revalya e valida:
- ✅ Token de autenticação
- ✅ Estrutura do payload
- ✅ Presença do `card_id`

### 2. Busca do Card

O sistema busca o card no banco de dados:
- Verifica se o card existe
- Obtém `client_id` e `assigned_team_id`
- Verifica se o card está completo (`status = 'completed'`)

### 3. Criação/Atualização do Pagamento

- Se `payment_id` já existe: **Atualiza** o pagamento existente
- Se `payment_id` não existe: **Cria** novo registro em `web_payments`

### 4. Cálculo de Comissão (Apenas se `status = "confirmed"`)

Se o pagamento está confirmado:
- Busca itens do card (`nexflow.card_items`)
- Para cada item, busca comissão configurada do time
- Calcula valor da comissão (percentual ou fixo)
- Distribui entre membros do time baseado em níveis hierárquicos
- Cria registros em `core_commission_calculations` e `core_commission_distributions`

### 5. Resposta ao Revalya

**Sucesso (200):**
```json
{
  "success": true,
  "payment_id": "uuid-do-pagamento-criado",
  "commission_calculated": true
}
```

**Erro (400/404/500):**
```json
{
  "error": "Mensagem de erro descritiva"
}
```

---

## 🔐 Autenticação

### Configuração no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Settings** → **Edge Functions** → **Secrets**
3. Adicione a variável:
   - **Name:** `REVALYA_WEBHOOK_SECRET`
   - **Value:** Seu token secreto (ex: `rev_sk_live_abc123xyz...`)

### Configuração no Revalya

No sistema Revalya, configure o webhook com:
- **URL:** `https://[SEU-PROJETO].supabase.co/functions/v1/revalya-webhook`
- **Método:** `POST`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {REVALYA_WEBHOOK_SECRET}`

---

## ⚠️ Tratamento de Erros

### Erros Comuns e Respostas

| Código | Erro | Causa | Solução |
|--------|------|-------|----------|
| `401` | `Unauthorized` | Token inválido ou ausente | Verificar `Authorization` header |
| `400` | `card_id não encontrado no payload` | Campo `card_id` ausente | Incluir `card_id` no payload ou `metadata.card_id` |
| `404` | `Card não encontrado` | Card não existe no Nexflow | Verificar se o UUID do card está correto |
| `500` | `Erro desconhecido` | Erro interno do servidor | Verificar logs do Supabase |

### Logs de Integração

Todos os eventos são registrados em `revalya_integration_log`:
- ✅ Sucessos: `status = "success"`
- ❌ Erros: `status = "error"` com `error_message`

---

## 📊 Status de Pagamento

### Valores Aceitos

| Status | Descrição | Ação no Nexflow |
|--------|-----------|-----------------|
| `pending` | Pagamento pendente | Registra pagamento, **não calcula comissão** |
| `confirmed` | Pagamento confirmado | Registra pagamento e **calcula comissão** |
| `cancelled` | Pagamento cancelado | Registra status, não calcula comissão |
| `refunded` | Pagamento estornado | Registra status, pode reverter comissão (futuro) |

> **Importante:** A comissão **só é calculada** quando `status = "confirmed"`.

---

## 🔄 Idempotência

O sistema é **idempotente**:
- Se o mesmo `payment_id` (Revalya) for enviado múltiplas vezes, o pagamento será **atualizado** ao invés de duplicado
- Isso permite reenvios seguros em caso de falha de rede

---

## 📋 Checklist de Implementação no Revalya

- [ ] Configurar URL do webhook no Revalya
- [ ] Configurar token de autenticação (`REVALYA_WEBHOOK_SECRET`)
- [ ] Implementar envio de payload quando pagamento é recebido
- [ ] Implementar envio de payload quando status muda (pending → confirmed)
- [ ] Incluir `card_id` no payload (raiz ou `metadata.card_id`)
- [ ] Testar com pagamento de teste
- [ ] Verificar logs no Supabase (`revalya_integration_log`)

---

## 🧪 Testando a Integração

### 1. Teste Manual com cURL

```bash
curl -X POST \
  https://[SEU-PROJETO].supabase.co/functions/v1/revalya-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_secreto" \
  -d '{
    "event": "payment.received",
    "payment_id": "TEST-001",
    "card_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 1000.00,
    "payment_date": "2025-01-27",
    "payment_method": "pix",
    "status": "confirmed",
    "metadata": {
      "card_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }'
```

### 2. Verificar Logs

No Supabase Dashboard:
1. Vá em **Edge Functions** → **Logs**
2. Verifique se a função `revalya-webhook` foi executada
3. Verifique a tabela `revalya_integration_log` no banco

### 3. Verificar Pagamento Criado

```sql
SELECT * FROM web_payments 
WHERE revalya_payment_id = 'TEST-001';
```

### 4. Verificar Comissão Calculada

```sql
SELECT * FROM core_commission_calculations 
WHERE payment_id = (SELECT id FROM web_payments WHERE revalya_payment_id = 'TEST-001');
```

---

## 🔍 Como Obter o `card_id` no Revalya

O `card_id` é o UUID do card no Nexflow. Existem algumas formas de obter esse valor:

### Opção 1: Armazenar no Revalya ao Criar a Venda

Quando o card é criado no Nexflow e a venda é registrada no Revalya, armazene o `card_id` como referência:

```json
{
  "revalya_payment_id": "REV-2025-001234",
  "nexflow_card_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 10000.00,
  ...
}
```

### Opção 2: Usar Metadata da Oportunidade

Se você vincula oportunidades do Nexflow a vendas no Revalya, pode buscar o `card_id` através da oportunidade:

- O card tem um campo `opportunity_id` que pode ser usado como referência
- Ou use um campo customizado no Revalya para armazenar o `card_id`

### Opção 3: Buscar por Referência Externa

Se você tem uma referência externa (ex: número do pedido, CPF do cliente), pode buscar o card:

```sql
-- Exemplo: Buscar card por CPF do cliente (se armazenado nos field_values)
SELECT id FROM nexflow.cards 
WHERE field_values->>'cpf' = '123.456.789-00'
  AND status = 'completed';
```

### Recomendação

**Melhor prática:** Armazene o `card_id` diretamente no Revalya quando a venda é criada, assim você sempre terá a referência correta ao enviar o webhook.

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs em `revalya_integration_log`
2. Verifique os logs das Edge Functions no Supabase
3. Consulte a documentação do plano: `docs/PLANO_COMISSOES_CARDS.md`

---

## 📎 Referências

- **Código do Webhook:** `supabase/functions/revalya-webhook/index.ts`
- **Código do Cálculo:** `supabase/functions/calculate-commission/index.ts`
- **Plano Completo:** `docs/PLANO_COMISSOES_CARDS.md`
- **Status da Implementação:** `docs/IMPLEMENTACAO_COMISSOES_STATUS.md`

---

**Última atualização:** 2025-01-27
