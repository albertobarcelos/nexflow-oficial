import { z } from 'zod';

export const companySchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo'),
  cnpj: z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  state_id: z.string().uuid('Selecione um estado válido'),
  city_id: z.string().uuid('Selecione uma cidade válida'),
  address: z.string().optional()
});

export type CompanyFormData = z.infer<typeof companySchema>;
