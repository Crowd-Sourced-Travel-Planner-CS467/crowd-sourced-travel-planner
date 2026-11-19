const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";
const SALT_ROUNDS = 12;
//Auth middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, errors: ["Not authenticated."] });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } 
  catch 
  {
    return res.status(401).json({ success: false, errors: ["Session expired. Please log in again."] });
  }
}

//GET /api/users/profile
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, email, full_name, bio, profile_image_url, created_at
       FROM public.users WHERE user_id = $1`,
      [req.user.user_id]  );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, errors: ["User not found."] });
    }
    return res.json({ success: true, user: result.rows[0] });
  } 
  catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({ success: false, errors: ["Something went wrong."] });
  }});

//PUT /api/users/profile
router.put("/profile", requireAuth, async (req, res) => {
  const { full_name, bio, profile_image_url } = req.body;
  if (!full_name || full_name.trim().length === 0) {
    return res.status(400).json({ success: false, errors: ["Full name is required."] });
  }
  if (full_name.trim().length > 255) {
    return res.status(400).json({ success: false, errors: ["Full name must be 255 characters or fewer."] });
  }
  try {
    const result = await pool.query(
      `UPDATE public.users SET full_name = $1, bio = $2, profile_image_url = $3, updated_at = NOW()
       WHERE user_id = $4 RETURNING user_id, email, full_name, bio, profile_image_url`,
      [full_name.trim(), bio ? bio.trim() : null, profile_image_url ? profile_image_url.trim() : null, req.user.user_id]
    );
    return res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ success: false, errors: ["Something went wrong."] });
  }
});

//PUT /api/users/account/email
router.put("/account/email", requireAuth, async (req, res) => {
  const { new_email, current_password } = req.body;
  const errors = [];
  if (!new_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(new_email.trim())) {
    errors.push("A valid new email address is required.");
  }
  if (!current_password) errors.push("Current password is required.");
  if (errors.length > 0) return res.status(400).json({ success: false, errors });
  const normalizedEmail = new_email.trim().toLowerCase();
  try {
    const userResult = await pool.query(
      "SELECT password_hash FROM public.users WHERE user_id = $1",
      [req.user.user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, errors: ["User not found."] });
    }
    const match = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ success: false, errors: ["Current password is incorrect."] });
    }
    const existing = await pool.query(
      "SELECT user_id FROM public.users WHERE email = $1 AND user_id != $2",
      [normalizedEmail, req.user.user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, errors: ["That email address is already in use."] });
    }
    await pool.query(
      "UPDATE public.users SET email = $1, updated_at = NOW() WHERE user_id = $2",
      [normalizedEmail, req.user.user_id]   );
    return res.json({ success: true, message: "Email updated successfully." });
  } 
  catch (error) {
    console.error("Update email error:", error.message);
    return res.status(500).json({ success: false, errors: ["Something went wrong."] });
  }
});

//PUT /api/users/account/password
router.put("/account/password", requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  const errors = [];
  if (!current_password) errors.push("Current password is required.");
  if (!new_password || new_password.length < 8) {
    errors.push("New password must be at least 8 characters.");
  }
  if (errors.length >0) return res.status(400).json({ success: false, errors });

  try {
    const userResult = await pool.query(
      "SELECT password_hash FROM public.users WHERE user_id = $1",
      [req.user.user_id]
    );
    if (userResult.rows.length === 0) 
    {
      return res.status(404).json({ success: false, errors: ["User not found."] });
    }
    const match = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ success: false, errors: ["Current password is incorrect."] });
    }
    const new_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    await pool.query(
      "UPDATE public.users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2",
      [new_hash, req.user.user_id]
    );

    return res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Update password error:", error.message);
    return res.status(500).json({ success: false, errors: ["Something went wrong."] });
  }
});

//DELETE /api/users/account
router.delete("/account", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM public.users WHERE user_id = $1", [req.user.user_id]);
    return res.json({ success: true, message: "Account deleted." });
  } catch (error) {
    console.error("Delete account error:", error.message);
    return res.status(500).json({ success: false, errors: ["Something went wrong."] });
  }});

module.exports = { router, requireAuth };