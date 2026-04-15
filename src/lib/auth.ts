import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";
import { loginSchema } from "./auth-validation";
import { logAdminAction } from "./audit-log";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Validate input shape.
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // 2. Look up the user in Postgres.
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) {
          await logAdminAction("login_failed", parsed.data.email, {
            reason: "user_not_found",
          });
          return null;
        }

        // 3. Verify password against the stored bcrypt hash.
        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!passwordMatch) {
          await logAdminAction("login_failed", parsed.data.email, {
            reason: "wrong_password",
          });
          return null;
        }

        await logAdminAction("login_success", user.email, { userId: user.id });

        return { id: String(user.id), email: user.email, role: user.role };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "admin";
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role =
          token.role as string;
        (session.user as { role?: string; id?: string }).id =
          token.id as string;
      }
      return session;
    },
  },
};
