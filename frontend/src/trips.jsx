
import { useState } from 'react';

function Trips() {
  const [tripName, setTripName] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    alert(`Trip created: ${tripName}`);
    setTripName('');
  }

  return (
    <div>
      <h2>Create a Trip</h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="tripName">Trip Name: </label>

        <input
          id="tripName"
          type="text"
          value={tripName}
          onChange={(event) => setTripName(event.target.value)}
          placeholder="Enter a trip name"
          required
        />

        <button type="submit">Create Trip</button>
      </form>
    </div>
  );
}

export default Trips;