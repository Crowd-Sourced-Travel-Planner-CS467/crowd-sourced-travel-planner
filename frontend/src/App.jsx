import './App.css'
import { Link } from 'react-router-dom'

function App() {
  return (
    <main className="landing">
      <h1 className="landing-title">Crowd-Sourced Travel Planner</h1>

    {/* <a className="trip-management-link" href="/trip-management">Trip Management</a> */}

    <Link className="trip-management-link" to="/trip-management">Trip Management</Link>
    <Link to={"/experiences/new"}>Create an Experience</Link>

    </main>
  )
}

export default App
