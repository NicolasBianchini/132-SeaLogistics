import { z } from "zod";

export const createLoginSchema = (translations: {
  emailError: string;
  passwordError: string;
}) =>
  z.object({
    email: z.string().email(translations.emailError),
    password: z.string().nonempty(translations.passwordError),
  });

export type LoginSchema = z.infer<ReturnType<typeof createLoginSchema>>;
