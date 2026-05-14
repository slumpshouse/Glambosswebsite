"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (!result || result.error) {
      setError("Invalid email or password.");
      return;
    }

    router.replace(callbackUrl);
  }

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-pink-200 bg-white p-8 shadow-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Admin Login</h1>
          <p className="mt-1 text-sm text-purple-600">✨ Glam Goddess Shop Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-semibold text-purple-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              className="rounded-lg border-2 border-pink-200 bg-pink-50 p-2.5 text-sm text-purple-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="admin@example.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-semibold text-purple-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              className="rounded-lg border-2 border-pink-200 bg-pink-50 p-2.5 text-sm text-purple-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="********"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-2.5 text-sm text-red-600 font-medium border-l-4 border-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:from-pink-600 hover:to-purple-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-purple-700">
          <Link href="/" className="font-semibold text-pink-600 hover:text-purple-600 transition-colors">
            ← Back to Customer Site
          </Link>
        </div>
      </div>
    </main>
  );
}

function LoginPageFallback() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4">
      <p className="text-sm text-gray-600">Loading login...</p>
    </main>
  );
}
