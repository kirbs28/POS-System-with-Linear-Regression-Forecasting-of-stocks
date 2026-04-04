import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data: posProducts } = await supabase.from("products").select("product_id");
    const posIds = new Set((posProducts || []).map(p => p.product_id));

    const { data: sales } = await supabase.from("sales").select("product_id, product_name, product_cat");
    if (!sales) return NextResponse.json([]);

    const map = {};
    sales.forEach(s => {
      if (!posIds.has(s.product_id) && !map[s.product_id]) {
        map[s.product_id] = { productId: s.product_id, productName: s.product_name, productCat: s.product_cat };
      }
    });
    return NextResponse.json(Object.values(map));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
