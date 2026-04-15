"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const adminPrefixes = [
  "/dashboard",
  "/products",
  "/requests",
  "/customers",
  "/sales",
  "/admin",
];

function isAdminRoute(pathname) {
  return adminPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { status } = useSession();

  if (pathname === "/login" || pathname === "/admin/login") {
    return null;
  }

  const authenticated = status === "authenticated";
  const adminRoute = isAdminRoute(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-gray-900">
          Glam Goddess Shop
        </Link>

        <nav className="flex items-center gap-2">
          {authenticated ? (
            <>
              {adminRoute && (
                <Link
                  href="/"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  View Customer Site
                </Link>
              )}
              <Link
                href="/my-requests"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                My Request
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/my-requests"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                My Request
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
              >
                Admin Login
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
