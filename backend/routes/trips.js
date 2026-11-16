// Code below created with AI assistance from chatGPT.
// Transcript: https://oregonstateuniversity-my.sharepoint.com/:w:/g/personal/harrisr6_oregonstate_edu/IQBeWruOGYKtRJCqR3wQY04OAQb-4zGosjXMuJZV76Xwpms?e=cQa044


const express = require("express");
const pool = require("../db");

const router = express.Router();

// Create new trips
router.post("/", async (req, res) => {
  const { user_id, trip_name } = req.body;

  if (!user_id || !trip_name || !trip_name.trim()) {
    return res.status(400).json({
      error: "A valid user_id and trip_name are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.trips (user_id, trip_name)
       VALUES ($1, $2)
       RETURNING trip_id, user_id, trip_name, created_time`,
      [user_id, trip_name.trim()]
    );

    res.status(201).json({
      message: "Trip created successfully",
      trip: result.rows[0],
    });
  } catch (error) {
    console.error("Trip creation failed:", error.message);

    res.status(500).json({
      error: "Could not create trip",
    });
  }
});

// Get already created trips
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT trip_id, user_id, trip_name, created_time
       FROM public.trips
       ORDER BY created_time DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve trips:", error.message);

    res.status(500).json({
      error: "Could not retrieve trips",
    });
  }
});

// Delete a trip
router.delete("/:trip_id", async (req, res) => {
  const { trip_id } = req.params;
  const { user_id } = req.body;

  try {
    const result = await pool.query(
      `DELETE FROM public.trips
       WHERE trip_id = $1 AND user_id = $2
       RETURNING trip_id`,
      [trip_id, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Trip not found or you do not have permission to delete it."
      });
    }

    res.json({ message: "Trip deleted successfully." });
  } catch (err) {
    console.error("Error deleting trip:", err);
    res.status(500).json({ error: "Failed to delete trip." });
  }
});

// Update an existing trip name
router.put("/:trip_id", async (req, res) => {
  const { trip_id } = req.params;
  const { user_id, trip_name } = req.body;

  // Validate the trip name
  if (!trip_name || !trip_name.trim()) {
    return res.status(400).json({
      error: "A valid trip name is required."
    });
  }

  try {
    const result = await pool.query(
      `UPDATE public.trips
       SET trip_name = $1
       WHERE trip_id = $2 AND user_id = $3
       RETURNING trip_id, user_id, trip_name, created_time`,
      [trip_name.trim(), trip_id, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Trip not found or you do not have permission to update it."
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating trip:", err);
    res.status(500).json({ error: "Failed to update trip." });
  }
});

module.exports = router;
