import { useState, useEffect } from 'react';
import './trips.css';

function Trips() {
  const [tripName, setTripName] = useState('');
  const [searchName, setSearchName] = useState('');
  const [trips, setTrips] = useState([]);

  

async function fetchTrips() {
  try {
    const response = await fetch(
      'https://spindly-casket-q5x4vg6995ghxqx4-3000.app.github.dev/api/trips'
    );

    if (!response.ok) {
      throw new Error('Failed to retrieve trips');
    }

    const data = await response.json();
    setTrips(data);
  } catch (error) {
    console.error('Error fetching trips:', error);
  }
}

useEffect(() => {
  fetchTrips();
}, []);




async function handleSubmit(event) {
  event.preventDefault();

  if (!tripName.trim()) {
    alert('Please enter a valid trip name.');
    return;
  }

  try {
    const response = await fetch('https://spindly-casket-q5x4vg6995ghxqx4-3000.app.github.dev/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trip_name: tripName.trim(),
        user_id: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create trip.');
    }
    await fetchTrips();
    setTripName('');
  } catch (error) {
    console.error('Error creating trip:', error);
    alert('Could not create trip. Please try again.');
  }
}


  return (
    <div className="trips-container">
      <h2>My Trip Management</h2>
      <p>Search for an existing trip or create a new trip</p>


      <form onSubmit={(event) => {
        event.preventDefault();

        if (!searchName.trim()) {
          alert('Please enter a trip name to search.');
          return;
        }

        alert(`Searching for trip: ${searchName.trim()}`);
        setSearchName('');
      }}>
        <label htmlFor="searchName">Search My Trips: </label>

        <input
          id="searchName"
          type="text"
          value={searchName}
          onChange={(event) => setSearchName(event.target.value)}
          placeholder="Enter a trip name"
          required
        />

        <button type="submit">Search Trips</button>
      </form>


      <form onSubmit={handleSubmit}>
        <label htmlFor="tripName">Create Trip: </label>

        <input
          id="tripName"
          type="text"
          value={tripName}
          onChange={(event) => setTripName(event.target.value)}
          placeholder="Enter a trip name"
          required
        />

        <button type="submit">Create New Trip</button>
      </form>

      
      <h3>My Saved Trips</h3>

      {trips.length === 0 ? (
        <p>No trips created yet.</p>
      ) : (
        <ul>
          {trips.map((trip) => (
            <li key={trip.trip_id}>
              {trip.trip_name}
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

export default Trips;