"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "glam_cart_items";

function safeNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const normalized = (Array.isArray(parsed) ? parsed : [])
        .filter((item) => item?.product?.id && Number(item?.quantity) > 0)
        .map((item) => ({
          product: item.product,
          quantity: Math.max(1, safeNumber(item.quantity, 1)),
        }));

      setItems(normalized);
    } catch {
      setItems([]);
    }
  }, []);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + safeNumber(item.product?.cost, 0) * safeNumber(item.quantity, 1),
        0
      ),
    [items]
  );

  function updateQuantity(productId, nextQuantity) {
    setItems((prev) => {
      const next = prev
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          const safeQuantity = Math.max(0, Math.min(safeNumber(item.product.stock, 0), nextQuantity));
          return { ...item, quantity: safeQuantity };
        })
        .filter((item) => item.quantity > 0);

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      setError("Please fill in your name and phone number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          notes: form.notes.trim() || undefined,
          items: items.map((item) => ({
            productId: Number(item.product.id),
            quantity: Number(item.quantity),
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      window.localStorage.removeItem(STORAGE_KEY);
      const sales = (data.saleIds ?? []).join(",");
      router.push(`/payments/cart?sales=${sales}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-purple-900">Cart checkout</h1>
        <Link
          href="/"
          className="rounded-lg border-2 border-pink-300 px-3 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50"
        >
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50 p-8 text-center text-sm font-medium text-pink-700">
          Your cart is empty. Add products first.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-3 rounded-2xl border-2 border-pink-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-purple-900">Items</h2>
            {items.map((item) => {
              const price = safeNumber(item.product?.cost, 0);
              const lineTotal = price * item.quantity;

              return (
                <div key={item.product.id} className="rounded-xl border border-pink-100 p-3">
                  <p className="font-semibold text-purple-900">{item.product.name}</p>
                  <p className="text-sm text-purple-700">${price.toFixed(2)} each</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="h-8 w-8 rounded border border-pink-300 text-pink-700"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="h-8 w-8 rounded border border-pink-300 text-pink-700"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-semibold text-pink-600">${lineTotal.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}

            <div className="rounded-xl bg-pink-50 p-3 text-right">
              <p className="text-sm text-purple-700">Total</p>
              <p className="text-2xl font-bold text-pink-600">${total.toFixed(2)}</p>
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-white to-pink-50 p-5"
          >
            <h2 className="text-xl font-semibold text-purple-900">Your information</h2>
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-800">Name</label>
              <input
                value={form.customerName}
                onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
                className="w-full rounded-lg border border-pink-200 p-2"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-800">Phone</label>
              <input
                value={form.customerPhone}
                onChange={(event) => setForm((prev) => ({ ...prev, customerPhone: event.target.value }))}
                className="w-full rounded-lg border border-pink-200 p-2"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-purple-800">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="h-24 w-full rounded-lg border border-pink-200 p-2"
                placeholder="Delivery or pickup preferences"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
            >
              {submitting ? "Preparing payment..." : "Proceed to payment"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
