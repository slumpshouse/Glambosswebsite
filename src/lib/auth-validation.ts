import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Throws if `data` is not a valid LoginInput — useful in Vitest stubs and
 * in places where you want an assertion rather than a Result type.
 */
export function assertValidLoginInput(data: unknown): asserts data is LoginInput {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    const messages = result.error.flatten().fieldErrors;
    const first =
      Object.values(messages).flat()[0] ?? "Invalid login input";
    throw new Error(first);
  }
}
