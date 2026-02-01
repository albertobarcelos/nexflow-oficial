-- Migration: Add RLS policy for core_indications table
-- Description: Cria política RLS para permitir que administrators, leaders e admins de time possam ler indicações do seu cliente
-- Data: 2025-01-27

-- Remover política existente se houver (para evitar duplicatas)
DROP POLICY IF EXISTS "Permitir leitura de indicações para administrators e leaders" ON public.core_indications;

-- Criar política RLS para SELECT
-- Permite acesso se:
-- 1. O usuário é administrator do cliente (core_client_users.role = 'administrator')
-- OU
-- 2. O usuário é leader ou admin de time (core_team_members.role IN ('leader', 'admin'))
-- E o cliente tem isHunting = true
CREATE POLICY "Permitir leitura de indicações para administrators e leaders"
ON public.core_indications
FOR SELECT
TO authenticated
USING (
  -- Verificar se o usuário é administrator do cliente
  EXISTS (
    SELECT 1
    FROM public.core_client_users ccu
    WHERE ccu.id = auth.uid()
      AND ccu.client_id = core_indications.client_id
      AND ccu.role = 'administrator'
      AND EXISTS (
        SELECT 1
        FROM public.core_clients cc
        WHERE cc.id = ccu.client_id
          AND cc."isHunting" = true
      )
  )
  OR
  -- Verificar se o usuário é leader ou admin de time do cliente
  EXISTS (
    SELECT 1
    FROM public.core_client_users ccu
    INNER JOIN public.core_team_members ctm ON ctm.user_profile_id = ccu.id
    WHERE ccu.id = auth.uid()
      AND ccu.client_id = core_indications.client_id
      AND ctm.role IN ('leader', 'admin')
      AND EXISTS (
        SELECT 1
        FROM public.core_clients cc
        WHERE cc.id = ccu.client_id
          AND cc."isHunting" = true
      )
  )
);

-- Comentário na política
COMMENT ON POLICY "Permitir leitura de indicações para administrators e leaders" 
ON public.core_indications IS 
'Permite que administrators, leaders e admins de time leiam indicações do seu cliente quando o cliente tem isHunting = true';

