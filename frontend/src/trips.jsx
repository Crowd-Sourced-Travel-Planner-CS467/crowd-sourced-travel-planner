import { useState, useEffect } from 'react';
import './trips.css';

function Trips() {
  // Stores the new trip name, search input, and list of saved trips.
  const [tripName, setTripName] = useState('');
  const [searchName, setSearchName] = useState('');
  const [trips, setTrips] = useState([]);

  // Retrieves saved trips from the backend and updates the displayed list.
  async function fetchTrips() {
    try {
      const response = await fetch(
        // TODO: confirm the backend URL for the team's deployemnt and replace this
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

  // Loads saved trips when the component first appears on the page.
  useEffect(() => {
    fetchTrips();
  }, []);

  // Validates the trip name, sends it to the backend, and refreshes the list.
  async function handleSubmit(event) {
    event.preventDefault();

    if (!tripName.trim()) {
      alert('Please enter a valid trip name.');
      return;
    }

    try {
      // TODO: confirm the backend URL for the team's deployemnt and replace this
      const response = await fetch('https://spindly-casket-q5x4vg6995ghxqx4-3000.app.github.dev/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip_name: tripName.trim(),
          user_id: 1, // Sets user_id = 1 for testing purposes only. TODO: remove when user management is set up
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
      {/* Page heading and description */}
      <h2>My Trip Management</h2>
      <p>Search for an existing trip or create a new trip</p>

      {/* Search form for entering a trip name */}
      <form onSubmit={(event) => {
        event.preventDefault();

        if (!searchName.trim()) {
          alert('Please enter a trip name to search.');
          return;
        }

        alert(`Searching for trip: ${searchName.trim()}`);
        setSearchName('');
      }}>
        <label htmlFor="searchName">Search All Trips: </label>

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

      {/* Form for creating a new trip */}
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

      {/* Displays saved trips or a message if no trips exist */}
      <h3>My Saved Trips</h3>

      {trips.length === 0 ? (
        <p>No trips created yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Trip Name</th>
              <th>Creation Date</th>
              <th>Linked Experiences</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.trip_id}>
                <td>{trip.trip_name}</td>
                <td>
                  {new Date(trip.created_time).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Trips;
