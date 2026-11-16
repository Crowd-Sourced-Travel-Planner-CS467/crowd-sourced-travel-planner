// Citation
// This code was generated with the help of Claude VSCode extension.  
// This transcript https://docs.google.com/document/d/13X01sMsMOhjlLOLURQMMhm94s9a2zac8OnuDPs4kJUc/edit?tab=t.0
// documents the GenAI interaction that led to the code in experiences.js and experiences.test.js.

// Citation
// The code for handling geocoding the address into latitude and longitude coordinates was generated with the help of ChatGPT. 
// These transcripts: https://chatgpt.com/share/6aee540f-e514-83e9-99ca-a8070a4385d7 and https://chatgpt.com/share/6aee54a5-a088-83ea-a22e-1c43db12f8cd
// document the GenAI interaction that led to code in geocoding.js, experiences.js, ExperienceForm.jsx, and experiences.test.js

const express = require("express");

const pool = require("../db");
const { validateExperience } = require("../validation/experienceValidation");
const geocoding = require("../services/geocoding");

const router = express.Router();

// Inserts the experience and the creator's rating in a single transaction.
// Rolls back if either insert fails.
const saveExperienceWithRating = async (values, coordinates) => {
  const { userId, title, description, address, imageUrl, rating, keywords } = values;

  // Use the coordinates returned by the geocoding service.
  const { latitude, longitude } = coordinates;

  let client;
  let releaseError;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Insert the experience, including its latitude and longitude.
    const experienceResult = await client.query(
      `INSERT INTO public.experiences
         (user_id, title, description, address, latitude, longitude, image_url, keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, title, description, address, latitude, longitude, imageUrl, keywords]
    );

    // Get the actual saved experience returned by PostgreSQL.
    const experience = experienceResult.rows[0];

    // Insert the creator's initial rating.
    const ratingResult = await client.query(
      `INSERT INTO public.ratings (experience_id, user_id, rating)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [experience.experience_id, userId, rating]
    );

    await client.query("COMMIT");

    return { experience, rating: ratingResult.rows[0] };
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError.message);

        // Remove a potentially broken connection from the pool.
        releaseError = rollbackError;
      }
    }

    throw error;
  } finally {
    client?.release(releaseError);
  }
};

// POST /api/experiences
// Validates the request, geocodes the address, and saves the experience and rating.
router.post("/", async (req, res) => {
  // Validate and clean the submitted experience fields.
  const { errors, values } = validateExperience(req.body ?? {});

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(" ") });
  }

  let coordinates;

  try {
    // Convert the submitted address into latitude and longitude.
    coordinates = await geocoding.geocodeAddress(values.address);
  } catch (error) {
    console.error("Geocoding failed:", error.message);

    // Nominatim could not verify the location because of a service failure.
    return res.status(503).json({
      code: "LOCATION_VERIFICATION_FAILED",
      message: "We couldn't verify the location right now. Please try again.",
    });
  }

  // A successful Nominatim request with no matching location
  // should not result in an experience being created.
  if (
    coordinates.latitude === null ||
    coordinates.longitude === null
  ) {
    return res.status(422).json({
      code: "LOCATION_NOT_FOUND",
      message: "We couldn't find this location. Please check the address and try again.",
    });
  }

  try {
    // Save the experience and initial rating after successful geocoding.
    const { experience, rating } =
      await saveExperienceWithRating(values, coordinates);

    // Return the actual database records to the frontend.
    return res.status(201).json({
      message: "Experience created",
      experience,
      rating,
    });
  } catch (error) {
    console.error("Failed to create experience:", error.message);

    // 23503 = foreign key violation (e.g. user does not exist).
    if (error.code === "23503") {
      return res.status(400).json({
        message: "User does not exist.",
      });
    }

    return res.status(500).json({
      code: "DATABASE_ERROR",
      message: "We couldn't create the experience right now. Please try again.",
    });
  }
});

module.exports = router;
