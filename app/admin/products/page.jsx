"use client";
import { useEffect, useMemo, useState } from "react";
const emptyForm = {
    name: "",
    category: "",
    cost: "",
    stock: "0",
    imageUrl: "",
    description: "",
};
function toPayload(form) {
    return {
        name: form.name.trim(),
        category: form.category.trim(),
        cost: Number(form.cost),
        stock: Number(form.stock),
        imageUrl: form.imageUrl.trim(),
        description: form.description.trim(),
    };
}
function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
    });
}
export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    async function fetchProducts() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/products", { cache: "no-store" });
            if (!response.ok)
                throw new Error("Failed to load products");
            const data = (await response.json());
            setProducts(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        void fetchProducts();
    }, []);
    const submitLabel = useMemo(() => {
        return editingId ? "Update Product" : "Create Product";
    }, [editingId]);
    function resetForm() {
        setForm(emptyForm);
        setEditingId(null);
    }
    function startEdit(product) {
        setEditingId(product.id);
        setForm({
            name: product.name,
            category: product.category,
            cost: product.cost === null ? "" : String(product.cost),
            stock: String(product.stock),
            imageUrl: product.imageUrl,
            description: product.description,
        });
    }
    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);
        const payload = toPayload(form);
        if (payload.stock < 0) {
            setError("Stock cannot go below 0.");
            return;
        }
        const endpoint = editingId ? `/api/products/${editingId}` : "/api/products";
        const method = editingId ? "PUT" : "POST";
        const response = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            setError("Failed to save product.");
            return;
        }
        const savedProduct = await response.json().catch(() => null);
        if (savedProduct) {
          if (editingId) {
            setProducts((prev) => prev.map((product) => product.id === editingId ? savedProduct : product));
          }
          else {
            setProducts((prev) => [savedProduct, ...prev]);
          }
        }
        else {
          await fetchProducts();
        }
        resetForm();
    }
    async function handleDelete(id) {
        setDeletingId(id);
        setError(null);
        // Save in case we need to restore
        const deletedProduct = products.find((p) => p.id === id);
        // Optimistically remove from UI
        setProducts((prev) => prev.filter((p) => p.id !== id));
        try {
            const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (!response.ok) {
                // Restore on error
                if (deletedProduct) {
                    setProducts((prev) => [...prev, deletedProduct]);
                }
                setError("Failed to delete product.");
                setDeletingId(null);
                return;
            }
            if (editingId === id) {
                resetForm();
            }
            setDeletingId(null);
        }
        catch (err) {
            // Restore on error
            if (deletedProduct) {
                setProducts((prev) => [...prev, deletedProduct]);
            }
            setError(err instanceof Error ? err.message : "Failed to delete product");
            setDeletingId(null);
        }
    }
    async function handleImageImport(event) {
        var _a;
        setError(null);
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            return;
        }
        try {
            const dataUrl = await fileToDataUrl(file);
            setForm((prev) => (Object.assign(Object.assign({}, prev), { imageUrl: dataUrl })));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to import image.");
        }
    }
    return (<main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Products</h1>

      <form onSubmit={handleSubmit} className="mb-8 grid gap-3 rounded border p-4 md:grid-cols-2">
        <input className="rounded border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { name: e.target.value })))} required/>
        <input className="rounded border p-2" placeholder="Category" value={form.category} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { category: e.target.value })))} required/>
        <input className="rounded border p-2" type="number" min="0" step="0.01" placeholder="Cost (required)" value={form.cost} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { cost: e.target.value })))} required/>
        <input className="rounded border p-2" type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { stock: e.target.value })))} required/>
        <input className="rounded border p-2" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { imageUrl: e.target.value })))} required/>
        <input className="file-input rounded border p-2 md:col-span-2" type="file" accept="image/*" onChange={(event) => void handleImageImport(event)}/>
        {form.imageUrl && (<div className="md:col-span-2">
            <p className="mb-1 text-xs text-gray-500">Image preview</p>
            <img src={form.imageUrl} alt="Product preview" className="h-28 w-28 rounded border object-cover"/>
          </div>)}
        <textarea className="rounded border p-2 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { description: e.target.value })))} rows={3} required/>
        <div className="flex gap-2 md:col-span-2">
          <button className="rounded bg-black px-4 py-2 text-white" type="submit">
            {submitLabel}
          </button>
          {editingId && (<button className="rounded border px-4 py-2" type="button" onClick={resetForm}>
              Cancel Edit
            </button>)}
        </div>
      </form>

      {error && (<div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-red-800">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>)}
      {loading ? (<div className="text-center py-8">
          <p className="text-gray-600">Loading products...</p>
        </div>) : products.length === 0 ? (<div className="text-center py-8">
          <p className="text-gray-500">No products yet. Create one above!</p>
        </div>) : (<div className="overflow-x-auto">
          <table className="min-w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Category</th>
                  <th className="border p-2 text-left">Cost</th>
                  <th className="border p-2 text-left">Stock</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (<tr key={product.id}>
                  <td className="border p-2">{product.id}</td>
                  <td className="border p-2">{product.name}</td>
                  <td className="border p-2">{product.category}</td>
                  <td className="border p-2">
                    {product.cost === null ? "-" : `$${product.cost.toFixed(2)}`}
                  </td>
                  <td className="border p-2">{product.stock}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <button className="rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3 py-1 text-sm text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => startEdit(product)} disabled={deletingId !== null}>
                        Edit
                      </button>
                      <button className="rounded bg-red-600 hover:bg-red-700 active:bg-red-800 px-3 py-1 text-sm text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => handleDelete(product.id)} disabled={deletingId === product.id}>
                        {deletingId === product.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </main>);
}
