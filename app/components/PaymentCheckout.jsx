"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function CheckoutForm({ saleId, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payments/${saleId}`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setMessage(result.error.message || "Payment failed");
      setLoading(false);
      return;
    }

    onPaid?.();
    setMessage("Payment submitted successfully.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-pink-200 bg-white p-5 shadow-sm">
      <PaymentElement />
      {message && <p className="text-sm text-purple-700">{message}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

export default function PaymentCheckout({ sale }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isCartCheckout = Array.isArray(sale.saleIds) && sale.saleIds.length > 0;
  const cartItems = sale.items ?? [];
  const displayName = sale.customerName || sale.customerPhone;

  useEffect(() => {
    async function createIntent() {
      try {
        const payload = isCartCheckout
          ? { saleIds: sale.saleIds, primarySaleId: sale.id }
          : { saleId: sale.id };

        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to initialize payment");
        }

        if (data.alreadyPaid) {
          setClientSecret(null);
          setLoading(false);
          return;
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize payment");
      } finally {
        setLoading(false);
      }
    }

    void createIntent();
  }, [isCartCheckout, sale.id, sale.saleIds]);

  if (loading) {
    return <p className="text-sm text-gray-600">Loading payment details...</p>;
  }

  return (
    <section className="rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50 p-6">
      <h1 className="text-2xl font-bold text-purple-900">
        {isCartCheckout ? "Complete your cart payment" : "Complete your payment"}
      </h1>
      <p className="mt-2 text-sm text-purple-700">
        {isCartCheckout
          ? `Cart checkout for ${displayName}`
          : `${sale.productName} for ${displayName}`}
      </p>
      <p className="mt-1 text-lg font-semibold text-pink-600">${Number(sale.totalPrice).toFixed(2)}</p>

      {isCartCheckout && cartItems.length > 0 && (
        <div className="mt-4 space-y-2 rounded-2xl border border-pink-200 bg-white p-4">
          {cartItems.map((item) => (
            <div key={item.saleId} className="flex items-center justify-between text-sm text-purple-900">
              <span>
                {item.productName} x {item.quantity}
              </span>
              <span className="font-semibold">${Number(item.totalPrice).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {sale.paymentStatus === "paid" ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          This sale is already paid.
        </div>
      ) : clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm saleId={sale.id} onPaid={() => setError(null)} />
        </Elements>
      ) : null}
    </section>
  );
}
