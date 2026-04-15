import React from "react";
/**
 * Table component displaying pending product requests
 */
export function RequestsTable({ requests }) {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };
    const getStatusBadge = (status) => {
        const statusStyles = {
            pending: "bg-yellow-100 text-yellow-800",
            approved: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
            completed: "bg-blue-100 text-blue-800",
        };
        const style = statusStyles[status] || statusStyles.pending;
        return (<span className={`inline-block px-2 py-1 rounded text-xs font-medium ${style}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>);
    };
    return (<div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Pending Product Requests
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Product
              </th>
              <th className="px-6 py-3 text-right font-medium text-gray-700">
                Quantity
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left font-medium text-gray-700">
                Requested
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (<tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No pending requests
                </td>
              </tr>) : (requests.map((request) => (<tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">
                    <span className="font-medium">{request.productName}</span>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-900">
                    {request.quantity}
                  </td>
                  <td className="px-6 py-3">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {formatDate(request.createdAt)}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
}
