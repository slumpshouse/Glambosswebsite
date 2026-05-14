"use client";
import { useEffect, useState } from "react";
const initialForm = {
    productId: "",
    quantity: "1",
    customerPhone: "",
    customerName: "",
};
export default function ManualSalesPage() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/products", { cache: "no-store" });
            if (!response.ok) {
                setError("Failed to load products");
                setLoading(false);
                return;
            }
            const data = (await response.json());
            setProducts(data);
            setLoading(false);
        }
        void loadProducts();
    }, []);
    const selectedProduct = products.find((product) => product.id === Number(form.productId));
    const requestedQuantity = Number(form.quantity) || 0;
    const estimatedTotal = selectedProduct ? requestedQuantity * Number(selectedProduct.cost || 0) : 0;
    async function handleSubmit(event) {
        var _a;
        event.preventDefault();
        setError(null);
        setSuccess(null);
        if (!selectedProduct) {
            setError("Select a valid product.");
            return;
        }
        const payload = {
            productId: Number(form.productId),
            quantity: Number(form.quantity),
            customerPhone: form.customerPhone.trim(),
            customerName: form.customerName.trim() || undefined,
        };
        if (payload.quantity > selectedProduct.stock) {
            setError("Requested quantity cannot exceed current stock.");
            return;
        }
        setSubmitting(true);
        const response = await fetch("/api/sales/manual", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const body = (await response.json().catch(() => ({})));
        if (!response.ok) {
            setError((_a = body.error) !== null && _a !== void 0 ? _a : "Failed to create manual sale.");
            setSubmitting(false);
            return;
        }
        setSuccess("Manual sale logged successfully.");
        setForm(initialForm);
        setSubmitting(false);
        // Refresh product stock indicator after successful sale.
        const refresh = await fetch("/api/products", { cache: "no-store" });
        if (refresh.ok) {
            const refreshed = (await refresh.json());
            setProducts(refreshed);
        }
    }
    return (<main className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-8 rounded-2xl border border-pink-200 bg-gradient-to-r from-white via-pink-50 to-purple-50 p-5 shadow-sm sm:p-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent sm:text-4xl">Log Manual Sale</h1>
        <p className="mt-2 text-sm text-purple-900/80 sm:text-base">Create a walk-in or offline sale and keep your inventory synced instantly.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border-2 border-pink-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-purple-800">Loading products...</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <form onSubmit={handleSubmit} className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-lg sm:p-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="product" className="block text-sm font-semibold text-purple-700">
                  Select Product *
                </label>
                <select
                  id="product"
                  className="w-full rounded-lg border-2 border-pink-200 bg-white px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                  value={form.productId}
                  onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { productId: event.target.value })))}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="block text-sm font-semibold text-purple-700">
                    Quantity *
                  </label>
                  <input
                    id="quantity"
                    className="w-full rounded-lg border-2 border-pink-200 bg-white px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { quantity: event.target.value })))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-semibold text-purple-700">
                    Customer Phone *
                  </label>
                  <input
                    id="phone"
                    className="w-full rounded-lg border-2 border-pink-200 bg-white px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                    type="tel"
                    placeholder="Enter phone number"
                    value={form.customerPhone}
                    onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { customerPhone: event.target.value })))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-purple-700">
                  Customer Name
                </label>
                <input
                  id="name"
                  className="w-full rounded-lg border-2 border-pink-200 bg-white px-4 py-3 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
                  type="text"
                  placeholder="Enter name (optional)"
                  value={form.customerName}
                  onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { customerName: event.target.value })))}
                />
              </div>

              {error && (
                <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                  Sale created successfully.
                </div>
              )}

              <button
                className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 text-base font-semibold text-white transition-all hover:from-pink-600 hover:to-purple-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-lg"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Create Sale"}
              </button>
            </div>
          </form>

          <aside className="h-fit rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Sale Preview</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-purple-500">Product</p>
                <p className="text-sm font-semibold text-purple-900">{selectedProduct ? selectedProduct.name : "Not selected"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-pink-200 bg-white p-3">
                  <p className="text-xs text-purple-500">In stock</p>
                  <p className="text-lg font-bold text-pink-600">{selectedProduct ? selectedProduct.stock : "-"}</p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-white p-3">
                  <p className="text-xs text-purple-500">Requested</p>
                  <p className="text-lg font-bold text-purple-700">{requestedQuantity > 0 ? requestedQuantity : "-"}</p>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-700">Estimated Total</p>
                <p className="text-2xl font-bold text-emerald-700">${estimatedTotal.toFixed(2)}</p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>);
}
