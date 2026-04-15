"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const navItems = [
    { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/product-requests", label: "Requests" },
    { href: "/admin/sales", label: "Sales" },
    { href: "/admin/sales/manual", label: "Manual Sale" },
    { href: "/admin/ai-summary", label: "AI Summary" },
];
function isActivePath(pathname, href) {
    if (href === "/dashboard") {
        return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
}
export function AdminShell({ children }) {
    const pathname = usePathname();
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }
    return (<div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-r border-gray-200 bg-white p-4 lg:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Glam Goddess Shop
          </p>
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
        </div>

        <nav className="space-y-2" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (<Link key={item.href} href={item.href} className={[
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200",
                ].join(" ")}>
                {item.label}
              </Link>);
        })}
        </nav>
      </aside>

      <section>{children}</section>
    </div>);
}
