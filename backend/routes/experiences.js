// Citation
// This code was generated with the help of Claude VSCode extension.  
// This transcript https://docs.google.com/document/d/13X01sMsMOhjlLOLURQMMhm94s9a2zac8OnuDPs4kJUc/edit?tab=t.0
// documents the GenAI interaction that led to the code in experiences.js and experiences.test.js.


const express = require("express");

const pool = require("../db");
const { validateExperience } = require("../validation/experienceValidation");

const router = express.Router();

// Inserts the experience and the creator's rating in a single operation,
// so an experience is never saved without its rating (or vice versa).
// Rolls back and rethrows the original error if either insert fails.
const saveExperienceWithRating = async (values) => {
  const { userId, title, description, address, imageUrl, rating, keywords } = values;

  // TODO: geocoding is not implemented yet, so latitude and longitude are saved as null.
  // Once geocoding is complete, look up the coordinates from the address here.
  const latitude = null;
  const longitude = null;

  let client;
  let releaseError;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const experienceResult = await client.query(
      `INSERT INTO public.experiences
         (user_id, title, description, address, latitude, longitude, image_url, keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, title, description, address, latitude, longitude, imageUrl, keywords]
    );

    const experience = experienceResult.rows[0];

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
        // The connection is broken, so remove it from the pool instead of reusing it
        releaseError = rollbackError;
      }
    }

    throw error;
  } finally {
    client?.release(releaseError);
  }
};

// POST /api/experiences
// Validates the request, then saves the experience and the creator's rating.
router.post("/", async (req, res) => {
  const { errors, values } = validateExperience(req.body ?? {});

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(" ") });
  }

  try {
    const { experience, rating } = await saveExperienceWithRating(values);

    res.status(201).json({ message: "Experience created", experience, rating });
  } catch (error) {
    console.error("Failed to create experience:", error.message);

    // 23503 = foreign key violation, e.g. the (temporary) user id does not exist in users
    if (error.code === "23503") {
      return res.status(400).json({ message: "User does not exist." });
    }

    res.status(500).json({ message: "Could not create experience" });
  }
});

module.exports = router;
