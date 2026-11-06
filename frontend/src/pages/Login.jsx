import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./Login.css";

const INITIAL_FORM = { email: "", password: "" };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage =location.state?.message || null;
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors.length) setErrors([]);  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setErrors(["Email and password are required."]);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, 
          password: form.password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        const redirectTo = location.state?.from || "/";
        navigate(redirectTo, { replace: true });
      } else {
        setErrors(data.errors ||["Login failed. Please try again."]);
      }
    } catch {
      setErrors(["Could not reach the server. Please try again later."]);
    } 
    finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="um-page">
      <form className="um-card" onSubmit={handleSubmit} noValidate>
        <h1>Welcome back</h1>
        <p>Log in to your account to continue.</p>
        {successMessage && (
          <div className="um-success" role="status">{successMessage}</div>
        )}

        {errors.length > 0 && (
          <ul className="um-errors" role="alert">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        )}

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"     type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="jane@example.com"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"     type="password"
          autoComplete="current-password"
          value={form.password}  onChange={handleChange}
          placeholder="Your password"
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
        <Link to="/register">Don't have an account? Create one</Link>
      </form>
    </main>
  );
}