import { getToken } from "next-auth/jwt";

export async function requireAdminToken(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== "admin") {
    return null;
  }

  return token;
}
