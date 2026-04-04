import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { rows } = await req.json();
    if (!rows || !Array.isArray(rows)) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const uploadBatch = `batch_${Date.now()}`;
    let inserted = 0, skipped = 0, errors = 0;
    const newProductIds = new Set();

    const { data: posProducts } = await supabase.from("products").select("product_id");
    const posIds = new Set((posProducts || []).map(p => p.product_id));

    // Batch insert in chunks of 100
    const records = [];
    for (const row of rows) {
      try {
        if (!row.date || !row.productId || !row.productName) { skipped++; continue; }
        const parsedDate = new Date(row.date);
        if (isNaN(parsedDate)) { skipped++; continue; }
        const qty = parseFloat(row.quantity) || 0;
        const unitPrice = parseFloat(row.unitPrice) || 0;
        const total = parseFloat(row.totalAmount) || qty * unitPrice;
        records.push({
          transaction_id: row.transactionId || null,
          date: parsedDate.toISOString(),
          product_id: row.productId.toString().trim(),
          product_name: row.productName.toString().trim(),
          product_cat: row.productCat?.toString().trim() || "Uncategorized",
          quantity: qty, unit_price: unitPrice, total_amount: total,
          upload_batch: uploadBatch,
        });
        if (!posIds.has(row.productId.toString().trim())) newProductIds.add(row.productName.toString().trim());
      } catch (e) { errors++; }
    }

    // Insert in chunks
    for (let i = 0; i < records.length; i += 100) {
      const chunk = records.slice(i, i + 100);
      const { error } = await supabase.from("sales").insert(chunk);
      if (error) errors += chunk.length;
      else inserted += chunk.length;
    }

    return NextResponse.json({ inserted, skipped, errors, batch: uploadBatch, newProducts: Array.from(newProductIds).slice(0, 20) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
