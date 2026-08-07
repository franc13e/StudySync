import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Glow blob */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-petal/30 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <span className="text-5xl">🐸</span>
          <h1 className="font-display font-extrabold text-3xl mt-3">
            Welcome back!
          </h1>
          <p className="text-chocolate mt-1">
            Sign in to your cozy study space
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-butter border border-border rounded-squircle-lg p-6 space-y-4 shadow-sm"
        >
          {error && (
            <div className="bg-petal/50 text-espresso text-sm rounded-squircle px-4 py-2.5 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 transition"
              placeholder="you@uni.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-espresso text-white font-semibold rounded-full py-3 text-sm hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-chocolate mt-5">
          New here?{" "}
          <Link to="/register" className="text-espresso font-semibold underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
