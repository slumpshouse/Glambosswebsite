import React from "react";
/**
 * Table component displaying recent sales
 */
export function RecentSalesTable({ sales }) {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };
    return (<div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Product
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Customer
              </th>
              <th className="px-6 py-3 text-right font-medium text-gray-700">
                Qty
              </th>
              <th className="px-6 py-3 text-right font-medium text-gray-700">
                Amount
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (<tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No recent sales
                </td>
              </tr>) : (sales.map((sale) => (<tr key={sale.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">
                    <span className="font-medium">{sale.productName}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {sale.customerName || "Unknown"}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-900">
                    {sale.quantity}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-900 font-medium">
                    {formatCurrency(sale.totalPrice)}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {formatDate(sale.createdAt)}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
}
