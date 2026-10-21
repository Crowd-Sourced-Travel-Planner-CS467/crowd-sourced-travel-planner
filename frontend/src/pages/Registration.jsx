import { useState } from "react";
import "./UserManagement.css";
export default function Registration() {
  const [fullName, setFullName]= useState("");
  const [email, setEmail] =useState("");
  const [password, setPassword]= useState("");
  function handleSubmit(event) {
    event.preventDefault();
    console.log({ fullName, email, password }); }
  return (
    <main className="um-page">
      <form className="um-card" onSubmit={handleSubmit}>
        <h1>Create an account</h1>
        <p>Join the community and start planning trips.</p>
        <label htmlFor="register-name">Full name</label>
        <input
          id="register-name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required  />
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <small>Use at least 8 characters.</small>
        <button type="submit">Register</button>
        <a href="/login">Already have an account? Log in</a>
      </form>
    </main>
  );
}
