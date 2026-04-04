-- =============================================
-- JOLLIBEE BI SYSTEM - SUPABASE SQL SCHEMA
-- Paste this entire file into Supabase SQL Editor and click Run
-- =============================================

-- USERS TABLE
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  password text not null,
  role text not null default 'cashier' check (role in ('admin', 'manager', 'cashier')),
  is_active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PRODUCTS TABLE
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  product_id text unique not null,
  product_name text not null,
  product_cat text not null,
  product_price numeric(10,2) not null,
  product_quan integer not null default 0,
  initial_quan integer not null default 0,
  is_active boolean default true,
  low_stock_threshold integer default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SALES TABLE (uploaded CSV/Excel data)
create table if not exists sales (
  id uuid default gen_random_uuid() primary key,
  transaction_id text,
  date timestamptz not null,
  product_id text not null,
  product_name text not null,
  product_cat text default 'Uncategorized',
  quantity numeric not null default 0,
  unit_price numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  upload_batch text,
  created_at timestamptz default now()
);

-- TRANSACTIONS TABLE (POS sales)
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  transaction_id text unique not null,
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null,
  tax numeric(10,2) default 0,
  total numeric(10,2) not null,
  payment_method text default 'cash',
  amount_tendered numeric(10,2),
  change_amount numeric(10,2),
  cashier text not null,
  cashier_id uuid,
  status text default 'completed',
  created_at timestamptz default now()
);

-- INDEXES for performance
create index if not exists sales_date_idx on sales(date);
create index if not exists sales_product_id_idx on sales(product_id);
create index if not exists transactions_created_at_idx on transactions(created_at desc);

-- =============================================
-- SEED DATA - Users (passwords are bcrypt hashed)
-- admin123, manager123, cashier123
-- =============================================
insert into users (name, email, password, role) values
  ('Admin User',    'admin@jollibee.com.ph',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oZ7RK3nOu', 'admin'),
  ('Store Manager', 'manager@jollibee.com.ph', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager'),
  ('Cashier 1',     'cashier@jollibee.com.ph', '$2a$12$TIXbn5bR.NkQZ.5VQbA.8OjNkzMBs.TdEt7iGFWOXiAQI/nFJV0Gy', 'cashier')
on conflict (email) do nothing;

-- =============================================
-- SEED DATA - Products
-- =============================================
insert into products (product_id, product_name, product_cat, product_price, product_quan, initial_quan) values
  ('JB-001', 'Chickenjoy (1pc)',            'Chicken', 99,   500, 500),
  ('JB-002', 'Chickenjoy (2pc)',            'Chicken', 179,  400, 400),
  ('JB-003', 'Chickenjoy Bucket (6pc)',     'Chicken', 579,  150, 150),
  ('JB-004', 'Yumburger',                  'Burger',  49,   600, 600),
  ('JB-005', 'Champ Burger',               'Burger',  139,  350, 350),
  ('JB-006', 'Jolly Spaghetti',            'Pasta',   79,   450, 450),
  ('JB-007', 'Palabok Fiesta',             'Pasta',   89,   300, 300),
  ('JB-008', 'Peach Mango Pie',            'Dessert', 35,   800, 800),
  ('JB-009', 'Halo-Halo Special',          'Dessert', 135,  200, 200),
  ('JB-010', 'Jolly Crispy Fries (Regular)','Sides',  59,   700, 700),
  ('JB-011', 'Jolly Crispy Fries (Large)', 'Sides',   79,   500, 500),
  ('JB-012', 'Iced Tea (Regular)',         'Drinks',  39,  1000, 1000),
  ('JB-013', 'Iced Tea (Large)',           'Drinks',  55,   800, 800),
  ('JB-014', 'Coca-Cola (Regular)',        'Drinks',  45,   600, 600),
  ('JB-015', 'Jolly Kiddie Meal',          'Meals',   159,  250, 250)
on conflict (product_id) do nothing;
