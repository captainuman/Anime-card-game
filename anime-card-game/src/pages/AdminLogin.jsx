import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await adminLogin(form);

      if (data.user?.role !== "admin") {
        throw new Error("Admin access denied.");
      }

      navigate("/admin/cards");
    } catch (error) {
      setError(
        error.message || "Admin login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center">
          <div className="text-6xl">
            🛡️
          </div>

          <h1 className="text-3xl font-black mt-4">
            ADMIN LOGIN
          </h1>

          <p className="text-gray-500 mt-2">
            Anime Card Battle Administration
          </p>
        </div>

        {error && (
          <div className="mt-6 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <label className="text-sm text-gray-400">
              Admin Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="mt-2 w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-red-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">
              Admin Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="mt-2 w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-red-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-black transition"
          >
            {loading
              ? "AUTHENTICATING..."
              : "ADMIN LOGIN"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-gray-500 hover:text-red-400 text-sm transition"
          >
            ← Back to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;