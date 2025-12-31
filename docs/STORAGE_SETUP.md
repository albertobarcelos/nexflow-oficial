# Configuração do Supabase Storage

## Buckets Necessários

Para que o sistema de anexos e mensagens funcione corretamente, é necessário criar os seguintes buckets no Supabase Storage:

### 1. Bucket: `card-attachments`
- **Descrição**: Armazena anexos de arquivos dos cards
- **Público**: Não (requer autenticação)
- **Limite de arquivo**: 100MB
- **Estrutura de pastas**: `{client_id}/{card_id}/{filename}`

### 2. Bucket: `card-messages`
- **Descrição**: Armazena arquivos de mensagens (áudio, vídeo, anexos)
- **Público**: Não (requer autenticação)
- **Limite de arquivo**: 100MB
- **Estrutura de pastas**: `{client_id}/{card_id}/{filename}`

## Políticas de Storage (RLS)

### Política para Upload (card-attachments e card-messages)

```sql
-- Usuários podem fazer upload apenas para seu próprio client_id
CREATE POLICY "Users can upload to their client folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('card-attachments', 'card-messages')
  AND (storage.foldername(name))[1] = (
    SELECT client_id::text 
    FROM public.core_client_users 
    WHERE id = auth.uid()
  )
);
```

### Política para Leitura (card-attachments e card-messages)

```sql
-- Usuários podem ler arquivos de cards que têm acesso
CREATE POLICY "Users can read accessible card files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('card-attachments', 'card-messages')
  AND (storage.foldername(name))[1] = (
    SELECT client_id::text 
    FROM public.core_client_users 
    WHERE id = auth.uid()
  )
);
```

### Política para Delete (card-attachments e card-messages)

```sql
-- Usuários podem deletar apenas arquivos que eles próprios criaram
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('card-attachments', 'card-messages')
  AND (storage.foldername(name))[1] = (
    SELECT client_id::text 
    FROM public.core_client_users 
    WHERE id = auth.uid()
  )
);
```

## Como Configurar

1. Acesse o Supabase Dashboard
2. Vá para Storage
3. Crie os buckets `card-attachments` e `card-messages`
4. Configure as políticas RLS acima usando o SQL Editor
5. Certifique-se de que os buckets não são públicos

## Nota

Os buckets devem ser criados manualmente no Supabase Dashboard, pois não é possível criar buckets via migrations SQL.


