const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");
const pool = require("../db");
const router = express.Router();
// const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_production";
const JWT_EXPIRES_IN = "7d";
// const RESEND_FROM = process.env.RESEND_FROM;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const RESET_TOKEN_EXPIRY_MINUTES = 30;

// Replace Resend setup with:
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

//Helpers
function validateRegistration({ email, password, full_name }) {
  const errors = [];
  if (!full_name || full_name.trim().length === 0) {
    errors.push("Full name is required.");
  } else if (full_name.trim().length > 255) {
    errors.push("Full name must be 255 characters or fewer.");
  }
  if (!email || email.trim().length === 0) {
    errors.push("Email address is required.");
  } 
  else if (!EMAIL_REGEX.test(email.trim())) 
    {
    errors.push("Please enter a valid email address.");
  }
  if (!password || password.length === 0) {
    errors.push("Password is required.");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  } else if (password.length > 72) {
    errors.push("Password must be 72 characters or fewer.");
  }
  return errors;
}

//pOST /api/auth/register

router.post("/register", async (req, res) => {
  const { email, password, full_name } = req.body;
  const errors = validateRegistration({ email, password, full_name });
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = full_name.trim();

  try {
    const existing = await pool.query(
      "SELECT user_id FROM public.users WHERE email = $1",
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        errors: ["An account with that email address already exists."],
      });    }
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO public.users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING user_id, email, full_name, created_at`,
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
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      errors: ["Email and password are required."],
    });
  }
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const result = await pool.query(
      "SELECT user_id, email, full_name, password_hash FROM public.users WHERE email = $1",
      [normalizedEmail]
    );

    const user = result.rows[0];
    const genericError = "Invalid email or password.";

    if (!user) {
      return res.status(401).json({ success: false, errors: [genericError] });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, errors: [genericError] });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      token, user: {
        user_id: user.user_id,
        email: user.email,  full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      errors: ["Something went wrong. Please try again later."],
    });
  }
});

//  POST /api/auth/forgot-password

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ success: false, errors: ["A valid email address is required."] });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const genericResponse = {
    success: true,
    message: "If an account with that email exists, a reset link has been sent.",
  };

  try {
    console.log("[forgot-password] Looking up email:", normalizedEmail);
    const result = await pool.query(
      "SELECT user_id, full_name FROM public.users WHERE email = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      console.log("[forgot-password] No account found for that email — returning generic response.");
      return res.json(genericResponse);
    }

    const user = result.rows[0];
    console.log("[forgot-password] User found:", user.user_id);

    // Generate a secure random token and store its hash
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    //Invalidate any existing unused tokens for this user
    await pool.query(
      "DELETE FROM public.password_reset_token WHERE user_id = $1 AND used_at IS NULL",
      [user.user_id]
    );
    console.log("[forgot-password] Old tokens cleared.");
    await pool.query(
      `INSERT INTO public.password_reset_token (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.user_id, tokenHash, expiresAt]
    );
    console.log("[forgot-password] Token stored. Expires at:", expiresAt);
    const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`;
    console.log("[forgot-password] Reset link:", resetLink);
    // console.log("[forgot-password] Sending email via Resend — from:", RESEND_FROM, "to:", normalizedEmail);
    const emailResult = await transporter.sendMail({
      from: `"Crowd-Sourced Travel Planner" <${process.env.BREVO_USER}>`,
      to: normalizedEmail,
      subject: "Reset your password — Crowd-Sourced Travel Planner",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="margin:0 0 8px">Reset your password</h2>
          <p style="color:#555;margin:0 0 24px">
            Hi ${user.full_name}, we received a request to reset the password for your account.
            Click the button below to choose a new one.
          </p>
          <a href="${resetLink}"
             style="display:inline-block;background:#2b6cb0;color:#fff;text-decoration:none;
                    padding:12px 24px;border-radius:6px;font-weight:600">
            Reset password
          </a>
          <p style="color:#888;font-size:13px;margin:24px 0 0">
            This link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log("[forgot-password] Resend response:", JSON.stringify(emailResult));
    return res.json(genericResponse);
  } catch (error) {
    console.error("[forgot-password] Error:", error.message);
    console.error("[forgot-password] Full error:", error);
    return res.status(500).json({
      success: false,
      errors: ["Something went wrong. Please try again later."],
    });
  }
});

//POST /api/auth/reset-password

router.post("/reset-password", async (req, res) => {
  const { token, new_password } = req.body;
  const errors = [];
  if (!token) errors.push("Reset token is missing.");
  if (!new_password || new_password.length < 8) {
    errors.push("New password must be at least 8 characters.");
  }
  if (errors.length > 0) return res.status(400).json({ success: false, errors });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  try {
    const result = await pool.query(
      `SELECT reset_id, user_id, expires_at, used_at
       FROM public.password_reset_token       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        errors: ["This reset link is invalid."],
      });
    }

    const resetToken = result.rows[0];
    if (resetToken.used_at) {
      return res.status(400).json({
        success: false,
        errors: ["This reset link has already been used."],
      });
    }

    if (new Date() > new Date(resetToken.expires_at)) {
      return res.status(400).json({
        success: false,
        errors: ["This reset link has expired. Please request a new one."],
      });
    }
    // Hash new password and update user
    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

    await pool.query(
      "UPDATE public.users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2",
      [password_hash, resetToken.user_id]
    );

    // Mark token as used
    await pool.query(
      "UPDATE public.password_reset_token SET used_at = NOW() WHERE reset_id = $1",
      [resetToken.reset_id]
    );

    return res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({
      success: false,   errors: ["Something went wrong. Please try again later."],
    });
  }
});

module.exports = router;