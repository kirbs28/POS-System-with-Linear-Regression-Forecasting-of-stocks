import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const body = await req.json();
    const update = {};
    if (body.name) update.name = body.name;
    if (body.email) update.email = body.email.toLowerCase();
    if (body.role) update.role = body.role;
    if (body.isActive !== undefined) update.is_active = body.isActive;
    if (body.password) update.password = await bcrypt.hash(body.password, 12);
    const { data, error } = await supabase.from("users").update(update).eq("id", params.id).select("id, name, email, role, is_active, created_at").single();
    if (error) throw error;
    return NextResponse.json({ ...data, _id: data.id, isActive: data.is_active });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { error } = await supabase.from("users").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
