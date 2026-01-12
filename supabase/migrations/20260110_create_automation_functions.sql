-- Função para criar ou atualizar card de parceiro
CREATE OR REPLACE FUNCTION public.handle_partner_contact_automation()
RETURNS TRIGGER AS $$
DECLARE
  v_flow_id UUID;
  v_first_step_id UUID;
  v_existing_card_id UUID;
  v_client_id UUID;
BEGIN
  -- Só processar se o array contém 'parceiro'
  IF NEW.contact_type IS NULL OR NOT ('parceiro' = ANY(NEW.contact_type)) THEN
    RETURN NEW;
  END IF;
  
  v_client_id := NEW.client_id;
  
  -- Buscar flow "Parceiros" pelo identificador
  SELECT id INTO v_flow_id
  FROM public.flows
  WHERE flow_identifier = 'parceiros'
    AND client_id = v_client_id
    AND (is_active = true OR is_active IS NULL)
  LIMIT 1;
  
  -- Se flow não existe, não fazer nada (pode ser criado depois)
  IF v_flow_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar primeiro step do flow
  v_first_step_id := public.get_first_step_of_flow(v_flow_id);
  
  IF v_first_step_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já existe card para este contato no flow
  SELECT id INTO v_existing_card_id
  FROM public.cards
  WHERE contact_id = NEW.id
    AND flow_id = v_flow_id
    AND client_id = v_client_id
  LIMIT 1;
  
  IF v_existing_card_id IS NOT NULL THEN
    -- Atualizar card existente
    UPDATE public.cards
    SET 
      title = COALESCE(NEW.client_name, NEW.main_contact, 'Parceiro'),
      updated_at = now(),
      field_values = jsonb_build_object(
        'client_name', NEW.client_name,
        'main_contact', NEW.main_contact,
        'phone_numbers', NEW.phone_numbers,
        'company_names', NEW.company_names
      )
    WHERE id = v_existing_card_id;
  ELSE
    -- Criar novo card
    INSERT INTO public.cards (
      client_id,
      flow_id,
      step_id,
      contact_id,
      title,
      field_values,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_client_id,
      v_flow_id,
      v_first_step_id,
      NEW.id,
      COALESCE(NEW.client_name, NEW.main_contact, 'Parceiro'),
      jsonb_build_object(
        'client_name', NEW.client_name,
        'main_contact', NEW.main_contact,
        'phone_numbers', NEW.phone_numbers,
        'company_names', NEW.company_names
      ),
      'inprogress',
      now(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar card de cliente automaticamente
CREATE OR REPLACE FUNCTION public.handle_client_contact_automation()
RETURNS TRIGGER AS $$
DECLARE
  v_flow_id UUID;
  v_first_step_id UUID;
  v_client_id UUID;
BEGIN
  -- Só processar se o array contém 'cliente'
  IF NEW.contact_type IS NULL OR NOT ('cliente' = ANY(NEW.contact_type)) THEN
    RETURN NEW;
  END IF;
  
  v_client_id := NEW.client_id;
  
  -- Buscar flow "Vendas" pelo identificador
  SELECT id INTO v_flow_id
  FROM public.flows
  WHERE flow_identifier = 'vendas'
    AND client_id = v_client_id
    AND (is_active = true OR is_active IS NULL)
  LIMIT 1;
  
  -- Se flow não existe, não fazer nada
  IF v_flow_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar primeiro step do flow
  v_first_step_id := public.get_first_step_of_flow(v_flow_id);
  
  IF v_first_step_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se já existe card para evitar duplicatas
  IF EXISTS (
    SELECT 1 FROM public.cards
    WHERE contact_id = NEW.id
      AND flow_id = v_flow_id
      AND client_id = v_client_id
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Criar novo card na primeira etapa
  INSERT INTO public.cards (
    client_id,
    flow_id,
    step_id,
    contact_id,
    title,
    field_values,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_client_id,
    v_flow_id,
    v_first_step_id,
    NEW.id,
    COALESCE(NEW.client_name, NEW.main_contact, 'Cliente'),
    jsonb_build_object(
      'client_name', NEW.client_name,
      'main_contact', NEW.main_contact,
      'phone_numbers', NEW.phone_numbers,
      'company_names', NEW.company_names,
      'tax_ids', NEW.tax_ids
    ),
    'inprogress',
    now(),
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION public.handle_partner_contact_automation IS 
'Automação: Quando um contato tipo "parceiro" é criado/atualizado, cria ou atualiza card no flow "Parceiros".';

COMMENT ON FUNCTION public.handle_client_contact_automation IS 
'Automação: Quando um contato tipo "cliente" é criado, cria automaticamente um card no flow "Vendas" na primeira etapa.';

