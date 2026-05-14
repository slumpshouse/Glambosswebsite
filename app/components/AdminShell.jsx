"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/sales/manual", label: "Manual Sale" },
  { href: "/admin/ai-summary", label: "AI Summary" },
];

const adminPrefixes = [
  "/admin/dashboard",
  "/admin/products",
  "/admin/customers",
  "/admin/sales",
  "/admin",
];

function isAdminPath(pathname) {
  return adminPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function getActiveHref(pathname) {
  const normalizedPath = pathname === "/dashboard" ? "/admin/dashboard" : pathname;

  const matches = navItems
    .map((item) => item.href)
    .filter(
      (href) => normalizedPath === href || normalizedPath.startsWith(`${href}/`)
    )
    .sort((a, b) => b.length - a.length);

  return matches[0] ?? null;
}
export function AdminShell({ children }) {
    const pathname = usePathname();
    const activeHref = getActiveHref(pathname);

  if (!isAdminPath(pathname) || pathname === "/login" || pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (<div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r-2 border-pink-200 bg-gradient-to-b from-white to-pink-50 p-4 lg:p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-pink-600">
            ✨ Glam Goddess Shop
          </p>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Admin Panel</h2>
        </div>

        <nav className="space-y-1" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = activeHref === item.href;
            return (<Link key={item.href} href={item.href} className={[
                    "block rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
                    active
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md"
                        : "text-purple-700 hover:bg-pink-100",
                ].join(" ")}>
                {item.label}
              </Link>);
        })}
        </nav>
      </aside>

      <section className="p-4 lg:p-6">{children}</section>
    </div>);
}
