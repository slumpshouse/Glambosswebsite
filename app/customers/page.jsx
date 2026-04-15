"use client";

import { useEffect, useState } from "react";
import { CustomerSearchBar } from "@/app/components/CustomerSearchBar";
import { CustomerList } from "@/app/components/CustomerList";

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    async function runSearch() {
      if (!debouncedQuery) {
        setCustomers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/customers/search?q=${encodeURIComponent(debouncedQuery)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to search customers");
        }

        const payload = await response.json();
        setCustomers(payload.results ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search customers");
      } finally {
        setLoading(false);
      }
    }

    void runSearch();
  }, [debouncedQuery]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Customer Management</h1>

      <div className="mb-4">
        <CustomerSearchBar value={query} onChange={setQuery} />
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <CustomerList
        customers={customers}
        hasSearched={Boolean(debouncedQuery)}
        loading={loading}
      />
    </main>
  );
}
