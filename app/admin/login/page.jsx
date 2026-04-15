"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
export default function AdminLoginPage() {
    var _a;
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = (_a = searchParams.get("callbackUrl")) !== null && _a !== void 0 ? _a : "/admin/products";
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
    return (<main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-1 text-sm text-gray-500">Glam Goddess Shop Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input id="email" type="email" value={form.email} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { email: e.target.value })))} className="rounded border border-gray-300 p-2 text-sm focus:border-black focus:outline-none" placeholder="admin@example.com" required autoComplete="email" autoFocus/>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input id="password" type="password" value={form.password} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { password: e.target.value })))} className="rounded border border-gray-300 p-2 text-sm focus:border-black focus:outline-none" placeholder="••••••••" required autoComplete="current-password"/>
          </div>

          {error && (<p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
            </p>)}

          <button type="submit" disabled={loading} className="mt-1 rounded bg-black hover:bg-gray-900 active:bg-gray-950 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-6 w-full">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>);
}
