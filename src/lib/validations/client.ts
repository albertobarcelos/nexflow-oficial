import * as z from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  company_name: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  plan: z.enum(["free", "premium"]).default("free"),
});

export type ClientFormData = z.infer<typeof clientSchema>;