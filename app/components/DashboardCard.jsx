import React from "react";
/**
 * Reusable KPI card component for displaying metrics
 */
export function DashboardCard({ title, value, subtitle, icon, trend, }) {
    const trendColor = {
        up: "text-green-600",
        down: "text-red-600",
        neutral: "text-gray-600",
    }[trend || "neutral"];
    return (<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (<p className={`text-sm mt-1 ${trendColor}`}>{subtitle}</p>)}
        </div>
        {icon && <div className="text-gray-400 text-2xl ml-4">{icon}</div>}
      </div>
    </div>);
}
