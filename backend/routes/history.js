const express = require("express");
const pool = require("../db");
const jwt = require("jsonwebtoken");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";

// Local requireAuth — avoids cross-file import issues
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, errors: ["Not authenticated."] });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, errors: ["Session expired. Please log in again."] });
  }
}

// console.log("[history] Router loaded");

//GET /api/history
// Returns the logged-in user's trips (with their experiences) and standalone experiences they have created.

router.get("/", requireAuth, async (req, res) => {
  // console.log("[history] GET / called by user_id:", req.user.user_id);
  const userId = req.user.user_id;

  try {
    //1. Fetch all trips owned by the user, with their associated experiences
    const tripsResult = await pool.query(
      `SELECT
         t.trip_id,
         t.trip_name,
         t.created_time,
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'experience_id', e.experience_id,
               'title',     e.title,
               'address',    e.address,
               'image_url',     e.image_url,
               'create_datetime', e.create_datetime,
               'average_rating', (  SELECT ROUND(AVG(r.rating)::numeric, 1)
                 FROM public.ratings r    WHERE r.experience_id = e.experience_id
               )
             )
           ) FILTER (WHERE e.experience_id IS NOT NULL),
           '[]'   ) AS experiences
       FROM public.trips t
       LEFT JOIN public.trip_experiences te ON te.trip_id = t.trip_id
       LEFT JOIN public.experiences e       ON e.experience_id = te.experience_id
       WHERE t.user_id = $1    GROUP BY t.trip_id
       ORDER BY t.created_time DESC`, [userId]
    );

    // 2. Fetch all experiences created by the user
    const experiencesResult = await pool.query(
      `SELECT
         e.experience_id,
         e.title,
         e.address,    e.image_url,
         e.description,
         e.keywords,    e.create_datetime,
         ROUND(AVG(r.rating)::numeric, 1) AS average_rating,
         COUNT(r.rating)::int    AS rating_count
       FROM public.experiences e
       LEFT JOIN public.ratings r ON r.experience_id = e.experience_id
       WHERE e.user_id = $1  GROUP BY e.experience_id
       ORDER BY e.create_datetime DESC`,
      [userId]
    );

    return res.json({
      success: true,
      trips: tripsResult.rows,
      experiences: experiencesResult.rows,
    });
  } catch (error) {
    console.error("History fetch error:", error.message);
    return res.status(500).json({
      success: false,
      errors: ["Could not load history. Please try again."],
    });
  }
});

module.exports = router;