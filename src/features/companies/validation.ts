import { z } from 'zod';
import { validateCNPJ } from '@/lib/utils';

export const companySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  razao_social: z.string().optional().nullable(),
  cnpj: z.string()
    .min(1, 'CNPJ é obrigatório')
    .refine(validateCNPJ, 'CNPJ inválido'),
  state_id: z.string().min(1, 'Estado é obrigatório'),
  city_id: z.string().min(1, 'Cidade é obrigatória'),
  company_type: z.string().min(1, 'Tipo de empresa é obrigatório'),
  email: z.string().email('Email inválido').optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  celular: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  address: z.object({
    cep: z.string().optional().nullable(),
    rua: z.string().optional().nullable(),
    numero: z.string().optional().nullable(),
    complemento: z.string().optional().nullable(),
    bairro: z.string().optional().nullable(),
  }).optional().nullable(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
