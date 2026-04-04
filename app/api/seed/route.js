import supabase from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const USERS = [
  { name: "Admin User",    email: "admin@jollibee.com.ph",   password: "admin123",   role: "admin" },
  { name: "Store Manager", email: "manager@jollibee.com.ph", password: "manager123", role: "manager" },
  { name: "Cashier 1",     email: "cashier@jollibee.com.ph", password: "cashier123", role: "cashier" },
];

const PRODUCTS = [
  { product_id: "JB-001", product_name: "Chickenjoy (1pc)",             product_cat: "Chicken", product_price: 99,  product_quan: 500,  initial_quan: 500 },
  { product_id: "JB-002", product_name: "Chickenjoy (2pc)",             product_cat: "Chicken", product_price: 179, product_quan: 400,  initial_quan: 400 },
  { product_id: "JB-003", product_name: "Chickenjoy Bucket (6pc)",      product_cat: "Chicken", product_price: 579, product_quan: 150,  initial_quan: 150 },
  { product_id: "JB-004", product_name: "Yumburger",                    product_cat: "Burger",  product_price: 49,  product_quan: 600,  initial_quan: 600 },
  { product_id: "JB-005", product_name: "Champ Burger",                 product_cat: "Burger",  product_price: 139, product_quan: 350,  initial_quan: 350 },
  { product_id: "JB-006", product_name: "Jolly Spaghetti",              product_cat: "Pasta",   product_price: 79,  product_quan: 450,  initial_quan: 450 },
  { product_id: "JB-007", product_name: "Palabok Fiesta",               product_cat: "Pasta",   product_price: 89,  product_quan: 300,  initial_quan: 300 },
  { product_id: "JB-008", product_name: "Peach Mango Pie",              product_cat: "Dessert", product_price: 35,  product_quan: 800,  initial_quan: 800 },
  { product_id: "JB-009", product_name: "Halo-Halo Special",            product_cat: "Dessert", product_price: 135, product_quan: 200,  initial_quan: 200 },
  { product_id: "JB-010", product_name: "Jolly Crispy Fries (Regular)", product_cat: "Sides",   product_price: 59,  product_quan: 700,  initial_quan: 700 },
  { product_id: "JB-011", product_name: "Jolly Crispy Fries (Large)",   product_cat: "Sides",   product_price: 79,  product_quan: 500,  initial_quan: 500 },
  { product_id: "JB-012", product_name: "Iced Tea (Regular)",           product_cat: "Drinks",  product_price: 39,  product_quan: 1000, initial_quan: 1000 },
  { product_id: "JB-013", product_name: "Iced Tea (Large)",             product_cat: "Drinks",  product_price: 55,  product_quan: 800,  initial_quan: 800 },
  { product_id: "JB-014", product_name: "Coca-Cola (Regular)",          product_cat: "Drinks",  product_price: 45,  product_quan: 600,  initial_quan: 600 },
  { product_id: "JB-015", product_name: "Jolly Kiddie Meal",            product_cat: "Meals",   product_price: 159, product_quan: 250,  initial_quan: 250 },
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "seed-jollibee-2025") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = { users: [], products: [], errors: [] };

    // Seed users
    for (const u of USERS) {
      try {
        const { data: existing } = await supabase.from("users").select("id").eq("email", u.email).single();
        if (existing) { results.users.push(`SKIPPED: ${u.email}`); continue; }
        const hashed = await bcrypt.hash(u.password, 12);
        const { error } = await supabase.from("users").insert([{ name: u.name, email: u.email, password: hashed, role: u.role, is_active: true }]);
        if (error) throw error;
        results.users.push(`CREATED: ${u.email}`);
      } catch (e) {
        results.errors.push(`User ${u.email}: ${e.message}`);
      }
    }

    // Seed products
    for (const p of PRODUCTS) {
      try {
        const { data: existing } = await supabase.from("products").select("id").eq("product_id", p.product_id).single();
        if (existing) { results.products.push(`SKIPPED: ${p.product_name}`); continue; }
        const { error } = await supabase.from("products").insert([{ ...p, is_active: true, low_stock_threshold: 50 }]);
        if (error) throw error;
        results.products.push(`CREATED: ${p.product_name}`);
      } catch (e) {
        results.errors.push(`Product ${p.product_name}: ${e.message}`);
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
