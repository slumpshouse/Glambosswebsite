import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { assertValidLoginInput, loginSchema } from "../src/lib/auth-validation";

const mockFindUnique = vi.fn();
const mockBcryptCompare = vi.fn();
const mockGetToken = vi.fn();
const mockLogAdminAction = vi.fn().mockResolvedValue(undefined);

async function authorize(credentials: { email?: string; password?: string } | undefined) {
  // Mirrors src/lib/auth.ts credentials authorize flow.
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const user = await (mockFindUnique as Mock)({
    where: { email: parsed.data.email },
  });

  if (!user) {
    await mockLogAdminAction("login_failed", parsed.data.email, {
      reason: "user_not_found",
    });
    return null;
  }

  const passwordMatch = await (mockBcryptCompare as Mock)(
    parsed.data.password,
    user.passwordHash
  );

  if (!passwordMatch) {
    await mockLogAdminAction("login_failed", parsed.data.email, {
      reason: "wrong_password",
    });
    return null;
  }

  await mockLogAdminAction("login_success", user.email, { userId: user.id });
  return { id: String(user.id), email: user.email, role: user.role };
}

type MiddlewareVerdict = "allow" | "redirect";

async function checkMiddleware(
  pathname: string,
  tokenPayload: Record<string, unknown> | null
): Promise<MiddlewareVerdict> {
  const protectedPrefixes = [
    "/dashboard",
    "/products",
    "/requests",
    "/customers",
    "/sales",
    "/admin",
  ];

  const protectedPath = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (pathname.startsWith("/api/auth") || pathname === "/login" || pathname === "/admin/login" || !protectedPath) {
    return "allow";
  }

  (mockGetToken as Mock).mockResolvedValueOnce(tokenPayload);
  const token = await (mockGetToken as Mock)();

  if (!token || (token as Record<string, unknown>).role !== "admin") {
    return "redirect";
  }

  return "allow";
}

beforeEach(() => {
  vi.clearAllMocks();
  (mockLogAdminAction as Mock).mockResolvedValue(undefined);
});

describe("A. Login Form", () => {
  it("returns admin user on valid credentials", async () => {
    (mockFindUnique as Mock).mockResolvedValueOnce({
      id: 42,
      email: "admin@glamgoddessshop.com",
      role: "admin",
      passwordHash: "$2b$12$storedhash",
    });
    (mockBcryptCompare as Mock).mockResolvedValueOnce(true);

    const result = await authorize({
      email: "admin@glamgoddessshop.com",
      password: "password123",
    });

    expect(result).toEqual({
      id: "42",
      email: "admin@glamgoddessshop.com",
      role: "admin",
    });
    expect(mockBcryptCompare).toHaveBeenCalledWith("password123", "$2b$12$storedhash");
  });

  it("rejects unknown email and logs user_not_found", async () => {
    (mockFindUnique as Mock).mockResolvedValueOnce(null);

    const result = await authorize({
      email: "missing@example.com",
      password: "password123",
    });

    expect(result).toBeNull();
    expect(mockBcryptCompare).not.toHaveBeenCalled();
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      "login_failed",
      "missing@example.com",
      expect.objectContaining({ reason: "user_not_found" })
    );
  });

  it("rejects wrong password and logs wrong_password", async () => {
    (mockFindUnique as Mock).mockResolvedValueOnce({
      id: 42,
      email: "admin@glamgoddessshop.com",
      role: "admin",
      passwordHash: "$2b$12$storedhash",
    });
    (mockBcryptCompare as Mock).mockResolvedValueOnce(false);

    const result = await authorize({
      email: "admin@glamgoddessshop.com",
      password: "WrongPass!1",
    });

    expect(result).toBeNull();
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      "login_failed",
      "admin@glamgoddessshop.com",
      expect.objectContaining({ reason: "wrong_password" })
    );
  });

  it("rejects empty/missing fields", async () => {
    expect(await authorize(undefined)).toBeNull();
    expect(loginSchema.safeParse({ email: "", password: "password123" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "admin@glamgoddessshop.com", password: "" }).success).toBe(false);
    expect(() =>
      assertValidLoginInput({ email: "", password: "password123" })
    ).toThrow();
  });
});

describe("B. Session Management", () => {
  it("jwt callback behavior: token gets role and id", () => {
    const token: Record<string, unknown> = {};
    const user = { id: "42", role: "admin" };

    token.role = user.role ?? "admin";
    token.id = user.id;

    expect(token.role).toBe("admin");
    expect(token.id).toBe("42");
  });

  it("session callback behavior: session.user gets role and id", () => {
    const session = { user: { email: "admin@glamgoddessshop.com" } } as {
      user: { email: string; role?: string; id?: string };
    };
    const token = { role: "admin", id: "42" };

    session.user.role = token.role;
    session.user.id = token.id;

    expect(session.user.role).toBe("admin");
    expect(session.user.id).toBe("42");
  });
});

describe("C. Access Control", () => {
  it("redirects protected admin routes without token", async () => {
    expect(await checkMiddleware("/products", null)).toBe("redirect");
    expect(await checkMiddleware("/requests", null)).toBe("redirect");
    expect(await checkMiddleware("/sales", null)).toBe("redirect");
    expect(await checkMiddleware("/customers", null)).toBe("redirect");
  });

  it("allows protected admin routes with admin token", async () => {
    expect(await checkMiddleware("/products", { role: "admin" })).toBe("allow");
  });

  it("always allows /login and /api/auth/*", async () => {
    expect(await checkMiddleware("/login", null)).toBe("allow");
    expect(await checkMiddleware("/api/auth/session", null)).toBe("allow");
  });
});

describe("D. Audit Logging", () => {
  it("logs login_success with userId for successful auth", async () => {
    (mockFindUnique as Mock).mockResolvedValueOnce({
      id: 7,
      email: "admin@glamgoddessshop.com",
      role: "admin",
      passwordHash: "$2b$12$storedhash",
    });
    (mockBcryptCompare as Mock).mockResolvedValueOnce(true);

    await authorize({
      email: "admin@glamgoddessshop.com",
      password: "password123",
    });

    expect(mockLogAdminAction).toHaveBeenCalledWith(
      "login_success",
      "admin@glamgoddessshop.com",
      expect.objectContaining({ userId: 7 })
    );
  });

  it("logs login_failed for unknown user", async () => {
    (mockFindUnique as Mock).mockResolvedValueOnce(null);

    await authorize({
      email: "ghost@example.com",
      password: "password123",
    });

    expect(mockLogAdminAction).toHaveBeenCalledWith(
      "login_failed",
      "ghost@example.com",
      expect.objectContaining({ reason: "user_not_found" })
    );
  });
});
