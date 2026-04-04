"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { ShoppingBag, TrendingUp, Package, AlertTriangle, Award, Clock } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

const COLORS = ["#FFC200", "#FF6B00", "#CC0000", "#FFD84D", "#E6A800", "#990000"];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!stats) return <p className="text-center mt-20 text-gray-400">Could not load dashboard data.</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display text-jollibee-red tracking-wider">DASHBOARD</h1>
          <p className="text-jollibee-brown/60 font-medium text-sm mt-0.5">
            Business overview & performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-jollibee-brown/50 bg-white px-3 py-1.5 rounded-full border border-jollibee-yellow/30">
          <Clock size={12} />
          <span className="font-medium">Live Data</span>
        </div>
      </div>

      {/* Low stock alert banner */}
      {stats.lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5">
          <AlertTriangle size={20} className="text-jollibee-red flex-shrink-0" />
          <p className="text-jollibee-red font-semibold text-sm">
            <strong>{stats.lowStockCount} product{stats.lowStockCount > 1 ? "s" : ""}</strong> running low on stock — check Forecast for details.
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Total Sales"
          value={formatCurrency(stats.totalSales)}
          color="red"
          sub={`${stats.totalTransactions} transactions`}
        />
        <StatCard
          icon={<ShoppingBag size={22} />}
          label="Items Sold"
          value={formatNumber(stats.totalItemsSold)}
          color="orange"
          sub="units total"
        />
        <StatCard
          icon={<Award size={22} />}
          label="Top Product"
          value={stats.topProduct?.name || "—"}
          color="yellow"
          sub={stats.topProduct ? `${formatNumber(stats.topProduct.qty)} units` : "No data"}
          small
        />
        <StatCard
          icon={<Package size={22} />}
          label="Products"
          value={stats.totalProducts}
          color="brown"
          sub={`${stats.lowStockCount} low stock`}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales trend */}
        <div className="lg:col-span-2 card">
          <h3 className="font-display text-xl text-jollibee-brown tracking-wide mb-4">SALES TREND</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.salesByDay || []}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFC200" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFC200" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF3CC" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#4A2800" }} />
              <YAxis tick={{ fontSize: 11, fill: "#4A2800" }} />
              <Tooltip
                contentStyle={{ background: "#4A2800", border: "none", borderRadius: 12, color: "#FFF8E7" }}
                formatter={(v) => [formatCurrency(v), "Sales"]}
              />
              <Area type="monotone" dataKey="total" stroke="#FFC200" strokeWidth={2.5} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by category */}
        <div className="card">
          <h3 className="font-display text-xl text-jollibee-brown tracking-wide mb-4">BY CATEGORY</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.salesByCategory || []} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {(stats.salesByCategory || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#4A2800", border: "none", borderRadius: 12, color: "#FFF8E7" }} formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products bar */}
        <div className="card">
          <h3 className="font-display text-xl text-jollibee-brown tracking-wide mb-4">TOP 10 PRODUCTS</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.topProducts || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#FFF3CC" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#4A2800" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#4A2800" }} width={100} />
              <Tooltip contentStyle={{ background: "#4A2800", border: "none", borderRadius: 12, color: "#FFF8E7" }} />
              <Bar dataKey="qty" fill="#FFC200" radius={[0, 6, 6, 0]}>
                {(stats.topProducts || []).map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#CC0000" : i === 1 ? "#FF6B00" : "#FFC200"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <h3 className="font-display text-xl text-jollibee-brown tracking-wide mb-4">RECENT TRANSACTIONS</h3>
          <div className="space-y-2 overflow-y-auto max-h-60">
            {(stats.recentTransactions || []).length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No transactions yet</p>
            )}
            {(stats.recentTransactions || []).map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-jollibee-cream transition-colors">
                <div>
                  <p className="font-bold text-jollibee-brown text-sm">{tx.transactionId}</p>
                  <p className="text-xs text-gray-400">{tx.cashier} · {new Date(tx.createdAt).toLocaleTimeString()}</p>
                </div>
                <span className="font-bold text-jollibee-red text-sm">{formatCurrency(tx.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sub, small }) {
  const colors = {
    red: "from-jollibee-red to-jollibee-red-dark",
    orange: "from-jollibee-orange to-jollibee-red",
    yellow: "from-jollibee-yellow to-jollibee-yellow-dark",
    brown: "from-jollibee-brown to-jollibee-brown/80",
  };
  const textColors = { yellow: "text-jollibee-brown" };

  return (
    <div className="card overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${colors[color]}`} />
      <div className="pl-3">
        <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${colors[color]} mb-3`}>
          <span className={color === "yellow" ? "text-jollibee-brown" : "text-white"}>{icon}</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-jollibee-brown/50">{label}</p>
        <p className={`font-display tracking-wide text-jollibee-brown mt-0.5 ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
        <p className="text-xs text-jollibee-brown/40 font-medium mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card h-28 bg-gray-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card h-72 bg-gray-100" />
        <div className="card h-72 bg-gray-100" />
      </div>
    </div>
  );
}
