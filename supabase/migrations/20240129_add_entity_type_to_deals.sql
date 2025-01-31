-- Add entity_type column to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS entity_type text 
CHECK (entity_type IN ('company', 'person', 'partner'));

-- Update existing deals to have entity_type based on their relationships
UPDATE public.deals 
SET entity_type = 
  CASE 
    WHEN company_id IS NOT NULL THEN 'company'
    WHEN person_id IS NOT NULL THEN 'person'
    ELSE 'partner'
  END 
WHERE entity_type IS NULL;
