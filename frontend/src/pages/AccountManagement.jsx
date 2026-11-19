import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserManagement.css";

export default function AccountManagement() {
  const navigate = useNavigate();
  //Change email
  const [email, setEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [emailSuccess, setEmailSuccess] =useState("");
  const [emailErrors, setEmailErrors]= useState([]);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  //Change password
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  //Delete account
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState([]);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  //Helpers
  function getToken() {
    return localStorage.getItem("token");
  }
  function handleAuthError() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  //Handle email update
  async function handleEmailSubmit(event) {
    event.preventDefault();
    setEmailErrors([]);
    setEmailSuccess("");
    if (!email.trim()) {
      setEmailErrors(["New email address is required."]);
      return;  }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailErrors(["Please enter a valid email address."]);
      return;  }
    if (!emailCurrentPassword) {
      setEmailErrors(["Current password is required to change your email."]);
      return;
    }

    setEmailSubmitting(true);
    try {
      const res = await fetch("/api/users/account/email", {
        method: "PUT",    headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          new_email: email.trim(),
          current_password: emailCurrentPassword,
        }),
      });

      const data = await res.json();

      if (res.status === 401) return handleAuthError();

      if (res.ok && data.success) {
        //Update stored user email
        const stored = localStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored);
          localStorage.setItem("user", JSON.stringify({ ...user, email: email.trim() }));
        }
        setEmailSuccess("Email address updated successfully.");
        setEmail("");
        setEmailCurrentPassword("");
      } 
      
      else {
        setEmailErrors(data.errors || ["Update failed. Please try again."]);
      }
    } 
    catch 
    {
      setEmailErrors(["Could not reach the server. Please try again later."]);
    } finally {
      setEmailSubmitting(false);
    }
  }

  //Handle password update
  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordErrors([]);
    setPasswordSuccess("");
    const errs = [];
    if (!passwordCurrentPassword) errs.push("Current password is required.");
    if (!newPassword) {
      errs.push("New password is required.");
    } else if (newPassword.length < 8) {
      errs.push("New password must be at least 8 characters.");
    }
    if (newPassword !== confirmNewPassword) errs.push("New passwords do not match.");
    if (errs.length>0) 
      { 
        setPasswordErrors(errs); return; 
      }

    setPasswordSubmitting(true);
    try {
      const res = await fetch("/api/users/account/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          current_password: passwordCurrentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.status === 401) return handleAuthError();
      if (res.ok && data.success) {
        setPasswordSuccess("Password updated successfully.");
        setPasswordCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPasswordErrors(data.errors || ["Update failed. Please try again."]);
      }
    } catch {
      setPasswordErrors(["Could not reach the server. Please try again later."]);
    } finally {
      setPasswordSubmitting(false);
    }
  }

  //Handle account deletion
  async function handleDeleteAccount() {
    if (!confirmDelete) return;
    setDeleteErrors([]);
    setDeleteSubmitting(true);
    try {
      const res = await fetch("/api/users/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
      } else {
        setDeleteErrors(data.errors || ["Deletion failed. Please try again."]);
      }
    } catch {
      setDeleteErrors(["Could not reach the server. Please try again later."]);
    } finally {
      setDeleteSubmitting(false);
    }
  }
  //Render
  return (
    <main className="um-page">
      <section className="um-card">
        <h1>Account management</h1>
        <p>Update your sign-in details or manage your account.</p>
        {/* ── Change email ── */}
        <form onSubmit={handleEmailSubmit}>
          <h2>Change email</h2>
          {emailSuccess && (
            <div className="um-success" role="status">{emailSuccess}</div>
          )}
          {emailErrors.length > 0 && (
            <ul className="um-errors" role="alert">
              {emailErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}

          <label htmlFor="account-email">New email</label>
          <input
            id="account-email"
            type="email"   autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="email-current-password">Current password</label>
          <input
            id="email-current-password"
            type="password"   autoComplete="current-password"
            value={emailCurrentPassword}
            onChange={(e) => setEmailCurrentPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={emailSubmitting}>
            {emailSubmitting ? "Updating…" : "Update email"}
          </button>
        </form>

        <hr />

        {/* ── Change password ── */}
        <form onSubmit={handlePasswordSubmit}>
          <h2>Change password</h2>
          {passwordSuccess && (
            <div className="um-success" role="status">{passwordSuccess}</div>
          )}
          {passwordErrors.length > 0 && (
            <ul className="um-errors" role="alert">
              {passwordErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
          <label htmlFor="password-current">Current password</label>
          <input
            id="password-current"
            type="password"     autoComplete="current-password"
            value={passwordCurrentPassword}
            onChange={(e) => setPasswordCurrentPassword(e.target.value)}
            required
          />

          <label htmlFor="password-new">New password</label>
          <input
            id="password-new"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <small>Must be at least 8 characters.</small>

          <label htmlFor="password-confirm">Confirm new password</label>
          <input
            id="password-confirm"
            type="password"          autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={passwordSubmitting}>
            {passwordSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>

        <hr />

        {/* ── Delete account ── */}
        <div className="um-danger-zone">
          <h2>Delete account</h2>
          <p>
            This will permanently delete your account and all associated data.
            This action cannot be undone.
          </p>

          {deleteErrors.length > 0 && (
            <ul className="um-errors" role="alert">
              {deleteErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}

          <label className="um-checkbox">
            <input        type="checkbox"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
            />
            I understand that this action cannot be undone.
          </label>

          <button
            className="um-danger-button"
            type="button"
            disabled={!confirmDelete || deleteSubmitting}
            onClick={handleDeleteAccount}
          >
            {deleteSubmitting ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </section>
    </main>
  );
}