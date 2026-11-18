import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

const INITIAL_FORM = { full_name:"", email:"", password: "",confirm_password: "" };
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function validate({ full_name, email, password, confirm_password }) {
    const errs = [];
    if (!full_name.trim()) errs.push("Full name is required.");
    if (!email.trim()) { errs.push("Email address is required.");
    } 
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.push("Please enter a valid email address.");
    }
    if (!password) {
      errs.push("Password is required.");
    } else if (password.length < 8) {
      errs.push("Password must be at least 8 characters.");
    }
    if (password !== confirm_password) errs.push("Passwords do not match.");
    return errs;
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors.length) setErrors([]);  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setErrors([]);


    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({  full_name: form.full_name,
          email: form.email,   password: form.password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        navigate("/login", {state: { message: "Account created! Please log in." } });
      } else {
        setErrors(data.errors||["Registration failed. Please try again."]);
      }
    } 
    catch {
      setErrors(["Could not reach the server. Please try again later."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="um-page">
      <form className="um-card" onSubmit={handleSubmit} noValidate>
        <h1>Create your account</h1>
        <p>Join the community and start planning your next adventure.</p>
        {errors.length > 0 && (
          <ul className="um-errors" role="alert">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>        )}
        <label htmlFor="full_name">Full name</label>
        <input id="full_name" name="full_name"
          type="text"
          autoComplete="name" value={form.full_name}
          onChange={handleChange}
          placeholder="Jane Smith"
          maxLength={255}
        />
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="jane@example.com"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"    name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}   onChange={handleChange}
          placeholder="At least 8 characters"
        />
        <small>Must be at least 8 characters.</small>

        <label htmlFor="confirm_password">Confirm password</label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password" value={form.confirm_password}
          onChange={handleChange}
          placeholder="Repeat your password"
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <Link to="/login">Already have an account? Log in</Link>
      </form>
    </main>
  );
}