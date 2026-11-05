// Code below created with AI assistance from chatGPT.
// Transcript: https://oregonstateuniversity-my.sharepoint.com/:w:/g/personal/harrisr6_oregonstate_edu/IQBeWruOGYKtRJCqR3wQY04OAQb-4zGosjXMuJZV76Xwpms?e=cQa044 

import { useState, useEffect } from 'react';
import './trips.css';

function Trips() {
  // Stores the new trip name, search input, and list of saved trips.
  const [tripName, setTripName] = useState('');
  const [searchName, setSearchName] = useState('');
  const [trips, setTrips] = useState([]);

  // Edit trips
  const [editingTripId, setEditingTripId] = useState(null);
  const [editedTripName, setEditedTripName] = useState('');

  // Filters trips by name using the search input.
  const filteredTrips = trips.filter((trip) =>
  trip.trip_name.toLowerCase().includes(searchName.trim().toLowerCase())
);

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

    // Delete a trip
  async function deleteTrip(tripId) {
    try {
      const response = await fetch(
        `https://spindly-casket-q5x4vg6995ghxqx4-3000.app.github.dev/api/trips/${tripId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: 1 }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }

      // Remove the deleted trip from the displayed list
      setTrips((previousTrips) =>
        previousTrips.filter((trip) => trip.trip_id !== tripId)
      );
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Unable to delete trip.');
    }
  }

      // Start editing a trip name
    function handleEdit(trip) {
      setEditingTripId(trip.trip_id);
      setEditedTripName(trip.trip_name);
    }

    // Save the updated trip name
    async function saveTripName(tripId) {
      if (!editedTripName.trim()) {
        alert('Please enter a valid trip name.');
        return;
      }

      try {
        const response = await fetch(
          `https://spindly-casket-q5x4vg6995ghxqx4-3000.app.github.dev/api/trips/${tripId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trip_name: editedTripName.trim(),
              user_id: 1,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update trip.');
        }

        // Update the displayed trip name
        setTrips((previousTrips) =>
          previousTrips.map((trip) =>
            trip.trip_id === tripId
              ? { ...trip, trip_name: data.trip_name }
              : trip
          )
        );

        setEditingTripId(null);
        setEditedTripName('');
      } catch (error) {
        console.error('Error updating trip:', error);
        alert('Unable to update trip.');
      }
    }

    // Cancel editing
    function cancelEdit() {
      setEditingTripId(null);
      setEditedTripName('');
    }

  return (
    <div className="trips-container">
      {/* Page heading and description */}
      <h2>My Trip Management</h2>
      <p>Create a new trip or browse your saved trips</p>



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

            {/* Search form for filtering trips by name */}
      <form onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="searchName">Filter by Trip Name: </label>

        <input
          id="searchName"
          type="text"
          value={searchName}
          onChange={(event) => setSearchName(event.target.value)}
          placeholder="Enter a trip name"
        />

        <button className="clear-button" type="button" onClick={() => setSearchName('')}>
          Clear Filter
        </button>
      </form>

        {/* Displays filtered trips or a message if no trips exist */}
        <h3>My Saved Trips</h3>

        {trips.length === 0 ? (
          <p>No trips created yet.</p>
        ) : filteredTrips.length === 0 ? (
          <p>No trips match your search.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trip Name</th>
                <th>Creation Date</th>
                <th>Linked Experiences</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((trip) => (
                <tr key={trip.trip_id}>
                  <td>
                    {editingTripId === trip.trip_id ? (
                      <input
                        type="text"
                        value={editedTripName}
                        onChange={(event) => setEditedTripName(event.target.value)}
                      />
                    ) : (
                      trip.trip_name
                    )}
                  </td>
                  <td>
                    {new Date(trip.created_time).toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td></td>
                  <td>
                    {editingTripId === trip.trip_id ? (
                      <>
                        <button className="save-button" onClick={() => saveTripName(trip.trip_id)}>
                          Save
                        </button>
                        <button className="cancel-button" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="edit-button" onClick={() => handleEdit(trip)}>
                          Edit
                        </button>
                        <button className="delete-button" onClick={() => deleteTrip(trip.trip_id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );



  
}



export default Trips;
