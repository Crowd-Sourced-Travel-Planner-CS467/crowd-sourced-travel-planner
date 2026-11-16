const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ||"change_this_secret_in_production";

//Auth middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, errors: ["Not authenticated."] });
  }
  const token =authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, errors: ["Session expired. Please log in again."] });  }
}

//GET /api/users/profile
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, email, full_name, bio, profile_image_url, created_at
       FROM public.users
       WHERE user_id = $1`,
      [req.user.user_id]   );

    if (result.rows.length === 0) 
      {
      return res.status(404).json({ success: false, errors: ["User not found."] });
    }

    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({ success: false, errors:["Something went wrong."] });
  }
});

//PUT /api/users/profile
router.put("/profile", requireAuth, async (req, res) => {
  const { full_name, bio, profile_image_url } = req.body;
  // Validation
  const errors = [];
  if (!full_name || full_name.trim().length === 0) {
    errors.push("Full name is required.");
  } else if (full_name.trim().length >255) {
    errors.push("Full name must be 255 characters or fewer.");
  }
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    const result = await pool.query(
      `UPDATE public.users
       SET full_name  = $1,
           bio = $2,
           profile_image_url = $3,
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING user_id, email, full_name, bio, profile_image_url`,
      [
        full_name.trim(),
        bio ? bio.trim() : null, profile_image_url ? profile_image_url.trim() : null,
        req.user.user_id,
      ]
    );
    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ success: false, errors: ["Something went wrong."] });
  }
});

module.exports = { router, requireAuth };