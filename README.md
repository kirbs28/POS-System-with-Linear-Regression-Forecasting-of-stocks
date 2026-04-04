# 🐝 Jollibee Business Intelligence System

A full-stack BI + POS web system built with **Next.js 14**, **MongoDB Atlas**, and **NextAuth** — deployable to **Vercel** in minutes.

---

## ✨ Features

| Feature | Details |
|---|---|
| **POS System** | Product catalog, cart, checkout, receipt printing |
| **RBAC** | Admin / Manager / Cashier roles |
| **Sales Data Upload** | CSV & Excel import with column mapping wizard |
| **Suggestive Add** | Detects products in uploaded data not yet in POS |
| **BI Dashboard** | KPIs, sales trend, category breakdown, top products |
| **Reports** | Sales, product performance, transaction history + CSV export |
| **Stock Forecast** | Linear regression–based 60-day stock depletion forecast |
| **User Management** | Admin can create/edit/deactivate users |

---

## 🚀 Deployment (Vercel + MongoDB Atlas) — No server needed!

### Step 1 — MongoDB Atlas (free tier)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → **Create a free account**
2. Create a **Free M0 cluster** (any region)
3. Click **Connect → Drivers → Node.js** and copy the connection string
4. In **Database Access** → Add a user with password
5. In **Network Access** → Add IP `0.0.0.0/0` (allows Vercel)

Your URI will look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jollibee_bi?retryWrites=true&w=majority
```

---

### Step 2 — Deploy to Vercel

1. Push this repo to **GitHub**
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo
3. In the **Environment Variables** section, add:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string |
| `NEXTAUTH_SECRET` | Any random 32-char string (run `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your Vercel URL e.g. `https://jollibee-bi.vercel.app` |

4. Click **Deploy** — Vercel handles everything!

> 💡 Every push to `main` auto-deploys. No CI/CD setup needed.

---

### Step 3 — Seed the database

After first deploy, run locally (or use Vercel Functions):

```bash
# Clone your repo
git clone https://github.com/your-username/jollibee-bi
cd jollibee-bi

# Create .env.local
cp .env.example .env.local
# Paste your MONGODB_URI and NEXTAUTH_SECRET

# Install dependencies
npm install

# Run the seeder
npm run seed
```

This creates:

| Role | Email | Password |
|---|---|---|
| Admin | admin@jollibee.com.ph | admin123 |
| Manager | manager@jollibee.com.ph | manager123 |
| Cashier | cashier@jollibee.com.ph | cashier123 |

And seeds 15 Jollibee products ready for POS.

---

## 💻 Local Development

```bash
npm install
cp .env.example .env.local   # Fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
jollibee-bi/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (protected)/           # All authenticated pages
│   │   ├── dashboard/         # BI Dashboard
│   │   ├── pos/               # Point of Sale
│   │   ├── products/          # Product management
│   │   ├── upload/            # CSV/Excel import
│   │   ├── reports/           # Reports & analytics
│   │   ├── forecast/          # Stock forecasting
│   │   └── users/             # User management (admin)
│   └── api/                   # API routes
│       ├── auth/              # NextAuth
│       ├── products/          # Product CRUD + suggestions
│       ├── transactions/      # POS transactions
│       ├── upload/            # Bulk sales import
│       ├── reports/           # Analytics APIs
│       ├── forecast/          # Stock forecast API
│       └── users/             # User management
├── components/
│   ├── Sidebar.jsx            # Navigation sidebar
│   └── SessionProvider.jsx    
├── lib/
│   ├── mongodb.js             # DB connection
│   ├── auth.js                # NextAuth config
│   └── utils.js               # Helpers + forecast math
├── models/
│   ├── User.js                # User schema (RBAC)
│   ├── Product.js             # Product schema
│   ├── Sale.js                # Uploaded sales data
│   └── Transaction.js        # POS transactions
├── scripts/
│   └── seed.js                # Database seeder
└── sample-data.csv            # Test upload file
```

---

## 📊 Sales Data Format

Upload CSV or Excel with these columns (flexible mapping in the UI):

| Column | Example | Required |
|---|---|---|
| `transactionId` | TXN-001 | No |
| `date` | 2024-11-01 | ✅ |
| `productId` | JB-001 | ✅ |
| `productName` | Chickenjoy (1pc) | ✅ |
| `productCat` | Chicken | No |
| `quantity` | 2 | No |
| `unitPrice` | 99 | No |
| `totalAmount` | 198 | No |

Use the included **`sample-data.csv`** to test the upload immediately.

---

## 🔐 Role Permissions

| Feature | Cashier | Manager | Admin |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| POS / Checkout | ✅ | ✅ | ✅ |
| View Products | ✅ | ✅ | ✅ |
| Manage Products | ❌ | ✅ | ✅ |
| Upload Data | ❌ | ✅ | ✅ |
| View Reports | ❌ | ✅ | ✅ |
| View Forecast | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

---

## 📈 Forecast Algorithm

The stock forecast uses **linear regression** over the past 90 days of sales velocity:

- **Critical** 🔴 — Stockout predicted within 30 days
- **Warning** 🟠 — Stockout predicted within 31–60 days  
- **Healthy** 🟢 — Stock sufficient for 60+ days

The forecast blends the regression trend (30%) with average daily sales (70%) for stability.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB Atlas (free tier) via Mongoose
- **Auth**: NextAuth.js with JWT sessions
- **Styling**: Tailwind CSS + Jollibee brand colors
- **Charts**: Recharts
- **File Parsing**: PapaParse (CSV) + SheetJS (Excel)
- **Hosting**: Vercel (free tier)

---

## 🐛 Troubleshooting

**"Cannot connect to MongoDB"** — Check your `MONGODB_URI` and that Atlas Network Access allows `0.0.0.0/0`

**"NEXTAUTH_SECRET missing"** — Generate one: `openssl rand -base64 32`

**Build errors on Vercel** — Make sure all 3 env vars are set in Vercel dashboard before deploying

**Seeder not running** — Run it locally with `npm run seed` after setting `.env.local`
