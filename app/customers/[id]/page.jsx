"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CustomerDetailCard } from "@/app/components/CustomerDetailCard";
import { PurchaseHistoryTable } from "@/app/components/PurchaseHistoryTable";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = Number(params.id);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCustomer() {
      if (!Number.isFinite(customerId)) {
        setError("Invalid customer id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/customers/${customerId}?limit=50`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load customer details");
        }

        const payload = await response.json();
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load customer details");
      } finally {
        setLoading(false);
      }
    }

    void fetchCustomer();
  }, [customerId]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4">
        <Link href="/customers" className="text-sm text-blue-700 hover:underline">
          Back to Customers
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading customer details...</p>}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-4">
          <CustomerDetailCard customer={data.customer} metrics={data.metrics} />
          <PurchaseHistoryTable rows={data.purchaseHistory} hasMore={data.hasMore} />
        </div>
      )}
    </main>
  );
}
