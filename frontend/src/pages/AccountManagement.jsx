import { useState } from "react";
import "./UserManagement.css";
export default function AccountManagement() {
  const [email, setEmail]=useState("");
  const [emailCurrentPassword,setEmailCurrentPassword]= useState("");
  const [passwordCurrentPassword, setPasswordCurrentPassword]=useState("");
  const [newPassword, setNewPassword]=useState("");
  const [confirmDelete, setConfirmDelete]= useState(false);
  function handleEmailSubmit(event) {
    event.preventDefault();
    console.log({ email });
  }
  function handlePasswordSubmit(event) {
    event.preventDefault();
    console.log({ newPassword });
  }
  function handleDeleteAccount() {
    if (!confirmDelete) return;
    alert("Account deletion is not connected yet."); }
  return (
    <main className="um-page">
      <section className="um-card">
        <h1>Account management</h1>
        <p>Update your sign-in details or manage your account.</p>
        <form onSubmit={handleEmailSubmit}>
          <h2>Change email</h2>
          <label htmlFor="account-email">New email</label>
          <input
            id="account-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="email-current-password">Current password</label>
          <input
            id="email-current-password"
            type="password"
            autoComplete="current-password"
            value={emailCurrentPassword}
            onChange={(event) => setEmailCurrentPassword(event.target.value)}
            required
          />
          <button type="submit">Update email</button>
        </form>
        <hr />
        <form onSubmit={handlePasswordSubmit}>
          <h2>Change password</h2>
          <label htmlFor="password-current">Current password</label>
          <input
            id="password-current"
            type="password"
            autoComplete="current-password"
            value={passwordCurrentPassword}
            onChange={(event) => setPasswordCurrentPassword(event.target.value)}
            required
          />
          <label htmlFor="password-new">New password</label>
          <input
            id="password-new"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <button type="submit">Update password</button>
        </form>
        <hr />
        <div className="um-danger-zone">
          <h2>Delete account</h2>
          <p>This action should permanently delete your account and associated data.</p>
          <label className="um-checkbox">
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(event) => setConfirmDelete(event.target.checked)}
            />
            I understand that this action cannot be undone.
          </label>
          <button
            className="um-danger-button"
            type="button"
            disabled={!confirmDelete}
            onClick={handleDeleteAccount}          >
            Delete account
          </button>
        </div>
      </section>
    </main>
  );
}
