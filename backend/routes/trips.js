// Code below created with AI assistance from chatGPT.
// Transcript: https://oregonstateuniversity-my.sharepoint.com/:w:/g/personal/harrisr6_oregonstate_edu/IQBeWruOGYKtRJCqR3wQY04OAQb-4zGosjXMuJZV76Xwpms?e=cQa044


const express = require("express");
const pool = require("../db");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

// Create new trips
router.post("/", authenticateToken, async (req, res) => {
  const { trip_name } = req.body;
  const user_id = req.user.user_id;

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
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT trip_id, user_id, trip_name, created_time
      FROM public.trips
      WHERE user_id = $1
      ORDER BY created_time DESC`,
      [req.user.user_id]
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
router.delete("/:trip_id", authenticateToken, async (req, res) => {
  const { trip_id } = req.params;
  const user_id = req.user.user_id;

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
router.put("/:trip_id", authenticateToken, async (req, res) => {
  const { trip_id } = req.params;
  const { trip_name } = req.body;
  const user_id = req.user.user_id;

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


// Add an existing experience to a trip
router.post("/:trip_id/experiences", authenticateToken, async (req, res) => {
  const { trip_id } = req.params;
  const { experience_id } = req.body;
  const user_id = req.user.user_id;

  if (!experience_id) {
    return res.status(400).json({
      error: "An experience_id is required."
    });
  }

  try {
    // Verify that the trip belongs to the logged-in user
    const trip = await pool.query(
      `SELECT trip_id
       FROM public.trips
       WHERE trip_id = $1 AND user_id = $2`,
      [trip_id, user_id]
    );

    if (trip.rowCount === 0) {
      return res.status(404).json({
        error: "Trip not found or you do not have permission to access it."
      });
    }

    // Verify that the experience exists
    const experience = await pool.query(
      `SELECT experience_id
       FROM public.experiences
       WHERE experience_id = $1`,
      [experience_id]
    );

    if (experience.rowCount === 0) {
      return res.status(404).json({
        error: "Experience not found."
      });
    }

    // Add the experience to the trip
    const result = await pool.query(
      `INSERT INTO public.trip_experiences (trip_id, experience_id)
       VALUES ($1, $2)
       ON CONFLICT (trip_id, experience_id) DO NOTHING
       RETURNING *`,
      [trip_id, experience_id]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        error: "This experience is already in the trip."
      });
    }

    res.status(201).json({
      message: "Experience added to trip successfully.",
      trip_experience: result.rows[0]
    });

  } catch (err) {
    console.error("Error adding experience to trip:", err);
    res.status(500).json({
      error: "Failed to add experience to trip."
    });
  }
});

module.exports = router;
