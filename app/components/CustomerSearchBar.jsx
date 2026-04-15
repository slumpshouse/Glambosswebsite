export function CustomerSearchBar({ value, onChange }) {
  return (
    <div className="rounded border bg-white p-4">
      <label htmlFor="customer-search" className="mb-2 block text-sm font-medium text-gray-700">
        Search Customers
      </label>
      <input
        id="customer-search"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name or phone"
        className="w-full rounded border border-gray-300 p-2 text-sm focus:border-black focus:outline-none"
      />
    </div>
  );
}
