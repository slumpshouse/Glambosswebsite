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
    const [saving, setSaving] = useState(false);
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
        setSuccess("Summary generated. Review and edit before saving.");
        setGenerating(false);
    }
    async function handleSaveSummary() {
        var _a;
        if (!aggregate || !structured || !editableSummary.trim()) {
            setError("Generate and edit a summary before saving.");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        const response = await fetch("/api/sales/weekly-summary", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                weekStart,
                weekEnd,
                editableSummary,
                structured,
                aggregate,
            }),
        });
        const body = (await response.json().catch(() => ({})));
        if (!response.ok) {
            setError((_a = body.error) !== null && _a !== void 0 ? _a : "Failed to save summary.");
            setSaving(false);
            return;
        }
        setSuccess("Summary saved successfully.");
        setSaving(false);
    }
    return (<main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-semibold">Weekly AI Sales Summary</h1>

      {loading ? (<p>Loading weekly sales data...</p>) : (<div className="space-y-6">
          {aggregate && (<section className="grid gap-4 rounded border p-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Week Revenue</p>
                <p className="text-2xl font-semibold">${totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sales Count</p>
                <p className="text-2xl font-semibold">{aggregate.totals.salesCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Units Sold</p>
                <p className="text-2xl font-semibold">{aggregate.totals.unitsSold}</p>
              </div>
            </section>)}

          {aggregate && (<section className="grid gap-4 md:grid-cols-2">
              <div className="rounded border p-4">
                <h2 className="mb-2 text-lg font-semibold">Product Volume</h2>
                <ul className="space-y-1 text-sm">
                  {aggregate.productVolume.slice(0, 8).map((row) => (<li key={row.productId}>
                      {row.productName}: {row.unitsSold} units (${row.revenue.toFixed(2)})
                    </li>))}
                </ul>
              </div>

              <div className="rounded border p-4">
                <h2 className="mb-2 text-lg font-semibold">Customer Trends</h2>
                <p className="text-sm">New customers this week: {aggregate.customerTrends.newCustomers}</p>
                <p className="mb-2 text-sm">Repeat customers this week: {aggregate.customerTrends.repeatCustomers}</p>
                <ul className="space-y-1 text-sm">
                  {aggregate.customerTrends.topCustomers.map((row) => {
                    var _a;
                    return (<li key={row.customerId}>
                      {(_a = row.customerName) !== null && _a !== void 0 ? _a : row.customerPhone}: {row.orders} orders (${row.revenue.toFixed(2)})
                    </li>);
                })}
                </ul>
              </div>

              <div className="rounded border p-4">
                <h2 className="mb-2 text-lg font-semibold">Top Inventory</h2>
                <ul className="space-y-1 text-sm">
                  {aggregate.inventory.top.map((item) => (<li key={item.productId}>
                      {item.productName}: {item.stock}
                    </li>))}
                </ul>
              </div>

              <div className="rounded border p-4">
                <h2 className="mb-2 text-lg font-semibold">Bottom Inventory</h2>
                <ul className="space-y-1 text-sm">
                  {aggregate.inventory.bottom.map((item) => (<li key={item.productId}>
                      {item.productName}: {item.stock}
                    </li>))}
                </ul>
              </div>
            </section>)}

          <section className="rounded border p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleGenerateSummary()} disabled={generating} className="rounded bg-black hover:bg-gray-900 active:bg-gray-950 px-4 py-2 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {generating ? "Generating..." : "Generate AI Summary"}
              </button>

              <button type="button" onClick={() => void handleSaveSummary()} disabled={saving || !editableSummary.trim()} className="rounded bg-green-600 hover:bg-green-700 active:bg-green-800 px-4 py-2 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? "Saving..." : "Save Summary"}
              </button>
            </div>

            <label htmlFor="summary" className="mb-2 block text-sm font-medium text-gray-700">
              Editable Summary Draft
            </label>
            <textarea id="summary" className="min-h-[240px] w-full rounded border p-3 text-sm" value={editableSummary} onChange={(event) => setEditableSummary(event.target.value)} placeholder="Generate a summary, edit it, then save."/>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}
        </div>)}
    </main>);
}
