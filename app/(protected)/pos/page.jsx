"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Printer, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_METHODS = [
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "gcash", label: "GCash", icon: CreditCard },
  { key: "maya", label: "Maya", icon: CreditCard },
];

export default function POSPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    fetch("/api/products?active=true")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        setFilteredProducts(data);
        const cats = ["All", ...new Set(data.map((p) => p.productCat))];
        setCategories(cats);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = products;
    if (activeCategory !== "All") filtered = filtered.filter((p) => p.productCat === activeCategory);
    if (search) filtered = filtered.filter((p) =>
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.productId.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [search, activeCategory, products]);

  const addToCart = useCallback((product) => {
    if (product.productQuan <= 0) {
      toast.error("Out of stock!");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.productId);
      if (existing) {
        if (existing.quantity >= product.productQuan) {
          toast.error("Not enough stock!");
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.productId
            ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [...prev, {
        productId: product.productId,
        productName: product.productName,
        productCat: product.productCat,
        quantity: 1,
        unitPrice: product.productPrice,
        totalPrice: product.productPrice,
      }];
    });
  }, []);

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta), totalPrice: Math.max(1, i.quantity + delta) * i.unitPrice }
          : i
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.totalPrice, 0);
  const tax = 0; // Adjust if VAT needed
  const total = subtotal + tax;
  const change = amountTendered ? parseFloat(amountTendered) - total : 0;

  async function handleCheckout() {
    if (cart.length === 0) { toast.error("Cart is empty!"); return; }
    if (paymentMethod === "cash" && (!amountTendered || parseFloat(amountTendered) < total)) {
      toast.error("Insufficient amount tendered!"); return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          subtotal,
          tax,
          total,
          paymentMethod,
          amountTendered: parseFloat(amountTendered) || total,
          change: Math.max(0, change),
          cashier: session?.user?.name,
          cashierId: session?.user?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReceipt(data.transaction);
      setCart([]);
      setAmountTendered("");
      toast.success("Transaction complete! 🎉");
      // Refresh products for stock update
      const updated = await fetch("/api/products?active=true").then(r => r.json());
      setProducts(updated);
    } catch (err) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-64px)] animate-fade-in">
      {/* Product Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-display text-jollibee-red tracking-wider">POINT OF SALE</h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                activeCategory === cat
                  ? "bg-jollibee-red text-white shadow-md"
                  : "bg-white text-jollibee-brown border border-jollibee-yellow/30 hover:border-jollibee-yellow"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product._id}
                  onClick={() => addToCart(product)}
                  disabled={product.productQuan <= 0}
                  className={`card text-left hover:shadow-md hover:border-jollibee-yellow/60 active:scale-95 transition-all duration-150 group ${
                    product.productQuan <= 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="w-full h-12 rounded-xl bg-gradient-to-br from-jollibee-yellow/20 to-jollibee-orange/10 flex items-center justify-center mb-2 group-hover:from-jollibee-yellow/30 transition-all">
                    <span className="text-2xl">🍔</span>
                  </div>
                  <p className="font-bold text-jollibee-brown text-xs leading-tight truncate">{product.productName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{product.productCat}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-display text-jollibee-red text-sm">₱{product.productPrice.toFixed(2)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      product.productQuan <= 0 ? "bg-red-100 text-red-500" :
                      product.productQuan < 10 ? "bg-orange-100 text-orange-600" :
                      "bg-green-100 text-green-600"
                    }`}>
                      {product.productQuan <= 0 ? "OOS" : `${product.productQuan}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart / Order Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-jollibee-yellow/20 overflow-hidden">
        {/* Cart header */}
        <div className="p-4 bg-jollibee-gradient">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-display text-2xl tracking-wide flex items-center gap-2">
              <ShoppingCart size={20} /> ORDER
            </h2>
            <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {cart.length} items
            </span>
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
              <ShoppingCart size={36} className="mb-2 opacity-30" />
              <p className="text-sm font-medium">Tap a product to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 p-2.5 rounded-xl bg-jollibee-cream border border-jollibee-yellow/20">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-jollibee-brown text-xs truncate">{item.productName}</p>
                  <p className="text-xs text-jollibee-red font-bold">₱{item.unitPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-jollibee-yellow/20 active:scale-90 transition-all">
                    <Minus size={10} />
                  </button>
                  <span className="w-7 text-center font-bold text-sm text-jollibee-brown">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-jollibee-yellow/20 active:scale-90 transition-all">
                    <Plus size={10} />
                  </button>
                </div>
                <div className="text-right min-w-[48px]">
                  <p className="text-xs font-bold text-jollibee-brown">₱{item.totalPrice.toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 mt-0.5">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & payment */}
        <div className="p-4 border-t border-jollibee-yellow/20 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-jollibee-brown/70 font-medium">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-base font-display text-jollibee-brown tracking-wide border-t border-dashed border-jollibee-yellow pt-1.5">
              <span>TOTAL</span><span className="text-jollibee-red">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-4 gap-1.5">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className={`flex flex-col items-center py-1.5 rounded-xl text-xs font-bold transition-all ${
                    paymentMethod === m.key
                      ? "bg-jollibee-red text-white shadow-md"
                      : "bg-gray-100 text-gray-500 hover:bg-jollibee-yellow/20"
                  }`}
                >
                  <Icon size={14} className="mb-0.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Amount tendered (cash only) */}
          {paymentMethod === "cash" && (
            <div>
              <label className="text-xs font-bold text-jollibee-brown/60 uppercase tracking-wider">Amount Tendered</label>
              <input
                type="number"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder="0.00"
                className="input-field mt-1 text-right font-bold"
              />
              {amountTendered && parseFloat(amountTendered) >= total && (
                <p className="text-right text-xs text-green-600 font-bold mt-1">
                  Change: {formatCurrency(Math.max(0, change))}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #FFC200, #CC0000)" }}
          >
            {processing ? "Processing..." : `Checkout · ${formatCurrency(total)}`}
          </button>
        </div>
      </div>

      {/* Receipt modal */}
      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function ReceiptModal({ receipt, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-jollibee-red tracking-wide">RECEIPT</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-red-100">
            <X size={16} />
          </button>
        </div>
        <div className="print-receipt">
          <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-300">
            <p className="font-display text-jollibee-red text-2xl tracking-widest">🐝 JOLLIBEE</p>
            <p className="text-xs text-gray-400 mt-1">{receipt.transactionId}</p>
            <p className="text-xs text-gray-400">{new Date(receipt.createdAt).toLocaleString()}</p>
            <p className="text-xs text-gray-400">Cashier: {receipt.cashier}</p>
          </div>
          <div className="space-y-1.5 mb-4 pb-4 border-b border-dashed border-gray-300">
            {receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700 flex-1">{item.productName} <span className="text-gray-400">×{item.quantity}</span></span>
                <span className="font-bold text-jollibee-brown ml-2">₱{item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between font-bold text-jollibee-brown">
              <span>TOTAL</span><span className="text-jollibee-red">₱{receipt.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Payment</span><span className="capitalize">{receipt.paymentMethod}</span>
            </div>
            {receipt.paymentMethod === "cash" && (
              <>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tendered</span><span>₱{receipt.amountTendered?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Change</span><span>₱{receipt.change?.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4 font-medium">Thank you! Come back soon! 🐝</p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary w-full mt-4 flex items-center justify-center gap-2"
        >
          <Printer size={16} /> Print Receipt
        </button>
      </div>
    </div>
  );
}
