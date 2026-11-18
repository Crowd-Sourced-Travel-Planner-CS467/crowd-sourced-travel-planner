import { useMemo, useState } from 'react'
import { searchExperiences } from '../features/discovery/searchExperiences.js'
import { sampleExperiences } from '../features/discovery/sampleExperiences.js'
import './ExperienceSearch.css'

export default function ExperienceSearch({ experiences = sampleExperiences }) {
  const [destination, setDestination] = useState('')
  const [keyword, setKeyword] = useState('')
  const [minimumRating, setMinimumRating] = useState('0')
  const [sort, setSort] = useState('rating')

  const results = useMemo(() => searchExperiences(experiences, {
    destination, keyword, minimumRating, sort,
  }), [experiences, destination, keyword, minimumRating, sort])

  function clearFilters() {
    setDestination('')
    setKeyword('')
    setMinimumRating('0')
    setSort('rating')
  }

  return (
    <main className="discovery">
      <header>
        <h1>Discover travel experiences</h1>
        <p>Explore community-rated activities for your next trip.</p>
      </header>

      <section className="discovery-filters" aria-label="Search filters">
        <label>
          Destination
          <input type="search" value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="e.g., Kyoto" />
        </label>
        <label>
          Keywords
          <input type="search" value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="e.g., food or walking" />
        </label>
        <label>
          Minimum rating
          <select value={minimumRating}
            onChange={(event) => setMinimumRating(event.target.value)}>
            <option value="0">Any rating</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
        </label>
        <label>
          Sort results
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="rating">Highest rated</option>
            <option value="title">Name (A–Z)</option>
          </select>
        </label>
        <button type="button" onClick={clearFilters}>Clear filters</button>
      </section>

      <section className="discovery-results" aria-live="polite">
        <h2>{results.length} {results.length === 1 ? 'experience' : 'experiences'} found</h2>
        {results.length === 0 ? (
          <p>No experiences match these filters. Try broadening your search.</p>
        ) : (
          <ul className="discovery-grid">
            {results.map((item) => (
              <li className="discovery-card" key={item.id}>
                <h3>{item.title}</h3>
                <p className="discovery-location">{item.destination}</p>
                <p>{item.description}</p>
                <p aria-label={`Rated ${item.rating} out of 5 stars`}>
                  ★ {Number(item.rating).toFixed(1)} / 5
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
