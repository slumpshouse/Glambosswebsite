import Link from "next/link";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function CustomerList({ customers, hasSearched, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-pink-200 bg-white/80 p-6 text-sm font-medium text-purple-800 shadow-sm">
        Searching customers...
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="rounded-2xl border-2 border-pink-200 bg-white/80 p-6 text-sm text-purple-700 shadow-sm">
        Start typing to search customers by name or phone number.
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50 p-6 text-sm font-medium text-pink-700">
        No matching customers found.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-pink-200 bg-white/90 shadow-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
            <tr className="text-left text-sm">
              <th className="border-b border-pink-200 px-4 py-3 font-semibold text-purple-900">Name</th>
              <th className="border-b border-pink-200 px-4 py-3 font-semibold text-purple-900">Phone</th>
              <th className="border-b border-pink-200 px-4 py-3 font-semibold text-purple-900">Total Spend</th>
              <th className="border-b border-pink-200 px-4 py-3 font-semibold text-purple-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr key={customer.id} className={index % 2 === 0 ? "bg-white" : "bg-pink-50/40"}>
                <td className="border-b border-pink-100 px-4 py-3 text-sm font-medium text-purple-900">{customer.name ?? "-"}</td>
                <td className="border-b border-pink-100 px-4 py-3 text-sm text-purple-900">{customer.phone}</td>
                <td className="border-b border-pink-100 px-4 py-3 text-sm font-semibold text-pink-700">
                  {formatCurrency(customer.totalSpend)}
                </td>
                <td className="border-b border-pink-100 px-4 py-3 text-sm">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="inline-flex rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:from-pink-600 hover:to-purple-600"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
