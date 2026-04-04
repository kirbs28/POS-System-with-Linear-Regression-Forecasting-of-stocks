import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");
    let query = supabase.from("products").select("*").order("product_name");
    if (active === "true") query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw error;
    // Map snake_case to camelCase for frontend compatibility
    const mapped = data.map(p => ({
      _id: p.id, id: p.id,
      productId: p.product_id, productName: p.product_name,
      productCat: p.product_cat, productPrice: p.product_price,
      productQuan: p.product_quan, initialQuan: p.initial_quan,
      isActive: p.is_active, lowStockThreshold: p.low_stock_threshold,
    }));
    return NextResponse.json(mapped);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const { data, error } = await supabase.from("products").insert([{
      product_id: body.productId, product_name: body.productName,
      product_cat: body.productCat, product_price: body.productPrice,
      product_quan: body.productQuan, initial_quan: body.productQuan,
      is_active: true, low_stock_threshold: 50,
    }]).select().single();
    if (error) throw error;
    return NextResponse.json({ _id: data.id, ...data }, { status: 201 });
  } catch (err) {
    if (err.code === "23505") return NextResponse.json({ error: "Product ID already exists" }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
