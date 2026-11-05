const express = require("express");
require("dotenv").config();

const pool = require("./db");

const tripsRouter = require("./routes/trips");

const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'https://spindly-casket-q5x4vg6995ghxqx4-5173.app.github.dev'
}));

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/trips", tripsRouter);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
