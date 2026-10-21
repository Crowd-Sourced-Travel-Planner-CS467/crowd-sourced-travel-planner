import { useState } from "react";
import "./UserManagement.css";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    console.log({ email, password });  }
  return (
    <main className="um-page">
      <form className="um-card" onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p>Log in to continue planning your travels.</p>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />  <label htmlFor="login-password">Password</label>
        <input
          id="login-password" type="password"
          autoComplete="current-password"  value={password}
          onChange={(event) => setPassword(event.target.value)} required />
        <button type="submit">Log in</button>
        <a href="/register">Create an account</a>
        <a href="/forgot-password">Forgot password?</a>
      </form>
    </main>
  ); }