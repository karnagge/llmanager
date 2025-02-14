import { z } from "zod";

export const userFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "USER"] as const),
});

export type UserFormData = z.infer<typeof userFormSchema>;