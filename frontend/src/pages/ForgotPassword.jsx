import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    if (!email.trim()) {
      setErrors(["Email address is required."]);
      return;    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",    headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrors(data.errors || ["Something went wrong. Please try again."]);
      }
    } catch {
      setErrors(["Could not reach the server. Please try again later."]);
    } finally 
    {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="um-page">
        <div className="um-card">
          <h1>Check your email</h1>
          <p>
            If an account with that address exists, we've sent a password reset
            link. It expires in 30 minutes.
          </p>
          <p style={{ textAlign: "center", color: "#888", fontSize: "14px" }}>
            Didn't get it? Check your spam folder or{" "}
            <button
              style={{
                background: "none",
                border: "none",         color: "inherit",
                textDecoration: "underline",
                cursor: "pointer",               font: "inherit",
                padding: 0,
              }}
              onClick={() => setSubmitted(false)}
            >
              try again
            </button>
            .
          </p>
          <Link to="/login">Back to log in</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="um-page">
      <form className="um-card" onSubmit={handleSubmit} noValidate>
        <h1>Forgot your password?</h1>
        <p>
          Enter the email address for your account and we'll send you a link to
          reset your password.
        </p>
        {errors.length > 0 && (
          <ul className="um-errors" role="alert">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"   type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.length) setErrors([]);    }}
          placeholder="jane@example.com"
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </button>

        <Link to="/login">Back to log in</Link>
      </form>
    </main>
  );
}