const express = require("express");
require("dotenv").config();
const pool = require("./db");
const experienceRoutes = require("./routes/experiences");
const authRoutes = require("./routes/authroutes.js");
const { router: userRoutes } = require("./routes/userroutes.js");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/experiences", experienceRoutes);

//Auth routes
app.use("/api/auth", authRoutes);

//User routes
app.use("/api/users", userRoutes);

//DB test
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Crowd-Sourced Travel Planner API is running",
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS database_time, current_database() AS database_name"
    );
    res.json({ status: "connected", ...result.rows[0] });
  } 
  catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({
      status: "error",
      message: "Could not connect to the database",
    });}});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});