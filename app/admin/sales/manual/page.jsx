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
    return (<main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Log Manual Sale</h1>

      {loading ? (<p>Loading products...</p>) : (<form onSubmit={handleSubmit} className="grid gap-4 rounded border p-4">
          <select className="rounded border p-2" value={form.productId} onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { productId: event.target.value })))} required>
            <option value="">Select product</option>
            {products.map((product) => (<option key={product.id} value={product.id}>
                {product.name} (stock: {product.stock})
              </option>))}
          </select>

          <input className="rounded border p-2" type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { quantity: event.target.value })))} required/>

          <input className="rounded border p-2" type="text" placeholder="Customer phone" value={form.customerPhone} onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { customerPhone: event.target.value })))} required/>

          <input className="rounded border p-2" type="text" placeholder="Customer name (optional)" value={form.customerName} onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { customerName: event.target.value })))}/>

          <button className="rounded bg-black hover:bg-gray-900 active:bg-gray-950 px-4 py-2 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Create Sale"}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}
        </form>)}
    </main>);
}
