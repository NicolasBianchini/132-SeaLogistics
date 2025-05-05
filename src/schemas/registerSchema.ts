import { z } from "zod";

export const createRegisterSchema = (translations: {
  nameError: string;
  emailError: string;
  passwordError: string;
  confirmPasswordError: string;
  passwordsDontMatch: string;
}) =>
  z
    .object({
      name: z.string().nonempty(translations.nameError),
      email: z.string().email(translations.emailError),
      password: z.string().min(6, translations.passwordError),
      confirmPassword: z.string().min(6, translations.confirmPasswordError),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: translations.passwordsDontMatch,
      path: ["confirmPassword"],
    });

export type RegisterSchema = z.infer<ReturnType<typeof createRegisterSchema>>;
