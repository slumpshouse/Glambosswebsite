"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const adminPrefixes = [
  "/admin/dashboard",
  "/admin/products",
  "/admin/customers",
  "/admin/sales",
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
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function readCartCount() {
      try {
        const raw = window.localStorage.getItem("glam_cart_items");
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) {
          setCartCount(0);
          return;
        }

        const nextCount = parsed.reduce((sum, item) => {
          const quantity = Number(item?.quantity);
          return sum + (Number.isFinite(quantity) ? quantity : 0);
        }, 0);

        setCartCount(nextCount);
      } catch {
        setCartCount(0);
      }
    }

    readCartCount();

    window.addEventListener("storage", readCartCount);
    window.addEventListener("focus", readCartCount);
    window.addEventListener("cartUpdated", readCartCount);

    return () => {
      window.removeEventListener("storage", readCartCount);
      window.removeEventListener("focus", readCartCount);
      window.removeEventListener("cartUpdated", readCartCount);
    };
  }, [pathname]);

  if (pathname === "/login" || pathname === "/admin/login") {
    return null;
  }

  const authenticated = status === "authenticated";
  const adminRoute = isAdminRoute(pathname);
  const customerRoute = !adminRoute;

  return (
    <header className="sticky top-0 z-40 border-b border-pink-200 bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          ✨ Glam Goddess Shop
        </Link>

        <nav className="flex items-center gap-2">
          {customerRoute && (
            <Link
              href="/checkout"
              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
            >
              Cart ({cartCount})
            </Link>
          )}
          {adminRoute && authenticated && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
            >
              Logout
            </button>
          )}
          {!authenticated && (
            <Link
              href="/admin/login"
              className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
            >
              Admin Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
