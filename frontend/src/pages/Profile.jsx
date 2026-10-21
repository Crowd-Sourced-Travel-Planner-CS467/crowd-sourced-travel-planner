import { useState } from "react";
import "./UserManagement.css";

export default function Profile() {
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    console.log({ fullName, bio, profileImageUrl }); }
  return (
    <main className="um-page">
      <form className="um-card" onSubmit={handleSubmit}>
        <h1>Your profile</h1>
        <p>Manage the information other travelers can see.</p>
        <label htmlFor="profile-name">Full name</label>
        <input
          id="profile-name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required />
        <label htmlFor="profile-image">Profile image URL</label>
        <input id="profile-image" type="url" placeholder="https://example.com" value={profileImageUrl} onChange={(event) => setProfileImageUrl(event.target.value)}  />
        <label htmlFor="profile-bio">About you</label>
        <textarea
          id="profile-bio"
          rows={4}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Tell other travelers a little about yourself"  />
        <button type="submit">Save profile</button>
      </form>
    </main>
  );
}
