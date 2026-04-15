"use client";
import { useEffect, useState } from "react";
const initialForm = {
    productId: "",
    quantity: "1",
    customerId: "",
};
function toPayload(form) {
    return {
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        customerId: form.customerId ? Number(form.customerId) : undefined,
    };
}
export default function ProductRequestsPage() {
    const [products, setProducts] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [confirmingRequestId, setConfirmingRequestId] = useState(null);
    const [error, setError] = useState(null);
    async function fetchProducts() {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok)
            throw new Error("Failed to load products");
        const data = (await response.json());
        setProducts(data);
    }
    async function fetchPendingRequests() {
        const response = await fetch("/api/product-requests", { cache: "no-store" });
        if (!response.ok)
            throw new Error("Failed to load pending requests");
        const data = (await response.json());
        setPendingRequests(data);
    }
    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            try {
                await Promise.all([fetchProducts(), fetchPendingRequests()]);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            }
            finally {
                setLoading(false);
            }
        }
        void load();
    }, []);
    const selectedProduct = products.find((product) => product.id === Number(form.productId));
    async function handleSubmit(event) {
        var _a;
        event.preventDefault();
        setError(null);
        const payload = toPayload(form);
        if (!selectedProduct) {
            setError("Select a valid product.");
            return;
        }
        if (payload.quantity > selectedProduct.stock) {
            setError("Requested quantity cannot exceed current stock.");
            return;
        }
        const response = await fetch("/api/product-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const body = (await response.json().catch(() => ({})));
            setError((_a = body.error) !== null && _a !== void 0 ? _a : "Failed to create request.");
            return;
        }
        setForm(initialForm);
        await fetchPendingRequests();
    }
    async function handleConfirm(requestId) {
        var _a, _b;
        setError(null);
      const request = pendingRequests.find((entry) => entry.id === requestId);
      const customerPhone = window.prompt("Customer phone (required):", (request === null || request === void 0 ? void 0 : request.customer.phone) || "");
        if (!customerPhone || !customerPhone.trim()) {
            setError("Customer phone is required to confirm the request.");
            return;
        }
      const customerName = (_a = window.prompt("Customer name (optional):", (request === null || request === void 0 ? void 0 : request.customer.name) || "")) === null || _a === void 0 ? void 0 : _a.trim();
        setConfirmingRequestId(requestId);
        const response = await fetch(`/api/product-requests/${requestId}/confirm`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerPhone: customerPhone.trim(),
                customerName: customerName || undefined,
            }),
        });
        if (!response.ok) {
            const body = (await response.json().catch(() => ({})));
            setError((_b = body.error) !== null && _b !== void 0 ? _b : "Failed to confirm request.");
            setConfirmingRequestId(null);
            return;
        }
        setConfirmingRequestId(null);
        await Promise.all([fetchProducts(), fetchPendingRequests()]);
    }
    return (<main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Product Requests</h1>

      <form onSubmit={handleSubmit} className="mb-8 grid gap-3 rounded border p-4 md:grid-cols-2">
        <select className="rounded border p-2" value={form.productId} onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { productId: event.target.value })))} required>
          <option value="">Select product</option>
          {products.map((product) => (<option key={product.id} value={product.id}>
              {product.name} (stock: {product.stock})
            </option>))}
        </select>

        <input className="rounded border p-2" type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { quantity: event.target.value })))} required/>

        <input className="rounded border p-2 md:col-span-2" type="number" min="1" placeholder="Customer ID (optional)" value={form.customerId} onChange={(event) => setForm((prev) => (Object.assign(Object.assign({}, prev), { customerId: event.target.value })))}/>

        <div className="md:col-span-2">
          <button className="rounded bg-black px-4 py-2 text-white" type="submit">
            Submit Request
          </button>
        </div>
      </form>

      {error && <p className="mb-4 text-red-600">{error}</p>}
      {loading ? (<p>Loading...</p>) : (<div className="overflow-x-auto">
          <h2 className="mb-3 text-xl font-semibold">Pending Requests</h2>
          <table className="min-w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Request ID</th>
                <th className="border p-2 text-left">Product</th>
                <th className="border p-2 text-left">Quantity</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Customer</th>
                <th className="border p-2 text-left">Notes</th>
                <th className="border p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((request) => {
                var _a;
                return (<tr key={request.id}>
                  <td className="border p-2">{request.id}</td>
                  <td className="border p-2">{request.product.name}</td>
                  <td className="border p-2">{request.quantity}</td>
                  <td className="border p-2">{request.status}</td>
                  <td className="border p-2">
                    {request.customer ? (<div>
                        <p className="font-medium text-gray-900">{(_a = request.customer.name) !== null && _a !== void 0 ? _a : "Unknown"}</p>
                        <p className="text-sm text-gray-600">{request.customer.phone}</p>
                      </div>) : ("-")}
                  </td>
                  <td className="border p-2 text-sm text-gray-600">{request.notes || "-"}</td>
                  <td className="border p-2">
                    <button type="button" onClick={() => void handleConfirm(request.id)} disabled={confirmingRequestId === request.id} className="rounded bg-green-600 hover:bg-green-700 active:bg-green-800 px-3 py-1 text-sm text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                      {confirmingRequestId === request.id ? "Confirming..." : "Confirm"}
                    </button>
                  </td>
                </tr>);
            })}
              {pendingRequests.length === 0 && (<tr>
                  <td className="border p-2 text-center" colSpan={7}>
                    No pending requests.
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>)}
    </main>);
}
