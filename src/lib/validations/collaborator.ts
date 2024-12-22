import { z } from "zod";

export const collaboratorSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  client_id: z.string().min(1, "Cliente é obrigatório"),
  role: z.enum(["administrator", "closer", "partnership_director", "partner"]),
});

export type CollaboratorFormData = z.infer<typeof collaboratorSchema>;