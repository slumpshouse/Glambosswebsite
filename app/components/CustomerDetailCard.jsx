export function CustomerDetailCard({ customer, metrics }) {
  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  return (
    <section className="rounded border bg-white p-4">
      <h2 className="mb-3 text-xl font-semibold text-gray-900">Customer Details</h2>

      <dl className="grid gap-3 md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Name</dt>
          <dd className="text-sm text-gray-900">{customer.name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Phone</dt>
          <dd className="text-sm text-gray-900">{customer.phone}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Instagram</dt>
          <dd className="text-sm text-gray-900">{customer.instagramHandle ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-gray-500">Created</dt>
          <dd className="text-sm text-gray-900">
            {new Date(customer.createdAt).toLocaleString()}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded border bg-gray-50 p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Lifetime Spend</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(metrics.totalLifetimeSpend)}
          </p>
        </div>
        <div className="rounded border bg-gray-50 p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Purchase Frequency</p>
          <p className="text-lg font-semibold text-gray-900">{metrics.purchaseFrequency}</p>
        </div>
      </div>
    </section>
  );
}
