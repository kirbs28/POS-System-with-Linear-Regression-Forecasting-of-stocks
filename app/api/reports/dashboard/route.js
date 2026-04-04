import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";
import { subDays, format } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const since = subDays(new Date(), 30).toISOString();

    const [
      { data: sales },
      { data: transactions },
      { data: recentTx },
      { data: products },
      { data: salesByDay },
      { data: salesByCat },
    ] = await Promise.all([
      supabase.from("sales").select("total_amount, quantity").gte("date", since),
      supabase.from("transactions").select("total").gte("created_at", since).eq("status", "completed"),
      supabase.from("transactions").select("*").eq("status", "completed").order("created_at", { ascending: false }).limit(8),
      supabase.from("products").select("*").eq("is_active", true),
      supabase.from("sales").select("date, total_amount").gte("date", since).order("date"),
      supabase.from("sales").select("product_cat, total_amount").gte("date", since),
    ]);

    const totalSales = (sales || []).reduce((s, r) => s + (r.total_amount || 0), 0)
      + (transactions || []).reduce((s, r) => s + (r.total || 0), 0);
    const totalItemsSold = (sales || []).reduce((s, r) => s + (r.quantity || 0), 0);
    const totalTransactions = (transactions || []).length;

    // Top products
    const { data: topRaw } = await supabase.from("sales").select("product_id, product_name, quantity");
    const topMap = {};
    (topRaw || []).forEach(r => {
      if (!topMap[r.product_id]) topMap[r.product_id] = { name: r.product_name, qty: 0 };
      topMap[r.product_id].qty += r.quantity;
    });
    const topProducts = Object.values(topMap).sort((a, b) => b.qty - a.qty).slice(0, 10);
    const topProduct = topProducts[0] || null;

    // Low stock
    const lowStockCount = (products || []).filter(p => {
      const pct = p.initial_quan > 0 ? (p.product_quan / p.initial_quan) * 100 : 100;
      return pct <= 40;
    }).length;

    // Sales by day (aggregate)
    const dayMap = {};
    (salesByDay || []).forEach(r => {
      const d = format(new Date(r.date), "MM/dd");
      dayMap[d] = (dayMap[d] || 0) + r.total_amount;
    });
    const salesByDayArr = Object.entries(dayMap).map(([date, total]) => ({ date, total }));

    // Sales by category
    const catMap = {};
    (salesByCat || []).forEach(r => {
      catMap[r.product_cat] = (catMap[r.product_cat] || 0) + r.total_amount;
    });
    const salesByCategory = Object.entries(catMap).map(([category, total]) => ({ category, total }));

    // Map recent transactions
    const recentTransactions = (recentTx || []).map(tx => ({
      transactionId: tx.transaction_id, cashier: tx.cashier,
      total: tx.total, createdAt: tx.created_at,
    }));

    return NextResponse.json({
      totalSales, totalTransactions, totalItemsSold,
      totalProducts: (products || []).length, lowStockCount,
      topProduct, topProducts, salesByDay: salesByDayArr,
      salesByCategory, recentTransactions,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
