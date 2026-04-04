"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, UserCheck, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { getRoleColor, getRoleBadge } from "@/lib/utils";

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "cashier" });

  useEffect(() => {
    if (session?.user?.role !== "admin") { router.push("/dashboard"); return; }
    fetch("/api/users").then(r => r.json()).then(d => { setUsers(d); setLoading(false); });
  }, [session]);

  const openAdd = () => { setEditUser(null); setForm({ name: "", email: "", password: "", role: "cashier" }); setShowModal(true); };
  const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: "", role: u.role }); setShowModal(true); };

  const fetchUsers = () => fetch("/api/users").then(r => r.json()).then(setUsers);

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editUser ? `/api/users/${editUser._id}` : "/api/users";
    const method = editUser ? "PUT" : "POST";
    const body = { ...form };
    if (editUser && !body.password) delete body.password;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast.success(editUser ? "User updated!" : "User created!"); setShowModal(false); fetchUsers(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
  }

  async function toggleActive(u) {
    const res = await fetch(`/api/users/${u._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (res.ok) { toast.success(u.isActive ? "User deactivated" : "User activated"); fetchUsers(); }
  }

  async function handleDelete(id) {
    if (!confirm("Permanently delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("User deleted"); fetchUsers(); }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display text-jollibee-red tracking-wider">USERS</h1>
          <p className="text-jollibee-brown/60 font-medium text-sm">Manage system access and roles</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Role legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-jollibee-brown/50 uppercase tracking-wider">Roles:</span>
        {["admin", "manager", "cashier"].map(r => (
          <span key={r} className={`badge ${getRoleColor(r)}`}>{getRoleBadge(r)}</span>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Status</th>
              <th className="table-header">Created</th>
              <th className="table-header">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-jollibee-cream/50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-jollibee-gradient flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-bold text-jollibee-brown">{u.name}</span>
                        {u._id === session?.user?.id && <span className="badge bg-jollibee-yellow/30 text-jollibee-brown text-[10px]">You</span>}
                      </div>
                    </td>
                    <td className="table-cell text-gray-500 text-sm">{u.email}</td>
                    <td className="table-cell"><span className={`badge ${getRoleColor(u.role)}`}>{getRoleBadge(u.role)}</span></td>
                    <td className="table-cell">
                      <span className={`badge ${u.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-jollibee-yellow/20 text-jollibee-brown transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => toggleActive(u)} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? "hover:bg-orange-50 text-orange-400" : "hover:bg-green-50 text-green-500"}`}>
                          {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        {u._id !== session?.user?.id && (
                          <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <h2 className="font-display text-2xl text-jollibee-red tracking-wide mb-5">{editUser ? "EDIT USER" : "ADD USER"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-jollibee-brown/60 uppercase tracking-wider mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-jollibee-brown/60 uppercase tracking-wider mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-jollibee-brown/60 uppercase tracking-wider mb-1">
                  Password {editUser && <span className="text-gray-400 normal-case font-normal">(leave blank to keep)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" required={!editUser} minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-bold text-jollibee-brown/60 uppercase tracking-wider mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field">
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editUser ? "Update" : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
