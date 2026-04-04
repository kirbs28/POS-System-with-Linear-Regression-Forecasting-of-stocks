"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { Download, Calendar, Filter } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

const COLORS = ["#FFC200", "#FF6B00", "#CC0000", "#FFD84D", "#E6A800", "#990000", "#4A2800"];

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("sales");
  const [period, setPeriod] = useState("30"); // days

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  const exportCSV = (rows, filename) => {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${r[h]}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-4xl font-display text-jollibee-red tracking-wider">REPORTS</h1>
          <p className="text-jollibee-brown/60 font-medium text-sm">Sales & product performance analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-jollibee-brown/60" />
          <select value={period} onChange={e => setPeriod(e.target.value)} className="input-field py-1.5 w-auto text-sm">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-jollibee-yellow/20 w-fit">
        {["sales", "products", "transactions"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab === t ? "bg-jollibee-red text-white shadow-sm" : "text-jollibee-brown/60 hover:bg-jollibee-cream"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-20 text-gray-400">Loading reports...</div> : (
        <>
          {/* SALES TAB */}
          {tab === "sales" && (
            <div className="space-y-4">
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Revenue", value: formatCurrency(data?.sales?.totalRevenue || 0), sub: "gross sales" },
                  { label: "Transactions", value: formatNumber(data?.sales?.totalTransactions || 0), sub: "orders placed" },
                  { label: "Avg Order", value: formatCurrency(data?.sales?.avgOrder || 0), sub: "per transaction" },
                  { label: "Units Sold", value: formatNumber(data?.sales?.totalUnits || 0), sub: "items" },
                ].map((k, i) => (
                  <div key={i} className="card">
                    <p className="text-xs font-bold uppercase tracking-wider text-jollibee-brown/50">{k.label}</p>
                    <p className="font-display text-2xl text-jollibee-red tracking-wide mt-1">{k.value}</p>
                    <p className="text-xs text-gray-400">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Revenue by day */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl text-jollibee-brown tracking-wide">DAILY REVENUE</h3>
                  <button onClick={() => exportCSV(data?.sales?.byDay, "daily_sales.csv")} className="btn-ghost flex items-center gap-1 text-xs py-1.5 px-3">
                    <Download size={12} /> Export
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.sales?.byDay || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FFF3CC" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#4A2800" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#4A2800" }} />
                    <Tooltip contentStyle={{ background: "#4A2800", border: "none", borderRadius: 12, color: "#FFF8E7" }} formatter={v => formatCurrency(v)} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {(data?.sales?.byDay || []).map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#FFC200" : "#FF6B00"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue by category */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl text-jollibee-brown tracking-wide">SALES BY CATEGORY</h3>
                  <button onClick={() => exportCSV(data?.sales?.byCategory, "sales_by_category.csv")} className="btn-ghost flex items-center gap-1 text-xs py-1.5 px-3">
                    <Download size={12} /> Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr>
                      <th className="table-header">Category</th>
                      <th className="table-header">Revenue</th>
                      <th className="table-header">Units</th>
                      <th className="table-header">Transactions</th>
                      <th className="table-header">Share</th>
                    </tr></thead>
                    <tbody>
                      {(data?.sales?.byCategory || []).map((c, i) => (
                        <tr key={i} className="hover:bg-jollibee-cream/50">
                          <td className="table-cell font-bold text-jollibee-brown">{c.category}</td>
                          <td className="table-cell font-bold text-jollibee-red">{formatCurrency(c.total)}</td>
                          <td className="table-cell">{formatNumber(c.units)}</td>
                          <td className="table-cell">{formatNumber(c.transactions)}</td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${c.share}%`, background: COLORS[i % COLORS.length] }} />
                              </div>
                              <span className="text-xs font-bold text-jollibee-brown">{c.share?.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {tab === "products" && (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl text-jollibee-brown tracking-wide">TOP PRODUCTS BY REVENUE</h3>
                  <button onClick={() => exportCSV(data?.products?.topByRevenue, "top_products.csv")} className="btn-ghost flex items-center gap-1 text-xs py-1.5 px-3">
                    <Download size={12} /> Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr>
                      <th className="table-header">#</th>
                      <th className="table-header">Product</th>
                      <th className="table-header">Category</th>
                      <th className="table-header">Units Sold</th>
                      <th className="table-header">Revenue</th>
                      <th className="table-header">Avg Price</th>
                    </tr></thead>
                    <tbody>
                      {(data?.products?.topByRevenue || []).map((p, i) => (
                        <tr key={i} className="hover:bg-jollibee-cream/50">
                          <td className="table-cell">
                            <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-jollibee-yellow text-jollibee-brown" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-orange-800" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>
                          </td>
                          <td className="table-cell font-bold text-jollibee-brown">{p.productName}</td>
                          <td className="table-cell"><span className="badge bg-jollibee-yellow/20 text-jollibee-brown">{p.productCat}</span></td>
                          <td className="table-cell">{formatNumber(p.totalQty)}</td>
                          <td className="table-cell font-bold text-jollibee-red">{formatCurrency(p.totalRevenue)}</td>
                          <td className="table-cell">{formatCurrency(p.avgPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {tab === "transactions" && (
            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl text-jollibee-brown tracking-wide">ALL TRANSACTIONS</h3>
                  <button onClick={() => exportCSV(data?.transactions, "transactions.csv")} className="btn-ghost flex items-center gap-1 text-xs py-1.5 px-3">
                    <Download size={12} /> Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr>
                      <th className="table-header">ID</th>
                      <th className="table-header">Date</th>
                      <th className="table-header">Cashier</th>
                      <th className="table-header">Items</th>
                      <th className="table-header">Total</th>
                      <th className="table-header">Payment</th>
                      <th className="table-header">Status</th>
                    </tr></thead>
                    <tbody>
                      {(data?.transactions || []).map((tx, i) => (
                        <tr key={i} className="hover:bg-jollibee-cream/50">
                          <td className="table-cell font-mono text-xs">{tx.transactionId}</td>
                          <td className="table-cell text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                          <td className="table-cell">{tx.cashier}</td>
                          <td className="table-cell">{tx.items?.length}</td>
                          <td className="table-cell font-bold text-jollibee-red">{formatCurrency(tx.total)}</td>
                          <td className="table-cell capitalize">{tx.paymentMethod}</td>
                          <td className="table-cell">
                            <span className={`badge ${tx.status === "completed" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>{tx.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
