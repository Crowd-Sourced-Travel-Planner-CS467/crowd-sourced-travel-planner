import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './ExperienceSearch.css'

const initialFilters = { destination: '', keyword: '', minimumRating: '0', sort: 'rating' }

export default function ExperienceSearch() {
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [experiences, setExperiences] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trips, setTrips] = useState([])
  const [selectedTrip, setSelectedTrip] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [notice, setNotice] = useState('')
  const [failedImages, setFailedImages] = useState({})
  const token = localStorage.getItem('token')

  // Fetch real, community-submitted experiences through the application backend.
  // The backend queries PostgreSQL and calculates each experience's average rating.
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({ ...filters, page: String(page) })
      try {
        const response = await fetch(`/api/experiences?${params}`, {
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Unable to load experiences.')
        if (!Array.isArray(data.experiences)) throw new Error('Invalid response from server.')
        setExperiences(data.experiences)
        setHasMore(Boolean(data.hasMore))
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err.message || 'Unable to load experiences.')
        setExperiences([])
        setHasMore(false)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [filters, page])

  // Existing trip API validates ownership using the authenticated user.
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    async function loadTrips() {
      try {
        const response = await fetch('/api/trips', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) return
        const data = await response.json()
        if (!controller.signal.aborted && Array.isArray(data)) setTrips(data)
      } catch {
        // Search remains usable even when trip management is unavailable.
      }
    }
    loadTrips()
    return () => controller.abort()
  }, [token])

  function updateFilter(name, value) {
    setFilters(current => ({ ...current, [name]: value }))
    setPage(1)
    setNotice('')
  }

  async function addToTrip(experienceId) {
    if (!selectedTrip || !token) {
      setNotice('Select a trip to save an experience.')
      return
    }
    setSavingId(experienceId)
    setNotice('')
    try {
      const response = await fetch(`/api/trips/${encodeURIComponent(selectedTrip)}/experiences`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ experience_id: experienceId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message || 'Could not save the experience.')
      setNotice('Experience successfully added to your trip.')
    } catch (err) {
      setNotice(err.message || 'Could not save the experience.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <main className="discovery">
      <header>
        <h1>Discover travel experiences</h1>
        <p>Explore real activities submitted and rated by the travel community.</p>
      </header>

      <section className="discovery-filters" aria-label="Search filters">
        <label>
          Destination or address
          <input type="search" value={filters.destination}
            onChange={event => updateFilter('destination', event.target.value)}
            placeholder="e.g., Chicago" maxLength={120} />
        </label>
        <label>
          Keywords
          <input type="search" value={filters.keyword}
            onChange={event => updateFilter('keyword', event.target.value)}
            placeholder="e.g., food walking" maxLength={120} />
        </label>
        <label>
          Minimum rating
          <select value={filters.minimumRating}
            onChange={event => updateFilter('minimumRating', event.target.value)}>
            <option value="0">Any rating</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
        </label>
        <label>
          Sort results
          <select value={filters.sort} onChange={event => updateFilter('sort', event.target.value)}>
            <option value="rating">Highest rated</option>
            <option value="title">Name (A–Z)</option>
          </select>
        </label>
        <button type="button" onClick={() => {
          setFilters(initialFilters)
          setPage(1)
          setNotice('')
        }}>Clear filters</button>
      </section>

      {token && (
        <div className="discovery-trip-tools">
          <label htmlFor="discovery-trip">Save an experience to a trip:</label>
          {trips.length > 0 ? (
            <select id="discovery-trip" value={selectedTrip}
              onChange={event => setSelectedTrip(event.target.value)}>
              <option value="">Choose a trip</option>
              {trips.map(trip => (
                <option key={trip.trip_id} value={trip.trip_id}>{trip.trip_name}</option>
              ))}
            </select>
          ) : (
            <span>No saved trips yet. <Link to="/trip-management">Create a trip</Link></span>
          )}
        </div>
      )}

      {notice && <p className="discovery-notice" role="status">{notice}</p>}

      <section className="discovery-results" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <p role="status">Loading experiences…</p>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setFilters(current => ({ ...current }))}>
              Retry search
            </button>
          </div>
        ) : (
          <>
            <h2>{experiences.length} {experiences.length === 1 ? 'experience' : 'experiences'} shown</h2>
            {experiences.length === 0 ? (
              <p>No experiences match these filters. Try broadening your search, or
                <Link to="/experiences/new"> share a new experience</Link>.</p>
            ) : (
              <ul className="discovery-grid">
                {experiences.map(item => (
                  <li className="discovery-card" key={item.experience_id}>
                    {item.image_url && !failedImages[item.experience_id] && (
                      <img src={item.image_url} alt=""
                        className="discovery-image" loading="lazy"
                        onError={() => setFailedImages(current => ({ ...current, [item.experience_id]: true }))} />
                    )}
                    <h3><Link to={`/experiences/${item.experience_id}`}>{item.title}</Link></h3>
                    <p className="discovery-location">{item.address}</p>
                    <p>{item.description}</p>
                    <p className="discovery-rating">
                      {item.average_rating === null
                        ? 'Not yet rated'
                        : `★ ${item.average_rating.toFixed(1)} / 5 (${item.rating_count} ${item.rating_count === 1 ? 'rating' : 'ratings'})`}
                    </p>
                    {item.keywords.length > 0 && <p className="discovery-tags">{item.keywords.join(' · ')}</p>}
                    <div className="discovery-actions">
                      <Link to={`/experiences/${item.experience_id}`}>View details</Link>
                      {token && trips.length > 0 && (
                        <button type="button" disabled={savingId !== null}
                          onClick={() => addToTrip(item.experience_id)}>
                          {savingId === item.experience_id ? 'Saving…' : 'Add to trip'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <nav className="discovery-pagination" aria-label="Search results pages">
              <button type="button" disabled={page <= 1}
                onClick={() => setPage(current => current - 1)}>Previous</button>
              <span>Page {page}</span>
              <button type="button" disabled={!hasMore}
                onClick={() => setPage(current => current + 1)}>Next</button>
            </nav>
          </>
        )}
      </section>
    </main>
  )
}
