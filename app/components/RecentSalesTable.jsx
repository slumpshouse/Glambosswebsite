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
    return (<div className="overflow-hidden rounded-2xl border-2 border-pink-200 bg-white shadow-lg">
      <div className="border-b border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-5 py-4">
        <h3 className="text-2xl font-bold text-purple-900">Recent Sales</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-white border-b border-pink-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-purple-900">
                Product
              </th>
              <th className="px-4 py-3 text-left font-semibold text-purple-900">
                Customer
              </th>
              <th className="px-4 py-3 text-right font-semibold text-purple-900">
                Qty
              </th>
              <th className="px-4 py-3 text-right font-semibold text-purple-900">
                Amount
              </th>
              <th className="px-4 py-3 text-left font-semibold text-purple-900">
                Payment
              </th>
              <th className="px-4 py-3 text-left font-semibold text-purple-900">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (<tr>
                <td colSpan={6} className="px-6 py-10 text-center text-purple-700 font-medium">
                  No recent sales
                </td>
              </tr>) : (sales.map((sale) => (<tr key={sale.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-purple-900">
                    <span className="font-medium">{sale.productName}</span>
                  </td>
                  <td className="px-4 py-3 text-purple-700">
                    {sale.customerName || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-right text-purple-900">
                    {sale.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-purple-900 font-semibold">
                    {formatCurrency(sale.totalPrice)}
                  </td>
                  <td className="px-4 py-3 text-purple-700">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${sale.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : sale.paymentStatus === "failed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                      {sale.paymentStatus === "paid" ? "completed" : sale.paymentStatus || "pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-purple-700 whitespace-nowrap">
                    {formatDate(sale.createdAt)}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
}
