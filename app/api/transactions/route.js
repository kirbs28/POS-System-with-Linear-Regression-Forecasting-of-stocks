import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { items, subtotal, tax, total, paymentMethod, amountTendered, change, cashier, cashierId } = body;

    if (!items || items.length === 0) return NextResponse.json({ error: "No items in cart" }, { status: 400 });

    // Decrement stock for each item
    for (const item of items) {
      const { data: product } = await supabase.from("products").select("product_quan").eq("product_id", item.productId).single();
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.product_quan < item.quantity) throw new Error(`Insufficient stock for ${item.productName}`);
      await supabase.from("products").update({ product_quan: product.product_quan - item.quantity }).eq("product_id", item.productId);
    }

    const txId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const { data: transaction, error } = await supabase.from("transactions").insert([{
      transaction_id: txId, items, subtotal, tax, total,
      payment_method: paymentMethod, amount_tendered: amountTendered,
      change_amount: change, cashier, cashier_id: cashierId, status: "completed",
    }]).select().single();
    if (error) throw error;

    // Map for frontend receipt
    const mapped = {
      transactionId: transaction.transaction_id,
      items: transaction.items,
      total: transaction.total,
      subtotal: transaction.subtotal,
      paymentMethod: transaction.payment_method,
      amountTendered: transaction.amount_tendered,
      change: transaction.change_amount,
      cashier: transaction.cashier,
      createdAt: transaction.created_at,
    };
    return NextResponse.json({ transaction: mapped }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
