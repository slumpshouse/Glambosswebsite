import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function assertValidLoginInput(data) {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    const messages = result.error.flatten().fieldErrors;
    const first =
      Object.values(messages).flat()[0] ?? "Invalid login input";
    throw new Error(first);
  }
}
