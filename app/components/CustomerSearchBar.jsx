export function CustomerSearchBar({ value, onChange }) {
  return (
    <div className="rounded-2xl border-2 border-pink-200 bg-white/90 p-5 shadow-sm sm:p-6">
      <label htmlFor="customer-search" className="mb-2 block text-sm font-semibold text-purple-700">
        Search Customers
      </label>
      <input
        id="customer-search"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name or phone"
        className="w-full rounded-lg border-2 border-pink-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-purple-300 outline-none transition-colors focus:border-pink-500"
      />
    </div>
  );
}
