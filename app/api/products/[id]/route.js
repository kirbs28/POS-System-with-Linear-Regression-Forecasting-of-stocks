import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await req.json();
    const update = {};
    if (body.productName !== undefined) update.product_name = body.productName;
    if (body.productCat !== undefined) update.product_cat = body.productCat;
    if (body.productPrice !== undefined) update.product_price = body.productPrice;
    if (body.productQuan !== undefined) { update.product_quan = body.productQuan; update.initial_quan = body.productQuan; }
    if (body.isActive !== undefined) update.is_active = body.isActive;
    const { data, error } = await supabase.from("products").update(update).eq("id", params.id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "manager"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { error } = await supabase.from("products").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
