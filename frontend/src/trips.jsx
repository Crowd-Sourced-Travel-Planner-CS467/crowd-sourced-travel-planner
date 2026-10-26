import { useState } from 'react';
import './trips.css';

function Trips() {
  const [tripName, setTripName] = useState('');
  const [searchName, setSearchName] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

  if (!tripName.trim()) {
  alert('Please enter a valid trip name.');
  return;
}

alert(`Trip created: ${tripName.trim()}`);


    setTripName('');
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
    </div>
  );
}

export default Trips;