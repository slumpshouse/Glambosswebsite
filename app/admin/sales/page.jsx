"use client";
import { useEffect, useState } from "react";
function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value);
}
function formatDate(value) {
    return new Date(value).toLocaleString();
}
export default function SalesPage() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function loadSales() {
            var _a;
            setLoading(true);
            setError(null);
            const response = await fetch("/api/sales", { cache: "no-store" });
            if (!response.ok) {
                const body = (await response.json().catch(() => ({})));
                setError((_a = body.error) !== null && _a !== void 0 ? _a : "Failed to load sales.");
                setLoading(false);
                return;
            }
            const data = (await response.json());
            setSales(data);
            setLoading(false);
        }
        void loadSales();
    }, []);
    return (<main className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Sales</h1>
        <p className="mt-2 text-sm text-purple-800 sm:text-base">Track all recorded sales and payment statuses in one place.</p>
      </div>

      {loading && (<div className="rounded-2xl border-2 border-pink-200 bg-white/80 p-6 text-center text-sm font-medium text-purple-800 shadow-sm">
          Loading sales...
        </div>)}

      {error && (<div className="mb-4 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>)}

      {!loading && !error && (<section className="overflow-hidden rounded-2xl border-2 border-pink-200 bg-white/90 shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                <tr>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Date</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Product</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Customer</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Phone</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Quantity</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Price</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Total</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Payment</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => {
                var _a;
                return (<tr key={sale.id} className={index % 2 === 0 ? "bg-white" : "bg-pink-50/40"}>
                    <td className="border-b border-pink-100 px-4 py-3 text-sm text-purple-800 whitespace-nowrap">{formatDate(sale.createdAt)}</td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base font-medium text-purple-900">{sale.product.name}</td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base text-purple-900">{(_a = sale.customer.name) !== null && _a !== void 0 ? _a : "-"}</td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base text-purple-900 whitespace-nowrap">{sale.customer.phone}</td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base font-semibold text-purple-900">{sale.quantity}</td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base text-purple-900 whitespace-nowrap">{formatCurrency(sale.unitPrice)}</td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base font-semibold text-pink-700 whitespace-nowrap">{formatCurrency(sale.totalPrice)}</td>
                    <td className="border-b border-pink-100 px-4 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${sale.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : sale.paymentStatus === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"}`}>
                        {sale.paymentStatus === "paid" ? "completed" : sale.paymentStatus || "pending"}
                      </span>
                    </td>
                  </tr>);
            })}

                {sales.length === 0 && (<tr>
                    <td className="px-4 py-10 text-center text-sm font-medium text-purple-700" colSpan={8}>
                      No sales yet.
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </section>)}
    </main>);
}
