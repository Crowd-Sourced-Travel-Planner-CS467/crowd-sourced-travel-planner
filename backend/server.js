
const express = require("express");
require("dotenv").config();

const pool = require("./db");

const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'https://spindly-casket-q5x4vg6995ghxqx4-5173.app.github.dev'
}));

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Crowd-Sourced Travel Planner API is running",
  });});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS database_time, current_database() AS database_name"
    );

    res.json({
      status: "connected",
      ...result.rows[0],
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(500).json({
      status: "error",
      message: "Could not connect to the database",
    });
  }
});

// Create new trips
app.post("/api/trips", async (req, res) => {
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
app.get("/api/trips", async (req, res) => {
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



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
