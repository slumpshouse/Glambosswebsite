"use client";
import { useEffect, useMemo, useState } from "react";
export default function AiSummaryPage() {
    const [aggregate, setAggregate] = useState(null);
    const [structured, setStructured] = useState(null);
    const [editableSummary, setEditableSummary] = useState("");
    const [weekStart, setWeekStart] = useState("");
    const [weekEnd, setWeekEnd] = useState("");
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    useEffect(() => {
        async function loadInitial() {
            var _a;
            setLoading(true);
            setError(null);
            const response = await fetch("/api/sales/weekly-summary", { cache: "no-store" });
            if (!response.ok) {
                const body = (await response.json().catch(() => ({})));
                setError((_a = body.error) !== null && _a !== void 0 ? _a : "Failed to load weekly sales data.");
                setLoading(false);
                return;
            }
            const data = (await response.json());
            setAggregate(data.aggregate);
            if (data.latest) {
                setEditableSummary(data.latest.summary);
                setWeekStart(data.latest.weekStart);
                setWeekEnd(data.latest.weekEnd);
            }
            else {
                setWeekStart(data.aggregate.weekStart);
                setWeekEnd(data.aggregate.weekEnd);
            }
            setLoading(false);
        }
        void loadInitial();
    }, []);
    const totalRevenue = useMemo(() => {
        var _a;
        return (_a = aggregate === null || aggregate === void 0 ? void 0 : aggregate.totals.revenue) !== null && _a !== void 0 ? _a : 0;
    }, [aggregate]);
    const periodLabel = useMemo(() => {
      if (!weekStart || !weekEnd)
        return "Current reporting period";
      return `${new Date(weekStart).toLocaleDateString()} - ${new Date(weekEnd).toLocaleDateString()}`;
    }, [weekStart, weekEnd]);
    async function handleGenerateSummary() {
        var _a, _b;
        setGenerating(true);
        setError(null);
        setSuccess(null);
        const response = await fetch("/api/sales/weekly-summary", {
            method: "POST",
        });
        const body = (await response.json().catch(() => ({})));
        if (!response.ok) {
            if (response.status === 429 && body.retryAfterMs) {
                setError(`Rate limited. Try again in ${Math.ceil(body.retryAfterMs / 1000)}s.`);
            }
            else {
                setError((_a = body.error) !== null && _a !== void 0 ? _a : "Failed to generate AI summary.");
            }
            setGenerating(false);
            return;
        }
        if (body.aggregate) {
            setAggregate(body.aggregate);
            setWeekStart(body.aggregate.weekStart);
            setWeekEnd(body.aggregate.weekEnd);
        }
        if (body.structured) {
            setStructured(body.structured);
        }
        setEditableSummary((_b = body.editableSummary) !== null && _b !== void 0 ? _b : "");
        setSuccess("Summary generated.");
        setGenerating(false);
    }
    return (<main className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-6 rounded-2xl border border-pink-200 bg-gradient-to-r from-white via-pink-50 to-purple-50 p-5 shadow-sm sm:mb-8 sm:p-6">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent sm:text-4xl">Weekly AI Sales Summary</h1>
        <p className="mt-2 text-sm text-purple-900/80 sm:text-base">{periodLabel}</p>
      </div>

      {loading ? (<div className="rounded-2xl border-2 border-pink-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-purple-800">Loading weekly sales data...</p>
        </div>) : (<div className="space-y-6">
          {aggregate && (<section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Week Revenue</p>
                <p className="mt-2 text-3xl font-bold text-pink-700">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Sales Count</p>
                <p className="mt-2 text-3xl font-bold text-purple-800">{aggregate.totals.salesCount}</p>
              </div>
              <div className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Units Sold</p>
                <p className="mt-2 text-3xl font-bold text-purple-800">{aggregate.totals.unitsSold}</p>
              </div>
            </section>)}

          {aggregate && (<section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-2xl font-bold text-purple-900">Customer Trends</h2>
                <p className="text-sm text-purple-800">New customers this week: <span className="font-semibold">{aggregate.customerTrends.newCustomers}</span></p>
                <p className="mb-3 text-sm text-purple-800">Repeat customers this week: <span className="font-semibold">{aggregate.customerTrends.repeatCustomers}</span></p>
                <ul className="space-y-2 text-sm text-purple-800">
                  {aggregate.customerTrends.topCustomers.map((row) => {
                    var _a;
                    return (<li key={row.customerId} className="rounded-lg bg-pink-50 px-3 py-2">
                      <span className="font-semibold">{(_a = row.customerName) !== null && _a !== void 0 ? _a : row.customerPhone}</span>: {row.orders} orders (${row.revenue.toFixed(2)})
                    </li>);
                })}
                </ul>
              </div>

              <div className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-2xl font-bold text-purple-900">Top Inventory</h2>
                <ul className="space-y-2 text-sm text-purple-800">
                  {aggregate.inventory.top.map((item) => (<li key={item.productId} className="rounded-lg bg-pink-50 px-3 py-2">
                      <span className="font-semibold">{item.productName}</span>: {item.stock}
                    </li>))}
                </ul>
              </div>

              <div className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-2xl font-bold text-purple-900">Bottom Inventory</h2>
                <ul className="space-y-2 text-sm text-purple-800">
                  {aggregate.inventory.bottom.map((item) => (<li key={item.productId} className="rounded-lg bg-pink-50 px-3 py-2">
                      <span className="font-semibold">{item.productName}</span>: {item.stock}
                    </li>))}
                </ul>
              </div>
            </section>)}

          <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleGenerateSummary()} disabled={generating} className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition-all hover:from-pink-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-60">
                {generating ? "Generating..." : "Generate AI Summary"}
              </button>
            </div>

            <p className="mb-2 block text-sm font-semibold text-purple-700">
              AI Summary
            </p>
            <div className="min-h-[260px] w-full rounded-xl border-2 border-pink-200 bg-pink-50/30 p-4 text-sm text-purple-900 whitespace-pre-wrap">
              {editableSummary || <span className="text-purple-300">Generate a summary to view it here.</span>}
            </div>
          </section>

          {error && (<div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>)}
          {success && (<div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{success}</div>)}
        </div>)}
    </main>);
}
