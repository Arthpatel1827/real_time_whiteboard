import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setAuth } from "../auth/authStorage";
import "../styles/login.css";

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
    <div className="login-page">

      <div className="login-container">

        {/* LEFT SIDE */}
        <div className="login-left">
          <h1>Whiteboard</h1>
          <p>Create an account and start collaborating instantly.</p>
        </div>


        {/* RIGHT SIDE */}
        <div className="login-card">

          <h2>Create Account</h2>
          <p className="subtitle">Register to start using the whiteboard</p>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label>Display Name</label>
              <input
                type="text"
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@email.com"
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create password"
                required
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button
              className="login-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </button>

          </form>

          <p className="register">
            Already have an account? <Link to="/login">Login</Link>
          </p>

        </div>

      </div>

    </div>
  );
}