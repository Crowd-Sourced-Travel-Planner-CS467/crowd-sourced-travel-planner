import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =useState("");
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  //No token in URL show a clear message rather than a broken form
  if (!token) {
    return (
      <main className="um-page">
        <div className="um-card">
          <h1>Invalid reset link</h1>
          <p>This password reset link is missing or malformed.</p>
          <Link to="/forgot-password">Request a new reset link</Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    const errs =[];
    if (!newPassword || newPassword.length < 8) {
      errs.push("Password must be at least 8 characters.");
    }
    if (newPassword !==confirmPassword) {
      errs.push("Passwords do not match.");  }
    if (errs.length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        navigate("/login", { state: { message: "Password reset! Please log in with your new password." } });
      } else {
        setErrors(data.errors || ["Reset failed. Please try again."]);
      }
    } 
    catch 
    {
      setErrors(["Could not reach the server. Please try again later."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="um-page">
      <form className="um-card" onSubmit={handleSubmit} noValidate>
        <h1>Reset your password</h1>
        <p>Choose a new password for your account.</p>
        {errors.length > 0 && (
          <ul className="um-errors" role="alert">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"      autoComplete="new-password"
          value={newPassword}
          onChange={(e) => {   setNewPassword(e.target.value);
            if (errors.length) setErrors([]);
          }}
          placeholder="At least 8 characters"
        />
        <small>Must be at least 8 characters.</small>

        <label htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          type="password"   autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.length) setErrors([]);
          }}
          placeholder="Repeat your new password"
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Resetting…" : "Reset password"}
        </button>

        <Link to="/forgot-password">Request a new reset link</Link>
      </form>
    </main>
  );
}