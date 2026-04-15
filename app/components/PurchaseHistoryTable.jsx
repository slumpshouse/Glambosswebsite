function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function PurchaseHistoryTable({ rows, hasMore }) {
  if (rows.length === 0) {
    return (
      <section className="rounded border bg-white p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Purchase History</h3>
        <p className="text-sm text-gray-500">No purchases recorded for this customer yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded border bg-white p-4">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Purchase History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="border-b p-3">Product</th>
              <th className="border-b p-3">Quantity</th>
              <th className="border-b p-3">Total Price</th>
              <th className="border-b p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.saleId} className="text-sm">
                <td className="border-b p-3">{row.productName}</td>
                <td className="border-b p-3">{row.quantity}</td>
                <td className="border-b p-3">{formatCurrency(row.totalPrice)}</td>
                <td className="border-b p-3">{new Date(row.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <p className="mt-3 text-xs text-gray-500">
          Showing the most recent records. Use a larger limit in the API for deeper history.
        </p>
      )}
    </section>
  );
}
