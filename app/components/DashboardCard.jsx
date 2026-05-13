import React from "react";
/**
 * Reusable KPI card component for displaying metrics
 */
export function DashboardCard({ title, value, subtitle, icon, trend, }) {
    const trendColor = {
        up: "text-emerald-600",
        down: "text-red-600",
        neutral: "text-purple-600",
    }[trend || "neutral"];
    return (<div className="bg-gradient-to-br from-white to-pink-50 rounded-lg shadow-md p-6 border-2 border-pink-100 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-purple-600 text-sm font-semibold">{title}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mt-2">{value}</p>
          {subtitle && (<p className={`text-sm mt-1 font-medium ${trendColor}`}>{subtitle}</p>)}
        </div>
        {icon && <div className="text-pink-400 text-3xl ml-4">{icon}</div>}
      </div>
    </div>);
}
