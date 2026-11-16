import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email('Escribe un correo válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const registrationSchema = credentialsSchema.extend({
  firstName: z.string().trim().min(1, 'Escribe tu nombre.'),
  lastName: z.string().trim().min(1, 'Escribe tu apellido.'),
  phone: z.string().trim().optional(),
});

export type CredentialsForm = z.infer<typeof credentialsSchema>;
export type RegistrationForm = z.infer<typeof registrationSchema>;
