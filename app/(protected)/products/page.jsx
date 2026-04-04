"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Package, AlertCircle, Search, ChevronUp, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ productId: "", productName: "", productCat: "", productPrice: "", productQuan: "" });

  const fetchAll = async () => {
    const [pRes, sRes] = await Promise.all([
      fetch("/api/products").then(r => r.json()),
      fetch("/api/products/suggestions").then(r => r.json()),
    ]);
    setProducts(pRes);
    setSuggestions(sRes);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setEditProduct(null); setForm({ productId: "", productName: "", productCat: "", productPrice: "", productQuan: "" }); setShowModal(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ productId: p.productId, productName: p.productName, productCat: p.productCat, productPrice: p.productPrice, productQuan: p.productQuan }); setShowModal(true); };
  const fillFromSuggestion = (s) => { setForm({ productId: s.productId, productName: s.productName, productCat: s.productCat || "", productPrice: "", productQuan: "" }); setEditProduct(null); setShowModal(true); };

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editProduct ? `/api/products/${editProduct._id}` : "/api/products";
    const method = editProduct ? "PUT" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, productPrice: parseFloat(form.productPrice), productQuan: parseInt(form.productQuan) }),
    });
    if (res.ok) {
      toast.success(editProduct ? "Product updated!" : "Product added!");
      setShowModal(false); fetchAll();
    } else {
      const d = await res.json(); toast.error(d.error || "Failed");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Product deleted!"); fetchAll(); }
  }

  const filtered = products.filter(p =>
    p.productName.toLowerCase().includes(search.toLowerCase()) ||
    p.productId.toLowerCase().includes(search.toLowerCase()) ||
    p.productCat.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display text-jollibee-red tracking-wider">PRODUCTS</h1>
          <p className="text-jollibee-brown/60 font-medium text-sm">{products.length} products in catalog</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Suggestive add */}
      {suggestions.length > 0 && (
        <div className="card border-l-4 border-l-jollibee-yellow">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-jollibee-yellow" />
            <h3 className="font-bold text-jollibee-brown">
              Suggestive Add — {suggestions.length} products found in sales data but not in POS
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => fillFromSuggestion(s)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-jollibee-cream border border-jollibee-yellow/30 hover:border-jollibee-yellow hover:shadow-sm transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-jollibee-yellow/20 flex items-center justify-center flex-shrink-0">
                  <Package size={14} className="text-jollibee-brown" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-jollibee-brown text-xs truncate">{s.productName}</p>
                  <p className="text-[10px] text-gray-400">{s.productId}</p>
                </div>
                <Plus size={14} className="text-jollibee-yellow group-hover:text-jollibee-red flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, ID, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-jollibee-cream">
                <th className="table-header">Product ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Price</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No products found</td></tr>
              ) : (
                filtered.map((p) => {
                  const pct = p.initialQuan > 0 ? (p.productQuan / p.initialQuan) * 100 : 100;
                  const status = pct <= 20 ? "critical" : pct <= 40 ? "low" : "ok";
                  return (
                    <tr key={p._id} className="hover:bg-jollibee-cream/50 transition-colors">
                      <td className="table-cell font-mono text-xs text-gray-500">{p.productId}</td>
                      <td className="table-cell font-bold text-jollibee-brown">{p.productName}</td>
                      <td className="table-cell">
                        <span className="badge bg-jollibee-yellow/20 text-jollibee-brown">{p.productCat}</span>
                      </td>
                      <td className="table-cell font-bold text-jollibee-red">{formatCurrency(p.productPrice)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                            <div
                              className={`h-1.5 rounded-full ${status === "critical" ? "bg-red-500" : status === "low" ? "bg-orange-400" : "bg-green-400"}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-jollibee-brown">{p.productQuan}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${status === "critical" ? "bg-red-100 text-red-600" : status === "low" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
                          {status === "critical" ? "⚠ Critical" : status === "low" ? "Low" : "OK"}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-jollibee-yellow/20 text-jollibee-brown transition-colors">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="font-display text-2xl text-jollibee-red tracking-wide mb-5">
              {editProduct ? "EDIT PRODUCT" : "ADD PRODUCT"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: "productId", label: "Product ID", type: "text" },
                { key: "productName", label: "Product Name", type: "text" },
                { key: "productCat", label: "Category", type: "text" },
                { key: "productPrice", label: "Price (₱)", type: "number" },
                { key: "productQuan", label: "Initial Stock Quantity", type: "number" },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-jollibee-brown/60 uppercase tracking-wider mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input-field"
                    required
                    step={key === "productPrice" ? "0.01" : "1"}
                    min={type === "number" ? "0" : undefined}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editProduct ? "Update" : "Add Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
