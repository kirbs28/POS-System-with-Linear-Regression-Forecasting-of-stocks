"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      toast.error(res.error || "Invalid credentials");
      setLoading(false);
      return;
    }

    toast.success("Welcome back! 🐝");
    router.push("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #FFC200 0%, #FF6B00 40%, #CC0000 100%)",
      }}
    >
      {/* Background decorative circles */}
      <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full opacity-20 bg-white" />
      <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full opacity-10 bg-white" />
      <div className="absolute top-1/2 left-[-40px] w-40 h-40 rounded-full opacity-10 bg-white" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo area */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-2xl mb-4">
            <span className="text-4xl">🐝</span>
          </div>
          <h1 className="text-white text-5xl font-display tracking-widest uppercase">
            Jollibee
          </h1>
          <p className="text-white/80 font-semibold text-sm mt-1 tracking-wide uppercase">
            Business Intelligence System
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-slide-up">
          <h2 className="text-2xl font-display text-jollibee-brown mb-1 tracking-wide">
            SIGN IN
          </h2>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-jollibee-brown/60 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@jollibee.com.ph"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-jollibee-brown/60 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl font-bold text-white text-base transition-all duration-200 active:scale-95 disabled:opacity-70"
              style={{ background: loading ? "#ccc" : "linear-gradient(135deg, #FFC200, #CC0000)" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
              <span className="font-medium">System Online</span>
              <span className="ml-auto">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Role badges */}
        <div className="flex justify-center gap-3 mt-5">
          {["Admin", "Manager", "Cashier"].map((role) => (
            <span
              key={role}
              className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
