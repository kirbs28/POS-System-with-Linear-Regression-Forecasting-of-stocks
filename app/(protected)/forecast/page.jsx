"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { TrendingDown, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default function ForecastPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/api/forecast")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); if (d.products?.length > 0) setSelected(d.products[0]._id); })
      .catch(() => setLoading(false));
  }, []);

  const selectedProduct = data?.products?.find(p => p._id === selected);

  const statusColor = (status) => ({
    critical: "text-red-600 bg-red-50 border-red-200",
    warning: "text-orange-600 bg-orange-50 border-orange-200",
    ok: "text-green-600 bg-green-50 border-green-200",
  })[status] || "text-gray-600 bg-gray-50 border-gray-200";

  const statusIcon = (status) => ({
    critical: <AlertTriangle size={16} />,
    warning: <TrendingDown size={16} />,
    ok: <CheckCircle size={16} />,
  })[status] || <Info size={16} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-display text-jollibee-red tracking-wider">STOCK FORECAST</h1>
        <p className="text-jollibee-brown/60 font-medium text-sm">2-month stock depletion prediction based on sales velocity</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Calculating forecasts...</div>
      ) : !data?.products?.length ? (
        <div className="card text-center py-16">
          <Info size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 font-medium">No product data available for forecasting.</p>
          <p className="text-sm text-gray-300 mt-1">Add products and upload sales data to generate forecasts.</p>
        </div>
      ) : (
        <>
          {/* Alert summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Critical", count: data.summary?.critical || 0, color: "text-red-600", bg: "bg-red-50 border-red-200" },
              { label: "Warning", count: data.summary?.warning || 0, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
              { label: "Healthy", count: data.summary?.ok || 0, color: "text-green-600", bg: "bg-green-50 border-green-200" },
            ].map((s, i) => (
              <div key={i} className={`card border ${s.bg} text-center`}>
                <p className={`text-3xl font-display ${s.color}`}>{s.count}</p>
                <p className={`text-xs font-bold uppercase tracking-wider ${s.color}`}>{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Product list */}
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-jollibee-yellow/20 bg-jollibee-cream">
                <h3 className="font-bold text-jollibee-brown text-sm uppercase tracking-wider">Products</h3>
              </div>
              <div className="overflow-y-auto max-h-[500px]">
                {data.products.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => setSelected(p._id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left hover:bg-jollibee-cream/50 transition-colors ${selected === p._id ? "bg-jollibee-cream border-l-4 border-l-jollibee-red" : ""}`}
                  >
                    <div className={`p-1.5 rounded-lg border ${statusColor(p.forecastStatus)}`}>
                      {statusIcon(p.forecastStatus)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-jollibee-brown text-xs truncate">{p.productName}</p>
                      <p className="text-[10px] text-gray-400">{p.productQuan} units left</p>
                    </div>
                    {p.forecastStatus !== "ok" && (
                      <span className="text-[10px] font-bold text-red-500 flex-shrink-0">
                        {p.daysUntilStockout}d
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Forecast detail */}
            {selectedProduct && (
              <div className="lg:col-span-2 space-y-4">
                <div className={`card border ${statusColor(selectedProduct.forecastStatus)}`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl border border-current">{statusIcon(selectedProduct.forecastStatus)}</div>
                    <div>
                      <h3 className="font-bold text-base">{selectedProduct.productName}</h3>
                      <p className="text-sm font-medium">
                        {selectedProduct.forecastStatus === "critical" && `⚠ Stock may run out in ~${selectedProduct.daysUntilStockout} days!`}
                        {selectedProduct.forecastStatus === "warning" && `Stock running low — projected ${selectedProduct.daysUntilStockout} days remaining`}
                        {selectedProduct.forecastStatus === "ok" && `Stock is healthy — sufficient for 60+ days`}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center">
                      <p className="font-display text-xl text-jollibee-brown">{formatNumber(selectedProduct.productQuan)}</p>
                      <p className="text-xs text-gray-500 font-medium">Current Stock</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-xl text-jollibee-brown">{selectedProduct.avgDailySales?.toFixed(1)}</p>
                      <p className="text-xs text-gray-500 font-medium">Avg Daily Sales</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-xl text-jollibee-brown">
                        {selectedProduct.daysUntilStockout >= 999 ? "60+" : selectedProduct.daysUntilStockout}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">Days Until Stockout</p>
                    </div>
                  </div>
                </div>

                {/* Forecast chart */}
                <div className="card">
                  <h4 className="font-display text-xl text-jollibee-brown tracking-wide mb-4">60-DAY STOCK PROJECTION</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={selectedProduct.chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#FFF3CC" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#4A2800" }} interval={6} />
                      <YAxis tick={{ fontSize: 10, fill: "#4A2800" }} />
                      <Tooltip
                        contentStyle={{ background: "#4A2800", border: "none", borderRadius: 12, color: "#FFF8E7" }}
                        formatter={(v, n) => [formatNumber(Math.max(0, v)), n]}
                      />
                      <Legend />
                      <ReferenceLine y={selectedProduct.lowStockThreshold} stroke="#CC0000" strokeDasharray="5 5" label={{ value: "Low Stock Threshold", fill: "#CC0000", fontSize: 10 }} />
                      <ReferenceLine y={0} stroke="#990000" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="actual" stroke="#FFC200" strokeWidth={2.5} dot={false} name="Actual Stock" />
                      <Line type="monotone" dataKey="forecast" stroke="#CC0000" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Forecasted Stock" />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Dashed red line = forecasted depletion · Solid yellow = actual remaining stock · Red horizontal = low stock alert level
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
