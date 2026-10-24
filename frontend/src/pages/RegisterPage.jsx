import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, username, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-canvas">
      <div className="fixed bottom-10 right-10 w-[400px] h-[400px] rounded-full bg-lavender/30 blur-[100px] pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <span className="text-5xl">🌱</span>
          <h1 className="font-display font-extrabold text-3xl mt-3">Join the crew</h1>
          <p className="text-chocolate mt-1">Set up your study nook in seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-butter border border-border rounded-3xl p-6 space-y-4">
          {error && (
            <div className="bg-petal/40 text-espresso text-sm rounded-2xl px-4 py-2.5 font-medium">{error}</div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
              placeholder="you@uni.edu" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
              minLength={2} maxLength={30} pattern="[A-Za-z0-9_.\-]+" title="2–30 letters, numbers, dots, dashes or underscores"
              className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
              placeholder="studybuddy42" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              minLength={8} maxLength={128} autoComplete="new-password"
              className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
              placeholder="At least 8 characters" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-espresso text-white font-semibold rounded-full py-3 text-sm hover:opacity-90 transition disabled:opacity-60">
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-chocolate mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-espresso font-semibold underline underline-offset-2">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
