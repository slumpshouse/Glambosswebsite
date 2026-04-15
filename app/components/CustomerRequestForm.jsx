"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const initialForm = {
  productId: "",
  customerName: "",
  customerPhone: "",
  quantity: "1",
  notes: "",
};

function isValidProductId(value, availableProducts) {
  return availableProducts.some((product) => String(product.id) === value);
}

export function CustomerRequestForm({
  initialProducts = [],
  showBackLink = false,
  backHref = "/",
}) {
  const searchParams = useSearchParams();
  const inStockInitialProducts = (initialProducts ?? []).filter(
    (product) => product.stock > 0
  );
  const [products, setProducts] = useState(inStockInitialProducts);
  const [form, setForm] = useState(initialForm);
  const [loadingProducts, setLoadingProducts] = useState(
    inStockInitialProducts.length === 0
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [didLoadProducts, setDidLoadProducts] = useState(
    inStockInitialProducts.length > 0 || initialProducts.length > 0
  );
  const requestedProductId = searchParams.get("product") ?? "";

  useEffect(() => {
    if (products.length > 0) {
      const preferredProductId = isValidProductId(requestedProductId, products)
        ? requestedProductId
        : String(products[0].id);

      setForm((prev) => ({
        ...prev,
        productId:
          prev.productId && isValidProductId(prev.productId, products)
            ? prev.productId
            : preferredProductId,
      }));
      setLoadingProducts(false);
      return;
    }

    if (initialProducts.length > 0 || didLoadProducts) {
      setLoadingProducts(false);
      return;
    }

    async function loadProducts() {
      setLoadingProducts(true);
      setError(null);

      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();
        const inStock = (data ?? []).filter((product) => product.stock > 0);
        setProducts(inStock);

        if (inStock.length > 0) {
          setForm((prev) => ({
            ...prev,
            productId: prev.productId || String(inStock[0].id),
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setDidLoadProducts(true);
        setLoadingProducts(false);
      }
    }

    void loadProducts();
  }, [didLoadProducts, initialProducts.length, products, requestedProductId]);

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === form.productId) ?? null,
    [products, form.productId]
  );

  const estimatedTotal = useMemo(() => {
    if (!selectedProduct) {
      return 0;
    }

    const quantity = Number(form.quantity);
    return Number.isFinite(quantity) && quantity > 0
      ? selectedProduct.cost * quantity
      : selectedProduct.cost;
  }, [form.quantity, selectedProduct]);

  function updateQuantity(nextQuantity) {
    if (!selectedProduct) {
      return;
    }

    const normalizedQuantity = Math.max(
      1,
      Math.min(selectedProduct.stock, nextQuantity)
    );

    setForm((prev) => ({
      ...prev,
      quantity: String(normalizedQuantity),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.productId) {
      setError("Please select a product.");
      return;
    }

    if (!form.customerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.customerPhone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    if (selectedProduct && quantity > selectedProduct.stock) {
      setError("Requested quantity cannot exceed current stock.");
      return;
    }

    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/product-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(form.productId),
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          quantity,
          notes: form.notes.trim() || undefined,
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error ?? "Failed to submit request");
      }

      setMessage("Request submitted. Our team will contact you soon.");
      setForm((prev) => ({
        ...prev,
        customerName: "",
        customerPhone: "",
        quantity: "1",
        notes: "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
      {showBackLink && (
        <div className="mb-5">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
          >
            <span aria-hidden="true">&larr;</span>
            Back to products
          </Link>
        </div>
      )}

      {selectedProduct && (
        <div className="mb-6 flex items-center gap-4 rounded-2xl bg-indigo-50 p-4 text-indigo-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <span className="text-xl">•</span>
          </div>
          <div>
            <p className="text-xl font-semibold leading-tight">{selectedProduct.name}</p>
            <p className="text-sm font-semibold text-indigo-700">
              ${selectedProduct.cost.toFixed(2)} per unit
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
          Submit a product request
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
          We'll confirm your request and reach out to arrange payment and pickup. Your order is not placed until we confirm it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        {products.length > 1 && (
          <div className="grid gap-2">
            <label htmlFor="product" className="text-sm font-medium text-gray-700">
              Product
            </label>
            <select
              id="product"
              value={form.productId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, productId: event.target.value }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none"
              disabled={loadingProducts || products.length === 0}
              required
            >
              {products.map((product) => (
                <option key={product.id} value={String(product.id)}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-2">
          <label htmlFor="customerName" className="text-sm font-medium text-gray-700">
            Your name
          </label>
          <input
            id="customerName"
            type="text"
            value={form.customerName}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, customerName: event.target.value }))
            }
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none"
            placeholder="Full name"
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">
            Phone number
          </label>
          <input
            id="customerPhone"
            type="tel"
            value={form.customerPhone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, customerPhone: event.target.value }))
            }
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none"
            placeholder="267-xxx-xxxx"
            required
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
            Quantity
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => updateQuantity(Number(form.quantity || "1") - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-300 text-lg text-gray-700 hover:bg-gray-100"
              disabled={!selectedProduct || Number(form.quantity) <= 1}
            >
              -
            </button>
            <span className="min-w-4 text-center text-lg font-semibold text-gray-900">
              {form.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(Number(form.quantity || "1") + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-300 text-lg text-gray-700 hover:bg-gray-100"
              disabled={!selectedProduct || Number(form.quantity) >= (selectedProduct?.stock ?? 1)}
            >
              +
            </button>
          </div>
          {selectedProduct && (
            <p className="text-xs text-gray-500">{selectedProduct.stock} units available</p>
          )}
        </div>

        <div className="grid gap-2">
          <label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, notes: event.target.value }))
            }
            className="min-h-16 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none"
            placeholder="Any special requests or questions..."
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm">
          <span className="font-medium text-gray-600">Estimated total</span>
          <span className="text-2xl font-semibold text-indigo-600">
            ${estimatedTotal.toFixed(2)}
          </span>
        </div>

        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        {message && <p className="rounded bg-green-50 p-2 text-sm text-green-700">{message}</p>}

        <button
          type="submit"
          disabled={submitting || loadingProducts || products.length === 0}
          className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit request"}
        </button>

        <p className="mx-auto max-w-md text-center text-sm leading-6 text-gray-500">
          Payment is not collected here. Raquel will confirm your request and follow up via phone or DM.
        </p>
      </form>
    </section>
  );
}
