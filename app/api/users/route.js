import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { data, error } = await supabase.from("users").select("id, name, email, role, is_active, created_at").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data.map(u => ({ ...u, _id: u.id, isActive: u.is_active, createdAt: u.created_at })));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const body = await req.json();
    const hashed = await bcrypt.hash(body.password, 12);
    const { data, error } = await supabase.from("users").insert([{
      name: body.name, email: body.email.toLowerCase(),
      password: hashed, role: body.role, is_active: true,
    }]).select("id, name, email, role, is_active, created_at").single();
    if (error) throw error;
    return NextResponse.json({ ...data, _id: data.id }, { status: 201 });
  } catch (err) {
    if (err.code === "23505") return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
