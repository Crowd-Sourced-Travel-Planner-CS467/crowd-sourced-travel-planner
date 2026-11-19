import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./History.css";
function StarRating({ rating }) {
  if (!rating) return <span className="hist-no-rating">No ratings yet</span>;
  const full = Math.round(Number(rating));
  return (
    <span className="hist-stars" aria-label={`${rating} out of 5`}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
      <span className="hist-rating-num"> {rating}</span>
    </span>
  );    }
function ExperienceCard({ exp, linkable = true }) {
  const inner = (
    <div className="hist-exp-card">
      {exp.image_url && (
        <img
          src={exp.image_url}
          alt={exp.title}
          className="hist-exp-img"      onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
      <div className="hist-exp-body">
        <h3 className="hist-exp-title">{exp.title}</h3>
        <p className="hist-exp-address">{exp.address}</p>
        <StarRating rating={exp.average_rating} />
        {exp.create_datetime && (
          <p className="hist-exp-date">
            {new Date(exp.create_datetime).toLocaleDateString(undefined, {
              year: "numeric", month: "short", day: "numeric",
            })}
          </p>
        )}
      </div>
    </div> );
  return linkable ? (
    <Link to={`/experiences/${exp.experience_id}`} className="hist-exp-link">
      {inner}
    </Link>
  ) : inner;
}

export default function History() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openTrips, setOpenTrips] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; 


    }

    async function fetchHistory() {
      try {
        const res = await fetch("/api/history", {
          headers: { Authorization: `Bearer ${token}` },   });
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        const data = await res.json();
        if (res.ok && data.success) {
          setTrips(data.trips);
          setExperiences(data.experiences);
        } 
        else 
        {
          setError("Could not load your history. Please try again.");
        }
      } catch {
        setError("Could not reach the server. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [navigate]);

  function toggleTrip(tripId) {
    setOpenTrips((prev) => ({ ...prev, [tripId]: !prev[tripId] }));
  }

  if (loading) {
    return (
      <main className="um-page">
        <div className="um-card">
          <p style={{ textAlign: "center" }}>Loading your history…</p>
        </div>
      </main>
    );  }

  if (error) {
    return (
      <main className="um-page">
        <div className="um-card">
          <ul className="um-errors" role="alert"><li>{error}</li></ul>
        </div>
      </main>
    );
  }

  return (
    <main className="um-page">
      <div className="hist-wrapper">
        {/* ── Trips ── */}
        <section className="hist-section">
          <h1 className="hist-heading"></h1>
          {trips.length === 0 ? (
            <p className="hist-empty">
              {/* You haven't created any trips yet.{" "}
              <Link to="/trip-management">Start one now</Link>. */}
            </p>
          ) : (
            <ul className="hist-trip-list">
              {trips.map((trip) => (
                <li key={trip.trip_id} className="hist-trip-item">
                  <button       className="hist-trip-toggle"
                    onClick={() => toggleTrip(trip.trip_id)}
                    aria-expanded={!!openTrips[trip.trip_id]}
                  >
                    <span className="hist-trip-name">{trip.trip_name}</span>
                    <span className="hist-trip-meta">
                      {trip.experiences.length} experience{trip.experiences.length !== 1 ? "s" : ""}
                      &nbsp;·&nbsp;
                      {new Date(trip.created_time).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </span>
                    <span className="hist-chevron">
                      {openTrips[trip.trip_id] ? "▲" : "▼"}
                    </span>
                  </button>

                  {openTrips[trip.trip_id] && (
                    <div className="hist-trip-experiences">
                      {trip.experiences.length === 0 ? (
                        <p className="hist-empty-inner">No experiences added to this trip yet.</p>
                      ) : (
                        trip.experiences.map((exp) => (
                          <ExperienceCard key={exp.experience_id} exp={exp} />
                        ))
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Experiences ── */}
        <section className="hist-section">
          <h1 className="hist-heading">My experiences</h1>
          {experiences.length === 0 ? (
            <p className="hist-empty">
              You haven't logged any experiences yet.{" "}
              <Link to="/experiences/new">Create your first one</Link>.
            </p>
          ) : (
            <div className="hist-exp-grid">
              {experiences.map((exp) => (
                <ExperienceCard key={exp.experience_id} exp={exp} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}