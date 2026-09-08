import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    username: "",
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
      await register(form);
      navigate("/");
    } catch (error) {
      setError(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center px-5 sm:px-8 py-8"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      <div className="w-full max-w-[900px] h-[540px] sm:h-[560px] rounded-2xl overflow-hidden bg-white/[0.04] backdrop-blur-[2px] border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.4)] flex flex-col lg:flex-row">

        <div className="relative w-full lg:w-[58%] h-[220px] lg:h-full flex items-end p-7 sm:p-9 lg:p-11">

          <div className="absolute inset-0 bg-white/[0.03]" />

          <div className="relative z-10">

            <div className="flex items-center gap-2.5 mb-5">

              <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center">
                <span className="text-lg">
                  🎴
                </span>
              </div>

              <div>
                <p className="text-[8px] tracking-[0.28em] uppercase font-bold text-white/80">
                  Anime Card Battle
                </p>

                <p className="text-[7px] tracking-widest uppercase text-white/40 mt-0.5">
                  Begin your journey
                </p>
              </div>

            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[0.95] tracking-tight text-white max-w-sm">

              CREATE YOUR

              <span className="block text-white/65">
                ADVENTURE!
              </span>

            </h2>

            <p className="mt-4 max-w-xs text-[11px] text-white/50 leading-relaxed">
              Create your account, build your collection, and enter the world of Anime Card Battle.
            </p>

          </div>

        </div>

        <div className="w-full lg:w-[42%] h-full bg-black/45 backdrop-blur-xl border-l border-white/15 px-7 sm:px-9 py-8 flex items-center">

          <div className="w-full max-w-[320px] mx-auto">

            <div className="mb-6">

              <p className="text-[8px] tracking-[0.3em] uppercase text-white/45 font-bold mb-2">
                New Player
              </p>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                REGISTER
              </h1>

              <p className="text-[10px] text-white/40 mt-2">
                Create your Anime Card Battle account.
              </p>

            </div>

            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/15 border border-red-300/25 text-red-100 text-[10px]">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-3.5"
            >

              <div>

                <label className="block text-[8px] tracking-[0.18em] uppercase text-white/55 font-bold mb-1.5">
                  Username
                </label>

                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={30}
                  autoComplete="username"
                  placeholder="Your username"
                  className="w-full h-10 px-3.5 rounded-lg bg-black/30 border border-white/15 text-white text-[10px] placeholder:text-white/30 outline-none transition-all duration-300 focus:bg-black/40 focus:border-white/40"
                />

              </div>

              <div>

                <label className="block text-[8px] tracking-[0.18em] uppercase text-white/55 font-bold mb-1.5">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full h-10 px-3.5 rounded-lg bg-black/30 border border-white/15 text-white text-[10px] placeholder:text-white/30 outline-none transition-all duration-300 focus:bg-black/40 focus:border-white/40"
                />

              </div>

              <div>

                <label className="block text-[8px] tracking-[0.18em] uppercase text-white/55 font-bold mb-1.5">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="w-full h-10 px-3.5 rounded-lg bg-black/30 border border-white/15 text-white text-[10px] placeholder:text-white/30 outline-none transition-all duration-300 focus:bg-black/40 focus:border-white/40"
                />

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-white/90 text-black text-[9px] font-black tracking-[0.22em] uppercase transition-all duration-300 hover:bg-white hover:shadow-[0_8px_25px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "CREATING ACCOUNT..." : "REGISTER"}
              </button>

            </form>

            <div className="flex items-center gap-2.5 my-5">

              <div className="flex-1 h-px bg-white/15" />

              <span className="text-[7px] tracking-[0.15em] uppercase text-white/35 whitespace-nowrap">
                Or continue with
              </span>

              <div className="flex-1 h-px bg-white/15" />

            </div>

            <div className="grid grid-cols-2 gap-2.5">

              <button
                type="button"
                className="h-9 rounded-lg bg-black/25 border border-white/15 text-white/65 text-[9px] backdrop-blur-md transition-all duration-300 hover:bg-black/40 hover:text-white"
              >
                <span className="font-bold mr-1.5">
                  G
                </span>
                Google
              </button>

              <button
                type="button"
                className="h-9 rounded-lg bg-black/25 border border-white/15 text-white/65 text-[9px] backdrop-blur-md transition-all duration-300 hover:bg-black/40 hover:text-white"
              >
                <span className="font-bold mr-1.5">
                  f
                </span>
                Facebook
              </button>

            </div>

            <p className="text-center text-white/40 text-[9px] mt-5">

              Already have an account?{" "}

              <Link
                to="/login"
                className="text-white font-bold hover:text-white/70 transition"
              >
                Login
              </Link>

            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Register;