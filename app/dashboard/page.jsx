"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardCard } from "@/app/components/DashboardCard";
import { RecentSalesTable } from "@/app/components/RecentSalesTable";
import { RequestsTable } from "@/app/components/RequestsTable";
/**
 * Admin Dashboard Page
 * Displays key business metrics, recent activity, inventory insights, and quick actions
 */
export default function DashboardPage() {
    const router = useRouter();
    const { status } = useSession();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Verify admin authentication
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/admin/login");
        }
    }, [status, router]);
    // Fetch dashboard data
    useEffect(() => {
        async function fetchDashboard() {
            try {
                const response = await fetch("/api/dashboard");
                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard data");
                }
                const json = await response.json();
                setData(json);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            }
            finally {
                setLoading(false);
            }
        }
        if (status === "authenticated") {
            fetchDashboard();
        }
    }, [status]);
    if (status === "loading" || loading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>);
    }
    if (error || !data) {
        return (<div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-900 font-semibold">Error</h3>
            <p className="text-red-700">{error || "Failed to load dashboard"}</p>
          </div>
        </div>
      </div>);
    }
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };
    return (<div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">Welcome back, Admin</p>
          </div>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Section 1: KPI Summary Cards */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard title="Total Revenue" value={formatCurrency(data.metrics.totalRevenue)} icon="💰"/>
            <DashboardCard title="Total Sales" value={data.metrics.totalSalesCount} icon="🛍️"/>
            <DashboardCard title="Total Products" value={data.metrics.totalProducts} icon="📦"/>
            <DashboardCard title="Low Stock Items" value={data.metrics.lowStockProducts} trend={data.metrics.lowStockProducts > 5 ? "down" : "up"} subtitle={data.metrics.lowStockProducts > 0
            ? "⚠️ Requires attention"
            : "✓ All good"} icon="⚠️"/>
          </div>
        </section>

        {/* Section 2: Weekly Sales Overview */}
        <section className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Weekly Sales Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-gray-600 text-sm font-medium">Weekly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(data.weeklySalesOverview.weeklyRevenue)}
              </p>
            </div>
            {data.weeklySalesOverview.topProducts.length > 0 ? (<div className="md:col-span-2">
                <p className="text-gray-600 text-sm font-medium mb-4">
                  Top Products This Week
                </p>
                <div className="space-y-3">
                  {data.weeklySalesOverview.topProducts.map((product, idx) => (<div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">
                          {idx + 1}. {product.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {product.totalQuantitySold} units sold
                        </p>
                      </div>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(product.totalRevenue)}
                      </p>
                    </div>))}
                </div>
              </div>) : (<div className="md:col-span-2">
                <p className="text-gray-600">No sales this week</p>
              </div>)}
          </div>
        </section>

        {/* Section 3: Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentSalesTable sales={data.recentSales}/>
          <RequestsTable requests={data.pendingRequests}/>
        </div>

        {/* Section 4: Inventory Insights */}
        <section className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Inventory Insights
          </h2>
          {data.lowStockItems.length === 0 ? (<p className="text-gray-500 text-center py-8">
              ✓ All products have sufficient stock
            </p>) : (<div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.lowStockItems.map((item) => (<tr key={item.id} className={`border-b border-gray-200 hover:bg-gray-50 ${item.stock === 0 ? "bg-red-50" : ""}`}>
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {item.name}
                        {item.stock === 0 && (<span className="ml-2 text-red-600 font-bold">
                            OUT OF STOCK
                          </span>)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.category}</td>
                      <td className={`px-4 py-3 text-right font-medium ${item.stock === 0 ? "text-red-600" : "text-gray-900"}`}>
                        {item.stock}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatCurrency(item.cost)}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </section>

        {/* Section 5: Quick Actions */}
        <section className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <QuickActionButton href="/admin/products" label="Add Product" emoji="➕"/>
            <QuickActionButton href="/admin/product-requests" label="View Requests" emoji="📋"/>
            <QuickActionButton href="/admin/sales/manual" label="Log Manual Sale" emoji="💳"/>
            <QuickActionButton href="/admin/sales" label="View Sales" emoji="📊"/>
            <QuickActionButton href="/admin/ai-summary" label="AI Summary" emoji="🤖"/>
          </div>
        </section>
      </div>
    </div>);
}
/**
 * Quick action button component
 */
function QuickActionButton({ href, label, emoji, }) {
    return (<Link href={href} className="block p-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors text-center shadow hover:shadow-lg text-white font-semibold">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-white text-sm">{label}</div>
    </Link>);
}
