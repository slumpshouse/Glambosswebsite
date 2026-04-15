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
    return (<main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Sales</h1>

      {loading && <p>Loading sales...</p>}
      {error && <p className="mb-4 text-red-600">{error}</p>}

      {!loading && !error && (<div className="overflow-x-auto rounded border">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Product</th>
                <th className="border p-2 text-left">Customer</th>
                <th className="border p-2 text-left">Phone</th>
                <th className="border p-2 text-left">Quantity</th>
                <th className="border p-2 text-left">Price</th>
                <th className="border p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                var _a;
                return (<tr key={sale.id}>
                  <td className="border p-2">{formatDate(sale.createdAt)}</td>
                  <td className="border p-2">{sale.product.name}</td>
                  <td className="border p-2">{(_a = sale.customer.name) !== null && _a !== void 0 ? _a : "-"}</td>
                  <td className="border p-2">{sale.customer.phone}</td>
                  <td className="border p-2">{sale.quantity}</td>
                  <td className="border p-2">{formatCurrency(sale.unitPrice)}</td>
                  <td className="border p-2 font-medium">{formatCurrency(sale.totalPrice)}</td>
                </tr>);
            })}

              {sales.length === 0 && (<tr>
                  <td className="border p-2 text-center" colSpan={7}>
                    No sales yet.
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>)}
    </main>);
}
