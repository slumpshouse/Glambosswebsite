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
      <div className="rounded border bg-white p-4 text-sm text-gray-600">
        Searching customers...
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="rounded border bg-white p-4 text-sm text-gray-500">
        Start typing to search customers by name or phone number.
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded border bg-white p-4 text-sm text-gray-500">
        No matching customers found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left text-sm">
            <th className="border-b p-3">Name</th>
            <th className="border-b p-3">Phone</th>
            <th className="border-b p-3">Total Spend</th>
            <th className="border-b p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="text-sm">
              <td className="border-b p-3">{customer.name ?? "-"}</td>
              <td className="border-b p-3">{customer.phone}</td>
              <td className="border-b p-3">{formatCurrency(customer.totalSpend)}</td>
              <td className="border-b p-3">
                <Link
                  href={`/customers/${customer.id}`}
                  className="rounded bg-black px-3 py-1 text-white hover:bg-gray-900"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
