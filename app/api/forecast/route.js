import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";
import { subDays, format } from "date-fns";

function linearRegression(data) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };
  const sumX = data.reduce((a, _, i) => a + i, 0);
  const sumY = data.reduce((a, v) => a + v, 0);
  const sumXY = data.reduce((a, v, i) => a + i * v, 0);
  const sumX2 = data.reduce((a, _, i) => a + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
  return { slope, intercept: (sumY - slope * sumX) / n };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const HISTORY_DAYS = 90, FORECAST_DAYS = 60;
    const since = subDays(new Date(), HISTORY_DAYS).toISOString();

    const { data: products } = await supabase.from("products").select("*").eq("is_active", true);
    const { data: sales } = await supabase.from("sales").select("product_id, date, quantity").gte("date", since);
    const { data: txItems } = await supabase.from("transactions").select("items, created_at").gte("created_at", since).eq("status", "completed");

    const velocityMap = {};
    (sales || []).forEach(s => {
      const day = format(new Date(s.date), "yyyy-MM-dd");
      const key = `${s.product_id}_${day}`;
      velocityMap[key] = (velocityMap[key] || 0) + s.quantity;
    });
    (txItems || []).forEach(tx => {
      const day = format(new Date(tx.created_at), "yyyy-MM-dd");
      (tx.items || []).forEach(item => {
        const key = `${item.productId}_${day}`;
        velocityMap[key] = (velocityMap[key] || 0) + item.quantity;
      });
    });

    const orderMap = { critical: 0, warning: 1, ok: 2 };
    const forecasted = (products || []).map(product => {
      const dailySales = [];
      for (let i = 0; i < HISTORY_DAYS; i++) {
        const day = format(subDays(new Date(), HISTORY_DAYS - i), "yyyy-MM-dd");
        dailySales.push(velocityMap[`${product.product_id}_${day}`] || 0);
      }
      const avgDailySales = dailySales.reduce((a, v) => a + v, 0) / HISTORY_DAYS;
      const reg = linearRegression(dailySales);

      let currentStock = product.product_quan;
      const chartData = [{ label: "Today", actual: currentStock, forecast: currentStock }];
      let daysUntilStockout = 999;

      for (let d = 1; d <= FORECAST_DAYS; d++) {
        const projected = Math.max(0, reg.slope * (HISTORY_DAYS + d) + reg.intercept);
        const smoothed = avgDailySales * 0.7 + projected * 0.3;
        currentStock = Math.max(0, currentStock - smoothed);
        if (currentStock <= 0 && daysUntilStockout === 999) daysUntilStockout = d;
        chartData.push({ label: `+${d}d`, actual: null, forecast: Math.round(currentStock) });
      }

      const forecastStatus = daysUntilStockout <= 30 ? "critical" : daysUntilStockout <= 60 ? "warning" : "ok";
      return {
        _id: product.id, productId: product.product_id, productName: product.product_name,
        productCat: product.product_cat, productQuan: product.product_quan,
        initialQuan: product.initial_quan, lowStockThreshold: product.low_stock_threshold,
        avgDailySales: parseFloat(avgDailySales.toFixed(2)), daysUntilStockout,
        forecastStatus, chartData,
      };
    });

    forecasted.sort((a, b) => orderMap[a.forecastStatus] - orderMap[b.forecastStatus]);
    const summary = {
      critical: forecasted.filter(p => p.forecastStatus === "critical").length,
      warning: forecasted.filter(p => p.forecastStatus === "warning").length,
      ok: forecasted.filter(p => p.forecastStatus === "ok").length,
    };
    return NextResponse.json({ products: forecasted, summary });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
