// Citation
// This code was generated with the help of Claude VSCode extension.  
// This transcript https://docs.google.com/document/d/13X01sMsMOhjlLOLURQMMhm94s9a2zac8OnuDPs4kJUc/edit?tab=t.0
// documents the GenAI interaction that led to the code in experiences.js and experiences.test.js.

// Citation
// The code for handling geocoding the address into latitude and longitude coordinates was generated with the help of ChatGPT. 
// These transcripts: https://chatgpt.com/share/6aee540f-e514-83e9-99ca-a8070a4385d7 and https://chatgpt.com/share/6aee54a5-a088-83ea-a22e-1c43db12f8cd
// document the GenAI interaction that led to code in geocoding.js, experiences.js, ExperienceForm.jsx, and experiences.test.js

// Citation
// The code handling the experience view page was generated with the help of ChatGPT.
// These transcript links: https://chatgpt.com/share/6af67cf0-17e4-83e9-bfa2-3c8d5c20b1a9 and https://chatgpt.com/share/6af67df0-f978-83ea-a1ed-86fa32cdb705
// document the GenAI interaction that led to ExperienceView.jsx and parts of ExperienceForm.css, experiences.js, and experiences.test.js

// Citation
// The code for incorporating user authentication, adding update and delete experience, and update rating was generated with the help of ChatGPT
// These transcipts: https://chatgpt.com/share/6aff3dab-2534-83e9-ad94-956e4c2a3ee3 and https://chatgpt.com/share/6aff3e47-c2c8-83ea-917d-1db944c50533
// document the GenAI interaction that led to code in ExperienceForm.jsx, ExperienceView.jsx, experiences.js, experienceValidation.js, 
// experienceValidation.test.js, and expereiences.test.js

const express = require("express");

const pool = require("../db");
const { validateExperience } = require("../validation/experienceValidation");
const geocoding = require("../services/geocoding");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("./userroutes");

const JWT_SECRET =
  process.env.JWT_SECRET || "change_this_secret_in_production";

const router = express.Router();

// Decode an optional token so public experience pages can include
// the current viewer's rating.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {
      // An invalid token is treated as a logged-out visitor for GET requests.
    }
  }

  next();
}

// Inserts the experience and the creator's rating in one transaction.
// Rolls back if either insert fails.
const saveExperienceWithRating = async (values, coordinates) => {
  const {
    userId,
    title,
    description,
    address,
    imageUrl,
    rating,
    keywords,
  } = values;

  const { latitude, longitude } = coordinates;

  let client;
  let releaseError;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    // Insert the experience with its creator's authenticated user ID.
    const experienceResult = await client.query(
      `INSERT INTO public.experiences
         (user_id, title, description, address,
          latitude, longitude, image_url, keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        title,
        description,
        address,
        latitude,
        longitude,
        imageUrl,
        keywords,
      ]
    );

    const experience = experienceResult.rows[0];

    // Save the creator's initial rating.
    const ratingResult = await client.query(
      `INSERT INTO public.ratings
         (experience_id, user_id, rating)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        experience.experience_id,
        userId,
        rating,
      ]
    );

    await client.query("COMMIT");

    return {
      experience,
      rating: ratingResult.rows[0],
    };
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "Rollback failed:",
          rollbackError.message
        );

        releaseError = rollbackError;
      }
    }

    throw error;
  } finally {
    client?.release(releaseError);
  }
};

// POST /api/experiences
// Create an experience and its initial rating.
router.post("/", requireAuth, async (req, res) => {
  const { errors, values } = validateExperience(req.body ?? {});

  // Never trust a user ID supplied by the frontend.
  // Use the identity from the verified JWT instead.
  values.userId = req.user.user_id;

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors.join(" "),
    });
  }

  let coordinates;

  try {
    // Convert the submitted address into coordinates.
    coordinates = await geocoding.geocodeAddress(
      values.address
    );
  } catch (error) {
    console.error("Geocoding failed:", error.message);

    return res.status(503).json({
      code: "LOCATION_VERIFICATION_FAILED",
      message:
        "We couldn't verify the location right now. Please try again.",
    });
  }

  if (
    coordinates.latitude === null ||
    coordinates.longitude === null
  ) {
    return res.status(422).json({
      code: "LOCATION_NOT_FOUND",
      message:
        "We couldn't find this location. Please check the address and try again.",
    });
  }

  try {
    const { experience, rating } =
      await saveExperienceWithRating(values, coordinates);

    return res.status(201).json({
      message: "Experience created",
      experience,
      rating,
    });
  } catch (error) {
    console.error(
      "Failed to create experience:",
      error.message
    );

    if (error.code === "23503") {
      return res.status(400).json({
        message: "User does not exist.",
      });
    }

    return res.status(500).json({
      code: "DATABASE_ERROR",
      message:
        "We couldn't create the experience right now. Please try again.",
    });
  }
});

// GET /api/experiences/:experienceId
// Retrieve one experience, its ratings, and the current user's rating.
router.get("/:experienceId", optionalAuth, async (req, res) => {
  const experienceId = Number(req.params.experienceId);

  if (
    !Number.isSafeInteger(experienceId) ||
    experienceId <= 0
  ) {
    return res.status(400).json({
      message: "Please provide a valid experience ID.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT
         e.*,

         COALESCE(
           ARRAY_AGG(r.rating)
             FILTER (WHERE r.rating IS NOT NULL),
           ARRAY[]::INTEGER[]
         ) AS ratings,

         MAX(r.rating)
           FILTER (WHERE r.user_id = $2)
           AS current_user_rating

       FROM public.experiences e

       LEFT JOIN public.ratings r
         ON r.experience_id = e.experience_id

       WHERE e.experience_id = $1

       GROUP BY e.experience_id`,
      [
        experienceId,
        req.user?.user_id ?? null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "This experience could not be found.",
      });
    }

    return res.json({
      experience: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Failed to retrieve experience:",
      error.message
    );

    return res.status(500).json({
      message:
        "We couldn't load this experience right now. Please try again.",
    });
  }
});

// PUT /api/experiences/:experienceId
// Only the creator can update an experience and their initial rating.
router.put("/:experienceId", requireAuth, async (req, res) => {
  const experienceId = Number(req.params.experienceId);

  if (
    !Number.isSafeInteger(experienceId) ||
    experienceId <= 0
  ) {
    return res.status(400).json({
      message: "Please provide a valid experience ID.",
    });
  }

  // An update does not require a new rating.
  // If a rating is included, it must be valid.
  const { errors, values } = validateExperience(
    req.body ?? {},
    { requireRating: false }
  );

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors.join(" "),
    });
  }

  try {
    // Check that the experience exists and retrieve its owner.
    const existing = await pool.query(
      `SELECT user_id
       FROM public.experiences
       WHERE experience_id = $1`,
      [experienceId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "This experience could not be found.",
      });
    }

    // Prevent users from updating experiences created by someone else.
    if (
      String(existing.rows[0].user_id) !==
      String(req.user.user_id)
    ) {
      return res.status(403).json({
        message:
          "You can only update your own experiences.",
      });
    }

    let coordinates;

    try {
      // Re-geocode the address in case the user changed it.
      coordinates = await geocoding.geocodeAddress(
        values.address
      );
    } catch {
      return res.status(503).json({
        code: "LOCATION_VERIFICATION_FAILED",
        message:
          "We couldn't verify the location right now. Please try again.",
      });
    }

    if (
      coordinates.latitude === null ||
      coordinates.longitude === null
    ) {
      return res.status(422).json({
        code: "LOCATION_NOT_FOUND",
        message:
          "We couldn't find this location. Please check the address and try again.",
      });
    }

    // Update the experience and, if supplied, its creator's rating
    // in one transaction so that both changes succeed or fail together.
    let client;
    let releaseError;

    try {
      client = await pool.connect();

      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE public.experiences
         SET
           title = $1,
           description = $2,
           address = $3,
           latitude = $4,
           longitude = $5,
           image_url = $6,
           keywords = $7
         WHERE experience_id = $8
           AND user_id = $9
         RETURNING *`,
        [
          values.title,
          values.description,
          values.address,
          coordinates.latitude,
          coordinates.longitude,
          values.imageUrl,
          values.keywords,
          experienceId,
          req.user.user_id,
        ]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          message:
            "You can only update your own experiences.",
        });
      }

      // Only update the rating when the frontend sends a changed rating.
      // If rating is undefined, the existing rating remains unchanged.
      if (values.rating !== undefined) {
        await client.query(
          `INSERT INTO public.ratings
             (experience_id, user_id, rating)
           VALUES ($1, $2, $3)

           ON CONFLICT (experience_id, user_id)
           DO UPDATE SET rating = EXCLUDED.rating`,
          [
            experienceId,
            req.user.user_id,
            values.rating,
          ]
        );
      }

      await client.query("COMMIT");

      return res.json({
        experience: result.rows[0],
      });
    } catch (error) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error(
            "Rollback failed:",
            rollbackError.message
          );

          releaseError = rollbackError;
        }
      }

      throw error;
    } finally {
      client?.release(releaseError);
    }
  } catch (error) {
    console.error(
      "Failed to update experience:",
      error.message
    );

    return res.status(500).json({
      message:
        "We couldn't update this experience right now. Please try again.",
    });
  }
});

// DELETE /api/experiences/:experienceId
// Only the creator can delete an experience.
router.delete("/:experienceId", requireAuth, async (req, res) => {
  const experienceId = Number(req.params.experienceId);

  if (
    !Number.isSafeInteger(experienceId) ||
    experienceId <= 0
  ) {
    return res.status(400).json({
      message: "Please provide a valid experience ID.",
    });
  }

  try {
    // The user ID condition ensures that only the owner can delete.
    const result = await pool.query(
      `DELETE FROM public.experiences
       WHERE experience_id = $1
         AND user_id = $2
       RETURNING experience_id`,
      [
        experienceId,
        req.user.user_id,
      ]
    );

    if (result.rows.length === 0) {
      // Distinguish a missing experience from an unauthorized deletion.
      const exists = await pool.query(
        `SELECT 1
         FROM public.experiences
         WHERE experience_id = $1`,
        [experienceId]
      );

      return res.status(
        exists.rows.length ? 403 : 404
      ).json({
        message: exists.rows.length
          ? "You can only delete your own experiences."
          : "This experience could not be found.",
      });
    }

    // Ratings and trip associations are deleted automatically
    // through the existing ON DELETE CASCADE relationships.
    return res.json({
      message: "Experience deleted.",
    });
  } catch (error) {
    console.error(
      "Failed to delete experience:",
      error.message
    );

    return res.status(500).json({
      message:
        "We couldn't delete this experience right now. Please try again.",
    });
  }
});

// PUT /api/experiences/:experienceId/rating
// Insert or update the logged-in user's rating.
router.put("/:experienceId/rating", requireAuth, async (req, res) => {
  const experienceId = Number(req.params.experienceId);
  const rating = Number(req.body?.rating);

  if (
    !Number.isSafeInteger(experienceId) ||
    experienceId <= 0 ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return res.status(400).json({
      message: "Choose a rating from 1 to 5.",
    });
  }

  try {
    // The existing primary key prevents duplicate ratings.
    // ON CONFLICT updates the user's existing rating instead.
    const result = await pool.query(
      `INSERT INTO public.ratings
         (experience_id, user_id, rating)
       VALUES ($1, $2, $3)

       ON CONFLICT (experience_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating

       RETURNING rating`,
      [
        experienceId,
        req.user.user_id,
        rating,
      ]
    );

    return res.json({
      rating: result.rows[0].rating,
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(404).json({
        message: "This experience could not be found.",
      });
    }

    console.error(
      "Failed to save rating:",
      error.message
    );

    return res.status(500).json({
      message:
        "We couldn't save your rating right now. Please try again.",
    });
  }
});

module.exports = router;