import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";
import { subDays, format } from "date-fns";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const period = parseInt(searchParams.get("period") || "30");
    const since = subDays(new Date(), period).toISOString();

    const [{ data: sales }, { data: transactions }] = await Promise.all([
      supabase.from("sales").select("*").gte("date", since).order("date"),
      supabase.from("transactions").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(200),
    ]);

    // Totals
    const totalRevenue = (sales || []).reduce((s, r) => s + r.total_amount, 0);
    const totalUnits = (sales || []).reduce((s, r) => s + r.quantity, 0);
    const txIds = new Set((sales || []).map(r => r.transaction_id).filter(Boolean));
    const totalTransactions = txIds.size || (transactions || []).length;

    // By day
    const dayMap = {};
    (sales || []).forEach(r => {
      const d = format(new Date(r.date), "yyyy-MM-dd");
      if (!dayMap[d]) dayMap[d] = { date: d, total: 0, units: 0 };
      dayMap[d].total += r.total_amount;
      dayMap[d].units += r.quantity;
    });
    const byDay = Object.values(dayMap);

    // By category
    const catMap = {};
    (sales || []).forEach(r => {
      const c = r.product_cat || "Unknown";
      if (!catMap[c]) catMap[c] = { category: c, total: 0, units: 0, transactions: new Set() };
      catMap[c].total += r.total_amount;
      catMap[c].units += r.quantity;
      if (r.transaction_id) catMap[c].transactions.add(r.transaction_id);
    });
    const grandTotal = totalRevenue || 1;
    const byCategory = Object.values(catMap).map(c => ({
      category: c.category, total: c.total, units: c.units,
      transactions: c.transactions.size,
      share: (c.total / grandTotal) * 100,
    })).sort((a, b) => b.total - a.total);

    // Top products
    const prodMap = {};
    (sales || []).forEach(r => {
      const k = r.product_id;
      if (!prodMap[k]) prodMap[k] = { productId: k, productName: r.product_name, productCat: r.product_cat, totalRevenue: 0, totalQty: 0, prices: [] };
      prodMap[k].totalRevenue += r.total_amount;
      prodMap[k].totalQty += r.quantity;
      prodMap[k].prices.push(r.unit_price);
    });
    const topByRevenue = Object.values(prodMap)
      .map(p => ({ ...p, avgPrice: p.prices.reduce((a, b) => a + b, 0) / p.prices.length }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 20);

    // Map transactions for display
    const txMapped = (transactions || []).map(tx => ({
      transactionId: tx.transaction_id, cashier: tx.cashier,
      items: tx.items, total: tx.total, paymentMethod: tx.payment_method,
      status: tx.status, createdAt: tx.created_at,
    }));

    return NextResponse.json({
      sales: { totalRevenue, totalUnits, totalTransactions, avgOrder: totalTransactions > 0 ? totalRevenue / totalTransactions : 0, byDay, byCategory },
      products: { topByRevenue },
      transactions: txMapped,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
