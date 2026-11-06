import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },     });
        if (res.status === 401) 
          {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        const data =await res.json();
        if (res.ok && data.success) {
          setFullName(data.user.full_name ||"");
          setBio(data.user.bio || "");
          setProfileImageUrl(data.user.profile_image_url || "");
        } 
        else {
          setErrors(["Could not load your profile. Please try again."]);
        }
      } 
      catch {
        setErrors(["Could not reach the server. Please try again later."]);
      } 
      finally 
      {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  //Submit updated profile
  async function handleSubmit(event) {
    event.preventDefault();
    setErrors([]);
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrors(["Full name is required."]);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users/profile", {
        method: "PUT", headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },  body: JSON.stringify({
          full_name: fullName.trim(),
          bio: bio.trim(),
          profile_image_url: profileImageUrl.trim(),
        }), });

      const data = await res.json();

      if (res.ok && data.success) {
        // Keep localStorage user in sync
        const stored = localStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored);
          localStorage.setItem(
            "user",
            JSON.stringify({ ...user, full_name: fullName.trim() }) );
        }
        setSuccessMessage("Profile updated successfully.");
      } 
      else {
        setErrors(data.errors ||["Update failed. Please try again."]);
      }
    } catch {
      setErrors(["Could not reach the server. Please try again later."]);
    } finally {
      setSubmitting(false);
    }
  }

  //Render
  if (loading) {
    return (
      <main className="um-page">
        <div className="um-card">
          <p style={{ textAlign: "center" }}>Loading your profile…</p>
        </div>
      </main>
    );     }

  return (
    <main className="um-page">
      <form className="um-card" onSubmit={handleSubmit}>
        <h1>Your profile</h1>
        <p>Manage the information other travelers can see.</p>
        {successMessage && (
          <div className="um-success" role="status">
            {successMessage}
          </div>
        )}
        {errors.length>0 &&(
          <ul className="um-errors" role="alert">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        {/* Profile image preview */}
        {profileImageUrl && (
          <div className="profile-image-preview">
            <img
              src={profileImageUrl}
              alt="Profile preview"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        )}
        <label htmlFor="profile-image">Profile image URL</label>
        <input
          id="profile-image"
          type="url"
          placeholder="https://example.com/photo.jpg"
          value={profileImageUrl}
          onChange={(e) => setProfileImageUrl(e.target.value)}
        />
        <label htmlFor="profile-name">Full name</label>
        <input
          id="profile-name"
          type="text"          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <label htmlFor="profile-bio">About you</label>
        <textarea
          id="profile-bio"
          rows={4}
          value={bio}          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell other travelers a little about yourself"
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}