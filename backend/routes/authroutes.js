const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

//Helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET ||"change_this_secret_in_production";
const JWT_EXPIRES_IN = "7d";
function validateRegistration({ email, password, full_name }) {
  const errors = [];
  if (!full_name || full_name.trim().length === 0) {
    errors.push("Full name is required.");
  } 
  else if (full_name.trim().length > 255) {
    errors.push("Full name must be 255 characters or fewer.");
  }
  if (!email || email.trim().length === 0) {
    errors.push("Email address is required.");
  } 
  else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push("Please enter a valid email address.");
  }
  if (!password || password.length === 0) {
    errors.push("Password is required.");
  } else if (password.length < 8) 
    {
    errors.push("Password must be at least 8 characters.");
  } else if (password.length > 72) {
    // bcrypt silently truncates beyond 72 bytes
    errors.push("Password must be 72 characters or fewer.");
  }

  return errors;
}

//POST /api/auth/register

router.post("/register", async (req, res) => {
  const { email, password, full_name } = req.body;
  // 1. Input validation
  const errors = validateRegistration({ email, password, full_name });
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = full_name.trim();
  try {
    // 2.Check if email is already registered
    const existing = await pool.query(
      "SELECT user_id FROM public.users WHERE email = $1",
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        errors: ["An account with that email address already exists."],
      });    }

    // 3. Hash password
    const password_hash =await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Insert new user
    const result = await pool.query(
      `INSERT INTO public.users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING user_id, email, full_name, created_at`,
      [normalizedEmail, password_hash, trimmedName]
    );

    const newUser = result.rows[0];
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        user_id: newUser.user_id,
        email: newUser.email, full_name: newUser.full_name,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({
      success: false,
      errors: ["Something went wrong. Please try again later."],
    });
  }
});

//POST /api/auth/login

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // 1. Basic presence validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      errors: ["Email and password are required."],
    }); }

  const normalizedEmail =email.trim().toLowerCase();

  try {
    // 2. Look up user by email
    const result = await pool.query(
      "SELECT user_id, email, full_name, password_hash FROM public.users WHERE email = $1",
      [normalizedEmail]  );

    // 3. Use a generic message for both "not found" and "wrong password" to avoid leaking which emails are registered
    const user = result.rows[0];
    const genericError = "Invalid email or password.";
    if (!user) {
      return res.status(401).json({ success: false, errors: [genericError] });
    }
    // 4. Compare password against stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, errors: [genericError] }); }

    // 5. Sign JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token, user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      errors: ["Something went wrong. Please try again later."],
    });    }});

module.exports = router;