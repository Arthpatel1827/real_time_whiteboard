import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setAuth } from "../auth/authStorage";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hostname = window.location.hostname;
  const apiBaseUrl = `http://${hostname}:5000`;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      setAuth(result.token, result.user);
      navigate("/", { replace: true });

    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b12] text-white flex items-center justify-center relative overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] top-[-100px] left-[-100px]" />
        <div className="absolute w-[400px] h-[400px] bg-purple-600/20 blur-[120px] bottom-[-100px] right-[-100px]" />
      </div>

      <div className="grid md:grid-cols-2 w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* LEFT */}
        <div className="p-10 flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-4">Whiteboard</h1>
          <p className="text-gray-400">
            Create an account and start collaborating instantly.
          </p>
        </div>

        {/* RIGHT */}
        <div className="p-10 bg-white/5">
          <h2 className="text-2xl font-semibold mb-2">Create Account</h2>
          <p className="text-gray-400 mb-6">Register to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="text"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              placeholder="Display Name"
              required
              className="w-full p-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-indigo-500"
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full p-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-indigo-500"
            />

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full p-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:border-indigo-500"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 transition-all p-3 rounded-xl font-semibold"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}