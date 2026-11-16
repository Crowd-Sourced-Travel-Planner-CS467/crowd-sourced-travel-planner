import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './App.css'
function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }});
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true }); }
  return (
    <main className="landing">
      <h1 className="landing-title">Crowd-Sourced Travel Planner</h1>
      {user &&(  <p className="landing-welcome">Welcome,{user.full_name}!</p>)}
      <nav className="landing-nav">
        {!user ?(
          <>
            <Link to="/register">Register Account</Link>
            <Link to="/login">Login</Link>
          </>
        ):(
          <>
            <Link to="/experiences/new">Create an Experience</Link>
            <Link className="trip-management-link" to="/trip-management">Trip Management</Link>
            <Link to="/profile">View Profile</Link>
            <Link to="/account">Manage Account</Link>
            <button className="btn-logout" onClick={handleLogout}>Log out</button>
          </> )}
      </nav>
    </main>
  );}

export default App;