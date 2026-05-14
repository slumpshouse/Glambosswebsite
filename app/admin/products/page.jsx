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
    const sectionOptions = useMemo(() => {
      return Array.from(
        new Set(
          products
            .map((product) => product.category?.trim())
            .filter((category) => Boolean(category))
        )
      ).sort((a, b) => a.localeCompare(b));
    }, [products]);
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
    return (<main className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Products</h1>
        <p className="mt-2 text-sm text-purple-800 sm:text-base">Create and manage catalog items, pricing, and stock levels.</p>
      </div>

      <section className="mb-8 rounded-2xl border-2 border-pink-200 bg-white/90 p-5 shadow-lg sm:p-6">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input className="rounded-lg border-2 border-pink-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-purple-300 outline-none transition-colors focus:border-pink-500" placeholder="Name" value={form.name} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { name: e.target.value })))} required/>

          <div className="grid gap-2 md:col-span-2">
            <label htmlFor="section" className="text-sm font-semibold text-purple-700">
              Category / Section
            </label>
            <input id="section" list="section-options" className="rounded-lg border-2 border-pink-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-purple-300 outline-none transition-colors focus:border-pink-500" placeholder="Select an existing section or type a new one" value={form.category} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { category: e.target.value })))} required/>
            <datalist id="section-options">
              {sectionOptions.map((section) => (<option key={section} value={section}/>))}
            </datalist>

            {sectionOptions.length > 0 && (<div className="flex flex-wrap gap-2 pt-1">
                {sectionOptions.map((section) => (<button key={section} type="button" onClick={() => setForm((prev) => (Object.assign(Object.assign({}, prev), { category: section })))} className={["rounded-full border px-3 py-1 text-xs font-semibold transition-colors", form.category === section
                        ? "border-pink-400 bg-pink-100 text-pink-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"].join(" ")}>
                    {section}
                  </button>))}
              </div>)}
          </div>

          <input className="rounded-lg border-2 border-pink-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-purple-300 outline-none transition-colors focus:border-pink-500" type="number" min="0" step="0.01" placeholder="Cost (required)" value={form.cost} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { cost: e.target.value })))} required/>
          <input className="rounded-lg border-2 border-pink-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-purple-300 outline-none transition-colors focus:border-pink-500" type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { stock: e.target.value })))} required/>

          <input className="rounded-lg border-2 border-pink-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-purple-300 outline-none transition-colors focus:border-pink-500" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { imageUrl: e.target.value })))} required/>
          <input className="file-input rounded-lg border-2 border-pink-400 bg-pink-50 px-3 py-2.5 text-sm text-purple-800 md:col-span-2" type="file" accept="image/*" onChange={(event) => void handleImageImport(event)}/>

          {form.imageUrl && (<div className="rounded-xl border border-pink-200 bg-pink-50 p-3 md:col-span-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-pink-700">Image preview</p>
              <img src={form.imageUrl} alt="Product preview" className="h-28 w-28 rounded-lg border border-pink-200 object-cover"/>
            </div>)}

          <textarea className="rounded-lg border-2 border-pink-200 bg-white px-3 py-2.5 text-gray-900 placeholder:text-purple-300 outline-none transition-colors focus:border-pink-500 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm((prev) => (Object.assign(Object.assign({}, prev), { description: e.target.value })))} rows={3} required/>

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition-all hover:from-pink-600 hover:to-purple-600" type="submit">
              {submitLabel}
            </button>
            {editingId && (<button className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100" type="button" onClick={resetForm}>
                Cancel Edit
              </button>)}
          </div>
        </form>
      </section>

      {error && (<div className="mb-4 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>)}

      {loading ? (<div className="rounded-2xl border-2 border-pink-200 bg-white/80 p-6 text-center text-sm font-medium text-purple-800 shadow-sm">
          Loading products...
        </div>) : products.length === 0 ? (<div className="rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50 p-8 text-center text-sm font-medium text-pink-700">
          No products yet. Create one above.
        </div>) : (<section className="overflow-hidden rounded-2xl border-2 border-pink-200 bg-white/90 shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                <tr>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">ID</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Name</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Category</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Cost</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Stock</th>
                  <th className="border-b border-pink-200 px-4 py-3 text-left text-sm font-semibold text-purple-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (<tr key={product.id} className={index % 2 === 0 ? "bg-white" : "bg-pink-50/40"}>
                    <td className="border-b border-pink-100 px-4 py-3 text-sm text-purple-800">{product.id}</td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base font-medium text-purple-900">{product.name}</td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base text-purple-900">{product.category}</td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base font-semibold text-pink-700 whitespace-nowrap">
                      {product.cost === null ? "-" : `$${product.cost.toFixed(2)}`}
                    </td>
                    <td className="border-b border-pink-100 px-4 py-3 text-base font-medium text-purple-900">{product.stock}</td>
                    <td className="border-b border-pink-100 px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => startEdit(product)} disabled={deletingId !== null}>
                          Edit
                        </button>
                        <button className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => handleDelete(product.id)} disabled={deletingId === product.id}>
                          {deletingId === product.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </section>)}
    </main>);
}
